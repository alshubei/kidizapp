/**
 * Game progress storage utilities
 * Stores player name and game progress (score/level) in localStorage
 */

export interface GameProgress {
  playerName: string;
  score: number; // This represents the "level" - number of correct answers
  streak: number;
  gameType: 'shape' | 'math';
  lastUpdated: number; // Timestamp
}

const PLAYER_NAME_KEY = 'gamePlayerName';
const GAME_PROGRESS_KEY = 'gameProgress';

/**
 * Save player name to localStorage
 */
export const savePlayerName = (name: string): void => {
  localStorage.setItem(PLAYER_NAME_KEY, name.trim());
};

/**
 * Get player name from localStorage
 */
export const getPlayerName = (): string | null => {
  return localStorage.getItem(PLAYER_NAME_KEY);
};

/**
 * Clear player name from localStorage
 */
export const clearPlayerName = (): void => {
  localStorage.removeItem(PLAYER_NAME_KEY);
};

/**
 * Save game progress to localStorage
 */
export const saveGameProgress = (progress: GameProgress): void => {
  localStorage.setItem(GAME_PROGRESS_KEY, JSON.stringify(progress));
};

/**
 * Get game progress from localStorage
 */
export const getGameProgress = (): GameProgress | null => {
  const stored = localStorage.getItem(GAME_PROGRESS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as GameProgress;
    } catch (e) {
      console.error('Failed to parse game progress:', e);
      return null;
    }
  }
  return null;
};

/**
 * Clear game progress from localStorage
 */
export const clearGameProgress = (): void => {
  localStorage.removeItem(GAME_PROGRESS_KEY);
};

/**
 * Clear all game data (player name and progress)
 */
export const clearAllGameData = (): void => {
  clearPlayerName();
  clearGameProgress();
};

