"use client";

import { useState } from "react";
import { updateQuizContentAction } from "@/app/actions/quizzes";

export default function QuizEditor({ quiz }: { quiz: any }) {
  const [title, setTitle] = useState(quiz.title);
  const [published, setPublished] = useState(!!quiz.published);
  const [questions, setQuestions] = useState<any[]>(quiz.questions || []);

  function addQuestion() {
    const idx = questions.length + 1;
    setQuestions((q) => [
      ...q,
      {
        qid: `q${idx}`,
        text: "",
        type: "single",
        options: ["A", "B", "C", "D"],
        answer: [0],
      },
    ]);
  }

  async function save() {
    await updateQuizContentAction(quiz.quizId, { title, published, questions });
    alert("Saved!");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <input
          className="border p-2 rounded flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label className="flex gap-2 items-center text-sm">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>
      </div>

      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.qid} className="border rounded p-3 space-y-2">
            <input
              className="border p-2 rounded w-full"
              value={q.text}
              onChange={(e) => {
                const x = [...questions];
                x[i] = { ...x[i], text: e.target.value };
                setQuestions(x);
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt: string, j: number) => (
                <input
                  key={j}
                  className="border p-2 rounded"
                  value={opt}
                  onChange={(e) => {
                    const x = [...questions];
                    const o = [...x[i].options];
                    o[j] = e.target.value;
                    x[i] = { ...x[i], options: o };
                    setQuestions(x);
                  }}
                />
              ))}
            </div>
            <div className="text-sm">
              Correct index(es) (comma separated):{" "}
              <input
                className="border p-1 rounded w-32"
                value={q.answer.join(",")}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => !Number.isNaN(n));
                  const x = [...questions];
                  x[i] = { ...x[i], answer: arr };
                  setQuestions(x);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 border rounded" onClick={addQuestion}>
          Add question
        </button>
        <button
          className="px-3 py-2 bg-black text-white rounded"
          onClick={save}
        >
          Save
        </button>
      </div>
    </div>
  );
}
