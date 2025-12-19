import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthProvider } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import LoginPage from "./components/Pages/LoginPage";
import RegisterPage from "./components/Pages/RegisterPage";
import Dashboard from "./components/Pages/Dashboard";
import LandingPage from "./components/Pages/LandingPage";
import QuizCreationPage from "./components/Pages/CreateQuiz";
import JoinQuiz from "./components/Pages/JoinQuiz";
import TakeQuiz from "./components/Pages/TakeQuiz";
import QuizResults from "./components/Pages/QuizResults";
import QuizParticipants from "./components/Pages/QuizParticipants";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      setDarkMode(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/landing" replace />} />

          <Route
            path="/landing"
            element={
              <PublicRoute>
                <LandingPage darkMode={darkMode} setDarkMode={setDarkMode} />
              </PublicRoute>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-creation"
            element={
              <ProtectedRoute>
                <QuizCreationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/join-quiz"
            element={
              <ProtectedRoute>
                <JoinQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/take-quiz/:quizId"
            element={
              <ProtectedRoute>
                <TakeQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-results/:attemptId"
            element={
              <ProtectedRoute>
                <QuizResults />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-participants/:quizId"
            element={
              <ProtectedRoute>
                <QuizParticipants />
              </ProtectedRoute>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="*" element={<Navigate to="/landing" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 
