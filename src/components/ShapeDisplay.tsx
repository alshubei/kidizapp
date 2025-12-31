import React from 'react';
import { Shape, ShapeType } from '@/types/game';
import { getShapeEmoji } from '@/lib/shapeGameUtils';

interface ShapeDisplayProps {
  shape: Shape;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16 text-3xl',
  md: 'w-24 h-24 text-5xl',
  lg: 'w-32 h-32 text-6xl',
};

const colorClasses: Record<string, string> = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-green-500',
  yellow: 'text-yellow-500',
  purple: 'text-purple-500',
  orange: 'text-orange-500',
};

export const ShapeDisplay: React.FC<ShapeDisplayProps> = ({
  shape,
  size = 'md',
  onClick,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
}) => {
  // Ensure shape has a valid color
  if (!shape?.color || !colorClasses[shape.color]) {
    console.error('ShapeDisplay: Invalid or missing color:', shape);
  }
  
  const baseClasses = `
    ${sizeClasses[size]}
    ${colorClasses[shape?.color] || 'text-gray-400'}
    flex items-center justify-center
    rounded-2xl
    transition-all duration-200
    ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''}
    ${isSelected ? 'ring-4 ring-btn-green scale-110' : ''}
    ${isCorrect ? 'ring-4 ring-success scale-110 animate-bounce-in' : ''}
    ${isWrong ? 'ring-4 ring-destructive animate-shake' : ''}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      <span className="drop-shadow-lg">{getShapeEmoji(shape.type)}</span>
    </div>
  );
};

