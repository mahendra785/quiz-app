"use server";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { Quiz, QuizSchema, Question } from "@/lib/interfaces";
import { GetCommand, PutCommand, UpdateCommand, BatchGetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { assertRole } from "@/lib/rbac";

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

export async function listQuizzesAction(): Promise<Quiz[]> {
  noStore();
  const ddb = getDynamo();
  const man = await ddb.send(new GetCommand({ TableName: TABLE, Key: { [PK]: QUIZ_INDEX_PK } }));
  const ids: string[] = (man.Item?.ids as string[]) ?? [];
  if (ids.length === 0) return [];
  const chunks = (arr: string[], n: number) => Array.from({ length: Math.ceil(arr.length/n) }, (_,i)=>arr.slice(i*n,(i+1)*n));
  const all: Quiz[] = [];
  for (const part of chunks(ids, 100)) {
    const res = await ddb.send(new BatchGetCommand({
      RequestItems: { [TABLE]: { Keys: part.map(id => ({ [PK]: quizPk(id) })) } }
    }));
    const items = (res.Responses?.[TABLE] ?? []) as Quiz[];
    for (const it of items) all.push(QuizSchema.parse(it));
  }
  return all;
}

// ONLY admin/creator
export async function createQuizAction(formData: FormData) {
  await assertRole(["admin","creator"]);
  const quizId = String(formData.get("quizId") ?? "").trim();
  const title  = String(formData.get("title")  ?? "").trim();
  if (!quizId || !title) return { ok: false, error: "quizId & title required" };

  const quiz: Quiz = {
    cloud: quizPk(quizId),
    kind: "QUIZ",
    quizId, title,
    questions: [] as Question[],
    published: false,
    createdAt: Date.now(),
  };
  QuizSchema.parse(quiz);

  const ddb = getDynamo();
  await ddb.send(new PutCommand({
    TableName: TABLE, Item: quiz,
    ConditionExpression: "attribute_not_exists(#pk)",
    ExpressionAttributeNames: { "#pk": PK },
  }));
  await ddb.send(new UpdateCommand({
    TableName: TABLE, Key: { [PK]: QUIZ_INDEX_PK },
    UpdateExpression: "SET #ids = list_append(if_not_exists(#ids, :empty), :new)",
    ExpressionAttributeNames: { "#ids": "ids" },
    ExpressionAttributeValues: { ":new": [quizId], ":empty": [] },
  }));
  revalidatePath("/"); revalidatePath("/creator"); revalidatePath("/admin");
  return { ok: true };
}

// ONLY admin/creator
export async function updateQuizContentAction(quizId: string, patch: Partial<Pick<Quiz,"title"|"questions"|"published">>) {
  await assertRole(["admin","creator"]);
  const sets: string[] = []; const names: Record<string,string> = {}; const values: Record<string,any> = {};
  if (patch.title !== undefined) { sets.push("#t=:t"); names["#t"]="title"; values[":t"]=patch.title; }
  if (patch.questions !== undefined) { sets.push("#q=:q"); names["#q"]="questions"; values[":q"]=patch.questions; }
  if (patch.published !== undefined) { sets.push("#p=:p"); names["#p"]="published"; values[":p"]=patch.published; }
  if (sets.length === 0) return { ok: true };
  const ddb = getDynamo();
  await ddb.send(new UpdateCommand({
    TableName: TABLE, Key: { [PK]: quizPk(quizId) },
    UpdateExpression: `SET ${sets.join(", ")}`,
    ExpressionAttributeNames: names, ExpressionAttributeValues: values,
  }));
  revalidatePath("/creator"); revalidatePath(`/quiz/${quizId}`);
  return { ok: true };
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
