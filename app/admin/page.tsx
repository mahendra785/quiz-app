import { auth } from "../../lib/auth";
import { redirect } from "next/navigation";
import { listQuizzesAction, deleteQuizAction } from "@/app/actions/quizzes";
import { setUserRoleAction } from "@/app/actions/users";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/");

  const quizzes = await listQuizzesAction();

  async function setRole(prev: any, fd: FormData) {
    "use server";
    const email = String(fd.get("email") ?? "")
      .trim()
      .toLowerCase();
    const role = String(fd.get("role") ?? "learner") as any;
    await setUserRoleAction(email, role);
    return { ok: true };
  }

  async function del(prev: any, fd: FormData) {
    "use server";
    const quizId = String(fd.get("quizId") ?? "").trim();
    await deleteQuizAction(quizId);
    return { ok: true };
  }

  return (
    <main className="container grid grid-2">
      <section className="card">
        <div className="section">
          <div className="h2">Assign Role</div>
          <form
            action={setRole}
            className="grid"
            style={{
              gridTemplateColumns: "1fr 200px auto",
              gap: 12,
              marginTop: 12,
            }}
          >
            <input
              name="email"
              placeholder="person@example.com"
              className="input"
            />
            <select name="role" className="select">
              <option value="admin">admin</option>
              <option value="creator">creator</option>
              <option value="learner">learner</option>
            </select>
            <button className="btn">Save</button>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="section">
          <div className="h2">All Quizzes</div>
          <table className="table" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Title</th>
                <th>ID</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((q) => (
                <tr key={q.cloud}>
                  <td>{q.title}</td>
                  <td className="mono">{q.quizId}</td>
                  <td>{q.published ? "Published" : "Draft"}</td>
                  <td>
                    <form
                      action={del}
                      className="row"
                      style={{ justifyContent: "end" }}
                    >
                      <input type="hidden" name="quizId" value={q.quizId} />
                      <button className="btn-outline">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
