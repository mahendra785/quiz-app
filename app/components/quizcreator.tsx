"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Check, GripVertical, Save, Loader2 } from "lucide-react";
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
        setSelectedQuizId(res.quizId); // Auto-select new quiz
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
    if (!confirm("Are you sure?")) return;
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Creator
          </h1>
          <p className="text-gray-600">Create and manage your quizzes</p>
        </div>

        {/* Save Message Toast */}
        {saveMessage && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top">
            <div
              className={`px-6 py-3 rounded-lg shadow-lg ${
                saveMessage.includes("Error")
                  ? "bg-red-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}
            >
              {saveMessage}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm sticky top-24">
              <button
                onClick={() => setShowNewQuizModal(true)}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-4 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Quiz
              </button>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                  Your Quizzes ({quizzes.length})
                </p>
                {quizzes.length === 0 ? (
                  <p className="text-sm text-gray-500 px-2 py-4 text-center">
                    No quizzes yet
                  </p>
                ) : (
                  quizzes.map((quiz) => (
                    <button
                      key={quiz.quizId}
                      onClick={() => setSelectedQuizId(quiz.quizId)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedQuizId === quiz.quizId
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{quiz.title}</span>
                        {quiz.published ? (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full ml-2 flex-shrink-0" />
                        ) : (
                          <span className="w-2 h-2 bg-gray-400 rounded-full ml-2 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {quiz.questions?.length || 0} questions
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
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
                        className="text-2xl font-bold text-gray-900 mb-2 w-full border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-1"
                        placeholder="Quiz Title"
                      />
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full flex-shrink-0 ml-4 ${
                        activeQuiz.published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {activeQuiz.published ? "Published" : "Draft"}
                    </span>
                  </div>

                  {/* Questions Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        Questions
                      </h3>
                      <button
                        onClick={handleAddQuestion}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
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
                            className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-shadow"
                          >
                            {/* Question Header */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
                                  className="flex-1 text-lg font-medium text-gray-900 border border-indigo-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  autoFocus
                                />
                              ) : (
                                <p
                                  onClick={() => setEditingQuestionId(q.qid)}
                                  className="flex-1 text-lg font-medium text-gray-900 cursor-pointer hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50"
                                >
                                  {q.text}
                                </p>
                              )}

                              <button
                                onClick={() => handleDeleteQuestion(q.qid)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
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
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                      answer.correct
                                        ? "bg-emerald-50 border-emerald-200"
                                        : "bg-gray-50 border-gray-200"
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
                                          ? "bg-emerald-500 border-emerald-500"
                                          : "border-gray-300 hover:border-emerald-400"
                                      }`}
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
                                        className="flex-1 border border-indigo-500 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        autoFocus
                                      />
                                    ) : (
                                      <span
                                        onClick={() =>
                                          setEditingAnswerId(answer.aid)
                                        }
                                        className={`flex-1 cursor-pointer px-3 py-1 rounded hover:bg-white ${
                                          answer.correct
                                            ? "text-emerald-900 font-medium"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {answer.text}
                                      </span>
                                    )}

                                    <button
                                      onClick={() =>
                                        handleDeleteAnswer(q.qid, answer.aid)
                                      }
                                      className="text-gray-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded flex-shrink-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No answers yet
                                </p>
                              )}

                              <button
                                onClick={() => handleAddAnswer(q.qid)}
                                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                              >
                                <Plus className="w-4 h-4" />
                                Add Answer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <div className="text-5xl mb-4">📝</div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">
                          No questions yet
                        </h4>
                        <p className="text-gray-500 mb-6">
                          Get started by adding your first question
                        </p>
                        <button
                          onClick={handleAddQuestion}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add First Question
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
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
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {activeQuiz.published ? "Unpublish Quiz" : "Publish Quiz"}
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={handleDeleteQuiz}
                      disabled={isDeleting}
                      className="px-6 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:bg-red-100 disabled:cursor-not-allowed flex items-center gap-2"
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
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">✏️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Quiz Selected
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Select a quiz from the sidebar or create a new one
                  </p>
                  <button
                    onClick={() => setShowNewQuizModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Quiz
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enter quiz title..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateNewQuiz}
                disabled={!newQuizTitle.trim() || isCreating}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Quiz"
                )}
              </button>
              <button
                onClick={() => {
                  setShowNewQuizModal(false);
                  setNewQuizTitle("");
                }}
                disabled={isCreating}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
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
