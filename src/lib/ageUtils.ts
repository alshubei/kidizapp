import { Difficulty, AgeRange } from '@/types/game';

/**
 * Maps age to appropriate difficulty level
 * Note: Math game is for ages 6-10
 */
export const getDifficultyFromAge = (age: AgeRange): Difficulty => {
  if (age <= 8) return 'medium';
  return 'hard';
};

/**
 * Gets age-appropriate problem constraints
 * Note: Math game is for ages 6-10 (though shape game is for 3-6)
 */
export const getAgeConstraints = (age: AgeRange) => {
  if (age <= 7) {
    // Ages 6-7: Very simple, addition only, numbers 1-10
    return {
      max1: 10,
      max2: 10,
      allowSubtraction: false, // Addition only for youngest
      minAnswer: 1,
      maxAnswer: 20,
    };
  } else if (age === 8) {
    // Age 8: Simple, mostly addition, some subtraction, numbers 1-12
    return {
      max1: 12,
      max2: 8,
      allowSubtraction: true,
      minAnswer: 1,
      maxAnswer: 20,
    };
  } else if (age === 9) {
    // Age 9: Medium, addition/subtraction, numbers 1-15
    return {
      max1: 15,
      max2: 10,
      allowSubtraction: true,
      minAnswer: 1,
      maxAnswer: 25,
    };
  } else {
    // Age 10: Medium-hard, addition/subtraction, numbers 1-20
    return {
      max1: 20,
      max2: 15,
      allowSubtraction: true,
      minAnswer: 1,
      maxAnswer: 30,
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

