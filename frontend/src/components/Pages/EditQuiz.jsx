import { useState, useEffect } from 'react';
import { quizService } from '../../services/quizService';
import Swal from 'sweetalert2';
import { ArrowLeft } from 'lucide-react';

const EditQuiz = ({ quizId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
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

  useEffect(() => {
    fetchQuizData();
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuiz(quizId);
      const quiz = response.data || response;
      
      setQuizData({
        title: quiz.title || '',
        description: quiz.description || '',
        time_limit: quiz.time_limit || '',
        randomize_questions: quiz.randomize_questions || false,
        randomize_choices: quiz.randomize_choices || false,
        show_results_immediately: quiz.show_results_immediately ?? true,
        allow_review: quiz.allow_review ?? true,
        questions: quiz.questions?.map(q => ({
          type: q.type,
          question_text: q.question_text,
          points: q.points,
          correct_answer: q.correct_answer || '',
          choices: q.choices?.map(c => ({
            choice_text: c.choice_text,
            is_correct: c.is_correct
          })) || []
        })) || []
      });
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError('Failed to load quiz data');
      Swal.fire('Error!', 'Failed to load quiz data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizChange = (field, value) => {
    setQuizData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[index][field] = value;
    
    if (field === 'type' && (value === 'identification' || value === 'essay')) {
      updatedQuestions[index].choices = [];
    }
    if (field === 'type' && value === 'multiple_choice' && !updatedQuestions[index].choices?.length) {
      updatedQuestions[index].choices = [
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false }
      ];
    }
    
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleChoiceChange = (questionIndex, choiceIndex, field, value) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].choices[choiceIndex][field] = value;
    
    if (field === 'is_correct' && value === true) {
      updatedQuestions[questionIndex].choices.forEach((choice, idx) => {
        if (idx !== choiceIndex) {
          choice.is_correct = false;
        }
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
            { choice_text: '', is_correct: false }
          ]
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (quizData.questions.length > 1) {
      setQuizData(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const addChoice = (questionIndex) => {
    const updatedQuestions = [...quizData.questions];
    updatedQuestions[questionIndex].choices.push({ choice_text: '', is_correct: false });
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const removeChoice = (questionIndex, choiceIndex) => {
    const updatedQuestions = [...quizData.questions];
    if (updatedQuestions[questionIndex].choices.length > 2) {
      updatedQuestions[questionIndex].choices.splice(choiceIndex, 1);
      setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
    }
  };

  const validateForm = () => {
    if (!quizData.title.trim()) {
      setError('Quiz title is required');
      return false;
    }

    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];
      
      if (!question.question_text.trim()) {
        setError(`Question ${i + 1} text is required`);
        return false;
      }

      if (question.type === 'multiple_choice') {
        if (!question.choices || question.choices.length < 2) {
          setError(`Question ${i + 1} must have at least 2 choices`);
          return false;
        }

        const hasCorrect = question.choices.some(c => c.is_correct);
        if (!hasCorrect) {
          setError(`Question ${i + 1} must have one correct answer`);
          return false;
        }

        const hasEmptyChoice = question.choices.some(c => !c.choice_text.trim());
        if (hasEmptyChoice) {
          setError(`Question ${i + 1} has empty choices`);
          return false;
        }
      }

      if (question.type === 'identification' && !question.correct_answer?.trim()) {
        setError(`Question ${i + 1} must have a correct answer`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  try {
    setSubmitting(true);
    setError('');

    // Prepare quiz data with correct question structure
    const cleanedQuizData = {
      title: quizData.title,
      description: quizData.description,
      time_limit: quizData.time_limit,
      randomize_questions: quizData.randomize_questions,
      randomize_choices: quizData.randomize_choices,
      show_results_immediately: quizData.show_results_immediately,
      allow_review: quizData.allow_review,
      questions: quizData.questions.map(q => {
        if (q.type === 'multiple_choice') {
          return {
            type: q.type,
            question_text: q.question_text,
            points: q.points,
            choices: q.choices.map(c => ({
              choice_text: c.choice_text,
              is_correct: c.is_correct
            }))
          };
        } else if (q.type === 'identification') {
          return {
            type: q.type,
            question_text: q.question_text,
            points: q.points,
            correct_answer: q.correct_answer
          };
        } else if (q.type === 'essay') {
          return {
            type: q.type,
            question_text: q.question_text,
            points: q.points
          };
        }
      })
    };
    
    const response = await quizService.updateQuiz(quizId, cleanedQuizData);

    Swal.fire({
      title: 'Success!',
      text: 'Quiz updated successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });

    if (onSuccess) {
      onSuccess(); // This will trigger MyQuizzes.jsx to refresh
    }

  } catch (err) {
    console.error('Error updating quiz:', err);
    const errorMessage = err.response?.data?.message || 'Failed to update quiz';
    const validationErrors = err.response?.data?.errors;

    if (validationErrors) {
      const errorList = Object.entries(validationErrors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('\n');
      
      Swal.fire({
        title: 'Validation Error',
        text: errorList,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } else {
      setError(errorMessage);
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  } finally {
    setSubmitting(false);
  }
};


  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Quizzes
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Edit Quiz Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={quizData.title}
                onChange={(e) => handleQuizChange('title', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={quizData.description}
                onChange={(e) => handleQuizChange('description', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                rows="3"
                placeholder="Enter quiz description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                value={quizData.time_limit}
                onChange={(e) => handleQuizChange('time_limit', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                min="1"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizData.randomize_questions}
                  onChange={(e) => handleQuizChange('randomize_questions', e.target.checked)}
                  className="mr-2 text-[#E46036] focus:ring-[#E46036]"
                />
                <span className="text-sm">Randomize Questions</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizData.randomize_choices}
                  onChange={(e) => handleQuizChange('randomize_choices', e.target.checked)}
                  className="mr-2 text-[#E46036] focus:ring-[#E46036]"
                />
                <span className="text-sm">Randomize Choices</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizData.show_results_immediately}
                  onChange={(e) => handleQuizChange('show_results_immediately', e.target.checked)}
                  className="mr-2 text-[#E46036] focus:ring-[#E46036]"
                />
                <span className="text-sm">Show Results Immediately</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={quizData.allow_review}
                  onChange={(e) => handleQuizChange('allow_review', e.target.checked)}
                  className="mr-2 text-[#E46036] focus:ring-[#E46036]"
                />
                <span className="text-sm">Allow Review</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 bg-[#E46036] text-white rounded-lg hover:bg-[#cc4f2d] transition-colors"
            >
              Add Question
            </button>
          </div>

          {quizData.questions.map((question, qIndex) => (
            <div key={qIndex} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium">Question {qIndex + 1}</h3>
                {quizData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="identification">Identification</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Question Text *</label>
                  <textarea
                    value={question.question_text}
                    onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                    rows="2"
                    placeholder="Enter question"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Points</label>
                  <input
                    type="number"
                    value={question.points}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                    min="1"
                  />
                </div>

                {question.type === 'multiple_choice' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Choices</label>
                      <button
                        type="button"
                        onClick={() => addChoice(qIndex)}
                        className="text-sm text-[#E46036] hover:text-[#cc4f2d]"
                      >
                        Add Choice
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {question.choices?.map((choice, cIndex) => (
                        <div key={cIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={choice.is_correct}
                            onChange={(e) => handleChoiceChange(qIndex, cIndex, 'is_correct', e.target.checked)}
                            className="mt-1 text-[#E46036] focus:ring-[#E46036]"
                          />
                          <input
                            type="text"
                            value={choice.choice_text}
                            onChange={(e) => handleChoiceChange(qIndex, cIndex, 'choice_text', e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                            placeholder={`Choice ${cIndex + 1}`}
                          />
                          {question.choices.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeChoice(qIndex, cIndex)}
                              className="text-red-500 hover:text-red-700 text-sm px-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === 'identification' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Correct Answer *</label>
                    <input
                      type="text"
                      value={question.correct_answer}
                      onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                      placeholder="Enter the correct answer"
                    />
                  </div>
                )}

                {question.type === 'essay' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Essay questions will require manual grading after quiz completion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-[#E46036] hover:bg-[#cc4f2d] text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Updating Quiz...' : 'Update Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;