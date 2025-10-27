import { listQuizzesAction } from "@/app/actions/quizzes";
import Link from "next/link";

export default async function HomePage() {
  const quizzes = await listQuizzesAction();
  const publishedQuizzes = quizzes.filter((q) => q.published);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Available Quizzes
          </h1>
          <p className="text-lg text-gray-600">
            Choose a quiz below to test your knowledge
          </p>
        </div>

        {publishedQuizzes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Quizzes Available
            </h3>
            <p className="text-gray-500">Check back later for new quizzes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedQuizzes.map((quiz) => (
              <Link
                key={quiz.quizId}
                href={`/quiz/${quiz.quizId}`}
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>
                    <span className="ml-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full whitespace-nowrap">
                      Published
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{quiz.questions?.length || 0} questions</span>
                    <span className="text-indigo-600 font-medium group-hover:underline">
                      Start Quiz →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
