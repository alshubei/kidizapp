import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Volume2, RotateCcw, Settings } from 'lucide-react';
import { SoundToggle } from '@/components/SoundToggle';
import { ParentSettings } from '@/components/ParentSettings';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { CountdownTimer } from '@/components/CountdownTimer';
import { HeroShape, ShapeGrid, ShapeOptionCard } from '@/components/ShapeOptionCard';
import { useShapeGameLogic } from '@/hooks/useShapeGameLogic';
import { useSpeech } from '@/hooks/useSpeech';
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { loadAllCustomAssets } from '@/lib/assetStorage';
import {
  getShapeDescription,
  getShapeNamePlural,
  getColorName,
  getShapeArticleAccusative,
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
  const [timerStarted, setTimerStarted] = useState(false);
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
    
    // If there's a shape in the question, add its name/description
    if (currentChallenge.questionShape) {
      // Count: plural only. Animals: name only (emoji color ≠ spoken color).
      // Geometry match/find: colored description.
      if (currentChallenge.type === 'count') {
        questionText += ' ' + getShapeNamePlural(currentChallenge.questionShape.type);
      } else {
        questionText += ' ' + getShapeDescription(currentChallenge.questionShape);
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

  // Countdown starts only after the first shape tap on count questions
  useEffect(() => {
    if (
      !childAge ||
      currentChallenge?.type !== 'count' ||
      feedback !== 'none' ||
      !timerStarted
    ) {
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
  }, [childAge, currentChallenge, feedback, timerStarted, handleTimeout]);

  // Reset selections and timer arming when the challenge changes
  useEffect(() => {
    setSelectedShapeIndices([]);
    setTimerStarted(false);
    setSecondsLeft(COUNT_QUESTION_SECONDS);
    timedOutRef.current = false;
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
      setTimerStarted(false);
      setSecondsLeft(COUNT_QUESTION_SECONDS);
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

    // Arm the countdown on the first tap so speech can finish first
    setTimerStarted(prev => prev || true);

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
    setTimerStarted(false);
    setSecondsLeft(COUNT_QUESTION_SECONDS);
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
    streak >= 3 ? 'Sehr gut gemacht' : streak >= 1 ? 'Weiter so' : 'Bereit?';
  const playerName = getPlayerName();

  const speakButton = (
    <button
      onClick={speakCurrentQuestion}
      className="bg-[#60A5FA] text-white p-2 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
      title="Frage nochmal hören"
      aria-label="Frage nochmal hören"
    >
      <Volume2 className="w-4 h-4" strokeWidth={2.25} />
    </button>
  );
  const questionEyebrow = () => {
    if (currentChallenge.type === 'count') return 'WIE VIELE';
    if (currentChallenge.type === 'color-match') return 'FINDE DIE';
    const article = currentChallenge.questionShape
      ? getShapeArticleAccusative(currentChallenge.questionShape.type).toUpperCase()
      : 'DAS';
    if (currentChallenge.type === 'find') return `KLICKE AUF ${article}`;
    return `FINDE ${article}`;
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
        <div className="flex flex-col h-full min-h-0">
          <div className="text-center shrink-0 mb-3">
            <div className="text-[11px] text-[#999] font-semibold tracking-wide">
              {questionEyebrow()}
            </div>
            <div className="text-xl font-bold leading-tight" style={{ color: headlineColor }}>
              {questionHeadline()}
            </div>
            <div className="flex justify-center gap-2 items-center mt-2">
              {currentChallenge.questionShape && (
                <HeroShape shape={currentChallenge.questionShape} size={64} />
              )}
              {speakButton}
            </div>
          </div>

          <ShapeGrid count={currentChallenge.options?.length ?? 0}>
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
          </ShapeGrid>
        </div>
      );
    }

    if (currentChallenge.type === 'count') {
      const targetType = currentChallenge.questionShape?.type;
      return (
        <div className="flex flex-col h-full min-h-0">
          <div className="text-center shrink-0 mb-3">
            <div className="text-[11px] text-[#999] font-semibold tracking-wide">
              {questionEyebrow()}
            </div>
            <div className="text-xl font-bold leading-tight" style={{ color: headlineColor }}>
              {questionHeadline()}
            </div>
            <div className="flex justify-center items-center gap-2 mt-2">
              <CountdownTimer secondsLeft={secondsLeft} />
              {speakButton}
            </div>
          </div>

          <ShapeGrid count={currentChallenge.shapes.length}>
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
          </ShapeGrid>
        </div>
      );
    }

    if (currentChallenge.type === 'find') {
      return (
        <div className="flex flex-col h-full min-h-0">
          <div className="text-center shrink-0 mb-3">
            <div className="text-[11px] text-[#999] font-semibold tracking-wide">
              {questionEyebrow()}
            </div>
            <div className="text-xl font-bold leading-tight" style={{ color: headlineColor }}>
              {questionHeadline()}
            </div>
            <div className="flex justify-center gap-2 items-center mt-2">
              {currentChallenge.questionShape && (
                <HeroShape shape={currentChallenge.questionShape} size={64} />
              )}
              {speakButton}
            </div>
          </div>

          <ShapeGrid count={Math.min(4, currentChallenge.shapes.length)}>
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
          </ShapeGrid>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="min-h-dvh h-dvh overflow-hidden font-fredoka"
      style={{
        background: 'linear-gradient(135deg, #FFF9E6 0%, #F0E6FF 100%)',
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(4.25rem, calc(env(safe-area-inset-bottom) + 3.25rem))',
        paddingLeft: 12,
        paddingRight: 12,
      }}
    >
      <div className="max-w-[380px] mx-auto h-full flex flex-col min-h-0 gap-2.5">
        {/* Header */}
        <div className="shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="w-[104px] shrink-0" aria-hidden="true" />
            <div className="flex-1 text-center min-w-0">
              <div className="text-[32px] font-bold text-[#2D3561] leading-none">
                Form-Spaß
              </div>
              <div className="text-[13px] text-[#666] font-medium mt-1">
                Ab {childAge} Jahren{playerName ? ` · ${playerName}` : ''}
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0 w-[104px] justify-end">
              <button
                onClick={() => setShowResetDialog(true)}
                className="bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition-all"
                title="Spiel zurücksetzen"
                aria-label="Spiel zurücksetzen"
              >
                <RotateCcw className="w-4 h-4 text-[#2D3561]" strokeWidth={2.25} />
              </button>
              <SoundToggle isMuted={isMuted} onToggle={toggleMute} />
              <button
                onClick={() => setShowSettings(true)}
                className="bg-white/80 p-2 rounded-full shadow-sm hover:bg-white transition-all"
                title="Einstellungen"
                aria-label="Einstellungen"
              >
                <Settings className="w-4 h-4 text-[#2D3561]" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] shrink-0 flex items-center gap-2.5">
          <div className="text-[12px] text-[#999] font-semibold uppercase tracking-wide whitespace-nowrap">
            Level {levelInSet}/5
          </div>
          <div className="h-2.5 flex-1 bg-[#E8E8E8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)',
              }}
            />
          </div>
          <div className="text-[12px] text-[#666] whitespace-nowrap">{encouragement}</div>
          {score > 0 && (
            <button
              type="button"
              onClick={() => handleLevelClick(Math.max(1, score))}
              className="text-[12px] text-[#7C3AED] font-semibold whitespace-nowrap"
            >
              {score} Pkt
            </button>
          )}
        </div>

        {/* Main game card — fills remaining space, no scroll */}
        <div className="bg-white rounded-2xl px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderGameContent()}
        </div>
      </div>

      {/* Compact fixed bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,1) 40%)',
          padding: '8px 12px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="max-w-[380px] mx-auto flex gap-2 pointer-events-auto">
          <button
            onClick={handlePrev}
            disabled={!hasPrevious}
            className="flex-1 py-2.5 text-white border-none rounded-xl text-sm font-bold shadow-[0_3px_6px_rgba(124,58,237,0.25)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}
          >
            ← Zurück
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 text-white border-none rounded-xl text-sm font-bold shadow-[0_3px_6px_rgba(16,185,129,0.25)] transition-transform active:scale-95"
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
            <AlertDialogTitle>Spiel zurücksetzen?</AlertDialogTitle>
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

