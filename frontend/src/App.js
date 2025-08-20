import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Context and Components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardSkeleton, ConversationSkeleton, LessonSkeleton } from './components/LoadingSkeleton';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import PasswordReset from './pages/PasswordReset';
import Profile from './pages/Profile';
import SpeakingLab from './pages/SpeakingLab';
import ListeningHub from './pages/ListeningHub';
import ReadingRoom from './pages/ReadingRoom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ==================== API UTILS ====================
const createAuthenticatedAxios = (authToken) => {
  const instance = axios.create({
    baseURL: API,
    headers: authToken ? {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    }
  });
  return instance;
};

// ==================== NAVIGATION ====================
const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/learn', label: 'Learn', icon: '📚' },
    { path: '/converse', label: 'Converse', icon: '💬' },
    { path: '/speak', label: 'Speak', icon: '🎤' },
    { path: '/listen', label: 'Listen', icon: '🎧' },
    { path: '/read', label: 'Read', icon: '📖' }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/login" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Elysian</h1>
                <p className="text-xs text-gray-500">Your AI Language Companion</p>
              </div>
            </Link>
            
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <span className="text-white font-bold text-lg">E</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Elysian</h1>
              <p className="text-xs text-gray-500">Learning with {currentUser.displayName || 'You'}</p>
            </div>
          </Link>
          
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <motion.div key={item.path} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    location.pathname === item.path
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {(currentUser.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-700 hidden md:inline">
                {currentUser.displayName || 'Profile'}
              </span>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// ==================== ENHANCED CENTRAL DASHBOARD ====================
const CentralDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authToken) {
      fetchDashboardData();
    }
  }, [authToken]);

  const fetchDashboardData = async () => {
    try {
      const api = createAuthenticatedAxios(authToken);
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load dashboard. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  const { user, daily_activities, skill_overview, recent_achievements, weekly_stats, gamification } = dashboardData;
  const completedActivities = daily_activities.filter(activity => activity.completed).length;
  const totalActivities = daily_activities.length;

  // Calculate progress to next level
  const progressToNextLevel = ((gamification.current_xp % 100) / 100) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Enhanced Welcome Header with Gamification */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome back, {user.name}! 
          </h1>
          
          {/* Level and XP Display */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 rounded-full text-white"
            >
              <span className="text-lg font-bold">Level {gamification.current_level}</span>
            </motion.div>
            
            <div className="bg-white rounded-full px-6 py-3 shadow-lg">
              <div className="text-sm text-gray-600 mb-1">XP Progress</div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNextLevel}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                ></motion.div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {gamification.current_xp % 100}/{gamification.xp_for_next_level} XP
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-4 text-lg">
            <motion.span 
              whileHover={{ scale: 1.1 }}
              className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full cursor-pointer"
            >
              🔥 {gamification.daily_streak} day streak
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.1 }}
              className="bg-green-100 text-green-800 px-4 py-2 rounded-full cursor-pointer"
            >
              📊 {user.current_cefr_level} Level
            </motion.span>
          </div>
        </motion.div>

        {/* Enhanced Today's Journey with XP Rewards */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Today's Learning Journey</h2>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress: {completedActivities}/{totalActivities} activities</span>
              <span>{Math.round((completedActivities / totalActivities) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(completedActivities / totalActivities) * 100}%` }}
                transition={{ duration: 1, delay: 0.6 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
              ></motion.div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {daily_activities.map((activity, index) => (
              <motion.div
                key={activity.type}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  activity.completed 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:shadow-md'
                }`}
                onClick={() => {
                  if (activity.type === 'learn') navigate('/learn');
                  else if (activity.type === 'converse') navigate('/converse');
                  else if (activity.type === 'speak') navigate('/speak');
                  else if (activity.type === 'listen') navigate('/listen');
                  else if (activity.type === 'read') navigate('/read');
                  else navigate(`/${activity.type}`);
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">
                    {activity.completed ? '✅' : 
                     activity.type === 'learn' ? '📚' :
                     activity.type === 'speak' ? '🎤' :
                     activity.type === 'listen' ? '🎧' :
                     activity.type === 'read' ? '📖' : '💬'}
                  </div>
                  <div className="text-sm font-medium text-gray-800 capitalize mb-1">
                    {activity.type}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {activity.description}
                  </div>
                  <div className="text-xs text-blue-600 font-medium">
                    +{activity.xp_reward} XP
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Main Navigation Hub */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Learn Module */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            onClick={() => navigate('/learn')}
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold mb-2">Learn</h3>
            <p className="text-blue-100 mb-4">Personalized daily lessons with Elysian's memory</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <div className="text-sm">Daily Worksheet • +50 XP</div>
            </div>
          </motion.div>

          {/* Speak Module */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            onClick={() => navigate('/speak')}
          >
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-xl font-bold mb-2">Speak</h3>
            <p className="text-purple-100 mb-4">AI-powered pronunciation coaching with real-time feedback</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <div className="text-sm">Pronunciation Lab • +20 XP</div>
            </div>
          </motion.div>

          {/* Listen Module */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            onClick={() => navigate('/listen')}
          >
            <div className="text-4xl mb-4">🎧</div>
            <h3 className="text-xl font-bold mb-2">Listen</h3>
            <p className="text-green-100 mb-4">Immersive listening challenges with audio comprehension</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <div className="text-sm">Audio Challenge • +25 XP</div>
            </div>
          </motion.div>

          {/* Read Module */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.3 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            onClick={() => navigate('/read')}
          >
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-xl font-bold mb-2">Read</h3>
            <p className="text-orange-100 mb-4">Interactive reading with vocabulary assistance</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <div className="text-sm">Reading Room • +30 XP</div>
            </div>
          </motion.div>

          {/* Converse Module */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.4 }}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white cursor-pointer"
            onClick={() => navigate('/converse')}
          >
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-2">Converse</h3>
            <p className="text-pink-100 mb-4">Natural conversations with memory of your journey</p>
            <div className="bg-white bg-opacity-20 rounded-lg p-2">
              <div className="text-sm">Chat with Elysian • +15 XP</div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Skills & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Skills Overview with Animation */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Skills Overview</h3>
            <div className="space-y-3">
              {Object.entries(skill_overview).map(([skill, score], index) => (
                <motion.div 
                  key={skill}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.6 + index * 0.1 }}
                  className="group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {skill.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {Math.round(score)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(score, 100)}%` }}
                      transition={{ duration: 1, delay: 1.8 + index * 0.1 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                    ></motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Achievements with Confetti Effect */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="space-y-6"
          >
            
            {/* Recent Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {recent_achievements.map((achievement, index) => (
                  <motion.div 
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 2 + index * 0.2, type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg cursor-pointer"
                  >
                    <div className="text-2xl">🏆</div>
                    <div className="text-sm text-gray-700">{achievement}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">This Week</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Lessons</span>
                  <span className="font-bold text-blue-600">{weekly_stats.lessons_completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consistency</span>
                  <span className="font-bold text-green-600">{weekly_stats.consistency_score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">XP Earned</span>
                  <span className="font-bold text-purple-600">{weekly_stats.xp_this_week}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// ==================== ENHANCED CONVERSATION PAGE ====================
const ConversePage = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationType, setConversationType] = useState('freestyle');
  const [isTyping, setIsTyping] = useState(false);
  const { authToken } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (authToken) {
      startNewConversation();
    }
  }, [authToken]);

  const startNewConversation = async () => {
    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.post('/conversations/start', {
        conversation_type: conversationType
      });
      
      setConversationId(response.data.conversation_id);
      setMessages([{
        id: Date.now(),
        sender: 'elysian',
        content: response.data.welcome_message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const api = createAuthenticatedAxios(authToken);
      const response = await api.post('/conversations/message', {
        conversation_id: conversationId,
        message: inputMessage,
        conversation_type: conversationType
      });

      setTimeout(() => {
        const elysianMessage = {
          id: Date.now() + 1,
          sender: 'elysian',
          content: response.data.elysian_response,
          timestamp: new Date(),
          feedback: response.data.feedback
        };

        setMessages(prev => [...prev, elysianMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchConversationType = (type) => {
    setConversationType(type);
    setMessages([]);
    setConversationId(null);
    setTimeout(() => {
      startNewConversation();
    }, 100);
  };

  if (!authToken) {
    return <ConversationSkeleton />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Enhanced Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Conversation with Elysian</h2>
          <p className="text-gray-600">Your AI companion remembers your learning journey</p>
        </motion.div>

        {/* Conversation Type Toggle */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="flex bg-gray-100 rounded-lg p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => switchConversationType('freestyle')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                conversationType === 'freestyle'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Freestyle Chat
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => switchConversationType('roleplay')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                conversationType === 'roleplay'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Role-Play Mode
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Chat Container */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg h-96 flex flex-col"
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    {message.feedback && (
                      <div className="mt-2 text-xs opacity-75">
                        💡 {message.feedback.encouragement}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl max-w-xs">
                  <div className="flex space-x-1">
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <motion.svg 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </motion.svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ==================== ENHANCED LEARN PAGE ====================
const LearnPage = () => {
  const [todayLesson, setTodayLesson] = useState(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    if (authToken) {
      fetchTodayLesson();
    }
  }, [authToken]);

  const fetchTodayLesson = async () => {
    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.get('/learn/today');
      setTodayLesson(response.data);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;

    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.post('/learn/submit_answer', {
        lesson_id: todayLesson.id,
        exercise_id: todayLesson.exercises[currentExercise].id,
        user_answer: userAnswer
      });

      setIsCorrect(response.data.is_correct);
      setFeedback(response.data.feedback);
      setXpEarned(response.data.xp_earned);
      setLevelUp(response.data.level_up);
      setShowFeedback(true);

    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextExercise = () => {
    setShowFeedback(false);
    setUserAnswer('');
    setIsCorrect(false);
    setFeedback('');
    setXpEarned(0);
    setLevelUp(false);

    if (currentExercise < todayLesson.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    } else {
      setLessonCompleted(true);
    }
  };

  if (isLoading && !todayLesson) {
    return <LessonSkeleton />;
  }

  if (lessonCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lesson Complete!</h2>
          <p className="text-gray-600 mb-6">Excellent work! Elysian has saved your progress and learned more about your journey.</p>
          
          <div className="flex justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              Review Lesson
            </motion.button>
            <Link
              to="/"
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!todayLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Unable to load today's lesson. Please try again later.</p>
        </div>
      </div>
    );
  }

  const exercise = todayLesson.exercises[currentExercise];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Enhanced Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Today's Learning Session</h2>
          <p className="text-gray-600">Personalized by Elysian based on your learning journey</p>
        </motion.div>

        {/* Enhanced Progress Header */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-semibold text-gray-800">Exercise Progress</h3>
            <span className="text-sm text-gray-600">
              {currentExercise + 1} of {todayLesson.exercises.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${((currentExercise + 1) / todayLesson.exercises.length) * 100}%` }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
            ></motion.div>
          </div>
        </motion.div>

        {/* Enhanced Exercise Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded cursor-pointer"
              >
                {exercise.type.replace('-', ' ').toUpperCase()}
              </motion.span>
              <motion.span 
                whileHover={{ scale: 1.1 }}
                className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded cursor-pointer"
              >
                {exercise.skill_target.replace('_', ' ').toUpperCase()}
              </motion.span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{exercise.question}</h3>
          </div>

          {/* Enhanced Answer Input */}
          {!showFeedback ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {exercise.type === 'multiple-choice' && exercise.options ? (
                <div className="space-y-2">
                  {exercise.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setUserAnswer(option)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        userAnswer === option 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={exercise.type === 'image-description' ? 4 : 2}
                />
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={submitAnswer}
                disabled={!userAnswer.trim() || isLoading}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? 'Checking...' : 'Submit Answer'}
              </motion.button>
            </motion.div>
          ) : (
            /* Enhanced Feedback Display */
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                    className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-yellow-600'}`}
                  >
                    {isCorrect ? '✅' : '💡'}
                  </motion.span>
                  <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-yellow-800'}`}>
                    {isCorrect ? 'Excellent!' : 'Good effort!'}
                  </span>
                  {xpEarned > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
                    >
                      +{xpEarned} XP
                    </motion.span>
                  )}
                </div>
                <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-yellow-700'}`}>
                  {feedback}
                </p>
                {levelUp && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 p-3 bg-purple-100 border border-purple-200 rounded-lg"
                  >
                    <span className="text-purple-800 font-medium">🎉 Level Up! You've reached a new level!</span>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={nextExercise}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                {currentExercise < todayLesson.exercises.length - 1 ? 'Next Exercise' : 'Complete Lesson'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// ==================== MAIN APP COMPONENT ====================
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navigation />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <CentralDashboard />
              </ProtectedRoute>
            } />
            <Route path="/learn" element={
              <ProtectedRoute>
                <LearnPage />
              </ProtectedRoute>
            } />
            <Route path="/converse" element={
              <ProtectedRoute>
                <ConversePage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/speak" element={
              <ProtectedRoute>
                <SpeakingLab />
              </ProtectedRoute>
            } />
            <Route path="/listen" element={
              <ProtectedRoute>
                <ListeningHub />
              </ProtectedRoute>
            } />
            <Route path="/read" element={
              <ProtectedRoute>
                <ReadingRoom />
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: 'green',
                  secondary: 'black',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;