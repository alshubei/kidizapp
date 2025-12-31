import React from 'react';

interface GameButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant: 'check' | 'next' | 'retry' | 'settings';
  isLoading?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = ({
  onClick,
  disabled = false,
  variant,
  isLoading = false,
}) => {
  const variants = {
    check: {
      bg: 'bg-btn-green',
      text: '✨ Prüfen',
      icon: '✨',
    },
    next: {
      bg: 'bg-btn-blue',
      text: '➡️ Weiter',
      icon: '➡️',
    },
    retry: {
      bg: 'bg-btn-yellow',
      text: '🔁 Nochmal',
      icon: '🔁',
    },
    settings: {
      bg: 'bg-btn-purple',
      text: '⚙️ Einstellungen',
      icon: '⚙️',
    },
  };

  const config = variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        btn-bounce ${config.bg} text-white font-bold 
        py-3 sm:py-4 px-6 sm:px-8 rounded-2xl 
        text-lg sm:text-xl shadow-fun transition-all
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        flex items-center justify-center gap-2
      `}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Erkenne...</span>
        </>
      ) : (
        config.text
      )}
    </button>
  );
};
