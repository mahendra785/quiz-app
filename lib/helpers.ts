import type { Question, Quiz } from "@/lib/interfaces";
import type { UIQuestion, UIQuiz } from "./interfaces";

/** Convert Zod Question -> UI Question */
export function zodToUIQuestion(q: Question): UIQuestion {
  return {
    qid: q.qid,
    text: q.text,
    type: q.type,
    explanation: q.explanation,
    answers: q.options.map((opt, idx) => ({
      aid: `a_${q.qid}_${idx}`,
      text: opt,
      correct: q.answer.includes(idx),
    })),
  };
}

/** Convert UI Question -> Zod Question */
export function uiToZodQuestion(q: UIQuestion): Question {
  return {
    qid: q.qid,
    text: q.text,
    type: q.type,
    options: q.answers.map(a => a.text),
    answer: q.answers
      .map((a, idx) => (a.correct ? idx : -1))
      .filter(idx => idx !== -1),
    explanation: q.explanation,
  };
}

/** Convert Zod Quiz -> UI Quiz */
export function zodToUIQuiz(q: Quiz): UIQuiz {
  return {
    quizId: q.quizId,
    title: q.title,
    published: q.published,
    questions: q.questions.map(zodToUIQuestion),
  };
}

/** Convert UI Quiz -> Zod Quiz-compatible partial */
export function uiToZodQuizPatch(quiz: UIQuiz): Partial<Quiz> {
  return {
    title: quiz.title,
    questions: quiz.questions.map(uiToZodQuestion),
    published: quiz.published ?? false,
  };
}
