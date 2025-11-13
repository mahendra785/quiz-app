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
  Sparkles,
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
    if (result) return;

    setAnswers((prev) => {
      const qid = currentQ.qid;
      const current = new Set(prev[qid] ?? []);

      if (currentQ.type === "single") {
        return { ...prev, [qid]: [idx] };
      } else {
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

  const timeTaken = endTime ? Math.floor((endTime - startTime) / 1000) : 0;
  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  // Results View
  if (result?.ok && result.score !== undefined && result.total !== undefined) {
    const percentage = Math.round((result.score / result.total) * 100);
    const passed = percentage >= 70;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Results Header */}
          <div className="text-center mb-12">
            <div
              className={`w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg ${
                passed
                  ? "bg-gradient-to-br from-green-500 to-emerald-500"
                  : "bg-gradient-to-br from-orange-500 to-red-500"
              }`}
            >
              <Award className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-3">
              {passed ? "Congratulations! 🎉" : "Quiz Complete!"}
            </h1>
            <p className="text-xl text-gray-600">
              {passed
                ? "You passed the quiz!"
                : "Keep practicing to improve your score"}
            </p>
          </div>

          {/* Score Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Score</span>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {result.score} / {result.total}
              </div>
              <div className="text-sm text-gray-500 mt-1">{percentage}%</div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  Time Taken
                </span>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {Math.round(timeTaken / questions.length)}s per question
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  Accuracy
                </span>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {percentage}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {result.score} correct answers
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <button
              onClick={handleRetake}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Retake Quiz
            </button>
            <button
              onClick={handleGoHome}
              className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all flex items-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Review Your Answers
            </h2>
            {questions.map((q, idx) => {
              const userAnswer = answers[q.qid] ?? [];
              const isCorrect =
                result.correctness?.find((c) => c.qid === q.qid)?.correct ??
                false;

              return (
                <div
                  key={q.qid}
                  className={`bg-white border-2 rounded-2xl p-6 hover:shadow-lg transition-all ${
                    isCorrect ? "border-green-400" : "border-red-400"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center ${
                        isCorrect
                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                          : "bg-gradient-to-br from-red-500 to-orange-500"
                      }`}
                    >
                      {isCorrect ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <X className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <span className="text-sm text-gray-500 font-medium">
                            Question {idx + 1}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900 mt-1">
                            {q.text}
                          </h3>
                        </div>
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
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
                              className={`p-4 rounded-xl border-2 ${
                                isCorrectAnswer
                                  ? "bg-green-50 border-green-400"
                                  : isUserAnswer
                                  ? "bg-red-50 border-red-400"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isCorrectAnswer && (
                                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                  <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                                )}
                                <span
                                  className={`font-medium ${
                                    isCorrectAnswer
                                      ? "text-green-900"
                                      : isUserAnswer
                                      ? "text-red-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {option}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <div className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Explanation
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {answeredCount} answered
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
                  {currentQuestion + 1}
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-full text-sm font-semibold text-purple-700">
                  {currentQ.type === "single"
                    ? "Single Choice"
                    : "Multiple Choice"}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {currentQ.text}
              </h2>
              {currentQ.type === "multi" && (
                <p className="text-sm text-gray-600 font-medium">
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
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-400 shadow-md"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 flex-shrink-0 flex items-center justify-center transition-all ${
                        currentQ.type === "single"
                          ? "rounded-full"
                          : "rounded-lg"
                      } ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-indigo-600"
                          : "border-2 border-gray-400 bg-white"
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
                      className={`text-base ${
                        isSelected
                          ? "text-gray-900 font-semibold"
                          : "text-gray-700 font-medium"
                      }`}
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
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => goToQuestion(currentQuestion - 1)}
            disabled={currentQuestion === 0}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-xl transition-all font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            <button
              onClick={() => goToQuestion(currentQuestion + 1)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all flex items-center gap-2 font-medium"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Question Grid */}
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
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
                  className={`aspect-square rounded-lg font-semibold text-sm transition-all ${
                    isCurrent
                      ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110"
                      : isAnswered
                      ? "bg-green-100 border-2 border-green-400 text-green-700"
                      : "bg-gray-100 border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-200"
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
          <div className="mt-6 p-4 bg-red-50 border-2 border-red-400 rounded-xl">
            <p className="text-red-700 font-medium">{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
