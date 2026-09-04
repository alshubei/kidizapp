import React from 'react';
import { getPlayerName } from '@/lib/gameProgressStorage';

interface ScoreDisplayProps {
  score: number;
  streak: number;
  onLevelClick?: (level: number) => void;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, streak, onLevelClick }) => {
  const playerName = getPlayerName();
  const levels = Array.from({ length: score }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-fun-sm">
          <span className="font-bold text-xl text-golden-foreground">{score}</span>
        </div>

        {streak >= 2 && (
          <div className="flex items-center gap-1 bg-btn-pink/20 px-3 py-1 rounded-full animate-bounce-in">
            <span className="font-bold text-btn-pink text-sm">{streak}× Serie</span>
          </div>
        )}
      </div>

      {playerName && (
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-foreground">{playerName}</p>
        </div>
      )}

      {levels.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-4xl">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => onLevelClick?.(level)}
              className={`
                w-10 h-10 sm:w-12 sm:h-12
                flex items-center justify-center
                rounded-lg sm:rounded-xl
                font-bold text-sm sm:text-base
                transition-all duration-200
                bg-btn-blue text-white
                hover:bg-btn-blue/90 hover:scale-110 active:scale-95
                shadow-fun-sm
                ${onLevelClick ? 'cursor-pointer' : 'cursor-default'}
              `}
              title={`Level ${level}`}
            >
              {level}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
