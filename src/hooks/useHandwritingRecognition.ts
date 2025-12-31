import { useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';

export const useHandwritingRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastRecognized, setLastRecognized] = useState<string>('');

  const recognizeDigit = useCallback(async (canvas: HTMLCanvasElement): Promise<number | null> => {
    setIsRecognizing(true);

    try {
      // Create a preprocessed version of the canvas for better OCR
      const processedCanvas = document.createElement('canvas');
      const ctx = processedCanvas.getContext('2d');
      if (!ctx) return null;

      // Scale up for better recognition
      const scale = 2;
      processedCanvas.width = canvas.width * scale;
      processedCanvas.height = canvas.height * scale;

      // White background, black text for better OCR
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, processedCanvas.width, processedCanvas.height);
      
      // Draw the original canvas content scaled up
      ctx.drawImage(canvas, 0, 0, processedCanvas.width, processedCanvas.height);

      // Invert colors if needed (OCR works better with dark text on light background)
      const imageData = ctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale and invert
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const inverted = 255 - avg;
        data[i] = inverted;     // R
        data[i + 1] = inverted; // G
        data[i + 2] = inverted; // B
      }
      
      ctx.putImageData(imageData, 0, 0);

      const result = await Tesseract.recognize(
        processedCanvas.toDataURL(),
        'eng',
        {
          logger: () => {},
        }
      );

      const text = result.data.text.trim();
      setLastRecognized(text);

      // Extract numbers from the recognized text
      const numbers = text.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const recognized = parseInt(numbers[0], 10);
        if (!isNaN(recognized)) {
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
