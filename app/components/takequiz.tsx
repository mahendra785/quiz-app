"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  TrendingUp,
  RotateCcw,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/interfaces";

interface TakeQuizClientProps {
  quizId: string;
  questions: Question[];
}

interface AnswerResult {
  qid: string;
  correct: boolean;
}

interface SubmitResult {
  ok: boolean;
  attemptId?: string;
  score?: number;
  total?: number;
  correctness?: AnswerResult[];
  error?: string;
}

export default function TakeQuizClient({
  quizId,
  questions,
}: TakeQuizClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showExplanations, setShowExplanations] = useState(false);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);

  const currentQ = questions[currentQuestion];
  const selectedAnswers = answers[currentQ?.qid] ?? [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  const answersJson = useMemo(
    () =>
      JSON.stringify(
        Object.entries(answers).map(([qid, selected]) => ({ qid, selected }))
      ),
    [answers]
  );

  const toggleAnswer = (idx: number) => {
    if (result) return; // Don't allow changes after submission

    setAnswers((prev) => {
      const qid = currentQ.qid;
      const current = new Set(prev[qid] ?? []);

      if (currentQ.type === "single") {
        // Single choice: replace with new selection
        return { ...prev, [qid]: [idx] };
      } else {
        // Multiple choice: toggle
        if (current.has(idx)) {
          current.delete(idx);
        } else {
          current.add(idx);
        }
        return { ...prev, [qid]: Array.from(current) };
      }
    });
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestion(index);
    }
  };

  const handleSubmit = async () => {
    if (answeredCount < questions.length) {
      const confirmSubmit = confirm(
        `You've answered ${answeredCount} out of ${questions.length} questions. Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setEndTime(Date.now());

    try {
      const { submitAttemptAction } = await import("@/app/actions/attempts");

      const formData = new FormData();
      formData.append("quizId", quizId);
      formData.append("answers", answersJson);

      const submitResult = await submitAttemptAction(null, formData);
      setResult(submitResult);
      setShowExplanations(true);
    } catch (error) {
      console.error("Submit failed:", error);
      setResult({
        ok: false,
        error: "Failed to submit quiz. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setResult(null);
    setShowExplanations(false);
    setEndTime(null);
  };

  const handleGoHome = () => {
    startTransition(() => {
      router.push("/");
    });
  };

  // Calculate time taken
  const timeTaken = endTime ? Math.floor((endTime - startTime) / 1000) : 0;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  // Results View
  if (result?.ok && result.score !== undefined && result.total !== undefined) {
    const percentage = Math.round((result.score / result.total) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Results Header */}
          <div className="text-center mb-12">
            <div
              className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                passed
                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                  : "bg-gradient-to-br from-orange-500 to-red-500"
              }`}
            >
              <Award className="w-12 h-12" />
            </div>

            <h1 className="text-4xl font-bold mb-2">
              {passed ? "Congratulations! 🎉" : "Quiz Complete!"}
            </h1>
            <p className="text-xl text-slate-400">
              {passed
                ? "You passed the quiz!"
                : "Keep practicing to improve your score"}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-slate-400">Score</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {result.score} / {result.total}
              </div>
              <div className="text-sm text-slate-400 mt-1">{percentage}%</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-slate-400">Time Taken</span>
              </div>
              <div className="text-3xl font-bold text-purple-400">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {Math.round(timeTaken / questions.length)}s per question
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5 text-green-400" />
                <span className="text-sm text-slate-400">Accuracy</span>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {percentage}%
              </div>
              <div className="text-sm text-slate-400 mt-1">
                {result.score} correct answers
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-blue-500/20 border border-blue-500/50 rounded-xl hover:bg-blue-500/30 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Retake Quiz
            </button>
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:border-slate-500 transition-all flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">Review Your Answers</h2>
            {questions.map((q, idx) => {
              const userAnswer = answers[q.qid] ?? [];
              const isCorrect =
                result.correctness?.find((c) => c.qid === q.qid)?.correct ??
                false;

              return (
                <div
                  key={q.qid}
                  className={`bg-slate-800/50 backdrop-blur-xl border rounded-2xl p-6 ${
                    isCorrect ? "border-green-500/50" : "border-red-500/50"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center ${
                        isCorrect ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {isCorrect ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-sm text-slate-400">
                            Question {idx + 1}
                          </span>
                          <h3 className="text-lg font-medium mt-1">{q.text}</h3>
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isCorrect ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {q.options.map((option, oIdx) => {
                          const isUserAnswer = userAnswer.includes(oIdx);
                          const isCorrectAnswer = q.answer.includes(oIdx);

                          return (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-lg border ${
                                isCorrectAnswer
                                  ? "bg-green-500/10 border-green-500/50"
                                  : isUserAnswer
                                  ? "bg-red-500/10 border-red-500/50"
                                  : "bg-slate-700/30 border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isCorrectAnswer && (
                                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                )}
                                <span
                                  className={
                                    isCorrectAnswer
                                      ? "text-green-300"
                                      : isUserAnswer
                                      ? "text-red-300"
                                      : "text-slate-300"
                                  }
                                >
                                  {option}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="text-sm font-medium text-blue-400 mb-1">
                            Explanation:
                          </div>
                          <div className="text-sm text-slate-300">
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-slate-400">
              {answeredCount} answered
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center font-bold text-blue-400">
                  {currentQuestion + 1}
                </div>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs font-medium text-purple-300">
                  {currentQ.type === "single"
                    ? "Single Choice"
                    : "Multiple Choice"}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{currentQ.text}</h2>
              {currentQ.type === "multi" && (
                <p className="text-sm text-slate-400">
                  Select all correct answers
                </p>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswers.includes(idx);

              return (
                <button
                  key={idx}
                  onClick={() => toggleAnswer(idx)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20"
                      : "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 flex-shrink-0 flex items-center justify-center transition-all ${
                        currentQ.type === "single" ? "rounded-full" : "rounded"
                      } ${
                        isSelected
                          ? "bg-blue-500 border-2 border-blue-500"
                          : "border-2 border-slate-500"
                      }`}
                    >
                      {isSelected &&
                        (currentQ.type === "single" ? (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        ) : (
                          <Check className="w-4 h-4 text-white" />
                        ))}
                    </div>
                    <span
                      className={
                        isSelected ? "text-white font-medium" : "text-slate-300"
                      }
                    >
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
            className="px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-xl hover:border-slate-500 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() => goToQuestion(currentQuestion + 1)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Question Grid */}
        <div className="mt-8 p-6 bg-slate-800/30 backdrop-blur-xl border border-slate-700 rounded-2xl">
          <h3 className="text-sm font-medium text-slate-400 mb-4">
            Question Overview
          </h3>
          <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.qid]?.length > 0;
              const isCurrent = idx === currentQuestion;

              return (
                <button
                  key={q.qid}
                  onClick={() => goToQuestion(idx)}
                  className={`aspect-square rounded-lg font-medium text-sm transition-all ${
                    isCurrent
                      ? "bg-blue-500 text-white scale-110"
                      : isAnswered
                      ? "bg-green-500/20 border border-green-500/50 text-green-400"
                      : "bg-slate-700/50 border border-slate-600 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {result?.error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-red-400">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
