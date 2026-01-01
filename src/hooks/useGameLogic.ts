import { useState, useCallback, useEffect } from 'react';
import { MathProblem, GameState, AgeRange } from '@/types/game';
import { getAgeConstraints } from '@/lib/ageUtils';
import { getGameProgress, saveGameProgress, getPlayerName } from '@/lib/gameProgressStorage';

const generateProblem = (age: AgeRange): MathProblem => {
  const constraints = getAgeConstraints(age);
  
  // Adjust subtraction probability based on age (younger = less subtraction)
  let subtractionProbability = 0;
  if (age === 8) {
    subtractionProbability = 0.3; // 30% chance for age 8
  } else if (age === 9) {
    subtractionProbability = 0.4; // 40% chance for age 9
  } else if (age === 10) {
    subtractionProbability = 0.5; // 50% chance for age 10
  }
  
  const operator = constraints.allowSubtraction && Math.random() < subtractionProbability ? '-' : '+';
  let num1 = Math.floor(Math.random() * constraints.max1) + 1;
  let num2 = Math.floor(Math.random() * constraints.max2) + 1;

  // Ensure subtraction doesn't result in negative numbers
  if (operator === '-' && num2 > num1) {
    [num1, num2] = [num2, num1];
  }

  // For addition, ensure answer doesn't exceed maxAnswer
  if (operator === '+') {
    const answer = num1 + num2;
    if (answer > constraints.maxAnswer) {
      // Reduce numbers to fit within maxAnswer
      const maxNum1 = Math.min(num1, constraints.maxAnswer - 1);
      const maxNum2 = constraints.maxAnswer - maxNum1;
      num1 = Math.floor(Math.random() * maxNum1) + 1;
      num2 = Math.floor(Math.random() * Math.min(maxNum2, constraints.max2)) + 1;
    }
  }

  const answer = operator === '+' ? num1 + num2 : num1 - num2;

  return { num1, num2, operator, answer };
};

interface ProblemHistory {
  problem: MathProblem;
  score: number;
  streak: number;
  selectedAnswer: number | null;
  feedback: 'none' | 'correct' | 'wrong';
  lastAnswer: number | null; // For handwriting recognition
  canvasImageData: string | null; // Canvas drawing as data URL
}

export const useGameLogic = (age: AgeRange) => {
  // Load saved progress if it exists (only on initial mount)
  const [state, setState] = useState<GameState>(() => {
    const savedProgress = getGameProgress();
    const playerName = getPlayerName();
    
    if (savedProgress && playerName && savedProgress.gameType === 'math') {
      // Load saved progress
      return {
        score: savedProgress.score,
        streak: savedProgress.streak,
        currentProblem: generateProblem(age),
        feedback: 'none',
        isProcessing: false,
      };
    }
    
    // Start fresh
    return {
      score: 0,
      streak: 0,
      currentProblem: generateProblem(age),
      feedback: 'none',
      isProcessing: false,
    };
  });
  const [history, setHistory] = useState<ProblemHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Save progress whenever score changes
  useEffect(() => {
    const playerName = getPlayerName();
    if (playerName) {
      saveGameProgress({
        playerName,
        score: state.score,
        streak: state.streak,
        gameType: 'math',
        lastUpdated: Date.now(),
      });
    }
  }, [state.score, state.streak]);

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

  const nextProblem = useCallback((selectedAnswer: number | null = null, lastAnswer: number | null = null, canvasImageData: string | null = null) => {
    setState(prev => {
      // Save current state to history before moving forward
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        problem: prev.currentProblem,
        score: prev.score,
        streak: prev.streak,
        selectedAnswer: selectedAnswer,
        feedback: prev.feedback,
        lastAnswer: lastAnswer,
        canvasImageData: canvasImageData,
      });
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return {
        ...prev,
        currentProblem: generateProblem(age),
        feedback: 'none',
      };
    });
  }, [age, history, historyIndex]);

  const prevProblem = useCallback(() => {
    if (historyIndex >= 0) {
      const prevState = history[historyIndex];
      setState({
        score: prevState.score,
        streak: prevState.streak,
        currentProblem: prevState.problem,
        feedback: prevState.feedback,
        isProcessing: false,
      });
      setHistoryIndex(historyIndex - 1);
      // Return the selected answer and feedback so the component can restore it
      return {
        selectedAnswer: prevState.selectedAnswer,
        feedback: prevState.feedback,
        lastAnswer: prevState.lastAnswer,
        canvasImageData: prevState.canvasImageData,
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
    setHistory([]);
    setHistoryIndex(-1);
  }, [age]);

  const updateAge = useCallback((newAge: AgeRange) => {
    setState(prev => ({
      ...prev,
      currentProblem: generateProblem(newAge),
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
        currentProblem: targetState.problem,
        feedback: targetState.feedback,
        isProcessing: false,
      });
      setHistoryIndex(targetIndex);
      return {
        selectedAnswer: targetState.selectedAnswer,
        feedback: targetState.feedback,
        lastAnswer: targetState.lastAnswer,
        canvasImageData: targetState.canvasImageData,
      };
    }
    return null;
  }, [history]);

  return {
    ...state,
    checkAnswer,
    nextProblem,
    prevProblem,
    retry,
    setProcessing,
    resetGame,
    updateAge,
    jumpToLevel,
    hasPrevious: historyIndex >= 0,
  };
};
