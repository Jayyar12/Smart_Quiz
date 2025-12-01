import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setLoading(true);
    setStatus(null);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/password/forgot`, {
        email: email.trim(),
      });

      setStatus('success');
      setMessage(response.data.message || 'Password reset link sent! Check your email.');
      setEmail('');
    } catch (error) {
      setStatus('error');
      if (error.response?.data?.errors?.email) {
        setMessage(error.response.data.errors.email[0]);
      } else {
        setMessage(error.response?.data?.message || 'Failed to send reset link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1EDE5] px-4 sm:px-6 lg:px-8 relative overflow-hidden">
  <div className="w-full max-w-md">
    {/* Back to Login Link */}
    <Link
      to="/login"
      className="inline-flex items-center text-gray-700 hover:text-[#E46036] font-medium mb-6 transition-colors duration-300"
    >
      <ArrowLeft className="w-5 h-5 mr-2 text-gray-500 group-hover:text-[#E46036] transition-colors duration-300" />
      Back to Login
    </Link> 
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/40">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-[#E46036] to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-300">
            <Mail className="w-9 h-9 text-white" />
          </div>

          {/* Header */}
          <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-2 tracking-wide">
            Forgot Password?
          </h1>
          <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
            No worries! Enter your email and we'll send you reset instructions.
          </p>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-xl flex items-start shadow-md">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-medium">Success!</p>
                <p className="text-sm text-green-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-xl flex items-start shadow-md">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1">{message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#E46036]/30 focus:border-[#E46036] outline-none transition-all duration-300 shadow-sm"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E46036] hover:bg-[#000000]'
                  } text-white font-semibold py-3 px-4 rounded-full shadow-md transition`}
              >
              {loading ? (
                <>
                  <div className="animate-spin rounded-x1 h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Remember your password?{' '}
              <Link to="/login" className="text-[#E46036] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          If you don't receive an email within a few minutes, check your spam folder.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
