import { getQuizByIdAction } from "@/app/actions/quizzes";
import TakeQuizClient from "../../components/takequiz";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await getQuizByIdAction(id);
  const session = await getServerSession(authOptions);

  if (!quiz) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-indigo-50 rounded-full flex items-center justify-center">
            <span className="text-4xl">📝</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Quiz Not Found
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            The quiz you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!quiz.published) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Quiz Not Available
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            This quiz is currently in draft mode and not available to take.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-indigo-50 rounded-full flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Please sign in to take this quiz and track your progress.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/api/auth/signin"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <TakeQuizClient quizId={quiz.quizId} questions={quiz.questions} />;
}
