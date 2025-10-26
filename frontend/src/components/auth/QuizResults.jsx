import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { 
  Award, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Eye, 
  Edit3,
  Save,
  X as CloseIcon,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const QuizResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [gradingMode, setGradingMode] = useState({});
  const [grades, setGrades] = useState({});
  const [savingGrade, setSavingGrade] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [attemptId, results?.allow_review]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await quizService.getResults(attemptId);
      const data = response.data.data;
      setResults(data);
      
      // Check if viewing as creator (has participant info)
      setIsCreator(data.is_creator || false);;
      
      // Initialize grades state for essay questions
      if (data.answers) {
        const initialGrades = {};
        data.answers.forEach(answer => {
          if (answer.question_type === 'essay') {
            initialGrades[answer.question_id] = {
              points_earned: answer.points_earned || 0,
              feedback: answer.feedback || '',
            };
          }
        });
        setGrades(initialGrades);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      Swal.fire('Error', 'Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (questionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      }
    }));
  };

  const handleSaveGrade = async (answerId, questionId, maxPoints) => {
    // Debug logging
    console.log('Grading:', { answerId, questionId, maxPoints });
    
    // Validate answerId exists
    if (!answerId) {
      console.error('Answer ID is missing!');
      Swal.fire('Error', 'Answer ID is missing. Please refresh the page.', 'error');
      return;
    }
    
    const grade = grades[questionId];
    
    // Validation
    if (grade.points_earned < 0) {
      Swal.fire('Invalid Points', 'Points cannot be negative', 'error');
      return;
    }
    
    if (grade.points_earned > maxPoints) {
      Swal.fire('Invalid Points', `Points cannot exceed ${maxPoints}`, 'error');
      return;
    }

    try {
      setSavingGrade(answerId);
      
      await quizService.gradeAnswer(answerId, {
        points_earned: parseFloat(grade.points_earned),
        feedback: grade.feedback,
      });

      // Refresh results to get updated scores
      await fetchResults();
      
      // Exit grading mode for this question
      setGradingMode(prev => ({
        ...prev,
        [questionId]: false,
      }));

      Swal.fire({
        title: 'Graded!',
        text: 'Essay has been graded successfully',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error('Error grading answer:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save grade', 'error');
    } finally {
      setSavingGrade(null);
    }
  };

  const toggleGradingMode = (questionId) => {
    setGradingMode(prev => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const getScorePercentage = () => {
    if (!results) return 0;
    return Math.round((results.score / results.total_points) * 100);
  };

  const getScoreColor = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'bg-green-50 border-green-200';
    if (percentage >= 75) return 'bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getGradeText = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 75) return 'Good Job!';
    if (percentage >= 60) return 'Passed';
    return 'Needs Improvement';
  };

  const hasUngradedEssays = () => {
    if (!results?.answers) return false;
    return results.answers.some(
      answer => answer.question_type === 'essay' && answer.is_correct === null
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Results not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-[#E46036] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => isCreator 
            ? navigate(`/quiz-participants/${results.quiz_id || document.referrer}`) 
            : navigate('/dashboard')
          }
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isCreator ? 'Back to Participants' : 'Back to Dashboard'}
        </button>

        {/* Participant Info (for creators) */}
        {isCreator && results.participant && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">Viewing results for:</p>
                <p className="text-lg font-bold text-gray-900">{results.participant.name}</p>
                <p className="text-sm text-gray-600">{results.participant.email}</p>
              </div>
              {hasUngradedEssays() && (
                <div className="flex items-center text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Has ungraded essays</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score Card */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 mb-6 ${getScoreBackground()}`}>
          <div className="text-center">
            <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor()}`} />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getGradeText()}
            </h1>
            <p className="text-gray-600 mb-6">{results.quiz_title}</p>
            
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {isCreator ? 'Student Score' : 'Your Score'}
                </p>
                <p className={`text-4xl font-bold ${getScoreColor()}`}>
                  {results.score}/{results.total_points}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Percentage</p>
                <p className={`text-4xl font-bold ${getScoreColor()}`}>
                  {getScorePercentage()}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all ${
                  getScorePercentage() >= 90 ? 'bg-green-600' :
                  getScorePercentage() >= 75 ? 'bg-blue-600' :
                  getScorePercentage() >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                }`}
                style={{ width: `${getScorePercentage()}%` }}
              />
            </div>

            <div className="flex items-center justify-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              Completed on {new Date(results.completed_at).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Review Button */}
        {(results.allow_review || results.is_creator) && results.answers && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-[#E46036] mr-3" />
                <span className="font-semibold text-gray-900">
                  {showReview ? 'Hide' : 'View'} Answer Review
                  {isCreator && ' & Grade Essays'}
                </span>
              </div>
              <span className="text-gray-600">{showReview ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {/* Answer Review */}
        {showReview && results.answers && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {isCreator ? 'Answer Review & Grading' : 'Answer Review'}
            </h2>
            {results.answers.map((answer, index) => {
              const isEssay = answer.question_type === 'essay';
              const isGrading = gradingMode[answer.question_id];
              const isUngraded = isEssay && answer.is_correct === null;

              return (
                <div 
                  key={answer.question_id} 
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 ${
                    isUngraded && isCreator ? 'border-yellow-300' : 'border-gray-200'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start mb-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-bold mr-3">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                          {answer.question_type === 'multiple_choice' ? 'Multiple Choice' : 
                           answer.question_type === 'identification' ? 'Identification' : 'Essay'}
                        </span>
                        
                        {!isUngraded && (
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            answer.is_correct 
                              ? 'bg-green-100 text-green-700' 
                              : answer.is_correct === false 
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {answer.is_correct 
                              ? 'Correct' 
                              : answer.is_correct === false 
                              ? 'Incorrect'
                              : 'Pending Review'}
                          </span>
                        )}
                        
                        {isUngraded && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Needs Grading
                          </span>
                        )}
                        
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          {answer.points_earned}/{answer.points_possible} pts
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{answer.question_text}</p>
                    </div>
                    
                    {/* Grade/Edit Button for Creator */}
                    {isCreator && isEssay && (
                      <button
                        onClick={() => toggleGradingMode(answer.question_id)}
                        className={`flex-shrink-0 ml-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isGrading
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-[#E46036] text-white hover:bg-[#cc4f2d]'
                        }`}
                      >
                        {isGrading ? (
                          <>
                            <CloseIcon className="w-4 h-4 inline mr-1" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-4 h-4 inline mr-1" />
                            {isUngraded ? 'Grade' : 'Edit Grade'}
                          </>
                        )}
                      </button>
                    )}
                    
                    {!isCreator && answer.is_correct !== null && (
                      answer.is_correct ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                      )
                    )}
                  </div>

                  {/* Answer Details */}
                  <div className="ml-11 space-y-3">
                    {/* Multiple Choice Options */}
                    {answer.question_type === 'multiple_choice' && answer.choices && (
                      <div className="space-y-2">
                        {answer.choices.map((choice) => {
                          const isUserAnswer = choice.choice_text === answer.user_answer;
                          const isCorrectAnswer = choice.is_correct;
                          
                          return (
                            <div
                              key={choice.id}
                              className={`p-3 rounded-lg border-2 ${
                                isCorrectAnswer && isUserAnswer
                                  ? 'bg-green-50 border-green-500'
                                  : isCorrectAnswer
                                  ? 'bg-green-50 border-green-300'
                                  : isUserAnswer
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`${
                                  isCorrectAnswer || isUserAnswer ? 'font-medium' : ''
                                }`}>
                                  {choice.choice_text}
                                </span>
                                <div className="flex items-center gap-2">
                                  {isUserAnswer && (
                                    <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                                      {isCreator ? 'Student answer' : 'Your answer'}
                                    </span>
                                  )}
                                  {isCorrectAnswer && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Answers (Identification/Essay) */}
                    {(answer.question_type === 'identification' || answer.question_type === 'essay') && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            {isCreator ? 'Student Answer:' : 'Your Answer:'}
                          </p>
                          <div className={`p-3 rounded-lg border-2 ${
                            answer.is_correct 
                              ? 'bg-green-50 border-green-300'
                              : answer.is_correct === false
                              ? 'bg-red-50 border-red-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {answer.user_answer || 'No answer provided'}
                            </p>
                          </div>
                        </div>

                        {/* Grading Interface for Essays (Creator only) */}
                        {isCreator && isEssay && isGrading && (
                          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Grade This Essay</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Points Earned (Max: {answer.points_possible})
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={answer.points_possible}
                                  step="0.5"
                                  value={grades[answer.question_id]?.points_earned || 0}
                                  onChange={(e) => handleGradeChange(
                                    answer.question_id, 
                                    'points_earned', 
                                    e.target.value
                                  )}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Feedback (Optional)
                                </label>
                                <textarea
                                  rows="3"
                                  value={grades[answer.question_id]?.feedback || ''}
                                  onChange={(e) => handleGradeChange(
                                    answer.question_id, 
                                    'feedback', 
                                    e.target.value
                                  )}
                                  placeholder="Provide feedback for the student..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                                />
                              </div>

                              <button
                                onClick={() => handleSaveGrade(
                                  answer.answer_id, 
                                  answer.question_id, 
                                  answer.points_possible
                                )}
                                disabled={savingGrade === answer.answer_id}
                                className="w-full bg-[#E46036] hover:bg-[#cc4f2d] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                              >
                                {savingGrade === answer.answer_id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Grade
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Display Existing Feedback */}
                        {!isGrading && answer.feedback && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Instructor Feedback:
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {answer.feedback}
                            </p>
                          </div>
                        )}
                        
                        {answer.question_type === 'identification' && answer.correct_answer && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                            <div className="p-3 rounded-lg bg-green-50 border-2 border-green-300">
                              <p className="text-gray-900 font-medium">{answer.correct_answer}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!results.show_details && !results.is_creator && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              Detailed results and answer review are not available for this quiz. 
              Please contact your instructor for more information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizResults;