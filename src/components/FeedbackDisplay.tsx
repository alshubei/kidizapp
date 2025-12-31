import React from 'react';
import correctDefaultImg from '@/assets/correct-default.png';
import wrongDefaultImg from '@/assets/wrong-default.png';

interface FeedbackDisplayProps {
  type: 'correct' | 'wrong';
  customImages: {
    correct: string | null;
    wrong: string | null;
  };
  onNext: () => void;
  onRetry: () => void;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  type,
  customImages,
  onNext,
  onRetry,
}) => {
  const isCorrect = type === 'correct';
  const image = isCorrect 
    ? (customImages.correct || correctDefaultImg)
    : (customImages.wrong || wrongDefaultImg);

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center p-4
      ${isCorrect ? 'bg-success/20' : 'bg-destructive/20'}
      backdrop-blur-sm animate-bounce-in
    `}>
      <div className={`
        bg-card rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center
        shadow-2xl border-4
        ${isCorrect ? 'border-success' : 'border-destructive'}
        ${!isCorrect && 'animate-shake'}
      `}>
        <div className="mb-4">
          <img
            src={image}
            alt={isCorrect ? 'Richtig!' : 'Falsch!'}
            className="w-32 h-32 sm:w-40 sm:h-40 mx-auto object-contain animate-float"
          />
        </div>

        <h2 className={`
          text-2xl sm:text-3xl font-bold mb-2
          ${isCorrect ? 'text-success' : 'text-destructive'}
        `}>
          {isCorrect ? '🎉 Super!' : '😢 Ohh...'}
        </h2>

        <p className="text-foreground/80 mb-6 text-lg">
          {isCorrect 
            ? 'Das ist richtig! Du bist toll!' 
            : 'Das war leider falsch. Versuch es nochmal!'}
        </p>

        <div className="flex flex-col gap-3">
          {isCorrect ? (
            <button
              onClick={onNext}
              className="btn-bounce bg-btn-green text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-fun transition-all"
            >
              ➡️ Nächste Aufgabe
            </button>
          ) : (
            <button
              onClick={onRetry}
              className="btn-bounce bg-btn-blue text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-fun transition-all"
            >
              🔁 Nochmal versuchen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
