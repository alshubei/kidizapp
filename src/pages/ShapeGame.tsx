import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { SoundToggle } from '@/components/SoundToggle';
import { ParentSettings } from '@/components/ParentSettings';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { ShapeDisplay } from '@/components/ShapeDisplay';
import { InlineShape } from '@/components/InlineShape';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useShapeGameLogic } from '@/hooks/useShapeGameLogic';
import { useSpeech } from '@/hooks/useSpeech';
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { loadAllCustomAssets } from '@/lib/assetStorage';
import { getShapeDescription, getShapeNamePlural, COUNT_QUESTION_SECONDS } from '@/lib/shapeGameUtils';
import { clearGameProgress } from '@/lib/gameProgressStorage';
import { AgeRange, Shape } from '@/types/game';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ShapeGame: React.FC = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [childAge, setChildAge] = useState<AgeRange | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | Shape | null>(null);
  const [selectedShapeIndices, setSelectedShapeIndices] = useState<number[]>([]);
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
    resetGame,
    updateAge,
    jumpToLevel,
    hasPrevious,
  } = useShapeGameLogic(childAge || 5);
  const [secondsLeft, setSecondsLeft] = useState(COUNT_QUESTION_SECONDS);
  const timedOutRef = useRef(false);
  const selectedShapeIndicesRef = useRef<number[]>([]);
  selectedShapeIndicesRef.current = selectedShapeIndices;

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
      // For count questions, use plural shape name without color
      // For other questions, use full description with color
      if (currentChallenge.type === 'count') {
        const shapeNamePlural = getShapeNamePlural(currentChallenge.questionShape.type);
        questionText += ' ' + shapeNamePlural;
      } else {
        const shapeDescription = getShapeDescription(currentChallenge.questionShape);
        questionText += ' ' + shapeDescription;
      }
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

  const handleTimeout = useCallback(() => {
    if (timedOutRef.current || feedback !== 'none') return;
    timedOutRef.current = true;

    const selected = selectedShapeIndicesRef.current;
    setSelectedAnswer(selected);
    const isCorrect = checkAnswer(selected);

    if (isCorrect) {
      speakCorrect();
    } else {
      speakWrong();
    }
  }, [feedback, checkAnswer, speakCorrect, speakWrong]);

  // 5-second countdown on count questions only — ends the round and grades taps
  useEffect(() => {
    if (!childAge || currentChallenge?.type !== 'count' || feedback !== 'none') {
      return;
    }

    timedOutRef.current = false;
    setSecondsLeft(COUNT_QUESTION_SECONDS);
    let remaining = COUNT_QUESTION_SECONDS;

    const intervalId = window.setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        handleTimeout();
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [childAge, currentChallenge, feedback, handleTimeout]);

  // Clear shape selections when the challenge changes
  useEffect(() => {
    setSelectedShapeIndices([]);
  }, [currentChallenge]);

  // Auto-advance after a correct count answer (kid doesn't need to tap Next)
  useEffect(() => {
    if (feedback !== 'correct' || currentChallenge?.type !== 'count') {
      return;
    }
    const timer = window.setTimeout(() => {
      nextChallenge(selectedShapeIndicesRef.current);
      setSelectedAnswer(null);
      setSelectedShapeIndices([]);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [feedback, currentChallenge?.type, nextChallenge]);

  // After Ohh on a count miss, return to the same task automatically
  useEffect(() => {
    if (feedback !== 'wrong' || currentChallenge?.type !== 'count') {
      return;
    }
    const timer = window.setTimeout(() => {
      timedOutRef.current = false;
      retry();
      setSelectedAnswer(null);
      setSelectedShapeIndices([]);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [feedback, currentChallenge?.type, retry]);

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

  const handleShapeToggle = useCallback((index: number) => {
    if (feedback !== 'none' || timedOutRef.current) return;
    if (currentChallenge.type !== 'count') return;

    const nextSelected = selectedShapeIndicesRef.current.includes(index)
      ? selectedShapeIndicesRef.current.filter(i => i !== index)
      : [...selectedShapeIndicesRef.current, index];

    setSelectedShapeIndices(nextSelected);
    selectedShapeIndicesRef.current = nextSelected;

    const targetType = currentChallenge.questionShape?.type;
    if (!targetType) return;

    const targetIndices = currentChallenge.shapes
      .map((shape, i) => (shape.type === targetType ? i : -1))
      .filter(i => i >= 0);
    const selectedSorted = [...nextSelected].sort((a, b) => a - b);
    const targetSorted = [...targetIndices].sort((a, b) => a - b);
    const isComplete =
      selectedSorted.length === targetSorted.length &&
      selectedSorted.every((i, n) => i === targetSorted[n]);

    if (!isComplete) return;

    timedOutRef.current = true;
    setSelectedAnswer(nextSelected);
    const isCorrect = checkAnswer(nextSelected);
    if (isCorrect) {
      speakCorrect();
    } else {
      speakWrong();
    }
  }, [feedback, currentChallenge, checkAnswer, speakCorrect, speakWrong]);

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
    setSelectedShapeIndices([]);
  }, [nextChallenge, selectedAnswer]);

  const handlePrev = useCallback(() => {
    const result = prevChallenge();
    if (result) {
      setSelectedAnswer(result.selectedAnswer);
      if (Array.isArray(result.selectedAnswer)) {
        setSelectedShapeIndices(result.selectedAnswer);
      } else {
        setSelectedShapeIndices([]);
      }
    } else {
      setSelectedAnswer(null);
      setSelectedShapeIndices([]);
    }
  }, [prevChallenge]);

  const handleLevelClick = useCallback((level: number) => {
    if (jumpToLevel) {
      const result = jumpToLevel(level);
      if (result) {
        setSelectedAnswer(result.selectedAnswer);
        if (Array.isArray(result.selectedAnswer)) {
          setSelectedShapeIndices(result.selectedAnswer);
        } else {
          setSelectedShapeIndices([]);
        }
      } else {
        setSelectedAnswer(null);
        setSelectedShapeIndices([]);
      }
    }
  }, [jumpToLevel]);

  const handleRetry = useCallback(() => {
    timedOutRef.current = false;
    retry();
    setSelectedAnswer(null);
    setSelectedShapeIndices([]);
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

  const handleResetGame = useCallback(() => {
    // Clear progress from localStorage
    clearGameProgress();
    // Reset game state
    if (resetGame) {
      resetGame();
    }
    setShowResetDialog(false);
    setSelectedAnswer(null);
  }, [resetGame]);

  // Don't render game if age is not set
  if (!childAge) {
    return null;
  }

  const renderGameContent = () => {
    if (currentChallenge.type === 'match' || currentChallenge.type === 'color-match') {
      // Shape matching game
      return (
        <div className="space-y-3 sm:space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2 sm:mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                <span>{currentChallenge.question}</span>
              {currentChallenge.questionShape && (
                <InlineShape 
                  type={currentChallenge.questionShape.type} 
                  color={currentChallenge.questionShape.color}
                  size={60}
                  usePlural={currentChallenge.type === 'count'}
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
      // Counting game: tap each matching shape within the timer
      const targetType = currentChallenge.questionShape?.type;
      return (
        <div className="space-y-3 sm:space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2 sm:mb-4 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                <span>{currentChallenge.question}</span>
              {currentChallenge.questionShape && (
                <InlineShape 
                  type={currentChallenge.questionShape.type} 
                  color={currentChallenge.questionShape.color}
                  size={60}
                  usePlural
                />
              )}
                {currentChallenge.questionSuffix && (
                  <span>{currentChallenge.questionSuffix}</span>
                )}
              </h2>
              <CountdownTimer secondsLeft={secondsLeft} />
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
          
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
            {currentChallenge.shapes.map((shape, index) => {
              const isSelected = selectedShapeIndices.includes(index);
              const isTarget = targetType ? shape.type === targetType : false;
              const showCorrect = feedback === 'correct' && isSelected;
              const showWrong =
                feedback === 'wrong' &&
                ((isSelected && !isTarget) || (!isSelected && isTarget));

              return (
                <ShapeDisplay
                  key={index}
                  shape={shape}
                  size="lg"
                  onClick={() => handleShapeToggle(index)}
                  isSelected={isSelected && feedback === 'none'}
                  isCorrect={showCorrect}
                  isWrong={showWrong}
                />
              );
            })}
          </div>
        </div>
      );
    } else if (currentChallenge.type === 'find') {
      // Find the shape game
      return (
        <div className="space-y-3 sm:space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2 sm:mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                <span>{currentChallenge.question}</span>
              {currentChallenge.questionShape && (
                <InlineShape 
                  type={currentChallenge.questionShape.type} 
                  color={currentChallenge.questionShape.color}
                  size={60}
                  usePlural={currentChallenge.type === 'count'}
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
    <div
      className="min-h-dvh h-dvh gradient-warm flex flex-col px-4 overflow-hidden"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="max-w-4xl w-full mx-auto flex flex-col flex-1 min-h-0 justify-center gap-3 sm:gap-5">
        {/* Header */}
        <header className="flex items-center justify-between shrink-0">
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
            <button
              onClick={() => setShowResetDialog(true)}
              className="btn-bounce bg-card p-2 rounded-full shadow-fun-sm"
              title="Spiel zurücksetzen"
            >
              <span className="text-xl">🔄</span>
            </button>
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
        <div className="flex justify-center shrink-0">
          <ScoreDisplay score={score} streak={streak} onLevelClick={handleLevelClick} />
        </div>

        {/* Game Content — centered play area */}
        <div className="mx-2 sm:mx-0 flex-1 min-h-0 flex items-center justify-center overflow-y-auto">
          <div className="w-full py-2">
            {renderGameContent()}
          </div>
        </div>

        {/* Navigation Buttons - Always visible to allow navigation between questions */}
        <div className="flex justify-center gap-4 shrink-0 pb-1">
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
          autoAdvance={feedback === 'correct' && currentChallenge?.type === 'count'}
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

      {/* Reset Game Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Spiel zurücksetzen? 🔄</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du wirklich das Spiel zurücksetzen? Dein aktueller Punktestand und Fortschritt werden gelöscht und das Spiel startet von vorne.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetGame}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Zurücksetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ShapeGame;

