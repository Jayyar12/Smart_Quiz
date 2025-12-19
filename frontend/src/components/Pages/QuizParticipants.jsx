import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';

import {
  Users,
  ArrowLeft,
  Download,
  Search,
  Award,
  Clock,
  CheckCircle,
  Eye,
  Mail,
  Calendar,
  TrendingUp,

} from 'lucide-react';
import Swal from 'sweetalert2';

const QuizParticipants = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score'); // score, name, date
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    fetchParticipants();
  }, [quizId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizParticipants(quizId);
      setQuiz(response.data.data.quiz);
      setParticipants(response.data.data.participants);
    } catch (err) {
      console.error('Error fetching participants:', err);
      Swal.fire('Error', 'Failed to load participants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Email', 'Score', 'Total Points', 'Percentage', 'Status', 'Completed At'].join(','),
      ...filteredAndSortedParticipants.map(p => [
        p.user_name,
        p.user_email,
        p.score,
        quiz.total_points,
        p.percentage + '%',
        p.completed ? 'Completed' : 'In Progress',
        p.completed_at ? new Date(p.completed_at).toLocaleString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title}_participants.csv`;
    a.click();
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

  // Filter and sort participants
  const filteredAndSortedParticipants = participants
    .filter(p =>
      p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'name':
          aVal = a.user_name.toLowerCase();
          bVal = b.user_name.toLowerCase();
          break;
        case 'score':
          aVal = a.score;
          bVal = b.score;
          break;
        case 'date':
          aVal = new Date(a.completed_at || 0);
          bVal = new Date(b.completed_at || 0);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Calculate statistics
  const stats = {
    total: participants.length,
    completed: participants.filter(p => p.completed).length,
    inProgress: participants.filter(p => !p.completed).length,
    averageScore: participants.length > 0
      ? Math.round(participants.reduce((sum, p) => sum + p.score, 0) / participants.length)
      : 0,
    averagePercentage: participants.length > 0
      ? Math.round(participants.reduce((sum, p) => sum + p.percentage, 0) / participants.length)
      : 0,
    highestScore: participants.length > 0
      ? Math.max(...participants.map(p => p.score))
      : 0,
    lowestScore: participants.length > 0
      ? Math.min(...participants.filter(p => p.completed).map(p => p.score))
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard?page=my-quizzes')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Quizzes
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{quiz?.title}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Quiz Participants & Results</p>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center px-4 py-2 bg-[#E46036] text-white rounded-lg hover:bg-[#cc4f2d] transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Participants</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-[#E46036]">
                  {stats.averageScore}/{quiz?.total_points}
                </p>
              </div>
              <Award className="w-10 h-10 text-[#E46036]" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average %</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.averagePercentage}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSort('score')}
                className={`px-4 py-2 rounded-lg border transition-colors ${sortBy === 'score'
                    ? 'bg-[#E46036] text-white border-[#E46036]'
                    : 'bg-white dark:bg-[#020617] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1E293B]'
                  }`}
              >
                Sort by Score {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>

              <button
                onClick={() => handleSort('name')}
                className={`px-4 py-2 rounded-lg border transition-colors ${sortBy === 'name'
                    ? 'bg-[#E46036] text-white border-[#E46036]'
                    : 'bg-white dark:bg-[#020617] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1E293B]'
                  }`}
              >
                Sort by Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>

              <button
                onClick={() => handleSort('date')}
                className={`px-4 py-2 rounded-lg border transition-colors ${sortBy === 'date'
                    ? 'bg-[#E46036] text-white border-[#E46036]'
                    : 'bg-white dark:bg-[#020617] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#1E293B]'
                  }`}
              >
                Sort by Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          {filteredAndSortedParticipants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No participants found' : 'No participants yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Share the quiz code to get participants'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Completed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#020617] divide-y divide-gray-200 dark:divide-white/10">
                  {filteredAndSortedParticipants.map((participant, index) => (
                    <tr key={participant.id} className="hover:bg-gray-50 dark:hover:bg-[#1E293B]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-600' :
                                'text-gray-600 dark:text-gray-400'
                          }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-[#E46036] rounded-full flex items-center justify-center text-white font-bold">
                            {participant.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {participant.user_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {participant.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {participant.score} / {quiz.total_points}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeBg(participant.percentage)}`}>
                          <span className={getGradeColor(participant.percentage)}>
                            {participant.percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.completed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            In Progress
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {participant.completed_at ? (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(participant.completed_at).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {participant.completed && (
                          <button
                            onClick={() => handleViewResults(participant.id)}
                            className="inline-flex items-center px-3 py-1 border border-[#E46036] text-[#E46036] rounded-lg hover:bg-[#E46036] hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizParticipants;