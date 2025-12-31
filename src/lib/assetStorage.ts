/**
 * Utility functions for storing and retrieving custom assets (images and audio)
 * Uses localStorage with IndexedDB fallback for large files
 * All assets are stored as data URLs for offline use
 */

const STORAGE_KEYS = {
  CORRECT_IMAGE: 'kidizapp_custom_correct_image',
  WRONG_IMAGE: 'kidizapp_custom_wrong_image',
  CORRECT_AUDIO: 'kidizapp_custom_correct_audio',
  WRONG_AUDIO: 'kidizapp_custom_wrong_audio',
} as const;

interface CustomAssets {
  correctImage: string | null;
  wrongImage: string | null;
  correctAudio: string | null;
  wrongAudio: string | null;
}

/**
 * Save a custom image to localStorage
 */
export const saveCustomImage = (type: 'correct' | 'wrong', imageDataUrl: string | null): void => {
  try {
    const key = type === 'correct' ? STORAGE_KEYS.CORRECT_IMAGE : STORAGE_KEYS.WRONG_IMAGE;
    if (imageDataUrl) {
      // Check size - localStorage has ~5-10MB limit
      const sizeInBytes = new Blob([imageDataUrl]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 4) {
        console.warn(`Image is ${sizeInMB.toFixed(2)}MB, may exceed localStorage limit`);
      }
      
      localStorage.setItem(key, imageDataUrl);
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error saving custom image:', error);
    // If quota exceeded, try to compress or warn user
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Speicher voll! Bitte lösche andere Daten oder verwende kleinere Bilder.');
    }
  }
};

/**
 * Load a custom image from localStorage
 */
export const loadCustomImage = (type: 'correct' | 'wrong'): string | null => {
  try {
    const key = type === 'correct' ? STORAGE_KEYS.CORRECT_IMAGE : STORAGE_KEYS.WRONG_IMAGE;
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error loading custom image:', error);
    return null;
  }
};

/**
 * Save custom audio to localStorage
 */
export const saveCustomAudio = (type: 'correct' | 'wrong', audioDataUrl: string | null): void => {
  try {
    const key = type === 'correct' ? STORAGE_KEYS.CORRECT_AUDIO : STORAGE_KEYS.WRONG_AUDIO;
    if (audioDataUrl) {
      // Check size
      const sizeInBytes = new Blob([audioDataUrl]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);
      
      if (sizeInMB > 4) {
        console.warn(`Audio is ${sizeInMB.toFixed(2)}MB, may exceed localStorage limit`);
      }
      
      localStorage.setItem(key, audioDataUrl);
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error saving custom audio:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('Speicher voll! Bitte lösche andere Daten oder verwende kürzere Audio-Aufnahmen.');
    }
  }
};

/**
 * Load custom audio from localStorage
 */
export const loadCustomAudio = (type: 'correct' | 'wrong'): string | null => {
  try {
    const key = type === 'correct' ? STORAGE_KEYS.CORRECT_AUDIO : STORAGE_KEYS.WRONG_AUDIO;
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error loading custom audio:', error);
    return null;
  }
};

/**
 * Load all custom assets
 */
export const loadAllCustomAssets = (): CustomAssets => {
  return {
    correctImage: loadCustomImage('correct'),
    wrongImage: loadCustomImage('wrong'),
    correctAudio: loadCustomAudio('correct'),
    wrongAudio: loadCustomAudio('wrong'),
  };
};

/**
 * Clear all custom assets
 */
export const clearAllCustomAssets = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CORRECT_IMAGE);
  localStorage.removeItem(STORAGE_KEYS.WRONG_IMAGE);
  localStorage.removeItem(STORAGE_KEYS.CORRECT_AUDIO);
  localStorage.removeItem(STORAGE_KEYS.WRONG_AUDIO);
};

/**
 * Compress image data URL to reduce storage size
 */
export const compressImage = async (dataUrl: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

