import React from 'react';
import { ShapeType, ShapeColor, Shape } from '@/types/game';
import { getShapeDescription, getShapeName, getShapeNamePlural } from '@/lib/shapeGameUtils';
import { ShapeGlyph } from '@/components/ShapeGlyph';

interface InlineShapeProps {
  type: ShapeType;
  color?: ShapeColor;
  size?: number;
  usePlural?: boolean; // For count questions - use plural form without color
}

const colorValues: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
};

export const InlineShape: React.FC<InlineShapeProps> = ({
  type,
  color,
  size = 32,
  usePlural = false,
}) => {
  const shapeColor = color && colorValues[color] ? colorValues[color] : '#6b7280';

  const shape: Shape | null = color ? { type, color } : null;
  const ariaLabel = usePlural
    ? getShapeNamePlural(type)
    : shape
      ? getShapeDescription(shape)
      : getShapeName(type);

  return (
    <span
      className="inline-flex items-center justify-center align-middle mx-1"
      style={{ width: size, height: size, verticalAlign: 'middle' }}
      role="img"
      aria-label={ariaLabel}
    >
      <ShapeGlyph type={type} color={shapeColor} size={size} className="w-full h-full" />
    </span>
  );
};
