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

// Reading Library Component
const ReadingLibrary = ({ articles, onSelectArticle }) => {
  const getTopicEmoji = (topic) => {
    const emojiMap = {
      education: '📚',
      technology: '💻',
      environment: '🌱',
      culture: '🌍',
      health: '🏥',
      science: '🔬',
      business: '💼',
      general: '📖'
    };
    return emojiMap[topic] || '📖';
  };

  const getDifficultyColor = (level) => {
    const colorMap = {
      'A1': 'bg-green-100 text-green-800',
      'A2': 'bg-blue-100 text-blue-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-orange-100 text-orange-800',
      'C1': 'bg-red-100 text-red-800',
      'C2': 'bg-purple-100 text-purple-800'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Reading Library</h2>
        <p className="text-gray-600">Choose an article that matches your interests and level</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer border-2 border-transparent hover:border-orange-200 transition-all"
            onClick={() => onSelectArticle(article)}
          >
            {/* Article Header */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">{getTopicEmoji(article.topic)}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                {article.title}
              </h3>
            </div>

            {/* Article Stats */}
            <div className="flex justify-center space-x-2 mb-4">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${getDifficultyColor(article.cefr_level)}`}>
                {article.cefr_level} Level
              </span>
              <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
                📄 {article.word_count} words
              </span>
            </div>

            {/* Reading Time */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-3">
                ⏱️ {article.estimated_reading_time} min read
              </div>
              
              {/* Preview */}
              <div className="text-xs text-gray-500 line-clamp-3 mb-4">
                {article.content.substring(0, 120)}...
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-orange-500 text-white py-2 px-4 rounded-xl font-medium text-sm"
              >
                Start Reading →
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Interactive Reader Component
const InteractiveReader = ({ article, onComplete, onBack }) => {
  const [selectedWord, setSelectedWord] = useState(null);
  const [wordDefinitions, setWordDefinitions] = useState({});
  const [lookupCount, setLookupCount] = useState({});
  const [readingStartTime] = useState(Date.now());
  const [showQuestions, setShowQuestions] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample word definitions for demo
  const sampleDefinitions = {
    'artificial': 'Made by humans; not natural',
    'intelligence': 'The ability to learn and understand',
    'algorithms': 'Sets of rules or instructions for solving problems',
    'unprecedented': 'Never done or known before',
    'revolutionizing': 'Completely changing something',
    'sophisticated': 'Complex and advanced',
    'technology': 'Scientific knowledge used to create tools and systems',
    'healthcare': 'The organized provision of medical care',
    'transportation': 'The movement of people or goods from one place to another',
    'financial': 'Related to money and finances',
    'privacy': 'The state of being free from public attention',
    'employment': 'The condition of having paid work',
    'ethical': 'Morally right and acceptable'
  };

  const handleWordClick = (word) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    
    if (sampleDefinitions[cleanWord]) {
      setSelectedWord(cleanWord);
      setWordDefinitions(prev => ({
        ...prev,
        [cleanWord]: sampleDefinitions[cleanWord]
      }));
      setLookupCount(prev => ({
        ...prev,
        [cleanWord]: (prev[cleanWord] || 0) + 1
      }));
    } else {
      setSelectedWord(cleanWord);
      setWordDefinitions(prev => ({
        ...prev,
        [cleanWord]: `Definition for "${cleanWord}" - In a real app, this would come from a dictionary API`
      }));
      setLookupCount(prev => ({
        ...prev,
        [cleanWord]: (prev[cleanWord] || 0) + 1
      }));
    }
  };

  const handleFinishReading = () => {
    setShowQuestions(true);
    toast.success('Great job reading! Now answer the comprehension questions.');
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleSubmitAnswers = async () => {
    if (!article) return;
    
    // Check if all questions are answered
    const unansweredCount = article.comprehension_questions.length - userAnswers.filter(Boolean).length;
    if (unansweredCount > 0) {
      toast.error(`Please answer all questions (${unansweredCount} remaining)`);
      return;
    }

    setIsSubmitting(true);
    
    const readingTime = (Date.now() - readingStartTime) / 1000; // Convert to seconds
    const vocabularyLookups = Object.keys(lookupCount);

    onComplete({
      reading_time: readingTime,
      comprehension_answers: userAnswers,
      vocabulary_lookups: vocabularyLookups,
      word_definitions_accessed: wordDefinitions
    });
  };

  const renderInteractiveText = () => {
    const words = article.content.split(' ');
    
    return (
      <div className="text-lg leading-relaxed text-gray-800 select-none">
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="cursor-pointer hover:bg-yellow-100 hover:shadow-sm rounded px-1 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleWordClick(word)}
          >
            {word}{' '}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 transition-colors"
        >
          <span>←</span>
          <span>Back to Library</span>
        </motion.button>
        
        <div className="flex items-center space-x-4">
          <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
            {article.cefr_level} Level
          </span>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            📄 {article.word_count} words
          </span>
          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
            🔍 {Object.keys(lookupCount).length} lookups
          </span>
        </div>
      </div>

      {!showQuestions ? (
        /* Reading Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h1 className="text-3xl font-bold text-gray-800 mb-6">{article.title}</h1>
              {renderInteractiveText()}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFinishReading}
                className="mt-8 w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition-colors font-medium"
              >
                I've Finished Reading 📖
              </motion.button>
            </motion.div>
          </div>

          {/* Vocabulary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 sticky top-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">📚 Vocabulary</h3>
              
              {selectedWord && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"
                >
                  <div className="font-bold text-yellow-800 capitalize mb-1">
                    {selectedWord}
                  </div>
                  <div className="text-sm text-yellow-700">
                    {wordDefinitions[selectedWord]}
                  </div>
                  <div className="text-xs text-yellow-600 mt-2">
                    Looked up {lookupCount[selectedWord] || 0} time(s)
                  </div>
                </motion.div>
              )}

              {Object.keys(lookupCount).length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Words Learned:</h4>
                  <div className="space-y-2">
                    {Object.entries(lookupCount).map(([word, count]) => (
                      <motion.div
                        key={word}
                        whileHover={{ scale: 1.02 }}
                        className="p-2 bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => setSelectedWord(word)}
                      >
                        <div className="font-medium text-gray-800 capitalize">{word}</div>
                        <div className="text-xs text-gray-600">{count} lookup(s)</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(lookupCount).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-3xl mb-2">👆</div>
                  <p className="text-sm">Click on any word in the text to see its definition</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        /* Comprehension Questions */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">📝 Comprehension Questions</h2>
          
          <div className="space-y-6">
            {article.comprehension_questions.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Question {index + 1}: {question.question}
                </h3>

                {question.type === 'multiple_choice' && question.options ? (
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <motion.button
                        key={optionIndex}
                        whileHover={{ scale: 1.01, x: 5 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswerChange(index, option)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          userAnswers[index] === option
                            ? 'border-orange-500 bg-orange-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            userAnswers[index] === option
                              ? 'border-orange-500 bg-orange-500 text-white'
                              : 'border-gray-300'
                          }`}>
                            {userAnswers[index] === option && '✓'}
                          </div>
                          <span className="flex-1">{option}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={userAnswers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={4}
                  />
                )}
              </motion.div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitAnswers}
            disabled={isSubmitting || userAnswers.filter(Boolean).length < article.comprehension_questions.length}
            className="w-full mt-8 px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Analyzing...</span>
              </span>
            ) : (
              `Submit Answers (${userAnswers.filter(Boolean).length}/${article.comprehension_questions.length})`
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

// Reading Results Component
const ReadingResults = ({ results, onTryAgain, onNextArticle }) => {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score) => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🌟';
    if (score >= 70) return '👏';
    if (score >= 60) return '👍';
    return '📚';
  };

  const getReadingSpeedFeedback = (speed) => {
    if (speed > 300) return 'Very fast reader! 🚀';
    if (speed > 200) return 'Good reading speed 📈';
    if (speed > 150) return 'Average reading speed ⚡';
    return 'Take your time - comprehension is more important than speed 🐢';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Score Overview */}
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
        <div className="text-gray-600 text-xl mb-4">Reading Comprehension</div>

        {/* Reading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-blue-50 rounded-2xl p-6">
            <div className="text-2xl font-bold text-blue-600">{Math.round(results.reading_speed)}</div>
            <div className="text-blue-800 font-medium">Words per minute</div>
            <div className="text-sm text-blue-600 mt-2">
              {getReadingSpeedFeedback(results.reading_speed)}
            </div>
          </div>

          <div className="bg-purple-50 rounded-2xl p-6">
            <div className="text-2xl font-bold text-purple-600">
              {results.vocabulary_analysis?.vocabulary_level || 'Intermediate'}
            </div>
            <div className="text-purple-800 font-medium">Vocabulary Level</div>
            <div className="text-sm text-purple-600 mt-2">
              {results.vocabulary_analysis?.words_looked_up || 0} words looked up
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="mr-2">📖</span>
          Elysian's Reading Feedback
        </h3>
        <p className="text-gray-700 leading-relaxed">{results.feedback}</p>
      </div>

      {/* Question Results */}
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
          <div className="text-2xl font-bold">📚 +{results.xp_earned} XP Earned!</div>
          <div className="text-sm opacity-90">Your reading skills are improving!</div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTryAgain}
          className="flex-1 px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
        >
          Read This Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNextArticle}
          className="flex-1 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          Next Article
        </motion.button>
      </div>
    </motion.div>
  );
};

// Main Reading Room Component
const ReadingRoom = () => {
  const [library, setLibrary] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.get('/read/library');
      setLibrary(response.data);
    } catch (error) {
      console.error('Error fetching reading library:', error);
      toast.error('Failed to load reading library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleSelect = async (article) => {
    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.get(`/read/article/${article.id}`);
      setSelectedArticle(response.data);
      setResults(null);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadingComplete = async (readingData) => {
    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.post('/read/submit', {
        content_id: selectedArticle.id,
        ...readingData
      });
      
      setResults(response.data);
      toast.success('Reading analysis complete! 🎯');
    } catch (error) {
      console.error('Error submitting reading data:', error);
      toast.error('Failed to analyze reading. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setResults(null);
    // Keep the same article selected
  };

  const handleNextArticle = () => {
    setSelectedArticle(null);
    setResults(null);
    fetchLibrary();
  };

  const handleBackToLibrary = () => {
    setSelectedArticle(null);
    setResults(null);
  };

  if (isLoading && !library && !selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Reading Room</h1>
          <p className="text-gray-600">Improve comprehension with interactive reading experiences</p>
          <Link 
            to="/" 
            className="inline-block mt-4 text-orange-600 hover:text-orange-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {results ? (
            <ReadingResults
              key="results"
              results={results}
              onTryAgain={handleTryAgain}
              onNextArticle={handleNextArticle}
            />
          ) : selectedArticle ? (
            <InteractiveReader
              key="reader"
              article={selectedArticle}
              onComplete={handleReadingComplete}
              onBack={handleBackToLibrary}
            />
          ) : library?.articles ? (
            <ReadingLibrary
              key="library"
              articles={library.articles}
              onSelectArticle={handleArticleSelect}
            />
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto text-center"
            >
              <div className="text-4xl mb-4">😓</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Reading Library</h2>
              <p className="text-gray-600 mb-4">We couldn't load the reading materials right now.</p>
              <button
                onClick={fetchLibrary}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
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

export default ReadingRoom;