import Link from "next/link";
import { listQuizzesAction, createQuizAction } from "@/app/actions/quizzes";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth"; // 👈 NOTE: authOptions, not auth

export default async function Home() {
  const session = await getServerSession(authOptions); // ✅ v4 way
  const role = session?.user?.role;
  const quizzes = await listQuizzesAction();

  return (
    <main className="container">
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 className="h1">Quizzes</h1>
          <div className="text-muted">Sharpen skills. Instant feedback.</div>
        </div>
        {(role === "admin" || role === "creator") && (
          <form action={createQuizAction} className="row" style={{ gap: 8 }}>
            <div className="stack">
              <label className="label">Quiz ID</label>
              <input
                name="quizId"
                className="input"
                placeholder="e.g. aws_basics"
              />
            </div>
            <div className="stack">
              <label className="label">Title</label>
              <input name="title" className="input" placeholder="AWS Basics" />
            </div>
            <button className="btn" style={{ height: 42 }}>
              Create
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-2">
        {quizzes.map((q) => (
          <div key={q.cloud} className="card">
            <div className="section">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div className="h2">{q.title}</div>
                  <div className="helper">
                    ID: <span className="mono">{q.quizId}</span>
                  </div>
                </div>
                <span className="badge">
                  {q.published ? "Published" : "Draft"}
                </span>
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <Link
                  className="btn-outline"
                  href={`/quiz/${encodeURIComponent(q.quizId)}`}
                >
                  Open
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!session?.user && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="section">
            <div className="h2">Sign in to create or attempt quizzes</div>
            <div className="helper">
              Use the button in the top-right to sign in with Google.
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
