import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { quizService } from '../../services/quizService';
import Swal from 'sweetalert2';

const CreateQuizModal = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invalidQuestionIndex, setInvalidQuestionIndex] = useState(null);
  const [visible, setVisible] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null); // collapsible

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

  // ====== Handlers ======
  const handleQuizChange = (field, value) => setQuizData(prev => ({ ...prev, [field]: value }));

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index][field] = value;

    if (field === 'type') {
      if (value === 'multiple_choice' && !updatedQuestions[index].choices?.length) {
        updatedQuestions[index].choices = [
          { choice_text: '', is_correct: false },
          { choice_text: '', is_correct: false },
        ];
      } else if (value !== 'multiple_choice') {
        updatedQuestions[index].choices = [];
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

  const validateForm = () => {
    setInvalidQuestionIndex(null);

    if (!quizData.title.trim()) {
      setError('Quiz title is required');
      topRef.current?.scrollIntoView({ behavior: 'smooth' });
      return false;
    }

    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];

      if (!question.question_text.trim()) {
        setError(`Question ${i + 1} text is required`);
        setInvalidQuestionIndex(i);
        questionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }

      if (question.type === 'multiple_choice') {
        if (!question.choices || question.choices.length < 2) {
          setError(`Question ${i + 1} must have at least 2 choices`);
          setInvalidQuestionIndex(i);
          questionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }

        if (!question.choices.some(c => c.is_correct)) {
          setError(`Question ${i + 1} must have one correct answer`);
          setInvalidQuestionIndex(i);
          questionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }

        if (question.choices.some(c => !c.choice_text.trim())) {
          setError(`Question ${i + 1} has empty choices`);
          setInvalidQuestionIndex(i);
          questionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      }

      if (question.type === 'identification' && !question.correct_answer?.trim()) {
        setError(`Question ${i + 1} must have a correct answer`);
        setInvalidQuestionIndex(i);
        questionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

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
              choices: q.choices.map(c => ({ choice_text: c.choice_text, is_correct: c.is_correct })),
            };
          } else if (q.type === 'identification') {
            return { type: q.type, question_text: q.question_text, points: q.points, correct_answer: q.correct_answer };
          } else {
            return { type: q.type, question_text: q.question_text, points: q.points };
          }
        }),
      };

      const response = await quizService.createQuiz(cleanedQuizData);
      Swal.fire({ title: 'Success!', text: 'Quiz created successfully', icon: 'success', timer: 2000, showConfirmButton: false });
      if (onSuccess) onSuccess(response.data);
      setVisible(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create quiz';
      setError(errorMessage);
      Swal.fire({ title: 'Error!', text: errorMessage, icon: 'error', confirmButtonText: 'OK' });
    } finally {
      setLoading(false);
    }
  };

  // Close modal but keep data intact (per your request)
  const handleClose = () => {
    setVisible(false);
    setExpandedQuestion(null);
  };

  // Re-open modal (button click). Keep any typed data.
  const handleOpen = () => {
    setVisible(true);
    // scroll to top of modal when opened
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }));
  };

  const Checkbox = ({ label, field }) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={quizData[field]}
        onChange={() => handleQuizChange(field, !quizData[field])}
        className="w-4 h-4 text-[#FD3A69] border-gray-300 rounded focus:ring-[#FD3A69]"
      />
      <span className="text-gray-700 font-medium">{label}</span>
    </label>
  );

  return (
    <>
      {/* Trigger button shown when modal is closed */}
      {!visible && (
        <div className="p-4">
          {/* You can move/change styling of this button as needed */}
          <button
            onClick={handleOpen}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FD3A69] text-white rounded-xl hover:bg-[#E46036] transition-colors shadow"
            aria-label="Open create quiz modal"
            title="Create Quiz"
          >
            {/* simple plus icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Quiz
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={topRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">Create Quiz</h2>
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 text-lg font-bold" aria-label="Close modal">
                  &times;
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mx-6 my-2 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                {/* Quiz Details */}
                <div className="space-y-4">
                  <input
                    type="text"
                    value={quizData.title}
                    onChange={e => handleQuizChange('title', e.target.value)}
                    placeholder="Quiz Title *"
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#e46036] focus:border-transparent outline-none"
                  />
                  <textarea
                    value={quizData.description}
                    onChange={e => handleQuizChange('description', e.target.value)}
                    placeholder="Description"
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#e46036] focus:border-transparent outline-none"
                    rows="2"
                  />

                  {/* Time Limit */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-700 font-medium">Time Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={quizData.time_limit || ''}
                      onChange={e => handleQuizChange('time_limit', e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#e46036] focus:border-transparent placeholder-gray-400 outline-none"
                      placeholder="Enter minutes"
                    />
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[5, 10, 15, 30, 60].map(min => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => handleQuizChange('time_limit', min)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full hover:bg-[#e46036] hover:text-white transition-colors text-sm"
                        >
                          {min} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 mt-2">
                    <Checkbox label="Randomize Questions" field="randomize_questions" />
                    <Checkbox label="Randomize Choices" field="randomize_choices" />
                    <Checkbox label="Show Results Immediately" field="show_results_immediately" />
                    <Checkbox label="Allow Review" field="allow_review" />
                  </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-4 py-2 bg-[#FD3A69] text-white rounded-xl hover:bg-[#E46036] transition-colors"
                    >
                      Add Question
                    </button>
                  </div>

                  {quizData.questions.map((question, qIndex) => {
                    const isExpanded = expandedQuestion === qIndex;
                    return (
                      <div
                        key={qIndex}
                        ref={el => (questionRefs.current[qIndex] = el)}
                        className={`bg-gray-50 border rounded-xl shadow-sm ${invalidQuestionIndex === qIndex ? 'border-red-500 animate-pulse' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-center px-4 py-2 cursor-pointer select-none" onClick={() => setExpandedQuestion(isExpanded ? null : qIndex)}>
                          <h4 className="font-medium">Question {qIndex + 1}</h4>
                          <div className="flex gap-2 items-center">
                            {quizData.questions.length > 1 && (
                              <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700 font-medium">
                                Remove
                              </button>
                            )}
                            <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 space-y-3">
                            <select
                              value={question.type}
                              onChange={e => handleQuestionChange(qIndex, 'type', e.target.value)}
                              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#FD3A69] focus:border-transparent"
                            >
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="identification">Identification</option>
                              <option value="essay">Essay</option>
                            </select>

                            <textarea
                              value={question.question_text}
                              onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#FD3A69] focus:border-transparent"
                              placeholder="Enter question"
                              rows="2"
                            />

                            <input
                              type="number"
                              value={question.points}
                              onChange={e => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                              className="w-24 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#FD3A69] focus:border-transparent"
                              min="1"
                              placeholder="Points"
                            />

                            {/* Multiple Choice */}
                            {question.type === 'multiple_choice' && (
                              <div className="space-y-2">
                                {question.choices.map((choice, cIndex) => (
                                  <div key={cIndex} className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`correct-${qIndex}`}
                                      checked={choice.is_correct}
                                      onChange={e => handleChoiceChange(qIndex, cIndex, 'is_correct', e.target.checked)}
                                      className="text-[#FD3A69] focus:ring-[#FD3A69]"
                                    />
                                    <input
                                      type="text"
                                      value={choice.choice_text}
                                      onChange={e => handleChoiceChange(qIndex, cIndex, 'choice_text', e.target.value)}
                                      className={`flex-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#FD3A69] focus:border-transparent ${choice.is_correct ? 'bg-green-50 border-green-300' : ''}`}
                                      placeholder={`Choice ${cIndex + 1}`}
                                    />
                                    {question.choices.length > 2 && (
                                      <button type="button" onClick={() => removeChoice(qIndex, cIndex)} className="text-red-500 hover:text-red-700 font-medium">
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button type="button" onClick={() => addChoice(qIndex)} className="text-sm text-[#FD3A69] hover:text-[#e6395d] font-medium">
                                  Add Choice
                                </button>
                              </div>
                            )}

                            {/* Identification */}
                            {question.type === 'identification' && (
                              <input
                                type="text"
                                value={question.correct_answer}
                                onChange={e => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                                placeholder="Correct Answer"
                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#FD3A69] focus:border-transparent"
                              />
                            )}

                            {/* Essay */}
                            {question.type === 'essay' && (
                              <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                                Essay questions require manual grading after quiz completion.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#FD3A69] text-white rounded-xl hover:bg-[#E46036] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
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

export default CreateQuizModal;
