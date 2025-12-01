import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import Swal from 'sweetalert2';
import { Clock, AlertCircle, CheckCircle, Save, Wifi, WifiOff } from 'lucide-react';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  // Refs for managing save queue and preventing race conditions
  const saveQueueRef = useRef([]);
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef(0);
  const timerStartRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Load saved progress on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!attemptId) return;
      
      try {
        const response = await quizService.getAttemptProgress(attemptId);
        const savedData = response.data.data;
        
        // Restore answers
        if (savedData.answers && savedData.answers.length > 0) {
          const answersMap = {};
          savedData.answers.forEach(ans => {
            answersMap[ans.question_id] = {
              answer: ans.answer_text,
              choice_id: ans.choice_id,
              question_id: ans.question_id
            };
          });
          setAnswers(answersMap);
        }
        
        // Restore timer if time limit exists
        if (quiz?.time_limit && savedData.time_remaining !== null) {
          setTimeLeft(savedData.time_remaining);
        }
      } catch (err) {
        console.error('Failed to load saved progress:', err);
      }
    };

    if (attemptId && quiz) {
      loadSavedProgress();
    }
  }, [attemptId, quiz]);

  // Debounced auto-save with queue
  const saveToQueue = useCallback((answersToSave) => {
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTimeRef.current;
    
    // Add to queue
    saveQueueRef.current.push({
      answers: answersToSave,
      timestamp: now
    });
    
    // If enough time has passed and not currently saving, process queue
    if (timeSinceLastSave >= 2000 && !isSavingRef.current) {
      processQueue();
    }
  }, []);

  const processQueue = async () => {
    if (isSavingRef.current || saveQueueRef.current.length === 0 || !attemptId || submitting) {
      return;
    }

    isSavingRef.current = true;
    setSaving(true);
    setSaveError(false);

    // Get latest entry from queue
    const latestEntry = saveQueueRef.current[saveQueueRef.current.length - 1];
    saveQueueRef.current = []; // Clear queue

    try {
      // Filter out empty answers
      const validAnswers = Object.values(latestEntry.answers).filter(ans => {
        if (ans.choice_id) return true; // Multiple choice
        return ans.answer && ans.answer.trim().length > 0; // Text answers
      });

      if (validAnswers.length > 0) {
        // Calculate time remaining
        const elapsedSeconds = timerStartRef.current 
          ? Math.floor((Date.now() - timerStartRef.current) / 1000)
          : 0;
        const timeRemaining = quiz?.time_limit 
          ? Math.max(0, (quiz.time_limit * 60) - elapsedSeconds)
          : null;

        await quizService.saveProgress(attemptId, validAnswers, timeRemaining);
        setLastSaved(new Date());
        lastSaveTimeRef.current = Date.now();
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      setSaveError(true);
      
      // Re-add to queue if save failed
      if (latestEntry) {
        saveQueueRef.current.push(latestEntry);
      }
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  };

  // Auto-save effect with debounce
  useEffect(() => {
    if (!attemptId || submitting) return;

    const debounceTimer = setTimeout(() => {
      if (Object.keys(answers).length > 0) {
        saveToQueue(answers);
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(debounceTimer);
  }, [answers, attemptId, submitting, saveToQueue]);

  // Periodic queue processing
  useEffect(() => {
    if (!attemptId || submitting) return;

    const interval = setInterval(() => {
      processQueue();
    }, 5000); // Check queue every 5 seconds

    return () => clearInterval(interval);
  }, [attemptId, submitting]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (Object.keys(answers).length > 0 && !submitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        
        // Try to save synchronously
        processQueue();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, submitting]);

  useEffect(() => {
    startQuizAttempt();
  }, [quizId]);

  // Timer effect with persistence
  useEffect(() => {
    if (!quiz?.time_limit || timeLeft === null) return;

    // Set timer start reference
    if (!timerStartRef.current) {
      timerStartRef.current = Date.now() - ((quiz.time_limit * 60 - timeLeft) * 1000);
    }

    if (timeLeft <= 0) {
      handleSubmit(true); // Auto-submit when time runs out
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Save time remaining every 10 seconds
        if (newTime % 10 === 0 && attemptId) {
          const validAnswers = Object.values(answers).filter(ans => {
            if (ans.choice_id) return true;
            return ans.answer && ans.answer.trim().length > 0;
          });
          
          if (validAnswers.length > 0) {
            quizService.saveProgress(attemptId, validAnswers, newTime).catch(err => {
              console.error('Failed to save time:', err);
            });
          }
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz, attemptId, answers]);

  const startQuizAttempt = useCallback(async () => {
    // Prevent duplicate calls
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      setLoading(true);
      const response = await quizService.startQuiz(quizId);
      const data = response.data.data;

      setQuiz(data.quiz);
      setAttemptId(data.attempt_id);
      setQuestions(data.questions);
      setStartTime(data.started_at);

      if (data.quiz.time_limit) {
        const timeRemaining = data.time_remaining !== null
          ? data.time_remaining
          : data.quiz.time_limit * 60;
        setTimeLeft(timeRemaining);

        timerStartRef.current = Date.now() - ((data.quiz.time_limit * 60 - timeRemaining) * 1000);
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.data?.can_view_results) {
        console.log('Quiz already completed - showing results option');
      } else {
        console.error('Error starting quiz:', err);
      }

      if (err.response?.status === 422 && err.response?.data?.data?.can_view_results) {
        Swal.fire({
          title: 'Already Completed',
          text: err.response?.data?.message || 'You have already completed this quiz',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'View Results',
          cancelButtonText: 'Back to Dashboard',
          confirmButtonColor: '#E46036',
          cancelButtonColor: '#6B7280',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate(`/quiz-results/${err.response.data.data.attempt_id}`, { replace: true });
          } else {
            navigate('/dashboard?page=join', { replace: true });
          }
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: err.response?.data?.message || 'Failed to start quiz',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#E46036',
        }).then(() => {
          navigate('/dashboard?page=join', { replace: true });
        });
      }
    } finally {
      setLoading(false);
    }
  }, [quizId, navigate]);

  useEffect(() => {
    startQuizAttempt();
  }, [startQuizAttempt]);

  const handleAnswerChange = (questionId, answer, choiceId = null) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      
      // Handle clearing/deletion
      if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
        // For text inputs, remove the answer if empty
        if (!choiceId) {
          delete newAnswers[questionId];
          return newAnswers;
        }
      }
      
      // Add or update answer
      newAnswers[questionId] = { 
        answer, 
        choice_id: choiceId, 
        question_id: questionId 
      };
      
      return newAnswers;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    // Prevent multiple submissions
    if (submitting) return;

    const unansweredCount = questions.length - Object.keys(answers).length;
    
    if (!autoSubmit && unansweredCount > 0) {
      const result = await Swal.fire({
        title: 'Submit Quiz?',
        text: `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E46036',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, submit',
        cancelButtonText: 'Go back'
      });

      if (!result.isConfirmed) return;
    } else if (!autoSubmit) {
      const result = await Swal.fire({
        title: 'Submit Quiz?',
        text: 'Are you sure you want to submit your answers?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#E46036',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Submit',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;
    }

    try {
      setSubmitting(true);
      
      // Filter valid answers only
      const validAnswers = Object.values(answers).filter(ans => {
        if (ans.choice_id) return true;
        return ans.answer && ans.answer.trim().length > 0;
      });
      
      const response = await quizService.submitQuiz(attemptId, validAnswers);
      
      const title = autoSubmit ? 'Time\'s Up!' : 'Success!';
      const text = autoSubmit 
        ? 'Your quiz has been automatically submitted' 
        : 'Quiz submitted successfully';
      
      Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonText: 'View Results',
        confirmButtonColor: '#E46036',
      }).then(() => {
        navigate(`/quiz-results/${attemptId}`, { replace: true });
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      Swal.fire({
        title: 'Error!',
        text: err.response?.data?.message || 'Failed to submit quiz',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#E46036',
      });
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // If quiz failed to load, show redirecting message
  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E46036] mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-save indicator */}
              <div className="text-xs flex items-center">
                {saving ? (
                  <span className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                    Saving...
                  </span>
                ) : saveError ? (
                  <span className="flex items-center text-red-600">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Save failed
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center text-green-600">
                    <Wifi className="w-3 h-3 mr-1" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="text-gray-500">Not saved</span>
                )}
              </div>

              {/* Timer */}
              {timeLeft !== null && (
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#E46036] h-2 rounded-full transition-all"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start mb-4">
            <span className="flex-shrink-0 w-8 h-8 bg-[#E46036] text-white rounded-full flex items-center justify-center font-bold mr-3">
              {currentQuestion + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                  {currentQ.type === 'multiple_choice' ? 'Multiple Choice' : 
                   currentQ.type === 'identification' ? 'Identification' : 'Essay'}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
                </span>
              </div>
              <p className="text-lg text-gray-900">{currentQ.question_text}</p>
            </div>
          </div>

          {/* Answer Input based on question type */}
          <div className="mt-6">
            {currentQ.type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQ.choices.map((choice) => (
                  <label
                    key={choice.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQ.id]?.choice_id === choice.id
                        ? 'border-[#E46036] bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      checked={answers[currentQ.id]?.choice_id === choice.id}
                      onChange={() => handleAnswerChange(currentQ.id, choice.choice_text, choice.id)}
                      className="w-4 h-4 text-[#E46036] focus:ring-[#E46036]"
                    />
                    <span className="ml-3 text-gray-900">{choice.choice_text}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQ.type === 'identification' && (
              <input
                type="text"
                value={answers[currentQ.id]?.answer || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent"
              />
            )}

            {currentQ.type === 'essay' && (
              <textarea
                value={answers[currentQ.id]?.answer || ''}
                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                placeholder="Type your essay answer here..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E46036] focus:border-transparent resize-none"
              />
            )}
          </div>

          {answers[currentQ.id] && (
            <div className="mt-4 flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Answer recorded</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full font-medium text-sm transition-colors ${
                  idx === currentQuestion
                    ? 'bg-[#E46036] text-white'
                    : answers[questions[idx].id]
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-6 py-2 bg-[#E46036] text-white rounded-lg font-medium hover:bg-[#cc4f2d] disabled:opacity-50 transition-colors flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
              className="px-6 py-2 bg-[#E46036] text-white rounded-lg font-medium hover:bg-[#cc4f2d] transition-colors"
            >
              Next
            </button>
          )}
        </div>

        {/* Warning for unanswered */}
        {Object.keys(answers).length < questions.length && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">
                  You have {questions.length - Object.keys(answers).length} unanswered question(s).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TakeQuiz;