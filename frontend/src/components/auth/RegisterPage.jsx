import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';


const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 6) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  useEffect(() => {
    const savedStep = localStorage.getItem('otpStep');
    const savedEmail = localStorage.getItem('emailForOtp');
    if (savedStep && savedEmail) {
      setOtpStep(true);
      setEmailForOtp(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/register`, formData);
      
      // ✅ Get email from response
      const email = res.data.email || formData.email;
      setEmailForOtp(email);
      setOtpStep(true);
      localStorage.setItem('otpStep', 'true');
      localStorage.setItem('emailForOtp', email);
      setSuccessMessage('OTP has been sent to your email. Please check your inbox.');
      
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/verify-otp`, {
        email: emailForOtp,
        otp: otp.trim(),
      });

      const token = res.data.token;
      const user = res.data.user;

      // store token for future auth
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setSuccessMessage('Email verified successfully! Redirecting to dashboard...');

      setTimeout(() => {
        localStorage.removeItem('otpStep');
        localStorage.removeItem('emailForOtp');
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Verification failed. Please try again.' });
      }
    } finally {
      setOtpLoading(false);
    }
  };


  const handleResendOtp = async () => {
    setResendLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/resend-otp`, {
        email: emailForOtp,
      });
      
      setSuccessMessage('A new OTP has been sent to your email.');
      setOtp(''); // Clear OTP input
      
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Failed to resend OTP. Please try again.' });
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 bg-[#FFFFFF]/90 backdrop-blur-md shadow-sm border-b border-[#E46036]/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-12 h-12 bg-[#E46036] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-2xl">SM</span>
            </div>
            <span className="text-2xl font-bold tracking-wide text-[#000000]">Smart Quiz</span>
          </div>

          <div className="hidden md:flex space-x-8 font-semibold text-[#000000]">
            <button className="hover:text-[#E46036]" onClick={() => navigate("/LandingPage")}>Home</button>
            <button className="hover:text-[#E46036]" onClick={() => navigate("/register")}>Register</button>
            <button className="hover:text-[#E46036]" onClick={() => navigate("/login")}>Login</button>
          </div>

          <button className="md:hidden text-[#000000]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 right-0 bg-[#FFFFFF] shadow-xl border-t border-[#E46036]/20"
          >
            <div className="px-6 py-4 space-y-4">
              <div className="flex space-x-4">
                <button className="hover:text-[#E46036]" onClick={() => navigate("/LandingPage")}>Home</button>
                <button className="hover:text-[#E46036]" onClick={() => navigate("/register")}>Register</button>
                <button className="hover:text-[#E46036]" onClick={() => navigate("/login")}>Login</button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Register Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md"
      >
        {!otpStep ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#E46036] mb-2">Join Smart Quiz</h2>
              <p className="text-gray-600">Create your account</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {successMessage}
                </div>
              )}

              {/* Name */}
              <div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className={`w-full px-3 py-3 border rounded-full focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500' : 'focus:ring-[#E46036] border-gray-300'
                  }`}
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`w-full px-3 py-3 border rounded-full focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500' : 'focus:ring-[#E46036] border-gray-300'
                  }`}
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`w-full px-3 py-3 pr-12 border rounded-full focus:outline-none focus:ring-2 ${
                      errors.password ? 'border-red-500' : 'focus:ring-[#E46036] border-gray-300'
                    }`}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-2">
                    <div className="h-2 w-full bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 1
                            ? 'bg-red-500 w-1/4'
                            : passwordStrength === 2
                            ? 'bg-yellow-500 w-2/4'
                            : passwordStrength === 3
                            ? 'bg-blue-500 w-3/4'
                            : 'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                    <p className="text-sm mt-1 text-gray-600">
                      Strength: {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <input
                    id="password_confirmation"
                    name="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className={`w-full px-3 py-3 pr-12 border rounded-full focus:outline-none focus:ring-2 ${
                      errors.password_confirmation
                        ? 'border-red-500'
                        : 'focus:ring-[#E46036] border-gray-300'
                    }`}
                    placeholder="Confirm Password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation[0]}</p>}
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E46036] hover:bg-[#cc4f2d]'
                } text-white font-semibold py-3 px-4 rounded-xl shadow-md transition`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </motion.button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#E46036] hover:underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </>
        ) : (
          // OTP Verification Form
          <form className="space-y-6" onSubmit={handleVerifyOtp}>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#E46036] mb-2">Verify Your Email</h2>
              <p className="text-gray-600">We've sent a 6-digit OTP to</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">{emailForOtp}</p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {successMessage}
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-3 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#E46036] border-gray-300 text-center text-2xl tracking-widest"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className={`w-full flex items-center justify-center ${
                otpLoading || otp.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#E46036] hover:bg-[#cc4f2d]'
              } text-white font-semibold py-3 px-4 rounded-xl shadow-md transition`}
            >
              {otpLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('otpStep');
                localStorage.removeItem('emailForOtp');
                setOtpStep(false);
                setEmailForOtp('');
                setOtp('');
              }}
              className="text-sm text-gray-600 underline mt-3"
            >
              Cancel and Register Again
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-[#E46036] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default RegisterPage;