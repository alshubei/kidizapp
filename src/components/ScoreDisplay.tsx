import React from 'react';

interface ScoreDisplayProps {
  score: number;
  streak: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, streak }) => {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {/* Score */}
      <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-fun-sm">
        <span className="text-2xl star-glow">⭐</span>
        <span className="font-bold text-xl text-golden-foreground">
          {score}
        </span>
      </div>

      {/* Streak indicator */}
      {streak >= 2 && (
        <div className="flex items-center gap-1 bg-btn-pink/20 px-3 py-1 rounded-full animate-bounce-in">
          <span className="text-lg">🔥</span>
          <span className="font-bold text-btn-pink text-sm">
            {streak}x
          </span>
        </div>
      )}
    </div>
  );
};
