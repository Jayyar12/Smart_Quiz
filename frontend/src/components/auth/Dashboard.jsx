import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Swal from 'sweetalert2';
import CreateQuiz from "./CreateQuiz";
import MyQuizzes from "./MyQuizzes";
import JoinQuiz from "./JoinQuiz";
import MyResults from "./MyResults";
import Settings from "./Settings";
import axios from 'axios';

import {
  BookOpen, Users, BarChart3, Plus, TrendingUp, LogOut, Menu, X, PlayCircle, ClipboardList, Settings as SettingsIcon
} from "lucide-react";


export default function Dashboard() {

  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  
  // Add refs to prevent multiple API calls
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userStats, setUserStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    activeQuizzes: 0,
    completions: 0
  });
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Memoized fetch function with duplicate call prevention
  const fetchUserDashboardData = useCallback(async () => {
    // Prevent duplicate calls
    if (!user?.id || isFetchingRef.current) {
      console.log("⏭️ Skipping fetch - already fetching or no user ID");
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setStatsError(false);
      const token = localStorage.getItem("auth_token");
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

      console.log("🔍 Fetching dashboard stats (single call)...");

      const response = await axios.get(`${API_URL}/users/${user.id}/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      if (data.success) {
        setUserStats({
          totalQuizzes: data.totalQuizzes || 0,
          activeQuizzes: data.activeQuizzes || 0,
          draftQuizzes: data.draftQuizzes || 0,
          totalQuestions: data.totalQuestions || 0,
          totalAttempts: data.totalAttempts || 0,
          uniqueParticipants: data.uniqueParticipants || 0,
          highestScore: data.highestScore || 0,
          completionRate: data.completionRate || 0,
          recentQuizzes: data.recentQuizzes || []
        });
        hasFetchedRef.current = true;
        console.log("✅ Dashboard stats loaded successfully");
      } else {
        throw new Error(data.message || 'Failed to load stats');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem("auth_token");
        navigate("/login", { replace: true });
        return;
      }
      
      setStatsError(true);
      setUserStats({
        totalQuizzes: 0,
        activeQuizzes: 0,
        draftQuizzes: 0,
        totalQuestions: 0,
        totalAttempts: 0,
        uniqueParticipants: 0,
        highestScore: 0,
        completionRate: 0,
        recentQuizzes: []
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, navigate]);

  // Only fetch once when user is available and data hasn't been fetched
  useEffect(() => {
    if (isAuthenticated && user?.id && !hasFetchedRef.current) {
      fetchUserDashboardData();
    }
  }, [isAuthenticated, user?.id, fetchUserDashboardData]);

  const handleNavigation = (page) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    confirmLogout();
  };

  const confirmLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'You will be signed out of your account',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();
        navigate("/login");
      }
    });
  };

  // Handle successful quiz creation - allow manual refresh
  const handleQuizCreated = () => {
    // Reset flag to allow refetch
    hasFetchedRef.current = false;
    // Refresh dashboard stats
    fetchUserDashboardData();
    // Navigate back to dashboard
    setCurrentPage('dashboard');
    // Show success message
    Swal.fire({
      title: 'Success!',
      text: 'Quiz created successfully',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // StatCard component
  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, onClick }) => (
    <div 
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:border-[#E46036]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{loading ? '...' : value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const NavItem = ({ icon: Icon, label, pageKey, isActive }) => (
    <button
      onClick={() => handleNavigation(pageKey)}
      className={`flex items-center w-full px-4 py-2 rounded-lg mb-2 transition-colors ${isActive
        ? 'bg-[#E46036]/10 text-[#E46036]'
        : 'text-gray-600 hover:bg-gray-50'
        }`}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  // Show loading state while user data is being fetched
  if (!user && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-[#E46036]">Dashboard</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-6">
          <div className="px-6 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Main</p>
            <NavItem icon={BarChart3} label="Dashboard" pageKey="dashboard" isActive={currentPage === 'dashboard'} />
            <NavItem icon={BookOpen} label="My Quizzes" pageKey="quizzes" isActive={currentPage === 'quizzes'} />
            <NavItem icon={Plus} label="Create Quiz" pageKey="create-quiz" isActive={currentPage === 'create-quiz'} />
            <NavItem icon={Users} label="Join Quiz" pageKey="join" isActive={currentPage === 'join'} />
            <NavItem icon={ClipboardList} label="My Results" pageKey="my-results" isActive={currentPage === 'my-results'} />
          </div>
          <div className="px-6 py-3 border-t border-gray-200 mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Settings</p>
            <NavItem icon={SettingsIcon} label="Settings" pageKey="settings" isActive={currentPage === 'settings'} />
          </div>
        </nav>
        <div className="absolute bottom-10 left-10 right-10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentPage === 'create-quiz' ? 'Create Quiz' : 
                 currentPage === 'my-results' ? 'My Results' :
                 currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleNavigation('create-quiz')}
                className="bg-[#E46036] hover:bg-[#cc4f2d] text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {currentPage === 'dashboard' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome{user?.name ? `, ${user.name}` : ''}! 👋
                </h2>
                <p className="text-gray-600">Here's what's happening with your quizzes today.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                  icon={BookOpen}
                  title="Quizzes"
                  value={userStats.totalQuizzes}
                  color="bg-[#E46036]"
                  onClick={() => handleNavigation('quizzes')}
                />
                <StatCard
                  icon={Users}
                  title="Participants"
                  value={userStats.uniqueParticipants}
                  color="bg-[#E46036]"
                />
                <StatCard
                  icon={PlayCircle}
                  title="Active Quizzes"
                  value={userStats.activeQuizzes}
                  color="bg-[#E46036]"
                />
              </div>


              {/* Recent Quizzes Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Quiz Activity</h3>
                  <button 
                    onClick={() => handleNavigation('quizzes')}
                    className="text-[#E46036] hover:text-[#cc4f2d] text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                
                {userStats.recentQuizzes && userStats.recentQuizzes.length > 0 ? (
                  <div className="space-y-3">
                    {userStats.recentQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{quiz.title}</p>
                            <p className="text-sm text-gray-500">
                              Updated {new Date(quiz.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No quiz activity yet</p>
                    <button
                      onClick={() => handleNavigation('create-quiz')}
                      className="text-[#E46036] hover:text-[#cc4f2d] text-sm font-medium mt-2"
                    >
                      Create your first quiz
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {currentPage === 'quizzes' && <MyQuizzes />}
          {currentPage === 'join' && <JoinQuiz />}
          {currentPage === 'create-quiz' && <CreateQuiz onSuccess={handleQuizCreated} />}
          {currentPage === 'my-results' && <MyResults />}
          {currentPage === 'settings' && <Settings />}

        </main>
      </div>
    </div>
  );
}