import React from 'react';

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ isMuted, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="btn-bounce bg-card px-4 py-2 rounded-full shadow-fun-sm flex items-center gap-2 transition-all"
      title={isMuted ? 'Ton einschalten' : 'Ton ausschalten'}
    >
      <span className="text-xl">
        {isMuted ? '🔇' : '🔊'}
      </span>
      <span className="text-sm font-medium text-foreground/70 hidden sm:inline">
        {isMuted ? 'Stumm' : 'Ton an'}
      </span>
    </button>
  );
};
