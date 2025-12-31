import { Difficulty, AgeRange } from '@/types/game';

/**
 * Maps age to appropriate difficulty level
 * Note: Math game is only for ages 7-10
 */
export const getDifficultyFromAge = (age: AgeRange): Difficulty => {
  if (age <= 8) return 'medium';
  return 'hard';
};

/**
 * Gets age-appropriate problem constraints
 * Note: Math game is only for ages 7-10
 */
export const getAgeConstraints = (age: AgeRange) => {
  if (age <= 8) {
    // Ages 7-8: Medium, numbers 1-20
    return {
      max1: 20,
      max2: 10,
      allowSubtraction: true,
      minAnswer: 1,
      maxAnswer: 30,
    };
  } else {
    // Ages 9-10: Hard, numbers 1-50
    return {
      max1: 50,
      max2: 25,
      allowSubtraction: true,
      minAnswer: 1,
      maxAnswer: 75,
    };
  }
};

/**
 * Stores age in localStorage
 */
export const saveAgeToStorage = (age: AgeRange): void => {
  localStorage.setItem('childAge', age.toString());
};

/**
 * Retrieves age from localStorage
 */
export const getAgeFromStorage = (): AgeRange | null => {
  const stored = localStorage.getItem('childAge');
  if (stored) {
    const age = parseInt(stored, 10);
    if (age >= 3 && age <= 10) {
      return age as AgeRange;
    }
  }
  return null;
};

