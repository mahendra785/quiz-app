import {
  listQuizzesAction,
  createQuizAction,
  seedQuizAction,
} from "@/app/actions/quizzes";

export default async function Home() {
  const quizzes = await listQuizzesAction();
  console.log("Home: quizzes=", quizzes);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quizzes</h1>
      <form action={seedQuizAction}>
        <button className="px-3 py-2 rounded bg-black text-white">
          Seed demo quiz
        </button>
      </form>
      <form
        action={createQuizAction}
        className="flex gap-2 items-end"
        method="post"
      >
        <div>
          <label className="block text-sm" htmlFor="quizId">
            Quiz ID
          </label>
          <input id="quizId" name="quizId" className="border p-2 rounded" />
        </div>
        <div>
          <label className="block text-sm" htmlFor="title">
            Title
          </label>
          <input id="title" name="title" className="border p-2 rounded" />
        </div>
        <button className="px-3 py-2 rounded bg-black text-white">
          Create
        </button>
      </form>
      <ul className="space-y-3">
        {quizzes.map((q) => (
          <li key={q.cloud} className="border p-4 rounded">
            <div className="font-semibold">{q.title}</div>
            <a className="text-blue-600 underline" href={`/quiz/${q.quizId}`}>
              Start
            </a>
          </li>
        ))}
      </ul>
      // app/(www)/page.tsx
      <ul className="space-y-3">
        {quizzes.map((q) => (
          <li key={q.cloud} className="border p-4 rounded">
            <div className="font-semibold">{q.title}</div>
            <div className="text-xs text-gray-500">
              quizId: <code>{q.quizId}</code> • cloud: <code>{q.cloud}</code>
            </div>
            <div className="flex gap-3 mt-2">
              <a className="text-blue-600 underline" href={`/quiz/${q.quizId}`}>
                Open by quizId
              </a>
              <a
                className="text-blue-600 underline"
                href={`/quiz/${encodeURIComponent(q.cloud)}`}
              >
                Open by cloud
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
