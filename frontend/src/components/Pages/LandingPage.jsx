import React, { useState } from "react";
import {
  Menu,
  X,
  GraduationCap,
  Facebook,
  Instagram,
  Twitter,
  Github,
  Zap,
  Edit3,
  BarChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const featuresData = [
  {
    title: "Auto-generate",
    desc: "Create quizzes in seconds with randomized questions and time limits.",
    icon: <Zap className="w-10 h-10" />,
  },
  {
    title: "Edit",
    desc: "Easily update quizzes, change difficulty, and manage sessions on the fly.",
    icon: <Edit3 className="w-10 h-10" />,
  },
  {
    title: "Reports",
    desc: "Export results, view leaderboards and detailed performance analytics.",
    icon: <BarChart className="w-10 h-10" />,
  },
];

const LandingPage = ({ darkMode, setDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();



  return (
    <div className="
  min-h-screen relative overflow-x-hidden
  bg-[#F1EDE5] text-[#1F1F1F]
  dark:bg-[#0F172A] dark:text-[#E5E7EB]
">

      {/* Navigation */}
      <nav className="
  fixed top-0 left-0 w-full z-50 px-6 py-4
  bg-white/80 dark:bg-[#020617]/80
  backdrop-blur-sm shadow-sm
  border-b border-[#E46036]/10 dark:border-white/10
">

        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            className="flex items-center space-x-3 cursor-pointer focus:outline-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Go to top"
          >
            <div className="w-12 h-12 bg-[#E46036] rounded-full flex items-center justify-center shadow-md">
              <span className="text-[#FFFFFF] font-extrabold text-2xl">SM</span>
            </div>
            <span className="text-2xl font-bold tracking-wide  text-black dark:text-white">SmartQuiz</span>
          </button>

          <div className="hidden md:flex items-center space-x-8 font-medium">
            <button
              onClick={() => setDarkMode(prev => !prev)}
              className="px-3 py-2 rounded-lg border text-sm
                   bg-white text-gray-700 border-gray-300
                   hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? "🌞 Light" : "🌙 Dark"}
            </button>

            <button className="hover:text-[#E46036] transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
            <button className="hover:text-[#E46036] transition-colors" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
            <button className="hover:text-[#E46036] transition-colors" onClick={() => document.getElementById('News')?.scrollIntoView({ behavior: 'smooth' })}>News</button>
            <div className="space-x-3">
              <button onClick={() => navigate('/register')} className="px-4 py-2 rounded-lg border border-[#E46036] hover:bg-[#E46036] hover:text-[#FFFFFF] transition">Register</button>
              <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-lg bg-[#E46036] text-[#FFFFFF] hover:opacity-90 transition">Login</button>
            </div>
          </div>

          <button className="md:hidden text-[#000000] p-2 rounded-md focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 right-0 bg-[#FFFFFF] dark:bg-[#1E293B] shadow-lg border-t border-[#E46036]/10 dark:border-white/10"
          >
            <div className="px-6 py-4 space-y-3">
              <button className="w-full text-left hover:text-[#E46036] transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</button>
              <button className="w-full text-left hover:text-[#E46036] transition-colors" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
              <button className="w-full text-left hover:text-[#E46036] transition-colors" onClick={() => document.getElementById('News')?.scrollIntoView({ behavior: 'smooth' })}>News</button>
              <div className="flex space-x-3">
                <button className="flex-1 px-4 py-2 rounded-md border border-[#E46036]" onClick={() => navigate('/register')}>Register</button>
                <button className="flex-1 px-4 py-2 rounded-md bg-[#E46036] text-[#FFFFFF]" onClick={() => navigate('/login')}>Login</button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-20 pt-28">
        <div className="relative max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="
  flex flex-col md:flex-row items-center
  bg-white dark:bg-[#020617]
  rounded-3xl shadow-2xl p-8 md:p-12 gap-8
">
            <div className="flex-1 text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                Create smarter quizzes, <span className="text-[#E46036]">faster</span>
              </h1>

              <p className="text-lg bg-white dark:bg-[#020617] mb-6 max-w-xl">
                Host the quiz. Join the app. A modern platform built for <span className="font-semibold text-[#E46036]">hosts</span> and <span className="font-semibold text-[#E46036]">users</span> — simple to setup, fun to play, and designed to test knowledge.
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-3 text-lg font-semibold rounded-xl bg-[#E46036] hover:bg-[#E46036] text-[#FFFFFF] transition shadow"
                >
                  Start Now
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <GraduationCap className="w-48 h-48 text-[#E46036]" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Features of <span className="text-[#E46036]">SmartQuiz</span></h2>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ staggerChildren: 0.12 }}
          >
            {featuresData.map((feature, idx) => (
              <motion.article
                key={idx}
                className="flex flex-col items-start gap-4 bg-[#FFFFFF] dark:bg-[#1E293B] rounded-2xl p-6 shadow hover:shadow-lg transition"
                whileHover={{ y: -6 }}
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-[#FFF4F0] dark:bg-[#E46036]/20 text-[#E46036]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#000000] dark:text-white">{feature.title}</h3>
                <p className="text-[#000000] dark:text-gray-300 leading-relaxed">{feature.desc}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* News Section */}
      <section
        id="News"
        className="py-16 px-6 bg-[#F9F7F6] dark:bg-[#020617]"
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Latest <span className="text-[#E46036]">News</span></h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="bg-[#FFFFFF] dark:bg-[#1E293B] rounded-2xl p-6 shadow hover:shadow-lg transition text-left">
              <h3 className="text-xl font-semibold mb-2 text-[#000000] dark:text-white">Auto-Grading Feature Released</h3>
              <p className="text-[#000000] dark:text-gray-300 mb-3">Automatic grading for objective questions is now available — save time and get instant results.</p>
              <time className="text-[#E46036] font-medium text-sm">Sep 10, 2025</time>
            </article>

            <article className="bg-[#FFFFFF] dark:bg-[#1E293B] rounded-2xl p-6 shadow hover:shadow-lg transition text-left">
              <h3 className="text-xl font-semibold mb-2 text-[#000000] dark:text-white">Leaderboards & Live Results</h3>
              <p className="text-[#000000] dark:text-gray-300 mb-3">Users can now see real-time rankings while games are live — encourage friendly competition.</p>
              <time className="text-[#E46036] font-medium text-sm">Sep 8, 2025</time>
            </article>
          </div>
        </div>
      </section>

      {/* Additional Section */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#FFF7F4] dark:bg-[#E46036]/10 border border-[#E46036]/10 dark:border-[#E46036]/20 mb-6">
            <span className="text-[#000000] dark:text-white font-medium">Trusted by hosts and users worldwide</span>
          </div>

          <h3 className="text-2xl font-bold mb-3 text-[#000000] dark:text-white">Empowering Engagement Through Play</h3>
          <p className="text-[#000000] dark:text-gray-300 leading-relaxed">Run fast-paced quizzes, collect insightful results, and create memorable learning experiences for everyone.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FFFFFF] dark:bg-[#020617] border-t border-[#E46036]/10 dark:border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col items-center space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#E46036] rounded-full flex items-center justify-center shadow">
              <span className="text-[#FFFFFF] font-extrabold text-lg">SM</span>
            </div>
            <span className="font-bold text-lg text-black dark:text-white">SmartQuiz</span>
          </div>

          <div className="flex justify-center space-x-6 text-2xl text-[#000000] dark:text-white">
            <a href="https://www.facebook.com" target="_blank" rel="noreferrer" aria-label="facebook"><Facebook /></a>
            <a href="https://www.instagram.com" target="_blank" rel="noreferrer" aria-label="instagram"><Instagram /></a>
            <a href="https://www.twitter.com" target="_blank" rel="noreferrer" aria-label="twitter"><Twitter /></a>
            <a href="https://www.github.com" target="_blank" rel="noreferrer" aria-label="github"><Github /></a>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default LandingPage;
