import React from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  secondsLeft: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ secondsLeft }) => {
  const urgent = secondsLeft <= 3;

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={`${secondsLeft} Sekunden`}
      className={`
        flex items-center justify-center gap-1
        min-w-[3.25rem] px-2.5 py-1
        rounded-full font-bold text-base
        shadow-sm
        ${urgent ? 'bg-destructive text-white animate-pulse' : 'bg-[#FFD93D] text-[#2D3561]'}
      `}
    >
      <Timer className="w-3.5 h-3.5" strokeWidth={2.25} aria-hidden="true" />
      <span>{secondsLeft}</span>
    </div>
  );
};
