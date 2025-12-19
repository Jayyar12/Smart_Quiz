import { useState, useEffect, useRef } from 'react';
import { quizService } from '../../services/quizService';
import Swal from 'sweetalert2';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';

const EditQuiz = ({ quizId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  const originalQuizRef = useRef(null);

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    time_limit: '',
    randomize_questions: false,
    randomize_choices: false,
    show_results_immediately: true,
    allow_review: true,
    questions: []
  });

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await quizService.getQuiz(quizId);
      const quiz = res.data || res;

      const formatted = {
        title: quiz.title || '',
        description: quiz.description || '',
        time_limit: quiz.time_limit || '',
        randomize_questions: quiz.randomize_questions || false,
        randomize_choices: quiz.randomize_choices || false,
        show_results_immediately: quiz.show_results_immediately ?? true,
        allow_review: quiz.allow_review ?? true,
        questions: quiz.questions || []
      };

      originalQuizRef.current = JSON.stringify(formatted);
      setQuizData(formatted);
    } catch {
      Swal.fire('Error', 'Failed to load quiz', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ================= UNSAVED ================= */

  const isDirty = () =>
    JSON.stringify(quizData) !== originalQuizRef.current;

  useEffect(() => {
    const warn = e => {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [quizData]);

  const confirmLeave = async () => {
    if (!isDirty()) return true;
    const res = await Swal.fire({
      title: 'Unsaved Changes',
      text: 'You have unsaved changes. Leave anyway?',
      icon: 'warning',
      showCancelButton: true
    });
    return res.isConfirmed;
  };

  /* ================= HANDLERS ================= */

  const handleQuizChange = (f, v) =>
    setQuizData(p => ({ ...p, [f]: v }));

  const handleQuestionChange = (i, f, v) => {
    const q = [...quizData.questions];
    q[i][f] = v;

    if (f === 'type') {
      if (v === 'multiple_choice' && !q[i].choices?.length) {
        q[i].choices = [
          { choice_text: '', is_correct: false },
          { choice_text: '', is_correct: false }
        ];
      }
      if (v !== 'multiple_choice') q[i].choices = [];
    }

    setQuizData(p => ({ ...p, questions: q }));
  };

  const handleChoiceChange = (qi, ci, f, v) => {
    const q = [...quizData.questions];
    q[qi].choices[ci][f] = v;

    if (f === 'is_correct' && v) {
      q[qi].choices.forEach((c, i) => {
        if (i !== ci) c.is_correct = false;
      });
    }

    setQuizData(p => ({ ...p, questions: q }));
  };

  const addQuestion = () =>
    setQuizData(p => ({
      ...p,
      questions: [
        ...p.questions,
        {
          type: 'multiple_choice',
          question_text: '',
          points: 1,
          correct_answer: '',
          choices: [
            { choice_text: '', is_correct: false },
            { choice_text: '', is_correct: false }
          ]
        }
      ]
    }));

  const removeQuestion = i =>
    quizData.questions.length > 1 &&
    setQuizData(p => ({
      ...p,
      questions: p.questions.filter((_, idx) => idx !== i)
    }));

  /* ================= VALIDATION ================= */

  const validateForm = () => {
    setError('');
    if (!quizData.title.trim()) {
      setError('Quiz title is required');
      return false;
    }

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];

      if (!q.question_text?.trim()) {
        setError(`Question ${i + 1} text is required`);
        return false;
      }

      if (q.type === 'multiple_choice') {
        if (!q.choices?.some(c => c.is_correct)) {
          setError(`Question ${i + 1} must have a correct answer`);
          return false;
        }
      }

      if (q.type === 'identification' && !q.correct_answer?.trim()) {
        setError(`Question ${i + 1} needs a correct answer`);
        return false;
      }
    }
    return true;
  };

  const hasChanges = () => {
    return JSON.stringify(quizData) !== originalQuizRef.current;
  };


  /* ================= SUBMIT ================= */

  const handleSubmit = async e => {
    e.preventDefault();
    if (!hasChanges()) {
      Swal.fire({
        title: 'No changes detected',
        text: 'You have not made any changes at all to the quiz',
        icon: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);
      await quizService.updateQuiz(quizId, quizData);
      originalQuizRef.current = JSON.stringify(quizData);
      Swal.fire('Success', 'Quiz updated', 'success');
      onSuccess && onSuccess();
    } catch {
      Swal.fire('Error', 'Update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */

  if (loading) return <p className="text-center py-10">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        type="button"
        onClick={async () => {
          if (await confirmLeave()) onCancel();
        }}
        className="bg-[#E46036] text-white px-6 py-2 rounded-lg"
      >
        Cancel Editing
      </button>


      {/* DETAILS */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Edit Quiz</h2>

        <input
          value={quizData.title}
          onChange={e => handleQuizChange('title', e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
          placeholder="Quiz Title"
        />

        <textarea
          value={quizData.description}
          onChange={e => handleQuizChange('description', e.target.value)}
          className="w-full px-10 py-2 border rounded"
          placeholder="Description"
        />

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowQuestionsModal(true)}
            className="bg-[#E46036] text-white px-6 py-2 rounded-lg"
          >
            Edit Questions →
          </button>
        </div>
      </div>

      {/* QUESTIONS MODAL */}
      {showQuestionsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6">
                <h2 className="text-xl font-semibold">Questions</h2>

                {quizData.questions.map((q, i) => (
                  <div key={i} className="border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Question {i + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="text-red-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <select
                      value={q.type}
                      onChange={e =>
                        handleQuestionChange(i, 'type', e.target.value)
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="identification">Identification</option>
                    </select>

                    <textarea
                      value={q.question_text}
                      onChange={e =>
                        handleQuestionChange(i, 'question_text', e.target.value)
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder="Question text"
                    />

                    {q.type === 'multiple_choice' &&
                      q.choices.map((c, ci) => (
                        <div key={ci} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            checked={c.is_correct}
                            onChange={() =>
                              handleChoiceChange(i, ci, 'is_correct', true)
                            }
                          />
                          <input
                            value={c.choice_text}
                            onChange={e =>
                              handleChoiceChange(
                                i,
                                ci,
                                'choice_text',
                                e.target.value
                              )
                            }
                            className="flex-1 border rounded px-2 py-1"
                            placeholder={`Choice ${ci + 1}`}
                          />
                        </div>
                      ))}

                    {q.type === 'identification' && (
                      <input
                        value={q.correct_answer}
                        onChange={e =>
                          handleQuestionChange(
                            i,
                            'correct_answer',
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-3 py-2"
                        placeholder="Correct Answer"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 text-[#E46036]"
                >
                  <Plus size={18} /> Add Question
                </button>

                {error && <p className="text-red-500">{error}</p>}
              </div>

              <div className="flex gap-4 p-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowQuestionsModal(false)}
                  className="flex-1 bg-gray-200 rounded py-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#E46036] text-white rounded py-2"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditQuiz;
