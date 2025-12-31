import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { SoundToggle } from '@/components/SoundToggle';
import { ParentSettings } from '@/components/ParentSettings';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { ShapeDisplay } from '@/components/ShapeDisplay';
import { InlineShape } from '@/components/InlineShape';
import { useShapeGameLogic } from '@/hooks/useShapeGameLogic';
import { useSpeech } from '@/hooks/useSpeech';
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { loadAllCustomAssets } from '@/lib/assetStorage';
import { getShapeDescription } from '@/lib/shapeGameUtils';
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

  // Load age and custom assets from storage on mount
  useEffect(() => {
    const storedAge = getAgeFromStorage();
    if (storedAge) {
      if (storedAge >= 6) {
        // Wrong game for this age, redirect to math game
        navigate('/game/math', { replace: true });
        return;
      }
      setChildAge(storedAge);
    } else {
      // No age set, redirect to home
      navigate('/', { replace: true });
    }

    // Load custom assets from localStorage
    const assets = loadAllCustomAssets();
    if (assets.correctImage) {
      setCustomImages(prev => ({ ...prev, correct: assets.correctImage }));
    }
    if (assets.wrongImage) {
      setCustomImages(prev => ({ ...prev, wrong: assets.wrongImage }));
    }
    if (assets.correctAudio) {
      setCustomAudio(prev => ({ ...prev, correct: assets.correctAudio }));
    }
    if (assets.wrongAudio) {
      setCustomAudio(prev => ({ ...prev, wrong: assets.wrongAudio }));
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

  const { isMuted, toggleMute, speakCorrect, speakWrong, speakQuestion } = useSpeech(customAudio);

  // Function to build and speak the question text
  const speakCurrentQuestion = useCallback(() => {
    if (!currentChallenge) {
      console.log('No current challenge to speak');
      return;
    }
    
    // Build the full question text including shape and suffix
    let questionText = currentChallenge.question;
    
    // If there's a shape in the question, add its description
    if (currentChallenge.questionShape) {
      const shapeDescription = getShapeDescription(currentChallenge.questionShape);
      questionText += ' ' + shapeDescription;
    }
    
    // Add suffix if present
    if (currentChallenge.questionSuffix) {
      questionText += ' ' + currentChallenge.questionSuffix;
    }
    
    console.log('speakCurrentQuestion called with:', questionText);
    speakQuestion(questionText);
  }, [currentChallenge, speakQuestion]);

  // Speak the question when it changes
  useEffect(() => {
    if (currentChallenge && feedback === 'none') {
      // Small delay to ensure page is ready and voices are loaded
      const timer = setTimeout(() => {
        speakCurrentQuestion();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentChallenge, speakCurrentQuestion, feedback]);

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
    nextChallenge(selectedAnswer);
    setSelectedAnswer(null);
  }, [nextChallenge, selectedAnswer]);

  const handlePrev = useCallback(() => {
    const result = prevChallenge();
    if (result) {
      setSelectedAnswer(result.selectedAnswer);
      // Note: feedback is already restored by the hook
    } else {
      setSelectedAnswer(null);
    }
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
    if (ageRange >= 6) {
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                <span>{currentChallenge.question}</span>
                {currentChallenge.questionShape && (
                  <InlineShape 
                    type={currentChallenge.questionShape.type} 
                    color={currentChallenge.questionShape.color}
                    size={60}
                  />
                )}
                {currentChallenge.questionSuffix && (
                  <span>{currentChallenge.questionSuffix}</span>
                )}
              </h2>
              <button
                onClick={speakCurrentQuestion}
                className="btn-bounce bg-btn-blue text-white p-2 sm:p-3 rounded-full shadow-fun-sm hover:bg-btn-blue/90 transition-all"
                title="Frage nochmal hören"
                aria-label="Frage nochmal hören"
              >
                <span className="text-xl sm:text-2xl">🔊</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {currentChallenge.options?.map((option, index) => {
              const shape = option as Shape;
              
              // Debug: Log shapes for color-match challenges
              if (currentChallenge.type === 'color-match' && index === 0) {
                console.log('Color-match challenge shapes:', currentChallenge.options?.map((s: any) => ({ type: s.type, color: s.color })));
                console.log('Target color:', currentChallenge.correctAnswer);
              }
              
              // Ensure shape is valid
              if (!shape || !shape.type || !shape.color) {
                console.error('Invalid shape in options:', shape, 'at index:', index);
              }
              
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                <span>{currentChallenge.question}</span>
                {currentChallenge.questionShape && (
                  <InlineShape 
                    type={currentChallenge.questionShape.type} 
                    color={currentChallenge.questionShape.color}
                    size={60}
                  />
                )}
                {currentChallenge.questionSuffix && (
                  <span>{currentChallenge.questionSuffix}</span>
                )}
              </h2>
              <button
                onClick={speakCurrentQuestion}
                className="btn-bounce bg-btn-blue text-white p-2 sm:p-3 rounded-full shadow-fun-sm hover:bg-btn-blue/90 transition-all"
                title="Frage nochmal hören"
                aria-label="Frage nochmal hören"
              >
                <span className="text-xl sm:text-2xl">🔊</span>
              </button>
            </div>
          </div>
          
          {/* Shapes display area - clearly non-interactive */}
          <div className="bg-card/30 rounded-3xl p-6 border-2 border-dashed border-muted-foreground/30 mb-8">
            <p className="text-center text-sm text-muted-foreground mb-4 font-medium">
              👆 Zähle die Formen oben
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-2xl mx-auto">
              {currentChallenge.shapes.map((shape, index) => (
                <div key={index} className="opacity-75 pointer-events-none">
                  <ShapeDisplay
                    shape={shape}
                    size="md"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Visual separator with arrow pointing to answer buttons */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="text-4xl animate-bounce">👇</div>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              Klicke auf die richtige Zahl:
            </p>
          </div>
          
          {/* Number buttons - made more prominent and clearly interactive */}
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
                    w-24 h-24 sm:w-28 sm:h-28 rounded-3xl font-bold text-4xl sm:text-5xl
                    transition-all duration-200
                    ${isSelected && isCorrect ? 'bg-success text-white ring-4 ring-success scale-110 shadow-2xl' : ''}
                    ${isSelected && isWrong ? 'bg-destructive text-white ring-4 ring-destructive animate-shake shadow-2xl' : ''}
                    ${!isSelected ? 'bg-btn-blue text-white hover:bg-btn-blue/90 hover:scale-110 active:scale-95 shadow-fun-lg ring-2 ring-btn-blue/50' : ''}
                    ${isSelected && !isCorrect && !isWrong ? 'bg-btn-blue text-white ring-4 ring-btn-blue scale-110 shadow-2xl' : ''}
                    cursor-pointer
                    transform
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
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                <span>{currentChallenge.question}</span>
                {currentChallenge.questionShape && (
                  <InlineShape 
                    type={currentChallenge.questionShape.type} 
                    color={currentChallenge.questionShape.color}
                    size={60}
                  />
                )}
                {currentChallenge.questionSuffix && (
                  <span>{currentChallenge.questionSuffix}</span>
                )}
              </h2>
              <button
                onClick={speakCurrentQuestion}
                className="btn-bounce bg-btn-blue text-white p-2 sm:p-3 rounded-full shadow-fun-sm hover:bg-btn-blue/90 transition-all"
                title="Frage nochmal hören"
                aria-label="Frage nochmal hören"
              >
                <span className="text-xl sm:text-2xl">🔊</span>
              </button>
            </div>
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

        {/* Navigation Buttons - Always visible to allow navigation between questions */}
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
              ${feedback !== 'none' ? 'opacity-75' : ''}
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
              ${feedback !== 'none' ? 'opacity-75' : ''}
            `}
          >
            Weiter ➡️
          </button>
        </div>
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

