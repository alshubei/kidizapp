import React from 'react';
import { Shape, ShapeColor, ShapeType } from '@/types/game';
import { getShapeName } from '@/lib/shapeGameUtils';

const GRADIENTS: Record<ShapeColor, string> = {
  red: 'linear-gradient(135deg, #FF6B6B, #FF4757)',
  yellow: 'linear-gradient(135deg, #FFE66D, #FFD93D)',
  purple: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  blue: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
  green: 'linear-gradient(135deg, #34D399, #10B981)',
  orange: 'linear-gradient(135deg, #FB923C, #F97316)',
};

const colorValues: Record<ShapeColor, string> = {
  red: '#FF6B6B',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#FFD93D',
  purple: '#7C3AED',
  orange: '#F97316',
};

const lightText: Record<ShapeColor, boolean> = {
  red: true,
  blue: true,
  green: true,
  yellow: false,
  purple: true,
  orange: true,
};

const renderMiniShape = (type: ShapeType, color: string, size: number) => {
  const center = size / 2;
  const strokeWidth = Math.max(2, size / 16);
  switch (type) {
    case 'circle':
      return <circle cx={center} cy={center} r={center - strokeWidth} fill={color} />;
    case 'square': {
      const s = size - strokeWidth * 2;
      return <rect x={strokeWidth} y={strokeWidth} width={s} height={s} rx={size * 0.12} fill={color} />;
    }
    case 'triangle': {
      const points = `${center},${strokeWidth} ${strokeWidth},${size - strokeWidth} ${size - strokeWidth},${size - strokeWidth}`;
      return <polygon points={points} fill={color} />;
    }
    case 'star': {
      const outer = center - strokeWidth;
      const inner = outer * 0.4;
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const r = i % 2 === 0 ? outer : inner;
        pts.push(`${center + r * Math.cos(angle - Math.PI / 2)},${center + r * Math.sin(angle - Math.PI / 2)}`);
      }
      return <polygon points={pts.join(' ')} fill={color} />;
    }
    case 'heart': {
      const hs = center - strokeWidth;
      const top = center - hs * 0.2;
      return (
        <path
          d={`M ${center} ${top}
             C ${center - hs * 0.4} ${top - hs * 0.3}, ${center - hs * 0.7} ${center - hs * 0.1}, ${center - hs * 0.7} ${center + hs * 0.1}
             C ${center - hs * 0.7} ${center + hs * 0.3}, ${center} ${center + hs * 0.5}, ${center} ${center + hs * 0.6}
             C ${center} ${center + hs * 0.5}, ${center + hs * 0.7} ${center + hs * 0.3}, ${center + hs * 0.7} ${center + hs * 0.1}
             C ${center + hs * 0.7} ${center - hs * 0.1}, ${center + hs * 0.4} ${top - hs * 0.3}, ${center} ${top} Z`}
          fill={color}
        />
      );
    }
    case 'diamond': {
      const points = `${center},${strokeWidth} ${size - strokeWidth},${center} ${center},${size - strokeWidth} ${strokeWidth},${center}`;
      return <polygon points={points} fill={color} />;
    }
    default:
      return <circle cx={center} cy={center} r={center - strokeWidth} fill={color} />;
  }
};

interface ShapeOptionCardProps {
  shape: Shape;
  onClick?: () => void;
  isSelected?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  showLabel?: boolean;
}

export const ShapeOptionCard: React.FC<ShapeOptionCardProps> = ({
  shape,
  onClick,
  isSelected = false,
  isCorrect = false,
  isWrong = false,
  showLabel = true,
}) => {
  const color = shape.color;
  const fill = '#ffffff';
  const textLight = lightText[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-2xl p-5 text-center transition-all duration-200 active:scale-95
        ${onClick ? 'cursor-pointer hover:scale-[1.03]' : ''}
        ${isCorrect ? 'ring-4 ring-emerald-400 scale-105' : ''}
        ${isWrong ? 'ring-4 ring-red-400 animate-shake' : ''}
        ${isSelected && !isCorrect && !isWrong ? 'ring-4 ring-white/80 scale-105' : ''}
      `}
      style={{
        background: GRADIENTS[color],
        boxShadow: isSelected || isCorrect
          ? `0 2px 6px rgba(0,0,0,0.08), 0 0 0 4px ${colorValues[color]}33`
          : '0 2px 6px rgba(0,0,0,0.08)',
        border: isSelected || isCorrect ? `3px solid ${colorValues[color]}` : '3px solid transparent',
      }}
      aria-label={getShapeName(shape.type)}
    >
      <div className="flex justify-center mb-2">
        <svg width={56} height={56} viewBox="0 0 56 56" className="drop-shadow-sm">
          {renderMiniShape(shape.type, fill, 56)}
        </svg>
      </div>
      {showLabel && (
        <div
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: textLight ? '#fff' : '#555' }}
        >
          {getShapeName(shape.type)}
        </div>
      )}
    </button>
  );
};

interface HeroShapeProps {
  shape: Shape;
  size?: number;
}

export const HeroShape: React.FC<HeroShapeProps> = ({ shape, size = 100 }) => {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: GRADIENTS[shape.color],
        boxShadow: `0 4px 12px ${colorValues[shape.color]}4D`,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox={`0 0 ${size * 0.55} ${size * 0.55}`}>
        {renderMiniShape(shape.type, '#ffffff', size * 0.55)}
      </svg>
    </div>
  );
};

export { GRADIENTS, colorValues };
