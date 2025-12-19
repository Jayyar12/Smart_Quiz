import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizService } from '../../services/quizService';
import Swal from 'sweetalert2';

const CreateQuiz = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalidQuestionIndex, setInvalidQuestionIndex] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  const topRef = useRef(null);
  const questionRefs = useRef([]);

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    time_limit: '',
    randomize_questions: false,
    randomize_choices: false,
    show_results_immediately: true,
    allow_review: true,
    questions: [
      {
        type: 'multiple_choice',
        question_text: '',
        points: 1,
        correct_answer: '',
        choices: [
          { choice_text: '', is_correct: false },
          { choice_text: '', is_correct: false },
        ],
      },
    ],
  });

  // ================= QUIZ DETAIL HANDLER =================
  const handleQuizChange = (field, value) =>
    setQuizData(prev => ({ ...prev, [field]: value }));

  const Checkbox = ({ label, field }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={quizData[field]}
        onChange={() => handleQuizChange(field, !quizData[field])}
        className="w-4 h-4 text-[#FD3A69]"
      />
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );

  // ================= QUESTION HANDLERS =================
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index][field] = value;

    if (field === 'type') {
      if (value === 'multiple_choice') {
        updatedQuestions[index].choices = [
          { choice_text: '', is_correct: false },
          { choice_text: '', is_correct: false },
        ];
        updatedQuestions[index].correct_answer = '';
      } else if (value === 'identification') {
        updatedQuestions[index].choices = [];
      } else {
        updatedQuestions[index].choices = [];
        updatedQuestions[index].correct_answer = '';
      }
    }

    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleChoiceChange = (qIndex, cIndex, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[qIndex].choices[cIndex][field] = value;

    if (field === 'is_correct' && value) {
      updatedQuestions[qIndex].choices.forEach((choice, idx) => {
        if (idx !== cIndex) choice.is_correct = false;
      });
    }

    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const addQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          type: 'multiple_choice',
          question_text: '',
          points: 1,
          correct_answer: '',
          choices: [
            { choice_text: '', is_correct: false },
            { choice_text: '', is_correct: false },
          ],
        },
      ],
    }));
  };

  const removeQuestion = index => {
    if (quizData.questions.length > 1) {
      setQuizData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      }));
    }
  };

  const addChoice = qIndex => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[qIndex].choices.push({ choice_text: '', is_correct: false });
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeChoice = (qIndex, cIndex) => {
    const updatedQuestions = [...quizData.questions];
    if (updatedQuestions[qIndex].choices.length > 2) {
      updatedQuestions[qIndex].choices.splice(cIndex, 1);
      setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  // ================= VALIDATION =================
  const validateQuestions = () => {
    setInvalidQuestionIndex(null);

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];

      if (!q.question_text.trim()) {
        setError(`Question ${i + 1} text is required`);
        setInvalidQuestionIndex(i);
        questionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }

      if (q.type === 'multiple_choice') {
        if (!q.choices.some(c => c.is_correct)) {
          setError(`Question ${i + 1} must have one correct answer`);
          return false;
        }
        if (q.choices.some(c => !c.choice_text.trim())) {
          setError(`Question ${i + 1} has empty choices`);
          return false;
        }
      }

      if (q.type === 'identification' && !q.correct_answer.trim()) {
        setError(`Question ${i + 1} must have a correct answer`);
        return false;
      }
    }
    return true;
  };

  // ================= SUBMIT =================
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateQuestions()) return;

    try {
      setLoading(true);
      setError('');

      const cleanedQuizData = {
        ...quizData,
        questions: quizData.questions.map(q => {
          if (q.type === 'multiple_choice') {
            return {
              type: q.type,
              question_text: q.question_text,
              points: q.points,
              choices: q.choices,
            };
          }
          if (q.type === 'identification') {
            return {
              type: q.type,
              question_text: q.question_text,
              points: q.points,
              correct_answer: q.correct_answer,
            };
          }
          return {
            type: q.type,
            question_text: q.question_text,
            points: q.points,
          };
        }),
      };

      await quizService.createQuiz(quizData);

      Swal.fire({
        title: 'Success!',
        text: 'Quiz created successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onSuccess?.();
      setShowQuestionsModal(false);
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to create quiz',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= RENDER =================
  return (
    <>
      {/* ================= QUIZ DETAILS PAGE ================= */}
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Quiz</h1>

        <div className="bg-white dark:bg-[#020617] rounded-2xl shadow border border-gray-200 dark:border-white/10 p-6 space-y-4">
          <input
            type="text"
            value={quizData.title}
            onChange={e => handleQuizChange('title', e.target.value)}
            placeholder="Quiz Title *"
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />

          <textarea
            value={quizData.description}
            onChange={e => handleQuizChange('description', e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />

          <input
            type="number"
            value={quizData.time_limit || ''}
            onChange={e => handleQuizChange('time_limit', e.target.value)}
            placeholder="Time limit (minutes)"
            className="w-48 px-4 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />

          <div className="flex flex-wrap gap-6">
            <Checkbox label="Randomize Questions" field="randomize_questions" />
            <Checkbox label="Randomize Choices" field="randomize_choices" />
            <Checkbox label="Show Results Immediately" field="show_results_immediately" />
            <Checkbox label="Allow Review" field="allow_review" />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowQuestionsModal(true)}
            className="px-6 py-3 bg-[#E46036] text-white rounded-xl hover:bg-[#00000]"
          >
            Create Quiz →
          </button>
        </div>
      </div>

      {/* ================= QUESTIONS MODAL ================= */}
      <AnimatePresence>
        {showQuestionsModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowQuestionsModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-[#020617] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Step 2: Quiz Questions</h2>
                <button onClick={() => setShowQuestionsModal(false)} className="text-2xl text-gray-900 dark:text-white">&times;</button>
              </div>

              {error && (
                <div className="mx-6 mt-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-4 py-2 rounded border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h3>
                  <button type="button" onClick={addQuestion} className="px-4 py-2 bg-[#FD3A69] text-white rounded-xl hover:bg-[#e03359]">
                    Add Question
                  </button>
                </div>

                {quizData.questions.map((question, qIndex) => (
                  <div key={qIndex} ref={el => (questionRefs.current[qIndex] = el)} className="border border-gray-300 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-[#1E293B]">
                    <div
                      className="flex justify-between px-4 py-2 cursor-pointer"
                      onClick={() => setExpandedQuestion(expandedQuestion === qIndex ? null : qIndex)}
                    >
                      <span className="text-gray-900 dark:text-white">Question {qIndex + 1}</span>
                      {quizData.questions.length > 1 && (
                        <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 dark:text-red-400 text-sm">
                          Remove
                        </button>
                      )}
                    </div>

                    {expandedQuestion === qIndex && (
                      <div className="p-4 space-y-3">
                        <select
                          value={question.type}
                          onChange={e => handleQuestionChange(qIndex, 'type', e.target.value)}
                          className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#020617] text-gray-900 dark:text-white"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="identification">Identification</option>
                          <option value="essay">Essay</option>
                        </select>

                        <textarea
                          value={question.question_text}
                          onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                          className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          rows={2}
                        />

                        {question.type === 'multiple_choice' && (
                          <>
                            {question.choices.map((choice, cIndex) => (
                              <div key={cIndex} className="flex gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={choice.is_correct}
                                  onChange={e => handleChoiceChange(qIndex, cIndex, 'is_correct', e.target.checked)}
                                />
                                <input
                                  type="text"
                                  value={choice.choice_text}
                                  onChange={e => handleChoiceChange(qIndex, cIndex, 'choice_text', e.target.value)}
                                  className="flex-1 border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#020617] text-gray-900 dark:text-white"
                                />
                              </div>
                            ))}
                            <button type="button" onClick={() => addChoice(qIndex)} className="text-sm text-[#FD3A69] dark:text-[#ff5080]">
                              + Add Choice
                            </button>
                          </>
                        )}

                        {question.type === 'identification' && (
                          <input
                            type="text"
                            value={question.correct_answer}
                            onChange={e => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                            className="w-full border border-gray-300 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end">
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-[#FD3A69] text-white rounded-xl">
                    {loading ? 'Creating...' : 'Create Quiz'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateQuiz;
