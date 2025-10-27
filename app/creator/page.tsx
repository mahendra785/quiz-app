import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { listQuizzesAction, getQuizByIdAction } from "@/app/actions/quizzes";
import { getServerSession } from "next-auth";
import QuizCreatorClient from "../components/quizcreator";
import { getUserByEmailAction } from "@/app/actions/users";

export default async function CreatorPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user?.email;
  const userobj = await getUserByEmailAction(user || "");

  if (!(userobj?.role === "admin" || userobj?.role === "creator")) {
    redirect("/");
  }

  const sp = await (searchParams ?? Promise.resolve({} as { id?: string }));
  const id = sp?.id;

  const quizzes = await listQuizzesAction();
  const activeQuiz = id ? await getQuizByIdAction(id) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <QuizCreatorClient
        quizzes={quizzes}
        activeQuizId={id || null}
        initialActiveQuiz={activeQuiz}
      />
    </div>
  );
}
