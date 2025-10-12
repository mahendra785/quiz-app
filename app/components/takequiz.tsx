"use client";

import { useState } from "react";
import { submitAttemptAction } from "@/app/actions/attempts";

export default function TakeQuizClient({
  quizId,
  questions,
}: {
  quizId: string;
  questions: any[];
}) {
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  function toggle(qid: string, idx: number) {
    setAnswers((prev) => {
      const set = new Set(prev[qid] ?? []);
      set.has(idx) ? set.delete(idx) : set.add(idx);
      return { ...prev, [qid]: Array.from(set) };
    });
  }

  async function submit() {
    setBusy(true);
    const payload = Object.entries(answers).map(([qid, selected]) => ({
      qid,
      selected,
    }));
    const formData = new FormData();
    formData.append("quizId", quizId);
    formData.append("answers", JSON.stringify(payload));
    const res = await submitAttemptAction(null, formData);
    setResult(res);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {questions.map((q: any) => (
        <div key={q.qid} className="border rounded p-4 space-y-2">
          <div className="font-medium">{q.text}</div>
          {q.options.map((opt: string, i: number) => {
            const selected = (answers[q.qid] ?? []).includes(i);
            return (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
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

      <button
        disabled={busy}
        onClick={submit}
        className="px-4 py-2 rounded bg-black text-white"
      >
        {busy ? "Submitting..." : "Submit"}
      </button>

      {result?.ok && (
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Result</div>
          <p>
            Score: {result.score} / {result.total}
          </p>
        </div>
      )}
      {result?.error && <p className="text-red-600">{result.error}</p>}
    </div>
  );
}
