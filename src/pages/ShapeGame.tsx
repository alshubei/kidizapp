import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { SoundToggle } from '@/components/SoundToggle';
import { ParentSettings } from '@/components/ParentSettings';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { ShapeDisplay } from '@/components/ShapeDisplay';
import { useShapeGameLogic } from '@/hooks/useShapeGameLogic';
import { useSpeech } from '@/hooks/useSpeech';
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { AgeRange, Shape } from '@/types/game';

const ShapeGame: React.FC = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [childAge, setChildAge] = useState<AgeRange | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | Shape | null>(null);
  const [customImages, setCustomImages] = useState<{ correct: string | null; wrong: string | null }>({
    correct: null,
    wrong: null,
  });
  const [customAudio, setCustomAudio] = useState<{ correct: string | null; wrong: string | null }>({
    correct: null,
    wrong: null,
  });

  // Load age from storage on mount
  useEffect(() => {
    const storedAge = getAgeFromStorage();
    if (storedAge) {
      if (storedAge >= 7) {
        // Wrong game for this age, redirect to math game
        navigate('/game/math', { replace: true });
        return;
      }
      setChildAge(storedAge);
    } else {
      // No age set, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const {
    score,
    streak,
    currentChallenge,
    feedback,
    checkAnswer,
    nextChallenge,
    prevChallenge,
    retry,
    updateAge,
    hasPrevious,
  } = useShapeGameLogic(childAge || 5);

  const { isMuted, toggleMute, speakCorrect, speakWrong } = useSpeech(customAudio);

  // Trigger confetti on 3-streak
  useEffect(() => {
    if (streak > 0 && streak % 3 === 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#9d65c9'],
      });
    }
  }, [streak]);

  // Update game logic when age changes
  useEffect(() => {
    if (childAge && updateAge) {
      updateAge(childAge);
    }
  }, [childAge, updateAge]);

  const handleAnswer = useCallback((answer: number | Shape) => {
    if (feedback !== 'none') return;
    
    setSelectedAnswer(answer);
    const isCorrect = checkAnswer(answer);
    
    if (isCorrect) {
      speakCorrect();
    } else {
      speakWrong();
    }
  }, [checkAnswer, speakCorrect, speakWrong, feedback]);

  const handleNext = useCallback(() => {
    nextChallenge();
    setSelectedAnswer(null);
  }, [nextChallenge]);

  const handlePrev = useCallback(() => {
    prevChallenge();
    setSelectedAnswer(null);
  }, [prevChallenge]);

  const handleRetry = useCallback(() => {
    retry();
    setSelectedAnswer(null);
  }, [retry]);

  const handleImageChange = useCallback((type: 'correct' | 'wrong', image: string | null) => {
    setCustomImages(prev => ({ ...prev, [type]: image }));
  }, []);

  const handleAudioChange = useCallback((type: 'correct' | 'wrong', audio: string | null) => {
    setCustomAudio(prev => ({ ...prev, [type]: audio }));
  }, []);

  const handleAgeChange = useCallback((age: number) => {
    const ageRange = age as AgeRange;
    setChildAge(ageRange);
    saveAgeToStorage(ageRange);
    if (updateAge) {
      updateAge(ageRange);
    }
    // Navigate to appropriate game based on new age
    if (ageRange >= 7) {
      navigate('/game/math', { replace: true });
    } else {
      navigate('/game/shape', { replace: true });
    }
  }, [updateAge, navigate]);

  // Don't render game if age is not set
  if (!childAge) {
    return null;
  }

  const renderGameContent = () => {
    if (currentChallenge.type === 'match' || currentChallenge.type === 'color-match') {
      // Shape matching game
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {currentChallenge.question}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {currentChallenge.options?.map((option, index) => {
              const shape = option as Shape;
              const isSelected = selectedAnswer !== null && 
                JSON.stringify(selectedAnswer) === JSON.stringify(option);
              const isCorrect = feedback === 'correct' && isSelected;
              const isWrong = feedback === 'wrong' && isSelected;
              
              return (
                <ShapeDisplay
                  key={index}
                  shape={shape}
                  size="lg"
                  onClick={() => handleAnswer(option)}
                  isSelected={isSelected}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                />
              );
            })}
          </div>
        </div>
      );
    } else if (currentChallenge.type === 'count') {
      // Counting game
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {currentChallenge.question}
            </h2>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-2xl mx-auto mb-6">
            {currentChallenge.shapes.map((shape, index) => (
              <ShapeDisplay
                key={index}
                shape={shape}
                size="md"
              />
            ))}
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {currentChallenge.options?.map((option) => {
              const num = option as number;
              const isSelected = selectedAnswer === num;
              const isCorrect = feedback === 'correct' && isSelected;
              const isWrong = feedback === 'wrong' && isSelected;
              
              return (
                <button
                  key={num}
                  onClick={() => handleAnswer(num)}
                  className={`
                    w-20 h-20 rounded-2xl font-bold text-3xl
                    transition-all duration-200
                    ${isSelected && isCorrect ? 'bg-success text-white ring-4 ring-success scale-110' : ''}
                    ${isSelected && isWrong ? 'bg-destructive text-white ring-4 ring-destructive animate-shake' : ''}
                    ${!isSelected ? 'bg-card text-foreground hover:bg-muted hover:scale-105' : ''}
                    ${isSelected && !isCorrect && !isWrong ? 'bg-btn-blue text-white ring-4 ring-btn-blue scale-110' : ''}
                    shadow-fun-sm
                  `}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      );
    } else if (currentChallenge.type === 'find') {
      // Find the shape game
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              {currentChallenge.question}
            </h2>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {currentChallenge.shapes.map((shape, index) => {
              const isCorrect = feedback === 'correct' && 
                JSON.stringify(shape) === JSON.stringify(currentChallenge.correctAnswer);
              const isWrong = feedback === 'wrong' && 
                selectedAnswer !== null &&
                JSON.stringify(shape) === JSON.stringify(selectedAnswer);
              
              return (
                <ShapeDisplay
                  key={index}
                  shape={shape}
                  size="lg"
                  onClick={() => handleAnswer(shape)}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                />
              );
            })}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen gradient-warm py-4 sm:py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🔷</span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Formen-Spaß
              </h1>
              {childAge && (
                <div className="flex items-center gap-1 bg-btn-purple/20 px-3 py-1 rounded-full">
                  <span className="text-sm">👶</span>
                  <span className="text-sm font-bold text-btn-purple">
                    Alter: {childAge} Jahre
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <SoundToggle isMuted={isMuted} onToggle={toggleMute} />
            <button
              onClick={() => setShowSettings(true)}
              className="btn-bounce bg-card p-2 rounded-full shadow-fun-sm"
              title="Einstellungen"
            >
              <span className="text-xl">⚙️</span>
            </button>
          </div>
        </header>

        {/* Score Display */}
        <div className="flex justify-center mb-6">
          <ScoreDisplay score={score} streak={streak} />
        </div>

        {/* Game Content */}
        <div className="mb-6">
          {renderGameContent()}
        </div>

        {/* Navigation Buttons */}
        {feedback === 'none' && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={handlePrev}
              disabled={!hasPrevious}
              className={`
                btn-bounce bg-btn-purple text-white font-bold 
                py-3 sm:py-4 px-6 sm:px-8 rounded-2xl 
                text-lg sm:text-xl shadow-fun transition-all
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center gap-2
              `}
            >
              ⬅️ Zurück
            </button>
            <button
              onClick={handleNext}
              className={`
                btn-bounce bg-btn-blue text-white font-bold 
                py-3 sm:py-4 px-6 sm:px-8 rounded-2xl 
                text-lg sm:text-xl shadow-fun transition-all
                flex items-center justify-center gap-2
              `}
            >
              Weiter ➡️
            </button>
          </div>
        )}
      </div>

      {/* Feedback Overlay */}
      {feedback !== 'none' && (
        <FeedbackDisplay
          type={feedback}
          customImages={customImages}
          onNext={handleNext}
          onRetry={handleRetry}
        />
      )}

      {/* Parent Settings Modal */}
      <ParentSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        customImages={customImages}
        onImageChange={handleImageChange}
        customAudio={customAudio}
        onAudioChange={handleAudioChange}
        currentAge={childAge}
        onAgeChange={handleAgeChange}
      />
    </div>
  );
};

export default ShapeGame;

