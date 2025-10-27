"use server";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { Quiz, QuizSchema, Question,QuestionSchema } from "@/lib/interfaces";
import { GetCommand, PutCommand, UpdateCommand, BatchGetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { assertRole } from "@/lib/rbac";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
const TABLE = process.env.DYNAMO_TABLE_NAME!;
const PK = "cloud";
const QUIZ_INDEX_PK = "QUIZ_INDEX";
const quizPk = (id: string) => `QUIZ#${id}`;

export async function getQuizByIdAction(quizId: string): Promise<Quiz | null> {
  noStore();
  const ddb = getDynamo();
  const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { [PK]: quizPk(quizId.trim()) } }));
  if (!res.Item) return null;
  return QuizSchema.parse(res.Item as Quiz);
}
// ONLY admin/creator
export async function publishQuizAction(quizId: string, published: boolean) {
  await assertRole(["admin", "creator"]);

  const ddb = getDynamo();
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { [PK]: quizPk(quizId) },
      UpdateExpression: "SET #p = :published",
      ExpressionAttributeNames: {
        "#p": "published",
      },
      ExpressionAttributeValues: {
        ":published": published,
      },
    })
  );

  // Revalidate relevant pages (creator panel & live quiz page)
  revalidatePath("/creator");
  revalidatePath(`/creator?id=${quizId}`);
  revalidatePath(`/quiz/${quizId}`);

  return { ok: true };
}

export async function listQuizzesAction(): Promise<Quiz[]> {
  noStore();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    throw new Error("You must be signed in to list quizzes.");
  }

  const ddb = getDynamo();

  const res = await ddb.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "#kind = :kind AND #creator = :creator",
      ExpressionAttributeNames: {
        "#kind": "kind",
        "#creator": "creator",
      },
      ExpressionAttributeValues: {
        ":kind": "QUIZ",
        ":creator": email,
      },
    })
  );

  return (res.Items ?? []).map((item) => QuizSchema.parse(item as Quiz));
}

// ONLY admin/creator
export async function createQuizAction(title: string) {
  const quizId = uuidv4();
const session = await getServerSession(authOptions);
  await assertRole(["admin","creator"]);
  const user = session?.user?.email || "";

  const newQuiz = {
    cloud: quizPk(quizId),
    kind: "QUIZ",
    quizId,
    title,
    creator: user,
    published: false,
    questions: [],
    createdAt: Date.now(),
  };

  const ddb = getDynamo();
    await ddb.send(new PutCommand({ TableName: TABLE, Item: newQuiz }));
console.log("New quiz created by user:", user);
console.log("Quiz ID:", quizId);
  return { ok: true, quizId };
}

// ONLY admin/creator
export async function updateQuizContentAction(
  quizId: string,
  patch: Partial<Pick<Quiz,"title"|"questions"|"published">>
) {
  await assertRole(["admin", "creator"]);

  const sets: string[] = [];
  const names: Record<string,string> = {};
  const values: Record<string,any> = {};

  if (patch.title !== undefined) { sets.push("#t = :t"); names["#t"]="title"; values[":t"]=patch.title; }
  if (patch.questions !== undefined) { sets.push("#q = :q"); names["#q"]="questions"; values[":q"]=patch.questions; }
  if (patch.published !== undefined) { sets.push("#p = :p"); names["#p"]="published"; values[":p"]=patch.published; }

  if (sets.length === 0) {
    return { ok: true }; // 👈 VERY IMPORTANT!
  }

  const ddb = getDynamo();
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { [PK]: quizPk(quizId) },
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));

  await revalidatePath("/creator");
  await revalidatePath(`/creator?id=${quizId}`);
  await revalidatePath(`/quiz/${quizId}`);

  return { ok: true }; // ✅ THIS MUST ALWAYS BE RETURNED
}


// ONLY admin
export async function deleteQuizAction(quizId: string) {
  await assertRole(["admin"]);
  const ddb = getDynamo();
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { [PK]: quizPk(quizId) } }));
  const man = await ddb.send(new GetCommand({ TableName: TABLE, Key: { [PK]: QUIZ_INDEX_PK } }));
  const ids: string[] = (man.Item?.ids as string[]) ?? [];
  const next = ids.filter(id => id !== quizId);
  await ddb.send(new PutCommand({ TableName: TABLE, Item: { [PK]: QUIZ_INDEX_PK, ids: next } }));
  revalidatePath("/admin"); revalidatePath("/");
  return { ok: true };
}


export async function saveQuizAction(formData: FormData) {
  const quizId = String(formData.get("quizId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const published = String(formData.get("published") ?? "false") === "true";
  const questionsJson = String(formData.get("questions") ?? "[]");
  
  if (!quizId) {
    return { ok: false, error: "Quiz ID is required" };
  }
  
  try {
    // Parse and validate questions against schema
    const questions = JSON.parse(questionsJson) as Question[];
    
    // Validate each question
    for (const q of questions) {
      QuestionSchema.parse(q);
    }
    
    // Use existing action from quizzes.ts
    const result = await updateQuizContentAction(quizId, { 
      title, 
      published, 
      questions 
    });
    
    if (result.ok) {
      revalidatePath(`/creator`);
      revalidatePath(`/creator?id=${quizId}`);
      revalidatePath(`/quiz/${quizId}`);
    }
    
    return result;
  } catch (error) {
    console.error("Save quiz error:", error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : "Failed to save quiz" 
    };
  }
}
export async function updateQuestionInQuiz(
  quiz: Quiz,
  questionId: string,
  updatedQuestion: Partial<Question>
): Promise<Quiz> {
  const updatedQuestions = quiz.questions.map((q) => (q.qid === questionId ? { ...q, ...updatedQuestion } : q));

  // Persist the updated questions array to DynamoDB using existing action
  await updateQuizContentAction(quiz.quizId, { questions: updatedQuestions });

  return { ...quiz, questions: updatedQuestions };
}