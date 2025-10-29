"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Plus,
  Check,
  GripVertical,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createQuizAction,
  updateQuizContentAction,
  deleteQuizAction,
  publishQuizAction,
} from "@/app/actions/quizzes";
import { zodToUIQuiz, uiToZodQuizPatch } from "../../lib/helpers";
import type { UIQuiz, UIAnswer, UIQuestion } from "../../lib/interfaces";
import type { Quiz } from "@/lib/interfaces";

interface QuizCreatorProps {
  quizzes: Quiz[];
  activeQuizId?: string | null;
  initialActiveQuiz?: Quiz | null;
}

export default function QuizCreatorClient({
  quizzes,
  activeQuizId,
  initialActiveQuiz,
}: QuizCreatorProps) {
  const router = useRouter();
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(
    activeQuizId || null
  );
  const [activeQuiz, setActiveQuiz] = useState<UIQuiz | null>(
    initialActiveQuiz ? zodToUIQuiz(initialActiveQuiz) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [showNewQuizModal, setShowNewQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState("");

  useEffect(() => {
    if (!selectedQuizId) return setActiveQuiz(null);
    const foundQuiz = quizzes.find((q) => q.quizId === selectedQuizId);
    setActiveQuiz(foundQuiz ? zodToUIQuiz(foundQuiz) : null);
  }, [selectedQuizId, quizzes]);

  useEffect(() => {
    if (saveMessage) {
      const t = setTimeout(() => setSaveMessage(null), 2000);
      return () => clearTimeout(t);
    }
  }, [saveMessage]);

  const handleAddQuestion = () => {
    if (!activeQuiz) return;
    const newQ: UIQuestion = {
      qid: `q_${Date.now()}`,
      text: "New Question",
      type: "single",
      answers: [],
    };
    setActiveQuiz({
      ...activeQuiz,
      questions: [...activeQuiz.questions, newQ],
    });
    setEditingQuestionId(newQ.qid);
  };

  const handleUpdateQuestionText = (qid: string, newText: string) => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.map((q) =>
        q.qid === qid ? { ...q, text: newText } : q
      ),
    });
  };

  const handleAddAnswer = (qid: string) => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.map((q) =>
        q.qid === qid
          ? {
              ...q,
              answers: [
                ...q.answers,
                { aid: `a_${Date.now()}`, text: "New Answer", correct: false },
              ],
            }
          : q
      ),
    });
  };

  const handleUpdateAnswerText = (
    qid: string,
    aid: string,
    newText: string
  ) => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.map((q) =>
        q.qid === qid
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.aid === aid ? { ...a, text: newText } : a
              ),
            }
          : q
      ),
    });
  };

  const handleToggleCorrectAnswer = (qid: string, aid: string) => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.map((q) =>
        q.qid === qid
          ? {
              ...q,
              answers: q.answers.map((a) =>
                a.aid === aid ? { ...a, correct: !a.correct } : a
              ),
            }
          : q
      ),
    });
  };

  const handleDeleteQuestion = (qid: string) => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.filter((q) => q.qid !== qid),
    });
  };

  const handleDeleteAnswer = (qid: string, aid: string) => {
    if (!activeQuiz) return;
    setActiveQuiz({
      ...activeQuiz,
      questions: activeQuiz.questions.map((q) =>
        q.qid === qid
          ? { ...q, answers: q.answers.filter((a) => a.aid !== aid) }
          : q
      ),
    });
  };

  const handleSaveChanges = async () => {
    if (!activeQuiz) return;
    setIsSaving(true);
    try {
      const patch = uiToZodQuizPatch(activeQuiz);
      await updateQuizContentAction(activeQuiz.quizId, patch);
      router.refresh();
      setSaveMessage("Saved!");
    } catch (err) {
      console.error(err);
      setSaveMessage("Error saving!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewQuiz = async () => {
    if (!newQuizTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await createQuizAction(newQuizTitle);
      if (res.ok && res.quizId) {
        setShowNewQuizModal(false);
        setNewQuizTitle("");
        setSelectedQuizId(res.quizId);
        router.refresh();
        setSaveMessage("Quiz created!");
      }
    } catch (err) {
      console.error(err);
      setSaveMessage("Error creating!");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublishQuiz = async () => {
    if (!activeQuiz) return;
    setIsSaving(true);
    try {
      await publishQuizAction(activeQuiz.quizId, !activeQuiz.published);
      setActiveQuiz({ ...activeQuiz, published: !activeQuiz.published });
      router.refresh();
      setSaveMessage("Status updated!");
    } catch (err) {
      console.error(err);
      setSaveMessage("Error publishing!");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!activeQuiz) return;
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    )
      return;
    setIsDeleting(true);
    try {
      await deleteQuizAction(activeQuiz.quizId);
      setSelectedQuizId(null);
      setActiveQuiz(null);
      router.refresh();
      setSaveMessage("Deleted!");
    } catch (err) {
      console.error(err);
      setSaveMessage("Error deleting!");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white/10">
      {/* Header */}
      <div className=" border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quiz Creator</h1>
              <p className="text-sm text-gray-500">
                Create and manage your quizzes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Message Toast */}
      {saveMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-200">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              saveMessage.includes("Error")
                ? "bg-red-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {saveMessage.includes("Error") ? "❌" : "✓"} {saveMessage}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 bg-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
              <button
                onClick={() => setShowNewQuizModal(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all mb-6 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Quiz
              </button>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Your Quizzes ({quizzes.length})
                </p>
                {quizzes.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm text-gray-500">No quizzes yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {quizzes.map((quiz) => (
                      <button
                        key={quiz.quizId}
                        onClick={() => setSelectedQuizId(quiz.quizId)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                          selectedQuizId === quiz.quizId
                            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-500 shadow-sm"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-medium truncate ${
                              selectedQuizId === quiz.quizId
                                ? "text-indigo-900"
                                : "text-gray-900"
                            }`}
                          >
                            {quiz.title}
                          </span>
                          {quiz.published ? (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 ml-2" />
                          ) : (
                            <span className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {quiz.questions?.length || 0} questions
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              {activeQuiz ? (
                <div className="space-y-8">
                  {/* Quiz Header */}
                  <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={activeQuiz.title}
                        onChange={(e) =>
                          setActiveQuiz({
                            ...activeQuiz,
                            title: e.target.value,
                          })
                        }
                        className="text-3xl font-bold text-gray-900 w-full border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
                        placeholder="Quiz Title"
                        style={{ color: "#111827" }}
                      />
                    </div>
                    <span
                      className={`px-4 py-2 text-sm font-medium rounded-full flex-shrink-0 ml-4 ${
                        activeQuiz.published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {activeQuiz.published ? "✓ Published" : "○ Draft"}
                    </span>
                  </div>

                  {/* Questions Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Questions ({activeQuiz.questions?.length || 0})
                      </h3>
                      <button
                        onClick={handleAddQuestion}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow"
                      >
                        <Plus className="w-4 h-4" />
                        Add Question
                      </button>
                    </div>

                    {activeQuiz.questions && activeQuiz.questions.length > 0 ? (
                      <div className="space-y-6">
                        {activeQuiz.questions.map((q, index) => (
                          <div
                            key={q.qid}
                            className="border-2 border-gray-200 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all"
                          >
                            {/* Question Header */}
                            <div className="flex items-start gap-3 mb-5">
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                <span className="text-sm font-bold text-white bg-gradient-to-br from-indigo-600 to-purple-600 px-3 py-1.5 rounded-lg">
                                  Q{index + 1}
                                </span>
                              </div>

                              {editingQuestionId === q.qid ? (
                                <input
                                  type="text"
                                  value={q.text}
                                  onChange={(e) =>
                                    handleUpdateQuestionText(
                                      q.qid,
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => setEditingQuestionId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      setEditingQuestionId(null);
                                  }}
                                  className="flex-1 text-lg font-semibold text-gray-900 border-2 border-indigo-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                  style={{ color: "#111827" }}
                                  autoFocus
                                />
                              ) : (
                                <p
                                  onClick={() => setEditingQuestionId(q.qid)}
                                  className="flex-1 text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-white transition-colors"
                                >
                                  {q.text}
                                </p>
                              )}

                              <button
                                onClick={() => handleDeleteQuestion(q.qid)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
                                title="Delete question"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Answers */}
                            <div className="space-y-3 ml-10">
                              {q.answers && q.answers.length > 0 ? (
                                q.answers.map((answer) => (
                                  <div
                                    key={answer.aid}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                      answer.correct
                                        ? "bg-emerald-50 border-emerald-300 shadow-sm"
                                        : "bg-white border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <button
                                      onClick={() =>
                                        handleToggleCorrectAnswer(
                                          q.qid,
                                          answer.aid
                                        )
                                      }
                                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        answer.correct
                                          ? "bg-emerald-500 border-emerald-500 shadow-sm"
                                          : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                                      }`}
                                      title="Toggle correct answer"
                                    >
                                      {answer.correct && (
                                        <Check className="w-4 h-4 text-white" />
                                      )}
                                    </button>

                                    {editingAnswerId === answer.aid ? (
                                      <input
                                        type="text"
                                        value={answer.text}
                                        onChange={(e) =>
                                          handleUpdateAnswerText(
                                            q.qid,
                                            answer.aid,
                                            e.target.value
                                          )
                                        }
                                        onBlur={() => setEditingAnswerId(null)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter")
                                            setEditingAnswerId(null);
                                        }}
                                        className="flex-1 border-2 border-indigo-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                                        style={{ color: "#111827" }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          setEditingAnswerId(answer.aid)
                                        }
                                        className={`flex-1 cursor-pointer px-4 py-2 rounded-lg transition-colors ${
                                          answer.correct
                                            ? "text-emerald-900 font-medium bg-emerald-100"
                                            : "text-gray-700 hover:bg-gray-50"
                                        }`}
                                      >
                                        {answer.text}
                                      </span>
                                    )}

                                    <button
                                      onClick={() =>
                                        handleDeleteAnswer(q.qid, answer.aid)
                                      }
                                      className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
                                      title="Delete answer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg border border-gray-200">
                                  No answers yet. Click "Add Answer" below.
                                </p>
                              )}

                              <button
                                onClick={() => handleAddAnswer(q.qid)}
                                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                              >
                                <Plus className="w-4 h-4" />
                                Add Answer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-indigo-50/30">
                        <div className="text-6xl mb-4">📝</div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">
                          No questions yet
                        </h4>
                        <p className="text-gray-600 mb-6">
                          Get started by adding your first question
                        </p>
                        <button
                          onClick={handleAddQuestion}
                          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add First Question
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePublishQuiz}
                      disabled={isSaving}
                      className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activeQuiz.published ? "○ Unpublish" : "✓ Publish Quiz"}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={handleDeleteQuiz}
                      disabled={isDeleting}
                      className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Quiz
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24">
                  <div className="text-7xl mb-6">✏️</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    No Quiz Selected
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
                    Select a quiz from the sidebar or create a new one
                  </p>
                  <button
                    onClick={() => setShowNewQuizModal(true)}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Quiz Modal */}
      {showNewQuizModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create New Quiz
            </h2>
            <p className="text-gray-600 mb-6">
              Enter a title for your new quiz
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title
              </label>
              <input
                type="text"
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newQuizTitle.trim() && !isCreating) {
                    handleCreateNewQuiz();
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-400"
                style={{ color: "#111827" }}
                placeholder="e.g., JavaScript Fundamentals"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateNewQuiz}
                disabled={!newQuizTitle.trim() || isCreating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Quiz
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowNewQuizModal(false);
                  setNewQuizTitle("");
                }}
                disabled={isCreating}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
