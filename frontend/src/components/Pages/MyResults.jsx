import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { 
  Award, 
  Clock, 
  Eye, 
  Search,
  TrendingUp,
  Calendar,
  Target,
  BookOpen,
  CheckCircle 
} from 'lucide-react';

const MyResults = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyAttempts();
  }, []);

  const fetchMyAttempts = async () => {
    try {
      setLoading(true);
      const response = await quizService.getMyAttempts({ per_page: 100 });
      setAttempts(response.data.data || []);
    } catch (err) {
      console.error('Error fetching attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (attemptId) => {
    navigate(`/quiz-results/${attemptId}`);
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBg = (percentage) => {
    if (percentage >= 90) return 'bg-green-100';
    if (percentage >= 75) return 'bg-blue-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getGradeText = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Passed';
    return 'Needs Improvement';
  };

  // Filter attempts
  const filteredAttempts = attempts.filter(attempt =>
    attempt.quiz?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const validAttempts = attempts.filter(a => a.quiz?.total_points > 0);
  const stats = {
    totalAttempts: validAttempts.length,
    averageScore: validAttempts.length > 0
      ? Math.round(validAttempts.reduce((sum, a) => sum + a.percentage, 0) / validAttempts.length)
      : 0,
    highestScore: validAttempts.length > 0
      ? Math.max(...validAttempts.map(a => a.percentage))
      : 0,
    passedQuizzes: validAttempts.filter(a => a.percentage >= 60).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Quiz Results</h2>
        <p className="text-gray-600">View your past quiz attempts and scores</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</p>
            </div>
            <BookOpen className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-[#E46036]">{stats.averageScore}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-[#E46036]" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Highest Score</p>
              <p className="text-3xl font-bold text-green-600">{Math.round(stats.highestScore)}%</p>
            </div>
            <Award className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Passed Quizzes</p>
              <p className="text-3xl font-bold text-purple-600">{stats.passedQuizzes}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search quiz by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Results List */}
      {filteredAttempts.length === 0 ? (

        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No results found' : 'No quiz attempts yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search' 
              : 'Join a quiz to see your results here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAttempts.map((attempt) => {
            if (!attempt.quiz?.total_points || attempt.quiz.total_points === 0) return null;
            const percentage = attempt.percentage ?? Math.round((attempt.score / (attempt.quiz?.total_points || 1)) * 100);
            
            return (
              <div 
                key={attempt.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Quiz Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#E46036] rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {attempt.quiz?.title || 'Untitled Quiz'}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(attempt.completed_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          
                          <div className="flex items-center">
                            <Target className="w-4 h-4 mr-1" />
                            {attempt.quiz?.questions_count || 0} questions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Display */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Your Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {attempt.score}
                        </span>
                        <span className="text-gray-500">
                          / {attempt.quiz?.total_points || 0}
                        </span>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-gray-200"></div>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Percentage</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getGradeBg(percentage)}`}>
                        <span className={getGradeColor(percentage)}>
                          {percentage}%
                        </span>
                      </div>
                      <p className={`text-xs mt-1 font-medium ${getGradeColor(percentage)}`}>
                        {getGradeText(percentage)}
                      </p>
                    </div>

                    <button
                      onClick={() => handleViewResults(attempt.id)}
                      className="flex items-center px-4 py-2 bg-[#E46036] text-white rounded-lg hover:bg-[#cc4f2d] transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage >= 90 ? 'bg-green-600' :
                        percentage >= 75 ? 'bg-blue-600' :
                        percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyResults;