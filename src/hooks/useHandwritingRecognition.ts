import { useState, useCallback, useEffect } from 'react';
import { recognizeNumber, initializeModel } from '@/lib/digit-recognition';

/**
 * Handwriting recognition hook using ONNX model
 * Fully offline, high-accuracy digit recognition
 */
export const useHandwritingRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastRecognized, setLastRecognized] = useState<string>('');
  const [modelReady, setModelReady] = useState(false);

  // Initialize model on mount (optional - can be lazy loaded)
  useEffect(() => {
    // Lazy load model on first use instead of on mount
    // This reduces initial bundle size
  }, []);

  const recognizeDigit = useCallback(async (canvas: HTMLCanvasElement): Promise<number | null> => {
    setIsRecognizing(true);

    try {
      // Lazy load model if not ready
      if (!modelReady) {
        try {
          await initializeModel('/models/mnist.onnx');
          setModelReady(true);
        } catch (error) {
          console.error('Failed to load ONNX model:', error);
          console.warn('ONNX model not available. Please ensure:');
          console.warn('1. Model file exists at public/models/mnist.onnx');
          console.warn('2. Run: node scripts/download-mnist-model.js');
          return null;
        }
      }

      // Recognize number (handles both single and multi-digit)
      const numberStr = await recognizeNumber(canvas, '/models/mnist.onnx');
      
      if (numberStr) {
        setLastRecognized(numberStr);
        // For single digit, return the number
        const num = parseInt(numberStr, 10);
        return isNaN(num) ? null : num;
      }

      return null;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, [modelReady]);

  return {
    recognizeDigit,
    isRecognizing,
    lastRecognized,
  };
};
