// src/components/TakeQuizClient.tsx (only wrapper changes)
"use client";
import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { submitAttemptAction } from "@/app/actions/attempts";

export default function TakeQuizClient({
  quizId,
  questions,
}: {
  quizId: string;
  questions: any[];
}) {
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [state, formAction] = useFormState(submitAttemptAction, { ok: false });
  const answersJson = useMemo(
    () =>
      JSON.stringify(
        Object.entries(answers).map(([qid, selected]) => ({ qid, selected }))
      ),
    [answers]
  );

  function toggle(qid: string, idx: number) {
    setAnswers((prev) => {
      const s = new Set(prev[qid] ?? []);
      s.has(idx) ? s.delete(idx) : s.add(idx);
      return { ...prev, [qid]: Array.from(s) };
    });
  }

  return (
    <div className="card">
      <div className="section">
        <form action={formAction} className="stack">
          <input type="hidden" name="quizId" value={quizId} />
          <input type="hidden" name="answers" value={answersJson} />

          {questions.map((q: any) => (
            <div
              key={q.qid}
              className="stack"
              style={{
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ fontWeight: 600 }}>{q.text}</div>
              {q.options.map((opt: string, i: number) => {
                const selected = (answers[q.qid] ?? []).includes(i);
                return (
                  <label
                    key={i}
                    className="row"
                    style={{ gap: 8, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(q.qid, i)}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          ))}

          <div className="row" style={{ gap: 10, marginTop: 8 }}>
            <button className="btn">Submit</button>
          </div>

          {state?.ok && (
            <div className="helper" style={{ marginTop: 8 }}>
              Score: {state.score} / {state.total}
            </div>
          )}
          {state?.error && (
            <div className="helper" style={{ color: "#ff6b6b" }}>
              {state.error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
