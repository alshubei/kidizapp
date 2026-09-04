import React from 'react';
import { Shape, ShapeColor, ShapeType } from '@/types/game';
import { getShapeName } from '@/lib/shapeGameUtils';

const colorValues: Record<ShapeColor, string> = {
  red: '#FF6B6B',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#EAB308',
  purple: '#7C3AED',
  orange: '#F97316',
};

const FRAME_BG = '#F7F4FB';
const FRAME_BORDER = '#E8E0F5';

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
  const fill = colorValues[shape.color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full h-full min-h-0 min-w-0 rounded-xl text-center transition-all duration-200 active:scale-95
        flex flex-col items-center justify-center gap-0.5 p-1.5
        ${onClick ? 'cursor-pointer hover:scale-[1.03]' : ''}
        ${isCorrect ? 'ring-[3px] ring-emerald-400' : ''}
        ${isWrong ? 'ring-[3px] ring-red-400 animate-shake' : ''}
        ${isSelected && !isCorrect && !isWrong ? 'ring-[3px] ring-[#7C3AED]/40' : ''}
      `}
      style={{
        background: FRAME_BG,
        boxShadow: isSelected || isCorrect
          ? `0 2px 6px rgba(45,53,97,0.08), 0 0 0 3px ${fill}33`
          : '0 2px 6px rgba(45,53,97,0.06)',
        border: isSelected || isCorrect ? `2px solid ${fill}` : `2px solid ${FRAME_BORDER}`,
      }}
      aria-label={getShapeName(shape.type)}
    >
      <svg
        viewBox="0 0 64 64"
        className={`drop-shadow-sm ${showLabel ? 'w-[70%] h-[70%]' : 'w-[80%] h-[80%]'}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {renderMiniShape(shape.type, fill, 64)}
      </svg>
      {showLabel && (
        <div
          className="text-[10px] font-bold uppercase tracking-wide leading-none shrink-0"
          style={{ color: '#2D3561' }}
        >
          {getShapeName(shape.type)}
        </div>
      )}
    </button>
  );
};

/** Square cells + identical row/column gaps (table-like); fits without scrolling. */
export const ShapeGrid: React.FC<{
  count: number;
  children: React.ReactNode;
  cols?: number;
}> = ({ count, children, cols = 2 }) => {
  const rows = Math.max(1, Math.ceil(count / cols));
  const gapPx = 4;

  return (
    <div
      className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden"
      style={{ containerType: 'size' }}
    >
      <div
        className="grid"
        style={{
          gap: gapPx,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          aspectRatio: `${cols} / ${rows}`,
          width: `min(100cqw, calc((100cqh - ${(rows - 1) * gapPx}px) * ${cols} / ${rows} + ${(cols - 1) * gapPx}px))`,
          height: `min(100cqh, calc((100cqw - ${(cols - 1) * gapPx}px) * ${rows} / ${cols} + ${(rows - 1) * gapPx}px))`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

interface HeroShapeProps {
  shape: Shape;
  size?: number;
}

export const HeroShape: React.FC<HeroShapeProps> = ({ shape, size = 100 }) => {
  const fill = colorValues[shape.color];
  const inner = size * 0.72;

  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 aspect-square"
      style={{
        width: size,
        height: size,
        background: FRAME_BG,
        border: `2px solid ${FRAME_BORDER}`,
        boxShadow: '0 2px 8px rgba(45,53,97,0.06)',
      }}
    >
      <svg width={inner} height={inner} viewBox={`0 0 ${inner} ${inner}`}>
        {renderMiniShape(shape.type, fill, inner)}
      </svg>
    </div>
  );
};

export { colorValues };
