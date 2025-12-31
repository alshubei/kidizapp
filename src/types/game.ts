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
