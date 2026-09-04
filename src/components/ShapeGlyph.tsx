import React from 'react';
import { ShapeType } from '@/types/game';

/** Geometric shapes used for younger kids. */
export const BASIC_SHAPE_TYPES: ShapeType[] = [
  'circle',
  'square',
  'triangle',
  'star',
  'heart',
  'diamond',
];

/** Common animals for age-5+ challenges. */
export const ANIMAL_SHAPE_TYPES: ShapeType[] = [
  'cat',
  'dog',
  'rabbit',
  'bear',
  'fox',
  'frog',
  'fish',
  'bird',
  'butterfly',
  'bee',
  'duck',
  'pig',
  'cow',
  'mouse',
  'lion',
  'panda',
  'chick',
  'turtle',
  'whale',
  'unicorn',
  'owl',
  'penguin',
  'monkey',
  'horse',
  'chicken',
  'snail',
  'ladybug',
  'octopus',
  'giraffe',
  'dragon',
];

export const isAnimalShape = (type: ShapeType): boolean =>
  ANIMAL_SHAPE_TYPES.includes(type);

export const SHAPE_EMOJIS: Record<ShapeType, string> = {
  circle: '⭕',
  square: '⬜',
  triangle: '🔺',
  star: '⭐',
  heart: '❤️',
  diamond: '💎',
  cat: '🐱',
  dog: '🐶',
  rabbit: '🐰',
  bear: '🐻',
  fox: '🦊',
  frog: '🐸',
  fish: '🐟',
  bird: '🐦',
  butterfly: '🦋',
  bee: '🐝',
  duck: '🦆',
  pig: '🐷',
  cow: '🐮',
  mouse: '🐭',
  lion: '🦁',
  panda: '🐼',
  chick: '🐤',
  turtle: '🐢',
  whale: '🐋',
  unicorn: '🦄',
  owl: '🦉',
  penguin: '🐧',
  monkey: '🐵',
  horse: '🐴',
  chicken: '🐔',
  snail: '🐌',
  ladybug: '🐞',
  octopus: '🐙',
  giraffe: '🦒',
  dragon: '🐉',
};

const renderGeoShape = (type: ShapeType, color: string, size: number) => {
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
        pts.push(
          `${center + r * Math.cos(angle - Math.PI / 2)},${center + r * Math.sin(angle - Math.PI / 2)}`
        );
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
      return null;
  }
};

interface ShapeGlyphProps {
  type: ShapeType;
  color: string;
  /** ViewBox / logical size for SVG geometry. */
  size?: number;
  className?: string;
}

/** Renders a geometric SVG or an animal emoji glyph. */
export const ShapeGlyph: React.FC<ShapeGlyphProps> = ({
  type,
  color,
  size = 64,
  className = '',
}) => {
  if (isAnimalShape(type)) {
    return (
      <span
        className={`leading-none select-none ${className}`}
        style={{ fontSize: size * 0.72, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.12))' }}
        aria-hidden="true"
      >
        {SHAPE_EMOJIS[type]}
      </span>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`drop-shadow-sm ${className}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
    >
      {renderGeoShape(type, color, size)}
    </svg>
  );
};
