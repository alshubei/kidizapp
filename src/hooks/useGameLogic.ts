import { useState, useCallback } from 'react';
import { MathProblem, GameState, Difficulty } from '@/types/game';

const generateProblem = (difficulty: Difficulty): MathProblem => {
  let max1: number, max2: number;
  
  switch (difficulty) {
    case 'easy':
      max1 = 10;
      max2 = 5;
      break;
    case 'medium':
      max1 = 20;
      max2 = 10;
      break;
    case 'hard':
      max1 = 50;
      max2 = 25;
      break;
  }

  const operator = Math.random() > 0.5 ? '+' : '-';
  let num1 = Math.floor(Math.random() * max1) + 1;
  let num2 = Math.floor(Math.random() * max2) + 1;

  // Ensure subtraction doesn't result in negative numbers
  if (operator === '-' && num2 > num1) {
    [num1, num2] = [num2, num1];
  }

  const answer = operator === '+' ? num1 + num2 : num1 - num2;

  return { num1, num2, operator, answer };
};

export const useGameLogic = (difficulty: Difficulty = 'easy') => {
  const [state, setState] = useState<GameState>({
    score: 0,
    streak: 0,
    currentProblem: generateProblem(difficulty),
    feedback: 'none',
    isProcessing: false,
  });

  const checkAnswer = useCallback((userAnswer: number): boolean => {
    const isCorrect = userAnswer === state.currentProblem.answer;
    
    setState(prev => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    return isCorrect;
  }, [state.currentProblem.answer]);

  const nextProblem = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentProblem: generateProblem(difficulty),
      feedback: 'none',
    }));
  }, [difficulty]);

  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      feedback: 'none',
    }));
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }));
  }, []);

  const resetGame = useCallback(() => {
    setState({
      score: 0,
      streak: 0,
      currentProblem: generateProblem(difficulty),
      feedback: 'none',
      isProcessing: false,
    });
  }, [difficulty]);

  return {
    ...state,
    checkAnswer,
    nextProblem,
    retry,
    setProcessing,
    resetGame,
  };
};
