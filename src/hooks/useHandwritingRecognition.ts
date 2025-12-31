import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';

export const useHandwritingRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastRecognized, setLastRecognized] = useState<string>('');

  const recognizeDigit = useCallback(async (canvas: HTMLCanvasElement): Promise<number | null> => {
    setIsRecognizing(true);

    try {
      // Get the original canvas context to find drawing bounds
      const originalCtx = canvas.getContext('2d');
      if (!originalCtx) return null;

      const imageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Find the bounding box of the drawing (non-background pixels)
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let hasDrawing = false;

      // Check for non-background pixels (not the dark green background #1a3a1a)
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
          // Check if pixel is not the background color (dark green)
          // Background is approximately #1a3a1a (26, 58, 26)
          if (r > 50 || g > 70 || b > 50) {
            hasDrawing = true;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (!hasDrawing) return null;

      // Add padding around the bounding box
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      const width = maxX - minX;
      const height = maxY - minY;

      // Create a cropped canvas with just the drawing
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) return null;

      croppedCanvas.width = width;
      croppedCanvas.height = height;

      // Extract the drawing region
      const croppedImageData = originalCtx.getImageData(minX, minY, width, height);
      croppedCtx.putImageData(croppedImageData, 0, 0);

      // Create processed canvas with normalized size for OCR
      // Target size: at least 200px height for better recognition
      const targetHeight = Math.max(200, height * 2);
      const aspectRatio = width / height;
      const targetWidth = targetHeight * aspectRatio;

      const processedCanvas = document.createElement('canvas');
      const processedCtx = processedCanvas.getContext('2d');
      if (!processedCtx) return null;

      processedCanvas.width = targetWidth;
      processedCanvas.height = targetHeight;

      // White background
      processedCtx.fillStyle = 'white';
      processedCtx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw the cropped image scaled to target size
      processedCtx.drawImage(croppedCanvas, 0, 0, targetWidth, targetHeight);

      // Process the image: convert to grayscale and apply threshold
      const processedImageData = processedCtx.getImageData(0, 0, targetWidth, targetHeight);
      const processedData = processedImageData.data;

      for (let i = 0; i < processedData.length; i += 4) {
        // Convert to grayscale
        const gray = processedData[i] * 0.299 + processedData[i + 1] * 0.587 + processedData[i + 2] * 0.114;
        
        // Apply threshold - anything darker than 200 becomes black, else white
        const threshold = 200;
        const value = gray < threshold ? 0 : 255;
        
        processedData[i] = value;     // R
        processedData[i + 1] = value; // G
        processedData[i + 2] = value; // B
        // Alpha stays the same
      }

      processedCtx.putImageData(processedImageData, 0, 0);

      // Use Tesseract with better configuration for single digits
      const result = await Tesseract.recognize(
        processedCanvas.toDataURL(),
        'eng',
        {
          logger: () => {},
          tessedit_char_whitelist: '0123456789',
        }
      );

      const text = result.data.text.trim();
      setLastRecognized(text);

      // Extract numbers from the recognized text
      const numbers = text.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // Take the first digit found (for single digit answers)
        const firstNumber = numbers[0];
        const recognized = parseInt(firstNumber[0], 10); // Get first digit only
        if (!isNaN(recognized) && recognized >= 0 && recognized <= 9) {
          return recognized;
        }
      }

      return null;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, []);

  return {
    recognizeDigit,
    isRecognizing,
    lastRecognized,
  };
};
