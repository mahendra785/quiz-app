import { z } from "zod";

export const QuestionSchema = z.object({
  qid: z.string(),
  text: z.string(),
  type: z.enum(["single", "multi"]),
  options: z.array(z.string()),
  answer: z.array(z.number()),
  explanation: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuizSchema = z.object({
  cloud: z.string(),            // "QUIZ#<quizId>"
  kind: z.literal("QUIZ"),
  quizId: z.string(),
  title: z.string(),
  questions: z.array(QuestionSchema),
  published: z.boolean(),
  createdAt: z.number(),
});
export type Quiz = z.infer<typeof QuizSchema>;

export const AttemptSchema = z.object({
  cloud: z.string(),            // "ATTEMPT#<attemptId>"
  kind: z.literal("ATTEMPT"),
  attemptId: z.string(),
  quizId: z.string(),
  userId: z.string(),
  score: z.number(),
  total: z.number(),
  createdAt: z.number(),
});
export type Attempt = z.infer<typeof AttemptSchema>;

export const UserSchema = z.object({
  cloud: z.string(),                     // "USER#<email>"
  kind: z.literal("USER"),
  email: z.string().email(),
  role: z.enum(["admin", "creator", "learner"]),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
  createdAt: z.number(),
  lastLoginAt: z.number().optional(),
});
export type User = z.infer<typeof UserSchema>;
// Used only in the UI. Easier to modify answers.
export type UIAnswer = {
  aid: string;
  text: string;
  correct: boolean;
};

export type UIQuestion = {
  qid: string;
  text: string;
  type: "single" | "multi";
  answers: UIAnswer[];
  explanation?: string;
};

export type UIQuiz = {
  quizId: string;
  title: string;
  questions: UIQuestion[];
  published?: boolean;
  description?: string; // Optional UI only; not in Zod schema (can ignore or add later)
};
