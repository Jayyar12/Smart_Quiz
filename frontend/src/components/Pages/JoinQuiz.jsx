import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import Swal from 'sweetalert2';
import { LogIn, Clock, FileText, Award } from 'lucide-react';

const JoinQuiz = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [quizInfo, setQuizInfo] = useState(null);

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
    }
  };

  const handleJoinQuiz = async (e) => {
    e.preventDefault();

    if (code.length !== 6) {
      Swal.fire({
        title: 'Invalid Code',
        text: 'Please enter a 6-character quiz code',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await quizService.joinQuizByCode(code);
      setQuizInfo(response.data.data);
    } catch (err) {
      console.error('Error joining quiz:', err);
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Quiz not found. Please check the code and try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    navigate(`/take-quiz/${quizInfo.id}`, { replace: true });
  };

  const handleBack = () => {
    setQuizInfo(null);
    setCode('');
  };

  if (quizInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-[#0F172A] dark:to-[#1E293B] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-[#020617] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E46036] rounded-full mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {quizInfo.title}
              </h1>
              {quizInfo.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">{quizInfo.description}</p>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1E293B] rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-[#E46036] mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Questions</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {quizInfo.question_count}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1E293B] rounded-lg">
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-[#E46036] mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Total Points</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {quizInfo.total_points}
                </span>
              </div>

              {quizInfo.time_limit && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1E293B] rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-[#E46036] mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">Time Limit</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {quizInfo.time_limit} minutes
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#1E293B] rounded-lg">
                <div className="flex items-center">
                  <LogIn className="w-5 h-5 text-[#E46036] mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Created by</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {quizInfo.creator}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Instructions:</strong> Once you start the quiz, you must complete it in one session.
                {quizInfo.time_limit && ' The timer will start immediately.'}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#1E293B] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleStartQuiz}
                className="flex-1 px-6 py-3 bg-[#E46036] text-white rounded-lg font-medium hover:bg-[#cc4f2d] transition-colors"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-[#0F172A] dark:to-[#1E293B] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-[#020617] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E46036] rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join Quiz</h1>
            <p className="text-gray-600 dark:text-gray-400">Enter the 6-character quiz code to begin</p>
          </div>

          <form onSubmit={handleJoinQuiz} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quiz Code
              </label>
              <input
                type="text"
                value={code}
                onChange={handleCodeChange}
                placeholder="ABC123"
                className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-[#020617] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#E46036] focus:border-transparent uppercase outline-none"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Enter the code provided by your instructor
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full px-6 py-3 bg-[#E46036] text-white rounded-lg font-medium hover:bg-[#cc4f2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking...' : 'Join Quiz'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinQuiz;