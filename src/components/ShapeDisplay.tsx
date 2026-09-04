import React from 'react';
import { Shape } from '@/types/game';
import { ShapeGlyph } from '@/components/ShapeGlyph';

interface ShapeDisplayProps {
  shape: Shape;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  /** Number or label drawn in the middle of the shape (count answers). */
  label?: string | number;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const colorValues: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
};

export const ShapeDisplay: React.FC<ShapeDisplayProps> = ({
  shape,
  size = 'md',
  onClick,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  label,
}) => {
  if (!shape || !shape.color || !colorValues[shape.color]) {
    console.error('ShapeDisplay: Invalid or missing color:', shape);
  }

  const color =
    shape?.color && colorValues[shape.color] ? colorValues[shape.color] : '#9ca3af';

  const sizeValue = size === 'sm' ? 64 : size === 'md' ? 96 : 128;

  const baseClasses = `
    ${sizeClasses[size]}
    flex items-center justify-center
    rounded-2xl
    transition-all duration-200
    relative
    ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
    ${isSelected ? 'ring-4 ring-btn-green scale-110' : ''}
    ${isCorrect ? 'ring-4 ring-success scale-110 animate-bounce-in' : ''}
    ${isWrong ? 'ring-4 ring-destructive animate-shake' : ''}
  `;

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label != null ? `Zahl ${label}` : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="w-full h-full flex items-center justify-center p-[8%]">
        <ShapeGlyph type={shape?.type || 'circle'} color={color} size={sizeValue} className="w-full h-full" />
      </div>
      {label != null && (
        <span
          className="absolute inset-0 flex items-center justify-center font-extrabold text-white pointer-events-none"
          style={{
            fontSize: sizeValue * 0.48,
            textShadow: '0 0 3px #1f2937, 0 1px 2px #1f2937',
            fontFamily: 'system-ui, sans-serif',
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
