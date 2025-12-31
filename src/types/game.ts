export interface MathProblem {
  num1: number;
  num2: number;
  operator: '+' | '-';
  answer: number;
}

export interface GameState {
  score: number;
  streak: number;
  currentProblem: MathProblem;
  feedback: 'none' | 'correct' | 'wrong';
  isProcessing: boolean;
}

export interface FeedbackImages {
  correct: string;
  wrong: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type AgeRange = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Shape game types
export type ShapeType = 'circle' | 'square' | 'triangle' | 'star' | 'heart' | 'diamond';
export type ShapeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Shape {
  type: ShapeType;
  color: ShapeColor;
}

export type ShapeGameType = 'match' | 'count' | 'find' | 'color-match';

export interface ShapeGameState {
  score: number;
  streak: number;
  currentChallenge: ShapeChallenge;
  feedback: 'none' | 'correct' | 'wrong';
}

export interface ShapeChallenge {
  type: ShapeGameType;
  question: string;
  shapes: Shape[];
  correctAnswer: number | Shape;
  options?: (number | Shape)[];
}
