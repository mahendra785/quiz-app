import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import {
  listQuizzesAction,
  getQuizByIdAction,
  updateQuizContentAction,
} from "@/app/actions/quizzes";
import { getServerSession } from "next-auth";

export default async function CreatorPage({
  searchParams,
}: {
  searchParams?: Promise<{ id?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!(role === "admin" || role === "creator")) redirect("/");

  const sp = await (searchParams ?? Promise.resolve({}));
  const id = sp?.id;
  const quizzes = await listQuizzesAction();
  const active = id ? await getQuizByIdAction(id) : null;

  async function save(prev: any, formData: FormData) {
    "use server";
    const quizId = String(formData.get("quizId") ?? "");
    const title = String(formData.get("title") ?? "");
    const published = String(formData.get("published") ?? "false") === "true";
    const questions = JSON.parse(String(formData.get("questions") ?? "[]"));
    await updateQuizContentAction(quizId, { title, published, questions });
    return { ok: true };
  }

  return (
    <main className="container grid grid-3">
      <aside className="card">
        <div className="section">
          <div className="h2">Your Quizzes</div>
          <ul className="stack" style={{ marginTop: 8 }}>
            {quizzes.map((q) => (
              <li key={q.cloud}>
                <a href={`/creator?id=${encodeURIComponent(q.quizId)}`}>
                  {q.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="card" style={{ gridColumn: "span 2" }}>
        <div className="section">
          {!active ? (
            <div className="helper">Select a quiz to edit.</div>
          ) : (
            <form action={save} className="stack">
              <input type="hidden" name="quizId" value={active.quizId} />
              <div className="stack">
                <label className="label">Title</label>
                <input
                  name="title"
                  defaultValue={active.title}
                  className="input"
                />
              </div>
              <div className="stack">
                <label className="label">Published</label>
                <select
                  name="published"
                  defaultValue={String(active.published)}
                  className="select"
                >
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>
              <div className="stack">
                <label className="label">Questions JSON</label>
                <textarea name="questions" rows={8} className="textarea mono">
                  {JSON.stringify(active.questions, null, 2)}
                </textarea>
                <div className="helper">
                  For now, paste JSON. (Your interactive editor can go here
                  later.)
                </div>
              </div>
              <button className="btn" style={{ width: "fit-content" }}>
                Save
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
