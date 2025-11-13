import { getQuizByIdAction } from "@/app/actions/quizzes";
import TakeQuizClient from "../../components/takequiz";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Sparkles, Lock, FileQuestion, ArrowRight } from "lucide-react";

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
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
            <FileQuestion className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
            Quiz Not Found
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg">
            The quiz you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all"
          >
            Return to Home
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    );
  }

  if (!quiz.published) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-10 h-10 text-gray-600" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
            Quiz Not Available
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg">
            This quiz is currently in draft mode and not available to take.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all"
          >
            Return to Home
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg">
            Please sign in to take this quiz and track your progress.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/api/auth/signin/google"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all"
            >
              Sign In with Google
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/"
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all"
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
