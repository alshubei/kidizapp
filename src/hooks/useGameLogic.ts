import { useState, useCallback } from 'react';
import { MathProblem, GameState, AgeRange } from '@/types/game';
import { getAgeConstraints } from '@/lib/ageUtils';

const generateProblem = (age: AgeRange): MathProblem => {
  const constraints = getAgeConstraints(age);
  
  const operator = constraints.allowSubtraction && Math.random() > 0.5 ? '-' : '+';
  let num1 = Math.floor(Math.random() * constraints.max1) + 1;
  let num2 = Math.floor(Math.random() * constraints.max2) + 1;

  // Ensure subtraction doesn't result in negative numbers
  if (operator === '-' && num2 > num1) {
    [num1, num2] = [num2, num1];
  }

  const answer = operator === '+' ? num1 + num2 : num1 - num2;

  return { num1, num2, operator, answer };
};

export const useGameLogic = (age: AgeRange) => {
  const [state, setState] = useState<GameState>({
    score: 0,
    streak: 0,
    currentProblem: generateProblem(age),
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
      currentProblem: generateProblem(age),
      feedback: 'none',
    }));
  }, [age]);

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
      currentProblem: generateProblem(age),
      feedback: 'none',
      isProcessing: false,
    });
  }, [age]);

  const updateAge = useCallback((newAge: AgeRange) => {
    setState(prev => ({
      ...prev,
      currentProblem: generateProblem(newAge),
    }));
  }, []);

  return {
    ...state,
    checkAnswer,
    nextProblem,
    retry,
    setProcessing,
    resetGame,
    updateAge,
  };
};
