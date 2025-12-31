import React, { useRef, useCallback, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Chalkboard } from '@/components/Chalkboard';
import { DrawingCanvas } from '@/components/DrawingCanvas';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { GameButton } from '@/components/GameButton';
import { SoundToggle } from '@/components/SoundToggle';
import { ParentSettings } from '@/components/ParentSettings';
import { useGameLogic } from '@/hooks/useGameLogic';
import { useSpeech } from '@/hooks/useSpeech';
import { useHandwritingRecognition } from '@/hooks/useHandwritingRecognition';

const MathGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customImages, setCustomImages] = useState<{ correct: string | null; wrong: string | null }>({
    correct: null,
    wrong: null,
  });
  const [lastAnswer, setLastAnswer] = useState<number | null>(null);

  const {
    score,
    streak,
    currentProblem,
    feedback,
    isProcessing,
    checkAnswer,
    nextProblem,
    retry,
    setProcessing,
  } = useGameLogic('easy');

  const { isMuted, toggleMute, speakCorrect, speakWrong } = useSpeech();
  const { recognizeDigit, isRecognizing } = useHandwritingRecognition();

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

  const handleCheck = useCallback(async () => {
    if (!canvasRef.current || isProcessing || isRecognizing) return;

    setProcessing(true);
    const recognized = await recognizeDigit(canvasRef.current);
    setLastAnswer(recognized);

    if (recognized !== null) {
      const isCorrect = checkAnswer(recognized);
      if (isCorrect) {
        speakCorrect();
      } else {
        speakWrong();
      }
    } else {
      // Could not recognize - show a message
      speakWrong();
      retry();
    }
    
    setProcessing(false);
  }, [isProcessing, isRecognizing, recognizeDigit, checkAnswer, speakCorrect, speakWrong, retry, setProcessing]);

  const handleNext = useCallback(() => {
    nextProblem();
    // Clear the canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setLastAnswer(null);
  }, [nextProblem]);

  const handleRetry = useCallback(() => {
    retry();
    // Clear the canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setLastAnswer(null);
  }, [retry]);

  const handleImageChange = useCallback((type: 'correct' | 'wrong', image: string | null) => {
    setCustomImages(prev => ({ ...prev, [type]: image }));
  }, []);

  const handleClearCanvas = useCallback(() => {
    setLastAnswer(null);
  }, []);

  return (
    <div className="min-h-screen gradient-warm py-4 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🧮</span>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Mathe-Spaß
            </h1>
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

        {/* Chalkboard */}
        <div className="mb-6">
          <Chalkboard problem={currentProblem} />
        </div>

        {/* Drawing Canvas */}
        <div className="mb-6">
          <DrawingCanvas 
            canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>} 
            onClear={handleClearCanvas}
          />
        </div>

        {/* Last recognized answer */}
        {lastAnswer !== null && feedback === 'none' && (
          <div className="text-center mb-4">
            <span className="text-muted-foreground">Erkannt: </span>
            <span className="font-bold text-xl text-foreground">{lastAnswer}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center">
          <GameButton
            variant="check"
            onClick={handleCheck}
            disabled={isProcessing || isRecognizing}
            isLoading={isProcessing || isRecognizing}
          />
        </div>

        {/* Footer hint */}
        <p className="text-center text-muted-foreground text-sm mt-8">
          Schreibe die Zahl mit dem Finger oder der Maus! ✍️
        </p>
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
      />
    </div>
  );
};

export default MathGame;
