import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const createAuthenticatedAxios = (authToken) => {
  return axios.create({
    baseURL: API,
    headers: authToken ? {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    }
  });
};

// Audio Player Component with Waveform Visualization
const AudioPlayer = ({ transcript, onPlayComplete, duration = 60 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Simulate audio playback since we don't have actual audio files
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          const progress = (newTime / duration) * 100;
          setAudioProgress(progress);
          
          if (newTime >= duration) {
            setIsPlaying(false);
            setCurrentTime(0);
            setAudioProgress(0);
            onPlayComplete && onPlayComplete();
            return 0;
          }
          return newTime;
        });
      }, 100 / playbackSpeed);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, duration, playbackSpeed, onPlayComplete]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const newTime = (newProgress / 100) * duration;
    
    setCurrentTime(newTime);
    setAudioProgress(newProgress);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      {/* Audio Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-center h-20 bg-gradient-to-r from-green-100 to-teal-100 rounded-xl mb-4">
          <div className="flex items-end space-x-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-green-400 to-teal-500 rounded-full"
                style={{ 
                  height: `${Math.max(8, Math.sin(i * 0.3 + (isPlaying ? currentTime * 5 : 0)) * 20 + 25)}px`
                }}
                animate={isPlaying ? {
                  height: [
                    `${Math.max(8, Math.sin(i * 0.3) * 20 + 25)}px`,
                    `${Math.max(8, Math.sin(i * 0.3 + Math.PI) * 20 + 25)}px`
                  ]
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Infinity : 0,
                  repeatType: "reverse"
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div 
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full"
            style={{ width: `${audioProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlayback}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${
              isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </motion.button>

          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Speed:</span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="text-sm bg-gray-100 rounded px-2 py-1 border-none focus:ring-2 focus:ring-green-500"
          >
            {speeds.map(speed => (
              <option key={speed} value={speed}>{speed}x</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transcript (shown after playing) */}
      {(isPlaying || audioProgress > 0) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-50 rounded-xl p-4"
        >
          <div className="text-sm text-gray-600 mb-2">Transcript:</div>
          <div className="text-gray-800 leading-relaxed">
            {transcript}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Question Component
const QuestionCard = ({ question, index, onAnswer, userAnswer }) => {
  const handleAnswerSelect = (answer) => {
    onAnswer(index, answer);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Question {index + 1}: {question.question}
      </h3>

      {question.type === 'multiple_choice' && question.options ? (
        <div className="space-y-3">
          {question.options.map((option, optionIndex) => (
            <motion.button
              key={optionIndex}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                userAnswer === option
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  userAnswer === option
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300'
                }`}>
                  {userAnswer === option && '✓'}
                </div>
                <span className="flex-1">{option}</span>
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <textarea
          value={userAnswer || ''}
          onChange={(e) => handleAnswerSelect(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          rows={4}
        />
      )}
    </motion.div>
  );
};

// Results Component
const ListeningResults = ({ results, onTryAgain, onNextChallenge }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score) => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🌟';
    if (score >= 70) return '👏';
    if (score >= 60) return '👍';
    return '💪';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Score Display */}
      <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-6xl mb-4"
        >
          {getScoreEmoji(results.score)}
        </motion.div>

        <div className={`text-5xl font-bold mb-2 ${getScoreColor(results.score)}`}>
          {Math.round(results.score)}%
        </div>
        <div className="text-gray-600 text-xl">Listening Comprehension</div>

        {/* Circular Progress */}
        <div className="relative w-32 h-32 mx-auto mt-6">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            <motion.path
              d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray={`${results.score}, 100`}
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${results.score}, 100` }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </svg>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">🎧</span>
          Elysian's Listening Feedback
        </h3>
        <p className="text-gray-700 leading-relaxed">{results.feedback}</p>
      </div>

      {/* Question-by-Question Results */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Question Results</h3>
        <div className="space-y-4">
          {results.detailed_results.map((result, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-2 ${
                result.is_correct ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`text-2xl ${result.is_correct ? 'text-green-600' : 'text-yellow-600'}`}>
                  {result.is_correct ? '✅' : '💡'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 mb-1">
                    Q{index + 1}: {result.question}
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="text-gray-600">
                      Your answer: <span className="font-medium">{result.user_answer}</span>
                    </div>
                    {!result.is_correct && (
                      <div className="text-gray-600">
                        Correct answer: <span className="font-medium text-green-600">{result.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* XP Display */}
      {results.xp_earned && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring" }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl p-6 text-center"
        >
          <div className="text-2xl font-bold">🏆 +{results.xp_earned} XP Earned!</div>
          <div className="text-sm opacity-90">Your listening skills are improving!</div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTryAgain}
          className="flex-1 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
        >
          Try This Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNextChallenge}
          className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          Next Challenge
        </motion.button>
      </div>
    </motion.div>
  );
};

// Main Listening Hub Component
const ListeningHub = () => {
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    fetchListeningChallenge();
  }, []);

  const fetchListeningChallenge = async () => {
    try {
      setIsLoading(true);
      setResults(null);
      setUserAnswers([]);
      setHasPlayedAudio(false);
      setShowQuestions(false);
      
      const api = createAuthenticatedAxios(authToken);
      const response = await api.get('/listen/challenge');
      setCurrentChallenge(response.data);
    } catch (error) {
      console.error('Error fetching listening challenge:', error);
      toast.error('Failed to load listening challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioComplete = () => {
    setHasPlayedAudio(true);
    setShowQuestions(true);
    toast.success('Great! Now answer the comprehension questions below.');
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const submitAnswers = async () => {
    if (!currentChallenge) return;
    
    // Check if all questions are answered
    const unansweredCount = currentChallenge.questions.length - userAnswers.filter(Boolean).length;
    if (unansweredCount > 0) {
      toast.error(`Please answer all questions (${unansweredCount} remaining)`);
      return;
    }

    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.post('/listen/submit', {
        content_id: currentChallenge.id,
        answers: userAnswers
      });
      
      setResults(response.data);
      toast.success('Analysis complete! 🎯');
    } catch (error) {
      console.error('Error submitting answers:', error);
      toast.error('Failed to submit answers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTopicEmoji = (topic) => {
    const emojiMap = {
      culture: '🌍',
      technology: '💻',
      travel: '✈️',
      health: '🏥',
      education: '📚',
      business: '💼',
      environment: '🌱',
      general: '🎯'
    };
    return emojiMap[topic] || '🎧';
  };

  if (isLoading && !currentChallenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Listening Hub</h1>
          <p className="text-gray-600">Improve comprehension with immersive audio challenges</p>
          <Link 
            to="/" 
            className="inline-block mt-4 text-green-600 hover:text-green-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {results ? (
            <ListeningResults
              key="results"
              results={results}
              onTryAgain={() => {
                setResults(null);
                setUserAnswers([]);
                setHasPlayedAudio(false);
                setShowQuestions(false);
              }}
              onNextChallenge={fetchListeningChallenge}
            />
          ) : currentChallenge ? (
            <motion.div
              key="challenge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Challenge Header */}
              <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
                <div className="text-5xl mb-4">{getTopicEmoji(currentChallenge.topic)}</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentChallenge.title}</h2>
                <p className="text-gray-600 mb-4">{currentChallenge.description}</p>
                
                <div className="flex justify-center space-x-4">
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                    📊 {currentChallenge.cefr_level} Level
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    🏷️ {currentChallenge.topic}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                    ⏱️ {Math.floor(currentChallenge.duration / 60)}:{(currentChallenge.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Audio Player */}
              <AudioPlayer
                transcript={currentChallenge.transcript}
                onPlayComplete={handleAudioComplete}
                duration={currentChallenge.duration}
              />

              {/* Instructions */}
              {!hasPlayedAudio && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">📢 Instructions</h3>
                  <p className="text-blue-700">
                    Listen carefully to the audio content. You can adjust the playback speed and replay as needed. 
                    After listening, answer the comprehension questions below.
                  </p>
                </motion.div>
              )}

              {/* Questions */}
              {showQuestions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
                    Comprehension Questions
                  </h3>
                  
                  {currentChallenge.questions.map((question, index) => (
                    <QuestionCard
                      key={index}
                      question={question}
                      index={index}
                      onAnswer={handleAnswerChange}
                      userAnswer={userAnswers[index]}
                    />
                  ))}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitAnswers}
                    disabled={isLoading || userAnswers.filter(Boolean).length < currentChallenge.questions.length}
                    className="w-full px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      `Submit Answers (${userAnswers.filter(Boolean).length}/${currentChallenge.questions.length})`
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto text-center"
            >
              <div className="text-4xl mb-4">😓</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Challenge</h2>
              <p className="text-gray-600 mb-4">We couldn't load a listening challenge right now.</p>
              <button
                onClick={fetchListeningChallenge}
                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ListeningHub;