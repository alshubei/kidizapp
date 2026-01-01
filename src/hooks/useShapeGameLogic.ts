import { useState, useCallback, useEffect } from 'react';
import { ShapeGameState, ShapeChallenge, AgeRange, Shape } from '@/types/game';
import { generateShapeChallenge } from '@/lib/shapeGameUtils';
import { getGameProgress, saveGameProgress, getPlayerName } from '@/lib/gameProgressStorage';

interface ChallengeHistory {
  challenge: ShapeChallenge;
  score: number;
  streak: number;
  selectedAnswer: number | Shape | null;
  feedback: 'none' | 'correct' | 'wrong';
}

export const useShapeGameLogic = (age: AgeRange) => {
  // Load saved progress if it exists (only on initial mount)
  const [state, setState] = useState<ShapeGameState>(() => {
    const savedProgress = getGameProgress();
    const playerName = getPlayerName();
    
    if (savedProgress && playerName && savedProgress.gameType === 'shape') {
      // Load saved progress
      return {
        score: savedProgress.score,
        streak: savedProgress.streak,
        currentChallenge: generateShapeChallenge(age),
        feedback: 'none',
      };
    }
    
    // Start fresh
    return {
      score: 0,
      streak: 0,
      currentChallenge: generateShapeChallenge(age),
      feedback: 'none',
    };
  });
  const [history, setHistory] = useState<ChallengeHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Save progress whenever score changes
  useEffect(() => {
    const playerName = getPlayerName();
    if (playerName) {
      saveGameProgress({
        playerName,
        score: state.score,
        streak: state.streak,
        gameType: 'shape',
        lastUpdated: Date.now(),
      });
    }
  }, [state.score, state.streak]);

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
      const userShape = userAnswer as Shape;
      const targetColor = challenge.correctAnswer as string; // correctAnswer is the target color string
      
      // Ensure userShape has a valid color property
      if (!userShape || typeof userShape.color !== 'string') {
        console.warn('Invalid shape in color-match answer:', userShape);
        isCorrect = false;
      } else {
        isCorrect = userShape.color === targetColor;
      }
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

  const nextChallenge = useCallback((selectedAnswer: number | Shape | null = null) => {
    setState(prev => {
      // Save current state to history before moving forward
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        challenge: prev.currentChallenge,
        score: prev.score,
        streak: prev.streak,
        selectedAnswer: selectedAnswer,
        feedback: prev.feedback,
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return {
        ...prev,
        currentChallenge: generateShapeChallenge(age),
        feedback: 'none',
      };
    });
  }, [age, history, historyIndex]);

  const prevChallenge = useCallback(() => {
    if (historyIndex >= 0) {
      const prevState = history[historyIndex];
      setState({
        score: prevState.score,
        streak: prevState.streak,
        currentChallenge: prevState.challenge,
        feedback: prevState.feedback,
      });
      setHistoryIndex(historyIndex - 1);
      // Return the selected answer and feedback so the component can restore it
      return {
        selectedAnswer: prevState.selectedAnswer,
        feedback: prevState.feedback,
      };
    }
    return null;
  }, [history, historyIndex]);

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
    setHistory([]);
    setHistoryIndex(-1);
  }, [age]);

  const updateAge = useCallback((newAge: AgeRange) => {
    setState(prev => ({
      ...prev,
      currentChallenge: generateShapeChallenge(newAge),
    }));
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const jumpToLevel = useCallback((level: number) => {
    // Level is 1-indexed, but history is 0-indexed
    // Level N means we've completed N challenges, so we want to go to history[N-1]
    const targetIndex = level - 1;
    if (targetIndex >= 0 && targetIndex < history.length) {
      const targetState = history[targetIndex];
      setState({
        score: targetState.score,
        streak: targetState.streak,
        currentChallenge: targetState.challenge,
        feedback: targetState.feedback,
      });
      setHistoryIndex(targetIndex);
      return {
        selectedAnswer: targetState.selectedAnswer,
        feedback: targetState.feedback,
      };
    }
    return null;
  }, [history]);

  return {
    ...state,
    checkAnswer,
    nextChallenge,
    prevChallenge,
    retry,
    resetGame,
    updateAge,
    jumpToLevel,
    hasPrevious: historyIndex >= 0,
  };
};

