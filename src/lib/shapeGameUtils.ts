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
        question: `Finde das`,
        questionShape: targetShape,
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
      
      // Create a sample shape of the target type for display in question
      const sampleShape: Shape = { type: shapeType, color: COLORS[0] };
      return {
        type: 'count',
        question: `Wie viele`,
        questionShape: sampleShape,
        questionSuffix: 'siehst du?',
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
        question: `Finde das`,
        questionShape: targetShape,
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
        question: `Klicke auf das`,
        questionShape: targetShape,
        shapes,
        correctAnswer: targetShape,
      };
    } else {
      // color-match
      const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      const otherColors = COLORS.filter(c => c !== targetColor);
      const shapes: Shape[] = [];
      
      // Create one shape with target color (this is the correct answer)
      // Make sure we create a new object, not a reference
      const correctShape: Shape = { 
        type: SHAPES[Math.floor(Math.random() * SHAPES.length)], 
        color: targetColor 
      };
      shapes.push(correctShape);
      
      // Create exactly 5 other shapes with colors that are NOT the target color
      // Shuffle otherColors to get variety
      const shuffledOtherColors = [...otherColors].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 5; i++) {
        // Cycle through other colors, ensuring we don't use target color
        const otherColor = shuffledOtherColors[i % shuffledOtherColors.length];
        const otherShape: Shape = {
          type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          color: otherColor
        };
        shapes.push(otherShape);
      }
      
      // Verify exactly one shape has the target color before shuffling
      const shapesWithTargetColor = shapes.filter(s => s.color === targetColor);
      if (shapesWithTargetColor.length !== 1) {
        console.error('Color-match: Expected 1 shape with target color, found:', shapesWithTargetColor.length);
        console.error('Target color:', targetColor);
        console.error('All shapes:', shapes.map(s => ({ type: s.type, color: s.color })));
        // Regenerate to fix the issue
        return generateShapeChallenge(age);
      }
      
      // Shuffle the shapes array
      shapes.sort(() => Math.random() - 0.5);
      
      // Create a fresh copy of shapes array for options to avoid reference issues
      const options = shapes.map(s => ({ ...s }));
      
      // Final verification after shuffle
      const finalShapesWithTargetColor = shapes.filter(s => s.color === targetColor);
      if (finalShapesWithTargetColor.length !== 1) {
        console.error('Color-match: After shuffle, expected 1 shape with target color, found:', finalShapesWithTargetColor.length);
        return generateShapeChallenge(age);
      }
      
      // Create a sample shape with the target color for display in question
      const questionShape: Shape = {
        type: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: targetColor
      };
      
      const challenge = {
        type: 'color-match' as const,
        question: `Finde die ${getColorName(targetColor)}e Form`,
        questionShape: questionShape,
        questionSuffix: '!',
        shapes: shapes.map(s => ({ ...s })), // Create fresh copy
        correctAnswer: targetColor, // Store the target color as the answer
        options: options, // Use the fresh copy
      };
      
      // Debug log to verify challenge is created correctly
      console.log('Generated color-match challenge:', {
        targetColor,
        targetColorName: getColorName(targetColor),
        shapes: challenge.shapes.map(s => ({ type: s.type, color: s.color })),
        shapesWithTargetColor: challenge.shapes.filter(s => s.color === targetColor).length
      });
      
      return challenge;
    }
  }
};

