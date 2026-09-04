import React from 'react';
import { Shape, ShapeType } from '@/types/game';

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

// SVG shape renderer
const renderShape = (type: ShapeType, color: string, size: number) => {
  const center = size / 2;
  const strokeWidth = Math.max(2, size / 16);
  
  switch (type) {
    case 'circle':
      return (
        <circle
          cx={center}
          cy={center}
          r={center - strokeWidth}
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'square':
      const squareSize = size - strokeWidth * 2;
      const squareOffset = strokeWidth;
      return (
        <rect
          x={squareOffset}
          y={squareOffset}
          width={squareSize}
          height={squareSize}
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
          rx={size * 0.1}
        />
      );
    case 'triangle':
      const triangleSize = center - strokeWidth;
      const points = [
        `${center},${strokeWidth}`,
        `${strokeWidth},${size - strokeWidth}`,
        `${size - strokeWidth},${size - strokeWidth}`
      ].join(' ');
      return (
        <polygon
          points={points}
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'star':
      const starPoints = 5;
      const outerRadius = center - strokeWidth;
      const innerRadius = outerRadius * 0.4;
      const starPointsArray: string[] = [];
      for (let i = 0; i < starPoints * 2; i++) {
        const angle = (i * Math.PI) / starPoints;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = center + radius * Math.cos(angle - Math.PI / 2);
        const y = center + radius * Math.sin(angle - Math.PI / 2);
        starPointsArray.push(`${x},${y}`);
      }
      return (
        <polygon
          points={starPointsArray.join(' ')}
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'heart':
      // Heart shape using path - simplified and more accurate
      const heartSize = center - strokeWidth;
      const heartTop = center - heartSize * 0.2;
      const heartBottom = center + heartSize * 0.8;
      return (
        <path
          d={`M ${center} ${heartTop}
             C ${center - heartSize * 0.4} ${heartTop - heartSize * 0.3}, ${center - heartSize * 0.7} ${center - heartSize * 0.1}, ${center - heartSize * 0.7} ${center + heartSize * 0.1}
             C ${center - heartSize * 0.7} ${center + heartSize * 0.3}, ${center} ${center + heartSize * 0.5}, ${center} ${center + heartSize * 0.6}
             C ${center} ${center + heartSize * 0.5}, ${center + heartSize * 0.7} ${center + heartSize * 0.3}, ${center + heartSize * 0.7} ${center + heartSize * 0.1}
             C ${center + heartSize * 0.7} ${center - heartSize * 0.1}, ${center + heartSize * 0.4} ${heartTop - heartSize * 0.3}, ${center} ${heartTop}
             Z`}
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'diamond':
      const diamondSize = center - strokeWidth;
      const diamondPoints = [
        `${center},${strokeWidth}`,
        `${size - strokeWidth},${center}`,
        `${center},${size - strokeWidth}`,
        `${strokeWidth},${center}`
      ].join(' ');
      return (
        <polygon
          points={diamondPoints}
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      );
    default:
      return <circle cx={center} cy={center} r={center - strokeWidth} fill={color} />;
  }
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
  // Ensure shape has a valid color
  if (!shape || !shape.color || !colorValues[shape.color]) {
    console.error('ShapeDisplay: Invalid or missing color:', shape);
    console.error('Shape type:', shape?.type, 'Shape color:', shape?.color);
  }
  
  // Get the color value, default to gray if invalid
  const color = shape?.color && colorValues[shape.color] 
    ? colorValues[shape.color] 
    : '#9ca3af';
  
  const sizeValue = size === 'sm' ? 64 : size === 'md' ? 96 : 128;
  
  const baseClasses = `
    ${sizeClasses[size]}
    flex items-center justify-center
    rounded-2xl
    transition-all duration-200
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
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox={`0 0 ${sizeValue} ${sizeValue}`}
        className="drop-shadow-lg"
      >
        {renderShape(shape?.type || 'circle', color, sizeValue)}
        {label != null && (
          <text
            x={sizeValue / 2}
            y={sizeValue / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#ffffff"
            stroke="#1f2937"
            strokeWidth={Math.max(2, sizeValue / 24)}
            paintOrder="stroke fill"
            fontSize={sizeValue * 0.48}
            fontWeight={800}
            style={{ fontFamily: 'system-ui, sans-serif', userSelect: 'none' }}
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
};

