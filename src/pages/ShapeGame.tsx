import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { SoundToggle } from '@/components/SoundToggle';
import { ParentSettings } from '@/components/ParentSettings';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { CountdownTimer } from '@/components/CountdownTimer';
import { HeroShape, ShapeOptionCard } from '@/components/ShapeOptionCard';
import { useShapeGameLogic } from '@/hooks/useShapeGameLogic';
import { useSpeech } from '@/hooks/useSpeech';
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { loadAllCustomAssets } from '@/lib/assetStorage';
import {
  getShapeDescription,
  getShapeName,
  getShapeNamePlural,
  getColorName,
  COUNT_QUESTION_SECONDS,
} from '@/lib/shapeGameUtils';
import { clearGameProgress, getPlayerName } from '@/lib/gameProgressStorage';
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

  const levelInSet = (score % 5) + 1;
  const progressPct = levelInSet * 20;
  const encouragement =
    streak >= 3 ? 'Sehr gut gemacht! 🌟' : streak >= 1 ? 'Weiter so! 💪' : 'Du schaffst das! 🌈';
  const playerName = getPlayerName();

  const questionEyebrow = () => {
    if (currentChallenge.type === 'count') return 'WIE VIELE';
    if (currentChallenge.type === 'color-match') return 'FINDE DIE';
    if (currentChallenge.type === 'find') return 'KLICKE AUF DAS';
    return 'FINDE DAS';
  };

  const questionHeadline = () => {
    if (currentChallenge.type === 'count' && currentChallenge.questionShape) {
      return getShapeNamePlural(currentChallenge.questionShape.type).toUpperCase();
    }
    if (currentChallenge.type === 'color-match') {
      return `${getColorName(currentChallenge.correctAnswer as any)}E FORM`.toUpperCase();
    }
    if (currentChallenge.questionShape) {
      return getShapeDescription(currentChallenge.questionShape).toUpperCase();
    }
    return currentChallenge.question.toUpperCase();
  };

  const headlineColor =
    currentChallenge.questionShape?.color === 'yellow'
      ? '#EAB308'
      : currentChallenge.questionShape?.color === 'blue'
        ? '#3B82F6'
        : currentChallenge.questionShape?.color === 'green'
          ? '#10B981'
          : currentChallenge.questionShape?.color === 'purple'
            ? '#7C3AED'
            : currentChallenge.questionShape?.color === 'orange'
              ? '#F97316'
              : '#FF6B6B';

  const renderGameContent = () => {
    if (currentChallenge.type === 'match' || currentChallenge.type === 'color-match') {
      return (
        <>
          <div className="text-center mb-6">
            <div className="text-[13px] text-[#999] font-semibold mb-3 tracking-wide">
              {questionEyebrow()}
            </div>
            <div className="text-[28px] font-bold mb-5" style={{ color: headlineColor }}>
              {questionHeadline()}
            </div>
            <div className="flex justify-center gap-3 items-center mb-8">
              {currentChallenge.questionShape && (
                <HeroShape shape={currentChallenge.questionShape} size={100} />
              )}
              <button
                onClick={speakCurrentQuestion}
                className="btn-bounce bg-[#60A5FA] text-white p-3 rounded-full shadow-md hover:scale-105 transition-all"
                title="Frage nochmal hören"
                aria-label="Frage nochmal hören"
              >
                <span className="text-xl">🔊</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {currentChallenge.options?.map((option, index) => {
              const shape = option as Shape;
              if (!shape?.type || !shape?.color) return null;
              const isSelected =
                selectedAnswer !== null &&
                JSON.stringify(selectedAnswer) === JSON.stringify(option);
              return (
                <ShapeOptionCard
                  key={index}
                  shape={shape}
                  onClick={() => handleAnswer(option)}
                  isSelected={isSelected}
                  isCorrect={feedback === 'correct' && isSelected}
                  isWrong={feedback === 'wrong' && isSelected}
                />
              );
            })}
          </div>
        </>
      );
    }

    if (currentChallenge.type === 'count') {
      const targetType = currentChallenge.questionShape?.type;
      return (
        <>
          <div className="text-center mb-6">
            <div className="text-[13px] text-[#999] font-semibold mb-3 tracking-wide">
              {questionEyebrow()}
            </div>
            <div className="text-[28px] font-bold mb-4" style={{ color: headlineColor }}>
              {questionHeadline()}
            </div>
            <div className="flex justify-center items-center gap-3 mb-6">
              <CountdownTimer secondsLeft={secondsLeft} />
              <button
                onClick={speakCurrentQuestion}
                className="btn-bounce bg-[#60A5FA] text-white p-3 rounded-full shadow-md"
                title="Frage nochmal hören"
                aria-label="Frage nochmal hören"
              >
                <span className="text-xl">🔊</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {currentChallenge.shapes.map((shape, index) => {
              const isSelected = selectedShapeIndices.includes(index);
              const isTarget = targetType ? shape.type === targetType : false;
              return (
                <ShapeOptionCard
                  key={index}
                  shape={shape}
                  onClick={() => handleShapeToggle(index)}
                  isSelected={isSelected && feedback === 'none'}
                  isCorrect={feedback === 'correct' && isSelected}
                  isWrong={
                    feedback === 'wrong' &&
                    ((isSelected && !isTarget) || (!isSelected && isTarget))
                  }
                  showLabel={false}
                />
              );
            })}
          </div>
        </>
      );
    }

    if (currentChallenge.type === 'find') {
      return (
        <>
          <div className="text-center mb-6">
            <div className="text-[13px] text-[#999] font-semibold mb-3 tracking-wide">
              {questionEyebrow()}
            </div>
            <div className="text-[28px] font-bold mb-5" style={{ color: headlineColor }}>
              {questionHeadline()}
            </div>
            <div className="flex justify-center gap-3 items-center mb-8">
              {currentChallenge.questionShape && (
                <HeroShape shape={currentChallenge.questionShape} size={100} />
              )}
              <button
                onClick={speakCurrentQuestion}
                className="btn-bounce bg-[#60A5FA] text-white p-3 rounded-full shadow-md"
                title="Frage nochmal hören"
                aria-label="Frage nochmal hören"
              >
                <span className="text-xl">🔊</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {currentChallenge.shapes.slice(0, 4).map((shape, index) => {
              const isSelected =
                selectedAnswer !== null &&
                JSON.stringify(shape) === JSON.stringify(selectedAnswer);
              const isCorrect =
                feedback === 'correct' &&
                JSON.stringify(shape) === JSON.stringify(currentChallenge.correctAnswer);
              const isWrong = feedback === 'wrong' && isSelected;
              return (
                <ShapeOptionCard
                  key={index}
                  shape={shape}
                  onClick={() => handleAnswer(shape)}
                  isSelected={isSelected}
                  isCorrect={isCorrect}
                  isWrong={isWrong}
                />
              );
            })}
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      className="min-h-dvh h-dvh overflow-hidden font-fredoka"
      style={{
        background: 'linear-gradient(135deg, #FFF9E6 0%, #F0E6FF 100%)',
        paddingTop: 'max(2rem, env(safe-area-inset-top))',
        paddingBottom: 'max(7.5rem, calc(env(safe-area-inset-bottom) + 5.5rem))',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div className="max-w-[380px] mx-auto h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="text-center mb-6 shrink-0 relative">
          <div className="absolute right-0 top-0 flex gap-2">
            <button
              onClick={() => setShowResetDialog(true)}
              className="bg-white/80 p-2 rounded-full shadow-sm"
              title="Spiel zurücksetzen"
            >
              <span className="text-lg">🔄</span>
            </button>
            <SoundToggle isMuted={isMuted} onToggle={toggleMute} />
            <button
              onClick={() => setShowSettings(true)}
              className="bg-white/80 p-2 rounded-full shadow-sm"
              title="Einstellungen"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
          <div className="text-[42px] font-bold text-[#2D3561] leading-tight mb-1">
            Form-Spaß! 🎨
          </div>
          <div className="text-sm text-[#666] font-medium">
            Ab {childAge} Jahren{playerName ? ` · ${playerName}` : ''}
          </div>
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-2xl p-4 mb-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] shrink-0">
          <div className="text-[12px] text-[#999] mb-2 font-semibold uppercase tracking-wide">
            Level {levelInSet} von 5
          </div>
          <div className="h-3 bg-[#E8E8E8] rounded-lg overflow-hidden mb-2">
            <div
              className="h-full rounded-lg transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)',
              }}
            />
          </div>
          <div className="text-[13px] text-[#666]">{encouragement}</div>
          {score > 0 && (
            <button
              type="button"
              onClick={() => handleLevelClick(Math.max(1, score))}
              className="mt-2 text-xs text-[#7C3AED] font-semibold"
            >
              ⭐ {score} Punkte
            </button>
          )}
        </div>

        {/* Main game card */}
        <div className="bg-white rounded-[20px] px-6 py-8 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex-1 min-h-0 overflow-y-auto">
          {renderGameContent()}
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,1))',
          padding: '24px 16px',
          paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-[380px] mx-auto flex gap-3 pointer-events-auto">
          <button
            onClick={handlePrev}
            disabled={!hasPrevious}
            className="flex-1 py-[18px] text-white border-none rounded-2xl text-base font-bold shadow-[0_4px_8px_rgba(124,58,237,0.3)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}
          >
            ← Zurück
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-[18px] text-white border-none rounded-2xl text-base font-bold shadow-[0_4px_8px_rgba(16,185,129,0.3)] transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #34D399, #10B981)' }}
          >
            Weiter →
          </button>
        </div>
      </div>

      {feedback !== 'none' && (
        <FeedbackDisplay
          type={feedback}
          customImages={customImages}
          onNext={handleNext}
          onRetry={handleRetry}
          autoAdvance={feedback === 'correct' && currentChallenge?.type === 'count'}
        />
      )}

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

