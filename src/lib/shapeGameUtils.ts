import { Shape, ShapeType, ShapeColor, ShapeChallenge, ShapeGameType, AgeRange } from '@/types/game';
import {
  ANIMAL_SHAPE_TYPES,
  BASIC_SHAPE_TYPES,
  SHAPE_EMOJIS,
} from '@/components/ShapeGlyph';

const COLORS: ShapeColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

/** Seconds a kid has to tap the matching shapes on count questions. */
export const COUNT_QUESTION_SECONDS = 5;

const COLOR_NAMES: Record<ShapeColor, string> = {
  red: 'Rot',
  blue: 'Blau',
  green: 'Grün',
  yellow: 'Gelb',
  purple: 'Lila',
  orange: 'Orange',
};

const SHAPE_NAMES: Record<ShapeType, string> = {
  circle: 'Kreis',
  square: 'Quadrat',
  triangle: 'Dreieck',
  star: 'Stern',
  heart: 'Herz',
  diamond: 'Raute',
  cat: 'Katze',
  dog: 'Hund',
  rabbit: 'Hase',
  bear: 'Bär',
  fox: 'Fuchs',
  frog: 'Frosch',
  fish: 'Fisch',
  bird: 'Vogel',
  butterfly: 'Schmetterling',
  bee: 'Biene',
  duck: 'Ente',
  pig: 'Schwein',
  cow: 'Kuh',
  mouse: 'Maus',
  lion: 'Löwe',
  panda: 'Panda',
  chick: 'Küken',
  turtle: 'Schildkröte',
  whale: 'Wal',
  unicorn: 'Einhorn',
  owl: 'Eule',
  penguin: 'Pinguin',
  monkey: 'Affe',
  horse: 'Pferd',
  chicken: 'Huhn',
  snail: 'Schnecke',
  ladybug: 'Marienkäfer',
  octopus: 'Krake',
  giraffe: 'Giraffe',
  dragon: 'Drache',
};

const SHAPE_NAMES_PLURAL: Record<ShapeType, string> = {
  circle: 'Kreise',
  square: 'Quadrate',
  triangle: 'Dreiecke',
  star: 'Sterne',
  heart: 'Herzen',
  diamond: 'Rauten',
  cat: 'Katzen',
  dog: 'Hunde',
  rabbit: 'Hasen',
  bear: 'Bären',
  fox: 'Füchse',
  frog: 'Frösche',
  fish: 'Fische',
  bird: 'Vögel',
  butterfly: 'Schmetterlinge',
  bee: 'Bienen',
  duck: 'Enten',
  pig: 'Schweine',
  cow: 'Kühe',
  mouse: 'Mäuse',
  lion: 'Löwen',
  panda: 'Pandas',
  chick: 'Küken',
  turtle: 'Schildkröten',
  whale: 'Wale',
  unicorn: 'Einhörner',
  owl: 'Eulen',
  penguin: 'Pinguine',
  monkey: 'Affen',
  horse: 'Pferde',
  chicken: 'Hühner',
  snail: 'Schnecken',
  ladybug: 'Marienkäfer',
  octopus: 'Kraken',
  giraffe: 'Giraffen',
  dragon: 'Drachen',
};

/** German noun gender for color adjective endings. */
type Gender = 'm' | 'n' | 'f';

const SHAPE_GENDER: Record<ShapeType, Gender> = {
  circle: 'm',
  square: 'n',
  triangle: 'n',
  star: 'm',
  heart: 'n',
  diamond: 'f',
  cat: 'f',
  dog: 'm',
  rabbit: 'm',
  bear: 'm',
  fox: 'm',
  frog: 'm',
  fish: 'm',
  bird: 'm',
  butterfly: 'm',
  bee: 'f',
  duck: 'f',
  pig: 'n',
  cow: 'f',
  mouse: 'f',
  lion: 'm',
  panda: 'm',
  chick: 'n',
  turtle: 'f',
  whale: 'm',
  unicorn: 'n',
  owl: 'f',
  penguin: 'm',
  monkey: 'm',
  horse: 'n',
  chicken: 'n',
  snail: 'f',
  ladybug: 'm',
  octopus: 'f',
  giraffe: 'f',
  dragon: 'm',
};

export const getShapeEmoji = (shape: ShapeType): string => SHAPE_EMOJIS[shape];
export const getColorName = (color: ShapeColor): string => COLOR_NAMES[color];
export const getShapeName = (shape: ShapeType): string => SHAPE_NAMES[shape];
export const getShapeNamePlural = (shapeType: ShapeType): string => SHAPE_NAMES_PLURAL[shapeType];

/** Definite article for German questions: den / die / das */
export const getShapeArticleAccusative = (type: ShapeType): string => {
  const g = SHAPE_GENDER[type];
  if (g === 'm') return 'den';
  if (g === 'f') return 'die';
  return 'das';
};

const colorAdjectiveFor = (colorName: string, gender: Gender): string => {
  if (colorName === 'lila' || colorName === 'orange') return colorName;
  if (gender === 'm') {
    if (colorName === 'rot') return 'roter';
    if (colorName === 'blau') return 'blauer';
    if (colorName === 'grün') return 'grüner';
    if (colorName === 'gelb') return 'gelber';
  } else if (gender === 'n') {
    if (colorName === 'rot') return 'rotes';
    if (colorName === 'blau') return 'blaues';
    if (colorName === 'grün') return 'grünes';
    if (colorName === 'gelb') return 'gelbes';
  } else {
    if (colorName === 'rot') return 'rote';
    if (colorName === 'blau') return 'blaue';
    if (colorName === 'grün') return 'grüne';
    if (colorName === 'gelb') return 'gelbe';
  }
  return colorName;
};

export const getShapeDescription = (shape: Shape): string => {
  const shapeName = getShapeName(shape.type);
  const colorName = getColorName(shape.color).toLowerCase();
  const gender = SHAPE_GENDER[shape.type];
  return `${colorAdjectiveFor(colorName, gender)} ${shapeName}`;
};

const shapesForAge = (age: AgeRange): ShapeType[] => {
  if (age <= 4) return BASIC_SHAPE_TYPES;
  // Age 5+: geometry + animals
  return [...BASIC_SHAPE_TYPES, ...ANIMAL_SHAPE_TYPES];
};

export const createRandomShape = (pool: ShapeType[] = BASIC_SHAPE_TYPES): Shape => ({
  type: pool[Math.floor(Math.random() * pool.length)],
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

export const createShapes = (count: number, pool: ShapeType[] = BASIC_SHAPE_TYPES): Shape[] => {
  return Array.from({ length: count }, () => createRandomShape(pool));
};

export const createShapesExcludingType = (
  count: number,
  excludeType: ShapeType,
  pool: ShapeType[] = BASIC_SHAPE_TYPES
): Shape[] => {
  const available = pool.filter(s => s !== excludeType);
  const usePool = available.length > 0 ? available : pool;
  return Array.from({ length: count }, () => ({
    type: usePool[Math.floor(Math.random() * usePool.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
};

/**
 * Generate age-appropriate shape challenges.
 * Ages 3–4: basic geometry. Age 5+: geometry + common animals.
 */
export const generateShapeChallenge = (age: AgeRange): ShapeChallenge => {
  const pool = shapesForAge(age);

  if (age <= 4) {
    const gameType: ShapeGameType = Math.random() > 0.3 ? 'count' : 'match';

    if (gameType === 'match') {
      const targetShape = createRandomShape(pool);
      const shapes = [targetShape, ...createShapes(2, pool)];
      shapes.sort(() => Math.random() - 0.5);

      return {
        type: 'match',
        question: `Finde ${getShapeArticleAccusative(targetShape.type)}`,
        questionShape: targetShape,
        shapes,
        correctAnswer: targetShape,
        options: shapes,
      };
    }

    const count = Math.floor(Math.random() * 3) + 1;
    const simplePool = BASIC_SHAPE_TYPES.slice(0, 3);
    const shapeType = simplePool[Math.floor(Math.random() * simplePool.length)];
    const shapes: Shape[] = [];
    for (let i = 0; i < count; i++) {
      shapes.push({ type: shapeType, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }
    shapes.push(...createShapesExcludingType(5 - count, shapeType, pool));
    shapes.sort(() => Math.random() - 0.5);

    return {
      type: 'count',
      question: `Wie viele`,
      questionShape: { type: shapeType, color: COLORS[0] },
      questionSuffix: 'siehst du?',
      shapes,
      correctAnswer: count,
    };
  }

  // Age 5+: richer pool with animals; prefer animal targets often
  const gameTypes: ShapeGameType[] = ['match', 'count', 'find', 'color-match'];
  const gameType = gameTypes[Math.floor(Math.random() * gameTypes.length)];

  const pickTargetType = (): ShapeType => {
    // ~65% animals so the new set shows up often
    if (Math.random() < 0.65) {
      return ANIMAL_SHAPE_TYPES[Math.floor(Math.random() * ANIMAL_SHAPE_TYPES.length)];
    }
    return BASIC_SHAPE_TYPES[Math.floor(Math.random() * BASIC_SHAPE_TYPES.length)];
  };

  if (gameType === 'match') {
    const targetType = pickTargetType();
    const targetShape: Shape = {
      type: targetType,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    const distractors = createShapesExcludingType(3, targetType, pool);
    const shapes = [targetShape, ...distractors].sort(() => Math.random() - 0.5);

    return {
      type: 'match',
      question: `Finde ${getShapeArticleAccusative(targetType)}`,
      questionShape: targetShape,
      shapes,
      correctAnswer: targetShape,
      options: shapes,
    };
  }

  if (gameType === 'count') {
    const count = Math.floor(Math.random() * 4) + 1;
    const shapeType = pickTargetType();
    const shapes: Shape[] = [];
    for (let i = 0; i < count; i++) {
      shapes.push({ type: shapeType, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }
    shapes.push(...createShapesExcludingType(Math.max(2, 6 - count), shapeType, pool));
    shapes.sort(() => Math.random() - 0.5);

    return {
      type: 'count',
      question: `Wie viele`,
      questionShape: { type: shapeType, color: COLORS[0] },
      questionSuffix: 'siehst du?',
      shapes: shapes.slice(0, 6),
      correctAnswer: count,
    };
  }

  if (gameType === 'find') {
    const targetType = pickTargetType();
    const targetShape: Shape = {
      type: targetType,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    const shapes = createShapesExcludingType(3, targetType, pool);
    shapes.push(targetShape);
    shapes.sort(() => Math.random() - 0.5);

    return {
      type: 'find',
      question: `Klicke auf ${getShapeArticleAccusative(targetType)}`,
      questionShape: targetShape,
      shapes,
      correctAnswer: targetShape,
    };
  }

  // color-match — geometry only so the answer color is unambiguous (emojis keep fixed colors)
  const geoPool = BASIC_SHAPE_TYPES;
  const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  const otherColors = COLORS.filter(c => c !== targetColor);
  const shapes: Shape[] = [
    {
      type: geoPool[Math.floor(Math.random() * geoPool.length)],
      color: targetColor,
    },
  ];
  const shuffledOtherColors = [...otherColors].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3; i++) {
    shapes.push({
      type: geoPool[Math.floor(Math.random() * geoPool.length)],
      color: shuffledOtherColors[i % shuffledOtherColors.length],
    });
  }
  shapes.sort(() => Math.random() - 0.5);

  if (shapes.filter(s => s.color === targetColor).length !== 1) {
    return generateShapeChallenge(age);
  }

  const options = shapes.map(s => ({ ...s }));
  return {
    type: 'color-match',
    question: `Finde die ${getColorName(targetColor)}e Form`,
    questionShape: {
      type: geoPool[Math.floor(Math.random() * geoPool.length)],
      color: targetColor,
    },
    questionSuffix: '!',
    shapes: shapes.map(s => ({ ...s })),
    correctAnswer: targetColor,
    options,
  };
};
