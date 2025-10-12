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
  cloud: z.string(),                 // DynamoDB PK: "QUIZ#<quizId>"
  kind: z.literal("QUIZ"),
  quizId: z.string(),
  title: z.string(),
  questions: z.array(QuestionSchema),
  published: z.boolean(),
  createdAt: z.number(),
});
export type Quiz = z.infer<typeof QuizSchema>;

export const AttemptSchema = z.object({
  cloud: z.string(),                 // "ATTEMPT#<attemptId>"
  kind: z.literal("ATTEMPT"),
  attemptId: z.string(),
  quizId: z.string(),
  userId: z.string(),
  score: z.number(),
  total: z.number(),
  createdAt: z.number(),
});
export type Attempt = z.infer<typeof AttemptSchema>;
