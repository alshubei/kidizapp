import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { loadAllCustomAssets } from '@/lib/assetStorage';
import { AgeRange } from '@/types/game';

// Convert numbers to German words for better speech synthesis
const numberToGerman = (num: number): string => {
  const numbers: Record<number, string> = {
    0: 'null',
    1: 'eins',
    2: 'zwei',
    3: 'drei',
    4: 'vier',
    5: 'fünf',
    6: 'sechs',
    7: 'sieben',
    8: 'acht',
    9: 'neun',
    10: 'zehn',
    11: 'elf',
    12: 'zwölf',
    13: 'dreizehn',
    14: 'vierzehn',
    15: 'fünfzehn',
    16: 'sechzehn',
    17: 'siebzehn',
    18: 'achtzehn',
    19: 'neunzehn',
    20: 'zwanzig',
    21: 'einundzwanzig',
    22: 'zweiundzwanzig',
    23: 'dreiundzwanzig',
    24: 'vierundzwanzig',
    25: 'fünfundzwanzig',
    26: 'sechsundzwanzig',
    27: 'siebenundzwanzig',
    28: 'achtundzwanzig',
    29: 'neunundzwanzig',
    30: 'dreißig',
  };
  
  if (numbers[num] !== undefined) {
    return numbers[num];
  }
  
  // For numbers beyond 30, fall back to digit reading
  return num.toString();
};

const MathGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [childAge, setChildAge] = useState<AgeRange | null>(null);
  const [customImages, setCustomImages] = useState<{ correct: string | null; wrong: string | null }>({
    correct: null,
    wrong: null,
  });
  const [customAudio, setCustomAudio] = useState<{ correct: string | null; wrong: string | null }>({
    correct: null,
    wrong: null,
  });
  const [lastAnswer, setLastAnswer] = useState<number | null>(null);

  // Load age and custom assets from storage on mount
  useEffect(() => {
    const storedAge = getAgeFromStorage();
    if (storedAge) {
      if (storedAge < 6) {
        // Wrong game for this age, redirect to shape game
        navigate('/game/shape', { replace: true });
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
    currentProblem,
    feedback,
    isProcessing,
    checkAnswer,
    nextProblem,
    prevProblem,
    retry,
    setProcessing,
    updateAge,
    hasPrevious,
  } = useGameLogic(childAge || 6); // Default to 6 if age not set yet (math game is for 6-10)

  // Update game logic when age changes
  useEffect(() => {
    if (childAge && updateAge) {
      updateAge(childAge);
    }
  }, [childAge, updateAge]);

  const { isMuted, toggleMute, speakCorrect, speakWrong, speakQuestion } = useSpeech(customAudio);
  const { recognizeDigit, isRecognizing } = useHandwritingRecognition();

  // Function to build and speak the math question
  const speakCurrentQuestion = useCallback(() => {
    if (!currentProblem) {
      console.log('No current problem to speak');
      return;
    }
    
    const operatorText = currentProblem.operator === '+' ? 'plus' : 'minus';
    const num1Text = numberToGerman(currentProblem.num1);
    const num2Text = numberToGerman(currentProblem.num2);
    const questionText = `${num1Text} ${operatorText} ${num2Text}`;
    console.log('speakCurrentQuestion called with:', questionText);
    speakQuestion(questionText);
  }, [currentProblem, speakQuestion]);

  // Speak the math problem when it changes
  useEffect(() => {
    if (currentProblem && feedback === 'none') {
      // Small delay to ensure page is ready and voices are loaded
      const timer = setTimeout(() => {
        speakCurrentQuestion();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentProblem, speakCurrentQuestion, feedback]);

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
    // Save current canvas state before navigating
    const canvas = canvasRef.current;
    const canvasImageData = canvas ? canvas.toDataURL() : null;
    
    nextProblem(lastAnswer, lastAnswer, canvasImageData);
    
    // Clear the canvas for the next problem
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#1a3a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setLastAnswer(null);
  }, [nextProblem, lastAnswer]);

  const handlePrev = useCallback(() => {
    const result = prevProblem();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (result) {
      // Restore the last answer if available
      setLastAnswer(result.lastAnswer);
      // Note: feedback is already restored by the hook
      
      // Restore the canvas drawing if available
      if (ctx && canvas && result.canvasImageData) {
        const img = new Image();
        img.onload = () => {
          // Clear canvas first
          ctx.fillStyle = '#1a3a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw the saved image
          ctx.drawImage(img, 0, 0);
        };
        img.src = result.canvasImageData;
      } else if (ctx && canvas) {
        // No saved drawing, clear the canvas
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      setLastAnswer(null);
      // Clear the canvas
      if (ctx && canvas) {
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [prevProblem]);

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

  const handleAudioChange = useCallback((type: 'correct' | 'wrong', audio: string | null) => {
    setCustomAudio(prev => ({ ...prev, [type]: audio }));
  }, []);

  const handleClearCanvas = useCallback(() => {
    setLastAnswer(null);
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

  return (
    <div className="min-h-screen gradient-warm py-4 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🧮</span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Mathe-Spaß
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

        {/* Chalkboard */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Chalkboard problem={currentProblem} />
            <button
              onClick={speakCurrentQuestion}
              className="btn-bounce bg-btn-blue text-white p-2 sm:p-3 rounded-full shadow-fun-sm hover:bg-btn-blue/90 transition-all flex-shrink-0"
              title="Frage nochmal hören"
              aria-label="Frage nochmal hören"
            >
              <span className="text-xl sm:text-2xl">🔊</span>
            </button>
          </div>
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
        <div className="flex justify-center mb-6">
          <GameButton
            variant="check"
            onClick={handleCheck}
            disabled={isProcessing || isRecognizing}
            isLoading={isProcessing || isRecognizing}
          />
        </div>

        {/* Navigation Buttons - Always visible to allow navigation between questions */}
        <div className="flex justify-center gap-4 mb-6">
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
        customAudio={customAudio}
        onAudioChange={handleAudioChange}
        currentAge={childAge}
        onAgeChange={handleAgeChange}
      />
    </div>
  );
};

export default MathGame;
