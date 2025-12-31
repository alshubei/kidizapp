import { Shape, ShapeType, ShapeColor, ShapeChallenge, ShapeGameType, AgeRange } from '@/types/game';

const SHAPES: ShapeType[] = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const COLORS: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

const SHAPE_EMOJIS: Record<ShapeType, string> = {
  circle: '⭕',
  square: '⬜',
  triangle: '🔺',
  star: '⭐',
  heart: '❤️',
  diamond: '💎',
};

const COLOR_NAMES: Record<ShapeColor, string> = {
  red: 'Rot',
  blue: 'Blau',
  green: 'Grün',
  yellow: 'Gelb',
  purple: 'Lila',
  orange: 'Orange',
};

export const getShapeEmoji = (shape: ShapeType): string => SHAPE_EMOJIS[shape];
export const getColorName = (color: ShapeColor): string => COLOR_NAMES[color];

export const createRandomShape = (): Shape => ({
  type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

export const createShapes = (count: number): Shape[] => {
  return Array.from({ length: count }, () => createRandomShape());
};

/**
 * Create shapes that exclude a specific shape type
 */
export const createShapesExcludingType = (count: number, excludeType: ShapeType): Shape[] => {
  const availableShapes = SHAPES.filter(s => s !== excludeType);
  return Array.from({ length: count }, () => ({
    type: availableShapes[Math.floor(Math.random() * availableShapes.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
};

/**
 * Generate age-appropriate shape challenges
 */
export const generateShapeChallenge = (age: AgeRange): ShapeChallenge => {
  // For ages 3-4: Very simple - matching and counting 1-3
  // For ages 5-6: Slightly harder - counting 1-5, finding shapes
  
  if (age <= 4) {
    // Ages 3-4: Simple matching and counting
    const gameType: ShapeGameType = Math.random() > 0.5 ? 'match' : 'count';
    
    if (gameType === 'match') {
      const targetShape = createRandomShape();
      const shapes = [targetShape, ...createShapes(2)];
      // Shuffle
      shapes.sort(() => Math.random() - 0.5);
      
      return {
        type: 'match',
        question: `Finde das ${getShapeEmoji(targetShape.type)}!`,
        shapes,
        correctAnswer: targetShape,
        options: shapes,
      };
    } else {
      // Count game
      const count = Math.floor(Math.random() * 3) + 1; // 1-3
      const shapeType = SHAPES[Math.floor(Math.random() * 3)]; // Simple shapes only
      const shapes: Shape[] = [];
      // Add exactly 'count' target shapes
      for (let i = 0; i < count; i++) {
        shapes.push({ type: shapeType, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      }
      // Add some other shapes (excluding the target type to avoid confusion)
      const otherShapes = createShapesExcludingType(5 - count, shapeType);
      shapes.push(...otherShapes);
      shapes.sort(() => Math.random() - 0.5);
      
      return {
        type: 'count',
        question: `Wie viele ${getShapeEmoji(shapeType)} siehst du?`,
        shapes,
        correctAnswer: count,
        options: [1, 2, 3, 4],
      };
    }
  } else {
    // Ages 5-6: More variety
    const gameTypes: ShapeGameType[] = ['match', 'count', 'find', 'color-match'];
    const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
    
    if (gameType === 'match') {
      const targetShape = createRandomShape();
      const shapes = [targetShape, ...createShapes(3)];
      shapes.sort(() => Math.random() - 0.5);
      
      return {
        type: 'match',
        question: `Finde das ${getShapeEmoji(targetShape.type)}!`,
        shapes,
        correctAnswer: targetShape,
        options: shapes,
      };
    } else if (gameType === 'count') {
      const count = Math.floor(Math.random() * 4) + 1; // 1-4
      const shapeType = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const shapes: Shape[] = [];
      // Add exactly 'count' target shapes
      for (let i = 0; i < count; i++) {
        shapes.push({ type: shapeType, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      }
      // Add some other shapes (excluding the target type to avoid confusion)
      const otherShapes = createShapesExcludingType(6 - count, shapeType);
      shapes.push(...otherShapes);
      shapes.sort(() => Math.random() - 0.5);
      
      return {
        type: 'count',
        question: `Wie viele ${getShapeEmoji(shapeType)} siehst du?`,
        shapes,
        correctAnswer: count,
        options: [1, 2, 3, 4, 5],
      };
    } else if (gameType === 'find') {
      const targetShape = createRandomShape();
      const shapes = createShapes(8);
      // Add target shape somewhere
      const targetIndex = Math.floor(Math.random() * shapes.length);
      shapes[targetIndex] = targetShape;
      
      return {
        type: 'find',
        question: `Klicke auf das ${getShapeEmoji(targetShape.type)}!`,
        shapes,
        correctAnswer: targetShape,
      };
    } else {
      // color-match
      const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shapes: Shape[] = [];
      // Create one shape with target color (this is the correct answer)
      const correctShape: Shape = { 
        type: SHAPES[Math.floor(Math.random() * SHAPES.length)], 
        color: targetColor 
      };
      shapes.push(correctShape);
      // Add other shapes with different colors
      const otherShapes = createShapes(5);
      // Ensure other shapes don't have the target color
      otherShapes.forEach(shape => {
        if (shape.color === targetColor) {
          const otherColors = COLORS.filter(c => c !== targetColor);
          shape.color = otherColors[Math.floor(Math.random() * otherColors.length)];
        }
      });
      shapes.push(...otherShapes);
      shapes.sort(() => Math.random() - 0.5);
      
      return {
        type: 'color-match',
        question: `Finde die ${getColorName(targetColor)}e Form!`,
        shapes,
        correctAnswer: correctShape,
        options: shapes,
      };
    }
  }
};

