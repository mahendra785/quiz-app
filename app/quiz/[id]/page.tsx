import { getQuizByIdAction } from "@/app/actions/quizzes";
import TakeQuizClient from "../../components/takequiz";
export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizByIdAction(decodeURIComponent(id).trim());
  if (!quiz) return <main className="p-6">Quiz not found</main>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{quiz.title}</h1>
      <TakeQuizClient quizId={quiz.quizId} questions={quiz.questions} />
    </main>
  );
}
