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

// Audio Visualizer Component
const AudioVisualizer = ({ isRecording, audioLevel }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-16">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full ${
            isRecording ? 'opacity-100' : 'opacity-30'
          }`}
          initial={{ height: 8 }}
          animate={{
            height: isRecording 
              ? Math.max(8, (audioLevel || 0) * 50 + Math.sin(Date.now() / 100 + i) * 10)
              : 8
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
  );
};

// Speaking Exercise Card Component
const SpeakingExerciseCard = ({ exercise, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const getExerciseIcon = () => {
    switch (exercise.type) {
      case 'word': return '🔤';
      case 'sentence': return '📝';
      case 'shadowing': return '🎭';
      default: return '🎤';
    }
  };

  const getExerciseTitle = () => {
    switch (exercise.type) {
      case 'word': return 'Word Pronunciation';
      case 'sentence': return 'Sentence Reading';
      case 'shadowing': return 'Shadowing Practice';
      default: return 'Speaking Exercise';
    }
  };

  const getInstructions = () => {
    switch (exercise.type) {
      case 'word': 
        return 'Click the record button and clearly pronounce the word. Focus on each sound.';
      case 'sentence': 
        return 'Read the sentence aloud with natural intonation and rhythm.';
      case 'shadowing': 
        return 'Listen to the audio and speak along, matching the pace and pronunciation.';
      default: 
        return 'Click record and speak clearly into your microphone.';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      // Animation loop for audio level visualization
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        
        clearInterval(timerRef.current);
        setRecordingTime(0);
        toast.success('Recording completed! 🎉');
      };

      setIsRecording(true);
      setShowInstructions(false);
      setRecordingTime(0);
      
      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      updateAudioLevel();
      toast.success('Recording started! Speak clearly into your microphone.');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  const submitRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, exercise);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setShowInstructions(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          {getExerciseIcon()}
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{getExerciseTitle()}</h2>
        <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
          {exercise.difficulty_level} Level
        </span>
      </div>

      {/* Exercise Content */}
      <div className="text-center mb-8">
        <div className="text-2xl font-semibold text-gray-800 mb-4 p-6 bg-gray-50 rounded-2xl">
          "{exercise.content}"
        </div>
        
        {showInstructions && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-600 mb-4"
          >
            {getInstructions()}
          </motion.p>
        )}

        {exercise.phonetic_transcription && (
          <div className="text-lg text-blue-600 font-mono mb-4">
            /{exercise.phonetic_transcription}/
          </div>
        )}
      </div>

      {/* Audio Visualizer */}
      <div className="mb-8">
        <AudioVisualizer isRecording={isRecording} audioLevel={audioLevel} />
        {isRecording && (
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">Recording: {formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        {!audioBlob ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all shadow-lg ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse hover:bg-red-600' 
                : 'bg-purple-500 text-white hover:bg-purple-600'
            }`}
          >
            {isRecording ? '⏹️' : '🎤'}
          </motion.button>
        ) : (
          <div className="flex space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playRecording}
              disabled={isPlaying}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <span>{isPlaying ? '🔊' : '▶️'}</span>
              <span>Play Recording</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetRecording}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Record Again</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={submitRecording}
              className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <span>✨</span>
              <span>Get Feedback</span>
            </motion.button>
          </div>
        )}

        <p className="text-sm text-gray-500 text-center max-w-md">
          {!audioBlob 
            ? isRecording 
              ? 'Click the stop button when you\'re finished speaking'
              : 'Make sure you\'re in a quiet environment for the best results'
            : 'Listen to your recording and submit for AI analysis'
          }
        </p>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        className="hidden"
      />
    </motion.div>
  );
};

// Speaking Analysis Results Component
const SpeakingResults = ({ analysis, onTryAgain, onNextExercise }) => {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 80) return '🎉';
    if (score >= 70) return '👍';
    if (score >= 60) return '💪';
    return '🚀';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-6xl mb-4"
        >
          {getScoreEmoji(analysis.pronunciation_score)}
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Speaking Analysis</h2>
        <p className="text-gray-600">Here's how you did!</p>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysis.pronunciation_score)}`}>
            {Math.round(analysis.pronunciation_score)}%
          </div>
          <div className="text-gray-600">Pronunciation</div>
          
          {/* Progress Ring */}
          <div className="relative w-24 h-24 mx-auto mt-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray={`${analysis.pronunciation_score}, 100`}
                className="transition-all duration-1000 ease-in-out"
              />
            </svg>
          </div>
        </div>

        {analysis.intonation_score && (
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysis.intonation_score)}`}>
              {Math.round(analysis.intonation_score)}%
            </div>
            <div className="text-gray-600">Intonation</div>
            
            {/* Progress Ring */}
            <div className="relative w-24 h-24 mx-auto mt-4">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray={`${analysis.intonation_score}, 100`}
                  className="transition-all duration-1000 ease-in-out"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="bg-blue-50 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
          <span className="mr-2">💬</span>
          Elysian's Feedback
        </h3>
        <p className="text-blue-700 leading-relaxed">{analysis.feedback}</p>
      </div>

      {/* Detailed Analysis */}
      {analysis.detailed_analysis && (
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Detailed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(analysis.detailed_analysis).map(([key, value]) => (
              <div key={key} className="bg-white rounded-xl p-4">
                <div className="text-sm text-gray-600 capitalize mb-1">
                  {key.replace('_', ' ')}
                </div>
                <div className="font-medium text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* XP Earned */}
      {analysis.xp_earned > 0 && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring" }}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl p-4 mb-8 text-center"
        >
          <div className="text-lg font-bold">🏆 +{analysis.xp_earned} XP Earned!</div>
          <div className="text-sm opacity-90">Keep up the great work!</div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onTryAgain}
          className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
        >
          Try Again
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNextExercise}
          className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
        >
          Next Exercise
        </motion.button>
      </div>
    </motion.div>
  );
};

// Main Speaking Lab Component
const SpeakingLab = () => {
  const [currentExercise, setCurrentExercise] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { authToken } = useAuth();

  useEffect(() => {
    fetchNewExercise();
  }, []);

  const fetchNewExercise = async () => {
    try {
      setIsLoading(true);
      setAnalysis(null);
      const api = createAuthenticatedAxios(authToken);
      const response = await api.get('/speak/exercise');
      setCurrentExercise(response.data);
    } catch (error) {
      console.error('Error fetching exercise:', error);
      toast.error('Failed to load speaking exercise');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob, exercise) => {
    try {
      setIsAnalyzing(true);
      
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        try {
          const api = createAuthenticatedAxios(authToken);
          const response = await api.post('/speak/submit', {
            exercise_type: exercise.type,
            content: exercise.content,
            audio_data: base64Audio
          });
          
          setAnalysis(response.data);
          toast.success('Analysis complete! 🎯');
        } catch (error) {
          console.error('Error analyzing recording:', error);
          toast.error('Failed to analyze recording. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Failed to process recording');
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🤖
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Your Speech</h2>
          <p className="text-gray-600">Elysian is carefully listening to your pronunciation...</p>
          <motion.div
            className="mt-6 flex justify-center space-x-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-6 bg-purple-500 rounded-full"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Speaking Lab</h1>
          <p className="text-gray-600">Master pronunciation with AI-powered feedback</p>
          <Link 
            to="/" 
            className="inline-block mt-4 text-purple-600 hover:text-purple-700 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {analysis ? (
            <SpeakingResults
              key="results"
              analysis={analysis}
              onTryAgain={() => setAnalysis(null)}
              onNextExercise={fetchNewExercise}
            />
          ) : currentExercise ? (
            <SpeakingExerciseCard
              key="exercise"
              exercise={currentExercise}
              onRecordingComplete={handleRecordingComplete}
            />
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-3xl shadow-lg p-8 max-w-2xl mx-auto text-center"
            >
              <div className="text-4xl mb-4">😓</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Exercise</h2>
              <p className="text-gray-600 mb-4">We couldn't load a speaking exercise right now.</p>
              <button
                onClick={fetchNewExercise}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
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

export default SpeakingLab;