"use server";

import { revalidatePath } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { Quiz, QuizSchema, Question } from "@/lib/interfaces";
import { ScanCommand, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DYNAMO_TABLE_NAME!;
const PK = "cloud";

export async function listQuizzesAction(): Promise<Quiz[]> {
  const ddb = getDynamo();
  const res = await ddb.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "#k = :quiz",
    ExpressionAttributeNames: { "#k": "kind" },
    ExpressionAttributeValues: { ":quiz": "QUIZ" },
  }));
  const items = (res.Items ?? []) as Quiz[];
  return items.map(i => QuizSchema.parse(i));
}

// ✅ One-arg signature for <form action={createQuizAction}>
export async function createQuizAction(formData: FormData) {
  const quizId = String(formData.get("quizId") ?? "").trim();
  const title  = String(formData.get("title")  ?? "").trim();
  if (!quizId || !title) return { ok: false, error: "quizId & title required" };

  const quiz: Quiz = {
    cloud: `QUIZ#${quizId}`,  // DynamoDB PK
    kind: "QUIZ",
    quizId,
    title,
    questions: [] as Question[],
    published: true,
    createdAt: Date.now(),
  };
  QuizSchema.parse(quiz);

  const ddb = getDynamo();
  await ddb.send(new PutCommand({ TableName: TABLE, Item: quiz }));

  revalidatePath("/");
  return { ok: true };
}

export async function seedQuizAction() {
  const quiz: Quiz = {
    cloud: "QUIZ#q_aws_1",
    kind: "QUIZ",
    quizId: "q_aws_1",
    title: "AWS Basics (Demo)",
    questions: [
      { qid: "q1", type: "single", text: "Which AWS service is NoSQL?", options: ["RDS","DynamoDB","Aurora","Redshift"], answer: [1] },
      { qid: "q2", type: "single", text: "Which region code is Europe (Stockholm)?", options: ["eu-west-1","eu-central-1","eu-north-1","eu-south-1"], answer: [2] },
    ],
    published: true,
    createdAt: Date.now(),
  };
  QuizSchema.parse(quiz);

  const ddb = getDynamo();
  await ddb.send(new PutCommand({ TableName: TABLE, Item: quiz }));

  revalidatePath("/");
  return { ok: true };
}
// app/actions/quizzes.ts
// src/app/actions/quizzes.ts (replace the function)
export async function getQuizByIdAction(quizId: string): Promise<Quiz | null> {
  const ddb = getDynamo();
  const qid = String(quizId ?? "").trim();

  const res = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: {
        cloud: `QUIZ#${quizId}`,
      }
    })
  );

//   const raw = res.Items?.[0;
//   if (!raw) return null;

//   const parsed = QuizSchema.safeParse(raw);
//   return parsed.success ? rs : (raw as any);
    if (!res.Item) return null;
    return QuizSchema.parse(res.Item);
}

