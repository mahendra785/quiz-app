"use server";

import { unstable_noStore as noStore } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { Attempt, AttemptSchema, Quiz, QuizSchema } from "@/lib/interfaces";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

const TABLE = process.env.DYNAMO_TABLE_NAME!;
const PK = "cloud";
const quizPk = (id: string) => `QUIZ#${id}`;
const attemptPk = (id: string) => `ATTEMPT#${id}`;

interface AnswerSubmission {
  qid: string;
  selected: number[];
}

interface SubmitAttemptResult {
  ok: boolean;
  attemptId?: string;
  score?: number;
  total?: number;
  correctness?: Array<{ qid: string; correct: boolean }>;
  error?: string;
}

export async function submitAttemptAction(
  prev: any,
  formData: FormData
): Promise<SubmitAttemptResult> {
  noStore();

  // Check authentication
  const session = await getServerSession(authOptions);
  const userId = session?.user?.email;

  if (!userId) {
    return { ok: false, error: "Please sign in to submit your attempt." };
  }

  // Extract form data
  const quizId = String(formData.get("quizId") ?? "").trim();
  const answersJson = String(formData.get("answers") ?? "[]");

  if (!quizId) {
    return { ok: false, error: "Quiz ID is required." };
  }

  // Parse answers
  let answers: AnswerSubmission[] = [];
  try {
    answers = JSON.parse(answersJson);
  } catch (error) {
    return { ok: false, error: "Invalid answer format." };
  }

  // Fetch quiz from database
  const ddb = getDynamo();
  let quizData;

  try {
    quizData = await ddb.send(
      new GetCommand({
        TableName: TABLE,
        Key: { [PK]: quizPk(quizId) }
      })
    );
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return { ok: false, error: "Failed to fetch quiz data." };
  }

  if (!quizData.Item) {
    return { ok: false, error: "Quiz not found." };
  }

  const quiz = QuizSchema.parse(quizData.Item);
  const questions = quiz.questions ?? [];

  if (questions.length === 0) {
    return { ok: false, error: "This quiz has no questions." };
  }

  // Calculate score
  let score = 0;
  const total = questions.length;
  const correctness: Array<{ qid: string; correct: boolean }> = [];

  for (const answer of answers) {
    const question = questions.find((q) => q.qid === answer.qid);

    if (!question) {
      correctness.push({ qid: answer.qid, correct: false });
      continue;
    }

    // Compare sorted arrays for correctness
    const userAnswerSorted = (answer.selected ?? []).slice().sort((a, b) => a - b);
    const correctAnswerSorted = (question.answer ?? []).slice().sort((a, b) => a - b);

    const isCorrect =
      userAnswerSorted.length === correctAnswerSorted.length &&
      userAnswerSorted.every((val, idx) => val === correctAnswerSorted[idx]);

    if (isCorrect) {
      score++;
    }

    correctness.push({ qid: answer.qid, correct: isCorrect });
  }

  // Handle unanswered questions
  for (const question of questions) {
    if (!answers.find(a => a.qid === question.qid)) {
      correctness.push({ qid: question.qid, correct: false });
    }
  }

  // Save attempt to database
  const attemptId = `a_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const attempt: Attempt = {
    cloud: attemptPk(attemptId),
    kind: "ATTEMPT",
    attemptId,
    quizId,
    userId,
    score,
    total,
    createdAt: Date.now(),
  };

  try {
    AttemptSchema.parse(attempt);
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: attempt
      })
    );
  } catch (error) {
    console.error("Error saving attempt:", error);
    return {
      ok: false,
      error: "Failed to save your attempt. Please try again."
    };
  }

  return {
    ok: true,
    attemptId,
    score,
    total,
    correctness,
  };
}