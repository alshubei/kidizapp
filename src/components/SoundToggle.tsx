import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ isMuted, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="bg-white/80 p-1.5 rounded-full shadow-sm flex items-center justify-center transition-all hover:bg-white"
      title={isMuted ? 'Ton einschalten' : 'Ton ausschalten'}
      aria-label={isMuted ? 'Ton einschalten' : 'Ton ausschalten'}
    >
      {isMuted ? (
        <VolumeX className="w-3.5 h-3.5 text-[#2D3561]" strokeWidth={2.25} />
      ) : (
        <Volume2 className="w-3.5 h-3.5 text-[#2D3561]" strokeWidth={2.25} />
      )}
    </button>
  );
};
