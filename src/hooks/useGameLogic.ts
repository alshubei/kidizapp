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
  const [state, setState] = useState<GameState>({
    score: 0,
    streak: 0,
    currentProblem: generateProblem(age),
    feedback: 'none',
    isProcessing: false,
  });
  const [history, setHistory] = useState<ProblemHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

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

  return {
    ...state,
    checkAnswer,
    nextProblem,
    prevProblem,
    retry,
    setProcessing,
    resetGame,
    updateAge,
    hasPrevious: historyIndex >= 0,
  };
};
