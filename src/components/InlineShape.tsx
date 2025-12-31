import React from 'react';
import { ShapeType, ShapeColor } from '@/types/game';

interface InlineShapeProps {
  type: ShapeType;
  color?: ShapeColor;
  size?: number;
}

const colorValues: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
};

// Render a small inline SVG shape
const renderInlineShape = (type: ShapeType, color: string, size: number) => {
  const center = size / 2;
  const strokeWidth = Math.max(1, size / 20);
  
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
      const heartSize = center - strokeWidth;
      const heartTop = center - heartSize * 0.2;
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

export const InlineShape: React.FC<InlineShapeProps> = ({ 
  type, 
  color, 
  size = 32 
}) => {
  const shapeColor = color && colorValues[color] ? colorValues[color] : '#6b7280';
  
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="inline-block align-middle mx-1"
      style={{ verticalAlign: 'middle' }}
    >
      {renderInlineShape(type, shapeColor, size)}
    </svg>
  );
};

