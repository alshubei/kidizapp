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
      fixed inset-0 z-50 flex items-center justify-center
      ${isCorrect ? 'bg-success/30' : 'bg-destructive/30'}
      backdrop-blur-md
    `}>
      {/* Animated background cover */}
      <div className={`
        absolute inset-0
        ${isCorrect ? 'bg-success/40' : 'bg-destructive/40'}
        animate-slide-cover
      `} />
      
      {/* Main content container - takes half to full screen */}
      <div className={`
        relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[90vw] sm:max-w-2xl
        flex flex-col items-center justify-center
        ${isCorrect ? 'bg-gradient-to-br from-success/95 to-success/80' : 'bg-gradient-to-br from-destructive/95 to-destructive/80'}
        backdrop-blur-xl
        shadow-2xl
        ${isCorrect ? 'animate-pop-in-correct' : 'animate-pop-in-wrong'}
        border-8
        ${isCorrect ? 'border-success' : 'border-destructive'}
        rounded-3xl sm:rounded-[3rem]
        p-8 sm:p-12
        overflow-hidden
      `}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className={`
            absolute -top-20 -right-20 w-64 h-64 rounded-full
            ${isCorrect ? 'bg-success/20' : 'bg-destructive/20'}
            blur-3xl animate-pulse-slow
          `} />
          <div className={`
            absolute -bottom-20 -left-20 w-64 h-64 rounded-full
            ${isCorrect ? 'bg-success/20' : 'bg-destructive/20'}
            blur-3xl animate-pulse-slow
            animation-delay-1000
          `} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8">
          {/* Image - larger on full screen */}
          <div className="mb-2 sm:mb-4">
            <img
              src={image}
              alt={isCorrect ? 'Richtig!' : 'Falsch!'}
              className={`
                w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80
                mx-auto object-contain
                rounded-3xl sm:rounded-[2rem]
                ${isCorrect ? 'animate-bounce-in-rotate' : 'animate-wobble'}
                drop-shadow-2xl
              `}
            />
          </div>

          {/* Title */}
          <h2 className={`
            text-4xl sm:text-5xl md:text-6xl font-bold mb-2
            ${isCorrect ? 'text-white' : 'text-white'}
            drop-shadow-lg
            ${isCorrect ? 'animate-scale-bounce' : 'animate-shake'}
          `}>
            {isCorrect ? '🎉 Super!' : '😢 Ohh...'}
          </h2>

          {/* Message */}
          <p className={`
            text-xl sm:text-2xl md:text-3xl
            text-white/95
            font-semibold
            mb-4 sm:mb-6
            drop-shadow-md
            max-w-lg
          `}>
            {isCorrect 
              ? 'Das ist richtig! Du bist toll!' 
              : 'Das war leider falsch. Versuch es nochmal!'}
          </p>

          {/* Button */}
          <div className="mt-4 sm:mt-6">
            {isCorrect ? (
              <button
                onClick={onNext}
                className="
                  btn-bounce bg-white text-success font-bold 
                  py-5 px-10 sm:py-6 sm:px-12
                  rounded-2xl text-xl sm:text-2xl
                  shadow-2xl
                  hover:scale-110
                  active:scale-95
                  transition-all duration-200
                  border-4 border-success/50
                  min-w-[200px] sm:min-w-[250px]
                "
              >
                ➡️ Nächste Aufgabe
              </button>
            ) : (
              <button
                onClick={onRetry}
                className="
                  btn-bounce bg-white text-destructive font-bold 
                  py-5 px-10 sm:py-6 sm:px-12
                  rounded-2xl text-xl sm:text-2xl
                  shadow-2xl
                  hover:scale-110
                  active:scale-95
                  transition-all duration-200
                  border-4 border-destructive/50
                  min-w-[200px] sm:min-w-[250px]
                "
              >
                🔁 Nochmal versuchen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
