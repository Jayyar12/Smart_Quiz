import { useState, useEffect, useCallback, useRef } from 'react';
import { quizService } from '../../services/quizService';
import { useAuth } from '../../hooks/useAuth';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import EditQuiz from './EditQuiz';
import {
  BookOpen,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  PlayCircle,
  Calendar,
  BarChart3,
  Plus,
  Search,
  Share2,
  Copy,
  Check
} from "lucide-react";


export default function MyQuizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  // Prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  const fetchMyQuizzes = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('⏭️ Already fetching quizzes, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError('');

      console.log('🔍 Fetching quizzes...');
      const response = await quizService.getMyQuizzes({
        per_page: 50,
        search: searchQuery || undefined
      });

      setQuizzes(response.data.data || response.data);
      console.log('✅ Quizzes loaded successfully');
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchMyQuizzes();
  }, [fetchMyQuizzes]);

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
  };

  const handleShareCode = (quiz) => {
    if (!quiz.code) {
      Swal.fire('No Code', 'This quiz needs to be published first to get a code.', 'info');
      return;
    }

    Swal.fire({
      title: 'Quiz Code',
      html: `
        <div class="text-center">
          <p class="text-gray-600 mb-4">Share this code with participants:</p>
          <div class="bg-gray-100 rounded-lg p-4 mb-4">
            <p class="text-4xl font-bold tracking-widest text-[#E46036]">${quiz.code}</p>
          </div>
          <p class="text-sm text-gray-500">Participants can join at: <strong>/join-quiz</strong></p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Copy Code',
      confirmButtonColor: '#E46036',
      cancelButtonText: 'Close',
      preConfirm: () => {
        return navigator.clipboard.writeText(quiz.code);
      }
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Copied!',
          text: 'Quiz code copied to clipboard',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const handleCopyCode = async (code, quizId) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(quizId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePublish = async (quizId) => {
    try {
      setActionLoading(quizId);
      await quizService.publishQuiz(quizId);
      await fetchMyQuizzes();
      Swal.fire('Published!', 'Quiz is now live for participants.', 'success');
    } catch (err) {
      console.error('Error publishing quiz:', err);
      Swal.fire('Error!', err.response?.data?.message || 'Failed to publish quiz.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (quizId) => {
    try {
      setActionLoading(quizId);
      await quizService.unpublishQuiz(quizId);
      await fetchMyQuizzes();
      Swal.fire('Unpublished!', 'Quiz is no longer available.', 'success');
    } catch (err) {
      console.error('Error unpublishing quiz:', err);
      Swal.fire('Error!', 'Failed to unpublish quiz.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (quizId, quizTitle) => {
    const result = await Swal.fire({
      title: 'Delete Quiz?',
      text: `Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(quizId);
        await quizService.deleteQuiz(quizId);
        await fetchMyQuizzes();
        Swal.fire('Deleted!', 'Quiz has been deleted.', 'success');
      } catch (err) {
        console.error('Error deleting quiz:', err);
        Swal.fire('Error!', 'Failed to delete quiz.', 'error');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getQuestionCountText = (questions) => {
    const count = questions?.length || 0;
    return `${count} question${count !== 1 ? 's' : ''}`;
  };

  const getTotalPoints = (questions) => {
    return questions?.reduce((total, question) => total + (question.points || 0), 0) || 0;
  };

  if (editingQuizId) {
    return (
      <EditQuiz
        quizId={editingQuizId}
        onSuccess={() => {
          setEditingQuizId(null);
          fetchMyQuizzes();
        }}
        onCancel={() => setEditingQuizId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Manage and track your created quizzes</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quizzes by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="bg-[#E46036] hover:bg-[#cc4f2d] text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10">
          <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No quizzes found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery ? 'No quizzes match your search.' : "You haven't created any quizzes yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white dark:bg-[#020617] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1 line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 min-h-[2.5rem]">
                      {quiz.description || 'No description'}
                    </p>
                  </div>
                  <div className={`ml-2 flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${quiz.is_published
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {quiz.is_published ? 'Published' : 'Draft'}
                  </div>
                </div>

                {/* Quiz Code Display */}
                {quiz.is_published && quiz.code && (
                  <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Quiz Code</p>
                        <p className="text-xl font-bold tracking-wider text-[#E46036] dark:text-orange-400">
                          {quiz.code}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopyCode(quiz.code, quiz.id)}
                        className="p-2 hover:bg-orange-100 dark:hover:bg-orange-800/30 rounded-lg transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === quiz.id ? (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      {getQuestionCountText(quiz.questions)}
                    </span>
                    <span className="flex items-center">
                      <PlayCircle className="w-4 h-4 mr-1" />
                      {getTotalPoints(quiz.questions)} pts
                    </span>
                  </div>
                  {quiz.time_limit && (
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {quiz.time_limit}m
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {quiz.is_published ? (
                    <>
                      <button
                        onClick={() => handleShareCode(quiz)}
                        className="flex-1 bg-[#E46036] hover:bg-[#cc4f2d] text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Share
                      </button>
                      <button
                        onClick={() => handleUnpublish(quiz.id)}
                        disabled={actionLoading === quiz.id}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <EyeOff className="w-4 h-4 mr-1" />
                        Unpublish
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePublish(quiz.id)}
                        disabled={actionLoading === quiz.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Publish
                      </button>

                      {/* Edit button - only shown when NOT published */}
                      <button
                        onClick={() => setEditingQuizId(quiz.id)}
                        className="px-3 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </>
                  )}

                  {/* View Participants Button - always visible */}
                  <button
                    onClick={() => navigate(`/quiz-participants/${quiz.id}`)}
                    className="px-3 py-2 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center"
                    title="View participants"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Participants
                  </button>

                  {/* Delete button - always visible */}
                  <button
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    disabled={actionLoading === quiz.id}
                    className="px-3 py-2 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created {formatDate(quiz.created_at)}
                    {quiz.published_at && ` • Published ${formatDate(quiz.published_at)}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}