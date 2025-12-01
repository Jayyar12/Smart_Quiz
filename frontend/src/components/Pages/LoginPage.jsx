import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await login(formData);
      navigate("/dashboard");
    } catch (error) {
      console.log('Full error:', error.response); // DEBUG
      console.log('Error data:', error.response?.data); // DEBUG
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "An error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1EDE5] text-gray-800 relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 bg-[#FFFFFF]/90 backdrop-blur-md shadow-sm border-b border-[#E46036]/20">

        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-12 h-12 bg-[#E46036] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-extrabold text-2xl">SM</span>
            </div>
            <span className="text-2xl font-bold tracking-wide text-[#000000]">Smart Quiz</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 font-semibold text-[#000000]">
            <button className="hover:text-[#E46036] transition-colors" onClick={() => navigate("/LandingPage")}>Home</button>
            <button className="hover:text-[#E46036] transition-colors" onClick={() => navigate("/register")}>Register</button>
            <button className="hover:text-[#E46036] transition-colors" onClick={() => navigate("/login")}>Login</button>
          </div>

          {/* Mobile Menu Button */}
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
                <button className="hover:text-[#E46036] transition-colors" onClick={() => navigate("/LandingPage")}>Home</button>
                <button className="hover:text-[#E46036] transition-colors" onClick={() => navigate("/register")}>Register</button>
                <button className="hover:text-[#E46036] transition-colors" onClick={() => navigate("/login")}>Login</button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
      {/* Animated Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-white border border-[#E46036]/20 rounded-3xl p-10 w-[420px] shadow-xl"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#E46036] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-extrabold text-2xl">SM</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-wide text-[#000000]">
            Smart Quiz
          </h2>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-extrabold text-center text-[#000000] mb-8"
        >
          Sign In
        </motion.h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email Address"
              required
              className={`w-full px-5 py-3 border border-[#E46036]/20 rounded-full shadow-sm bg-white text-gray-800 placeholder-gray-500 focus:ring-4 focus:ring-[#E46036]/40 focus:border-[#E46036] outline-none transition-all duration-300 focus:scale-105 ${errors.email ? "border-red-500" : ""
                }`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
            )}
          </motion.div>

          {/*PASSWORD*/}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"} 
              placeholder="Password"
              required
              className={`w-full px-5 py-3 pr-12 border border-[#E46036]/20 rounded-full shadow-sm bg-white  text-gray-800 placeholder-gray-500 focus:ring-4 focus:ring-[#E46036]/40 focus:border-[#E46036] outline-none transition-all duration-300 focus:scale-105 ${errors.password ? "border-red-500" : ""
                }`}
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}   // ✅ FIXED
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}   {/* ✅ FIXED */}
            </button>

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password[0]}</p>
            )}
          </motion.div>


          <div className="flex items-center justify-between mb-6">
            <Link
              to="/forgot-password"
              className="text-sm text-[#E46036] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className={`w-full bg-[#E46036] text-white font-semibold py-3 rounded-full shadow-lg transition hover:bg-[#000000] ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </motion.button>
        </form>

        {/* Register Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-gray-700 text-sm mt-6"
        >
          Don’t have an account?{" "}
          <Link to="/register" className="text-[#E46036] hover:underline">
            Create Account
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
