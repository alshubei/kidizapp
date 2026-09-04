import React from 'react';

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
        min-w-[4.5rem] px-3 py-2
        rounded-full font-bold text-2xl sm:text-3xl
        shadow-fun-sm
        ${urgent ? 'bg-destructive text-white animate-pulse' : 'bg-btn-yellow text-foreground'}
      `}
    >
      <span aria-hidden="true">⏰</span>
      <span>{secondsLeft}</span>
    </div>
  );
};
