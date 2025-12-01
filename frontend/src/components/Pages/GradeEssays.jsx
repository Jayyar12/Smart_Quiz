import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  AlertCircle,
  User,
  FileText,
  Award
} from 'lucide-react';
import Swal from 'sweetalert2';

const GradeEssays = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [ungradedEssays, setUngradedEssays] = useState([]);
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetchUngradedEssays();
  }, [quizId]);

  const fetchUngradedEssays = async () => {
    try {
      setLoading(true);
      const response = await quizService.getUngradedEssays(quizId);
      const data = response.data.data;
      
      setQuiz(data.quiz);
      setUngradedEssays(data.ungraded_essays);
      
      // Initialize grades state
      const initialGrades = {};
      data.ungraded_essays.forEach(question => {
        question.submissions.forEach(submission => {
          initialGrades[submission.answer_id] = {
            answer_id: submission.answer_id,
            points_earned: 0,
            feedback: '',
          };
        });
      });
      setGrades(initialGrades);
      
      // Select first question by default
      if (data.ungraded_essays.length > 0) {
        setSelectedQuestion(data.ungraded_essays[0].question_id);
      }
    } catch (err) {
      console.error('Error fetching ungraded essays:', err);
      Swal.fire('Error', 'Failed to load ungraded essays', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (answerId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: value,
      }
    }));
  };

  const handleSaveAll = async () => {
    const currentQuestion = ungradedEssays.find(q => q.question_id === selectedQuestion);
    if (!currentQuestion) return;

    // Validate all grades
    const gradesToSubmit = [];
    let hasErrors = false;

    for (const submission of currentQuestion.submissions) {
      const grade = grades[submission.answer_id];
      
      if (grade.points_earned < 0) {
        Swal.fire('Invalid Points', 'Points cannot be negative', 'error');
        hasErrors = true;
        break;
      }
      
      if (grade.points_earned > currentQuestion.points) {
        Swal.fire('Invalid Points', `Points cannot exceed ${currentQuestion.points}`, 'error');
        hasErrors = true;
        break;
      }

      gradesToSubmit.push({
        answer_id: grade.answer_id,
        points_earned: parseFloat(grade.points_earned),
        feedback: grade.feedback,
      });
    }

    if (hasErrors) return;

    try {
      setSaving(true);
      
      await quizService.gradeMultipleAnswers(gradesToSubmit);
      
      await Swal.fire({
        title: 'Success!',
        text: `Graded ${gradesToSubmit.length} essay(s) successfully`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });

      // Refresh data
      await fetchUngradedEssays();
      
    } catch (err) {
      console.error('Error saving grades:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save grades', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedQuestionData = ungradedEssays.find(q => q.question_id === selectedQuestion);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ungraded essays...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/quiz-participants/${quizId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Participants
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Grade Essays</h1>
              <p className="text-gray-600 mt-1">{quiz?.title}</p>
            </div>
            
            {ungradedEssays.length > 0 && selectedQuestionData && (
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-[#E46036] text-white rounded-lg hover:bg-[#cc4f2d] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save All Grades
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {ungradedEssays.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">All Essays Graded!</h3>
            <p className="text-gray-600 mb-6">
              There are no ungraded essay submissions for this quiz.
            </p>
            <button
              onClick={() => navigate(`/quiz-participants/${quizId}`)}
              className="bg-[#E46036] text-white px-6 py-2 rounded-lg hover:bg-[#cc4f2d] transition-colors"
            >
              View Participants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Question Sidebar */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">Essay Questions</h3>
                <div className="space-y-2">
                  {ungradedEssays.map((question) => (
                    <button
                      key={question.question_id}
                      onClick={() => setSelectedQuestion(question.question_id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedQuestion === question.question_id
                          ? 'bg-[#E46036] text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Question</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedQuestion === question.question_id
                            ? 'bg-white/20'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {question.ungraded_count} ungraded
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">
                        {question.question_text}
                      </p>
                      <div className="flex items-center mt-2 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        {question.points} points
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grading Area */}
            <div className="col-span-12 lg:col-span-9">
              {selectedQuestionData && (
                <>
                  {/* Question Header */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-[#E46036]" />
                          <span className="text-sm font-medium text-gray-600">Essay Question</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedQuestionData.question_text}
                        </h2>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Max Points</p>
                          <p className="text-2xl font-bold text-[#E46036]">
                            {selectedQuestionData.points}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Ungraded</p>
                          <p className="text-2xl font-bold text-yellow-600">
                            {selectedQuestionData.ungraded_count}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Grade all submissions below, then click "Save All Grades" to submit.
                      </p>
                    </div>
                  </div>

                  {/* Student Submissions */}
                  <div className="space-y-4">
                    {selectedQuestionData.submissions.map((submission, index) => (
                      <div 
                        key={submission.answer_id}
                        className="bg-white rounded-xl border border-gray-200 p-6"
                      >
                        {/* Student Header */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-[#E46036] rounded-full flex items-center justify-center text-white font-bold mr-3">
                              {submission.student_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Student #{index + 1}
                                </span>
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                              <p className="font-semibold text-gray-900">
                                {submission.student_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {submission.student_email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Submitted</p>
                            <p className="text-sm text-gray-700">
                              {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Student Answer */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Student's Answer:
                          </label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {submission.answer_text || 'No answer provided'}
                            </p>
                          </div>
                        </div>

                        {/* Grading Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points Earned (Max: {selectedQuestionData.points})
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={selectedQuestionData.points}
                              step="0.5"
                              value={grades[submission.answer_id]?.points_earned || 0}
                              onChange={(e) => handleGradeChange(
                                submission.answer_id,
                                'points_earned',
                                e.target.value
                              )}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent text-lg font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Percentage
                            </label>
                            <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-lg font-semibold text-gray-700">
                              {selectedQuestionData.points > 0
                                ? Math.round(
                                    ((grades[submission.answer_id]?.points_earned || 0) /
                                      selectedQuestionData.points) *
                                      100
                                  )
                                : 0}
                              %
                            </div>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Feedback for Student (Optional)
                            </label>
                            <textarea
                              rows="3"
                              value={grades[submission.answer_id]?.feedback || ''}
                              onChange={(e) => handleGradeChange(
                                submission.answer_id,
                                'feedback',
                                e.target.value
                              )}
                              placeholder="Provide constructive feedback for the student..."
                              maxLength="1000"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {(grades[submission.answer_id]?.feedback || '').length}/1000 characters
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save Button (Bottom) */}
                  <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Ready to submit grades?
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedQuestionData.submissions.length} essay(s) will be graded
                        </p>
                      </div>
                      
                      <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="flex items-center px-6 py-3 bg-[#E46036] text-white rounded-lg hover:bg-[#cc4f2d] transition-colors disabled:opacity-50 font-medium"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
                            Save All Grades
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeEssays;