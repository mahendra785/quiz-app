// src/app/(www)/quiz/[id]/page.tsx
import { getQuizByIdAction } from "@/app/actions/quizzes";
import TakeQuizClient from "../../components/takequiz"; // or "@/components/TakeQuizClient"
export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quizId = decodeURIComponent(id).trim();

  const quiz = await getQuizByIdAction(quizId);
  console.log("QuizPage:", { quizId, found: !!quiz }); // server log

  if (!quiz) {
    return (
      <main className="p-6">
        <h1 className="font-bold">Quiz not found</h1>
        <p className="text-sm mt-2">
          Tried quizId: <code>{quizId}</code>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{quiz.title}</h1>
      <TakeQuizClient quizId={quiz.quizId} questions={quiz.questions} />
    </main>
  );
}
