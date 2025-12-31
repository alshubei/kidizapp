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
    const challenge = state.currentChallenge;
    let isCorrect = false;

    if (challenge.type === 'match') {
      // Match game: compare by type only (question asks to find by type)
      const userShape = userAnswer as { type: string; color: string };
      const correctShape = challenge.correctAnswer as { type: string; color: string };
      isCorrect = userShape.type === correctShape.type;
    } else if (challenge.type === 'color-match') {
      // Color-match game: compare by color only
      const userShape = userAnswer as { type: string; color: string };
      const correctShape = challenge.correctAnswer as { type: string; color: string };
      isCorrect = userShape.color === correctShape.color;
    } else if (challenge.type === 'find') {
      // Find game: compare by type only (question asks to find by type, e.g., "Klicke auf das ⭐!")
      const userShape = userAnswer as { type: string; color: string };
      const correctShape = challenge.correctAnswer as { type: string; color: string };
      isCorrect = userShape.type === correctShape.type;
    } else if (challenge.type === 'count') {
      // Count game: compare numbers
      isCorrect = userAnswer === challenge.correctAnswer;
    }
    
    setState(prev => ({
      ...prev,
      feedback: isCorrect ? 'correct' : 'wrong',
      score: isCorrect ? prev.score + 1 : prev.score,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    return isCorrect;
  }, [state.currentChallenge]);

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

