import { useState, useCallback } from 'react';
import { ShapeGameState, ShapeChallenge, AgeRange } from '@/types/game';
import { generateShapeChallenge } from '@/lib/shapeGameUtils';

export const useShapeGameLogic = (age: AgeRange) => {
  const [state, setState] = useState<ShapeGameState>({
    score: 0,
    streak: 0,
    currentChallenge: generateShapeChallenge(age),
    feedback: 'none',
  });

  const checkAnswer = useCallback((userAnswer: number | any): boolean => {
    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(state.currentChallenge.correctAnswer);
    
    setState(prev => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    return isCorrect;
  }, [state.currentChallenge.correctAnswer]);

  const nextChallenge = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentChallenge: generateShapeChallenge(age),
      feedback: 'none',
    }));
  }, [age]);

  const retry = useCallback(() => {
    setState(prev => ({
      ...prev,
      feedback: 'none',
    }));
  }, []);

  const resetGame = useCallback(() => {
    setState({
      score: 0,
      streak: 0,
      currentChallenge: generateShapeChallenge(age),
      feedback: 'none',
    });
  }, [age]);

  const updateAge = useCallback((newAge: AgeRange) => {
    setState(prev => ({
      ...prev,
      currentChallenge: generateShapeChallenge(newAge),
    }));
  }, []);

  return {
    ...state,
    checkAnswer,
    nextChallenge,
    retry,
    resetGame,
    updateAge,
  };
};

