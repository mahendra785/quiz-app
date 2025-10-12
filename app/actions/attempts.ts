"use server";

import { unstable_noStore as noStore } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { Attempt, AttemptSchema } from "@/lib/interfaces";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DYNAMO_TABLE_NAME!;
const PK = "cloud";

const quizPk = (id: string) => `QUIZ#${id}`;
const attemptPk = (id: string) => `ATTEMPT#${id}`;

export async function submitAttemptAction(prev: any, formData: FormData) {
  noStore();
  const quizId = String(formData.get("quizId") ?? "").trim();
  const raw = String(formData.get("answers") ?? "[]");

  let answers: { qid: string; selected: number[] }[] = [];
  try {
    answers = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid answers JSON" };
  }
  if (!quizId || !Array.isArray(answers)) {
    return { ok: false, error: "quizId & answers required" };
  }

  const ddb = getDynamo();

  // Get quiz by PK
  const q = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { [PK]: quizPk(quizId) },
    })
  );
  if (!q.Item) return { ok: false, error: "Quiz not found" };

  // score
  const questions: any[] = (q.Item as any).questions ?? [];
  let score = 0;
  const total = questions.length;

  const correctness = answers.map((a) => {
    const mt = questions.find((qq) => qq.qid === a.qid);
    const correct = mt && Array.isArray(mt.answer)
      ? String(mt.answer.slice().sort()) === String((a.selected ?? []).slice().sort())
      : false;
    if (correct) score++;
    return { qid: a.qid, correct };
  });

  const attemptId = `a_${Date.now()}`;
  const attempt: Attempt = {
    cloud: attemptPk(attemptId),
    kind: "ATTEMPT",
    attemptId,
    quizId,
    userId: "demo-user",
    score,
    total,
    createdAt: Date.now(),
  };
  AttemptSchema.parse(attempt);

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: attempt,
    })
  );

  return { ok: true, attemptId, score, total, correctness };
}
