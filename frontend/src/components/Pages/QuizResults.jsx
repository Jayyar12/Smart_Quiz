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

  // ----------- Helpers -----------
  const getScorePercentage = () => results ? Math.round((results.score / results.total_points) * 100) : 0;

  const getScoreColor = (percentage = getScorePercentage()) => 
    percentage >= 90 ? 'text-green-600' :
    percentage >= 75 ? 'text-blue-600' :
    percentage >= 60 ? 'text-yellow-600' :
    'text-red-600';

  const getScoreBg = (percentage = getScorePercentage()) =>
    percentage >= 90 ? 'bg-green-50 border-green-200' :
    percentage >= 75 ? 'bg-blue-50 border-blue-200' :
    percentage >= 60 ? 'bg-yellow-50 border-yellow-200' :
    'bg-red-50 border-red-200';

  const getGradeText = () => {
    const percentage = getScorePercentage();
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 75) return 'Good Job!';
    if (percentage >= 60) return 'Passed';
    return 'Needs Improvement';
  };

  const hasUngradedEssays = () => results?.answers?.some(a => a.question_type === 'essay' && a.is_correct === null);

  // ----------- Fetch Results -----------
  useEffect(() => {
    fetchResults();
  }, [attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data } = await quizService.getResults(attemptId);
      setResults(data.data);
      setIsCreator(data.data.is_creator || false);

      // Initialize grades for essays
      const initialGrades = {};
      data.data.answers?.forEach(answer => {
        if (answer.question_type === 'essay') {
          initialGrades[answer.question_id] = {
            points_earned: answer.points_earned || 0,
            feedback: answer.feedback || '',
          };
        }
      });
      setGrades(initialGrades);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to load results', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ----------- Handlers -----------
  const toggleGradingMode = (questionId) => {
    setGradingMode(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleGradeChange = (questionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [field]: value }
    }));
  };

  const handleSaveGrade = async (answerId, questionId, maxPoints) => {
    const grade = grades[questionId];
    if (!answerId) return Swal.fire('Error', 'Answer ID is missing.', 'error');
    if (grade.points_earned < 0) return Swal.fire('Invalid Points', 'Points cannot be negative', 'error');
    if (grade.points_earned > maxPoints) return Swal.fire('Invalid Points', `Points cannot exceed ${maxPoints}`, 'error');

    try {
      setSavingGrade(answerId);
      await quizService.gradeAnswer(answerId, { points_earned: parseFloat(grade.points_earned), feedback: grade.feedback });
      await fetchResults();
      setGradingMode(prev => ({ ...prev, [questionId]: false }));
      Swal.fire({ title: 'Graded!', text: 'Essay graded successfully', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save grade', 'error');
    } finally {
      setSavingGrade(null);
    }
  };

  // ----------- Loading / Not Found -----------
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#E46036] rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading results...</p>
      </div>
    </div>
  );

  if (!results) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600">Results not found</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-[#E46036] hover:underline">Back to Dashboard</button>
      </div>
    </div>
  );

  // ----------- Render -----------
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back Button */}
        <button
          onClick={() => isCreator ? navigate(`/quiz-participants/${results.quiz_id}`) : navigate('/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isCreator ? 'Back to Participants' : 'Back to Dashboard'}
        </button>

        {/* Participant Info */}
        {isCreator && results.participant && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
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
        )}

        {/* Score Card */}
        <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 text-center ${getScoreBg()}`}>
          <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor()}`} />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{getGradeText()}</h1>
          <p className="text-gray-600 mb-6">{results.quiz_title}</p>

          <div className="flex justify-center items-center space-x-8 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">{isCreator ? 'Student Score' : 'Your Score'}</p>
              <p className={`text-4xl font-bold ${getScoreColor()}`}>{results.score}/{results.total_points}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Percentage</p>
              <p className={`text-4xl font-bold ${getScoreColor()}`}>{getScorePercentage()}%</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div
              className={`h-3 rounded-full transition-all ${getScoreColor().replace('text', 'bg')}`}
              style={{ width: `${getScorePercentage()}%` }}
            />
          </div>

          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            Completed on {new Date(results.completed_at).toLocaleString()}
          </div>
        </div>

        {/* Review Button */}
        {(results.allow_review || results.is_creator) && results.answers && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center">
                <Eye className="w-5 h-5 text-[#E46036] mr-3" />
                <span className="font-semibold text-gray-900">{showReview ? 'Hide' : 'View'} Answer Review{isCreator && ' & Grade Essays'}</span>
              </div>
              <span className="text-gray-600">{showReview ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {/* Answer Review */}
        {showReview && results.answers && (
          <div className="space-y-4">
            {results.answers.map((answer, index) => {
              const isEssay = answer.question_type === 'essay';
              const isGrading = gradingMode[answer.question_id];
              const isUngraded = isEssay && answer.is_correct === null;

              return (
                <div key={answer.question_id} className={`bg-white p-6 rounded-xl shadow-sm border-2 ${isUngraded && isCreator ? 'border-yellow-300' : 'border-gray-200'}`}>
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 flex items-start gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold flex items-center justify-center">{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2 items-center">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                            {answer.question_type.replace('_', ' ').toUpperCase()}
                          </span>
                          {!isUngraded && (
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              answer.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {answer.is_correct ? 'Correct' : 'Incorrect'}
                            </span>
                          )}
                          {isUngraded && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" /> Needs Grading
                            </span>
                          )}
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {answer.points_earned}/{answer.points_possible} pts
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{answer.question_text}</p>
                      </div>
                    </div>

                    {isCreator && isEssay && (
                      <button
                        onClick={() => toggleGradingMode(answer.question_id)}
                        className={`ml-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          isGrading ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-[#E46036] text-white hover:bg-[#cc4f2d]'
                        }`}
                      >
                        {isGrading ? <><CloseIcon className="w-4 h-4 mr-1 inline"/>Cancel</> : <><Edit3 className="w-4 h-4 mr-1 inline"/>{isUngraded ? 'Grade' : 'Edit Grade'}</>}
                      </button>
                    )}
                  </div>

                  {/* Answer Content */}
                  <div className="ml-11 space-y-3">
                    {/* Multiple Choice */}
                    {answer.question_type === 'multiple_choice' && answer.choices && answer.choices.map(choice => {
                      const isUser = choice.choice_text === answer.user_answer;
                      const isCorrect = choice.is_correct;
                      return (
                        <div key={choice.id} className={`p-3 rounded-lg border-2 ${
                          isCorrect && isUser ? 'bg-green-50 border-green-500' :
                          isCorrect ? 'bg-green-50 border-green-300' :
                          isUser ? 'bg-red-50 border-red-500' :
                          'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className={`${isCorrect || isUser ? 'font-medium' : ''}`}>{choice.choice_text}</span>
                            <div className="flex items-center gap-2">
                              {isUser && <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">{isCreator ? 'Student answer' : 'Your answer'}</span>}
                              {isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Essay / Identification */}
                    {(answer.question_type === 'essay' || answer.question_type === 'identification') && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{isCreator ? 'Student Answer:' : 'Your Answer:'}</p>
                          <div className={`p-3 rounded-lg border-2 ${answer.is_correct ? 'bg-green-50 border-green-300' : answer.is_correct === false ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                            <p className="text-gray-900 whitespace-pre-wrap">{answer.user_answer || 'No answer provided'}</p>
                          </div>
                        </div>

                        {/* Essay Grading */}
                        {isCreator && isEssay && isGrading && (
                          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
                            <h4 className="font-semibold text-gray-900 mb-2">Grade This Essay</h4>
                            <input type="number" min="0" max={answer.points_possible} step="0.5"
                              value={grades[answer.question_id]?.points_earned || 0}
                              onChange={(e) => handleGradeChange(answer.question_id, 'points_earned', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                              placeholder={`Points (Max ${answer.points_possible})`} />
                            <textarea rows="3" value={grades[answer.question_id]?.feedback || ''} onChange={(e) => handleGradeChange(answer.question_id, 'feedback', e.target.value)}
                              placeholder="Provide feedback..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent" />
                            <button onClick={() => handleSaveGrade(answer.answer_id, answer.question_id, answer.points_possible)}
                              disabled={savingGrade === answer.answer_id}
                              className="w-full bg-[#E46036] text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center disabled:opacity-50">
                              {savingGrade === answer.answer_id ? <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2 rounded-full"></div> : <Save className="w-4 h-4 mr-2"/>}
                              Save Grade
                            </button>
                          </div>
                        )}

                        {/* Feedback */}
                        {!isGrading && answer.feedback && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-blue-900 mb-1">Instructor Feedback:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{answer.feedback}</p>
                          </div>
                        )}

                        {/* Correct Answer (Identification) */}
                        {answer.question_type === 'identification' && answer.correct_answer && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                            <div className="p-3 rounded-lg bg-green-50 border-2 border-green-300">
                              <p className="text-gray-900 font-medium">{answer.correct_answer}</p>
                            </div>
                          </div>
                        )}
                      </>
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
              Detailed results and answer review are not available for this quiz. Please contact your instructor.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuizResults;
