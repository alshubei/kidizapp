import { useState, useCallback } from 'react';

// Lightweight digit recognition using improved pattern matching
// This is fully offline, lightweight, and optimized for single digit recognition
// No external AI models or remote services required
export const useHandwritingRecognition = () => {
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastRecognized, setLastRecognized] = useState<string>('');

  // Improved pattern matching for digit recognition
  const recognizeDigitPattern = useCallback((imageData: ImageData): number | null => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Convert to binary (0 or 1) array
    const binary: number[][] = [];
    for (let y = 0; y < height; y++) {
      binary[y] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
        binary[y][x] = gray < 128 ? 1 : 0; // 1 = black, 0 = white
      }
    }

    // Calculate features for pattern matching
    const features = {
      centerMassX: 0,
      centerMassY: 0,
      totalPixels: 0,
      topHalf: 0,
      bottomHalf: 0,
      leftHalf: 0,
      rightHalf: 0,
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0,
      verticalLines: 0,
      horizontalLines: 0,
      holes: 0, // Closed loops
    };

    // Calculate center of mass and region densities
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (binary[y][x] === 1) {
          features.totalPixels++;
          features.centerMassX += x;
          features.centerMassY += y;

          // Region analysis
          if (y < height / 2) features.topHalf++;
          else features.bottomHalf++;
          if (x < width / 2) features.leftHalf++;
          else features.rightHalf++;

          // Quadrant analysis
          if (y < height / 2 && x < width / 2) features.topLeft++;
          else if (y < height / 2 && x >= width / 2) features.topRight++;
          else if (y >= height / 2 && x < width / 2) features.bottomLeft++;
          else features.bottomRight++;
        }
      }
    }

    if (features.totalPixels === 0) return null;

    features.centerMassX /= features.totalPixels;
    features.centerMassY /= features.totalPixels;

    // Detect vertical and horizontal lines
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (binary[y][x] === 1) {
          // Vertical line detection
          if (binary[y - 1][x] === 1 && binary[y + 1][x] === 1) {
            features.verticalLines++;
          }
          // Horizontal line detection
          if (binary[y][x - 1] === 1 && binary[y][x + 1] === 1) {
            features.horizontalLines++;
          }
        }
      }
    }

    // Simple hole detection (closed loops)
    // This is simplified - just check for areas with low connectivity
    const visited = new Set<string>();
    const checkHole = (startX: number, startY: number): boolean => {
      const stack = [[startX, startY]];
      const region: number[][] = [];
      
      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const key = `${x},${y}`;
        if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue;
        if (binary[y][x] === 0) continue;
        
        visited.add(key);
        region.push([x, y]);
        
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      
      return region.length > 10 && region.length < features.totalPixels * 0.3;
    };

    // Calculate additional features for better recognition
    const normalized = {
      centerX: features.centerMassX / width,
      centerY: features.centerMassY / height,
      aspectRatio: width / height,
      topRatio: features.topHalf / features.totalPixels,
      bottomRatio: features.bottomHalf / features.totalPixels,
      leftRatio: features.leftHalf / features.totalPixels,
      rightRatio: features.rightHalf / features.totalPixels,
      verticalRatio: features.verticalLines / features.totalPixels,
      horizontalRatio: features.horizontalLines / features.totalPixels,
      topLeftRatio: features.topLeft / features.totalPixels,
      topRightRatio: features.topRight / features.totalPixels,
      bottomLeftRatio: features.bottomLeft / features.totalPixels,
      bottomRightRatio: features.bottomRight / features.totalPixels,
    };

    // Calculate stroke density in different regions
    const topDensity = normalized.topRatio;
    const bottomDensity = normalized.bottomRatio;
    const leftDensity = normalized.leftRatio;
    const rightDensity = normalized.rightRatio;
    const verticalDensity = normalized.verticalRatio;
    const horizontalDensity = normalized.horizontalRatio;

    // Score-based recognition for better accuracy
    const scores: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

    // 0: Circular/oval shape, balanced, centered
    if (normalized.centerX > 0.35 && normalized.centerX < 0.65 && 
        normalized.centerY > 0.35 && normalized.centerY < 0.65) {
      scores[0] += 3;
      if (topDensity > 0.25 && bottomDensity > 0.25 && leftDensity > 0.25 && rightDensity > 0.25) {
        scores[0] += 2;
      }
      if (horizontalDensity > 0.1) scores[0] += 1;
    }

    // 1: Primarily vertical, minimal horizontal
    if (verticalDensity > 0.12 && horizontalDensity < 0.08) {
      scores[1] += 4;
      if (normalized.centerX > 0.3 && normalized.centerX < 0.7) scores[1] += 1;
    }
    if (topDensity > 0.2 && bottomDensity > 0.2 && leftDensity < 0.15 && rightDensity < 0.15) {
      scores[1] += 2;
    }

    // 2: Top curve, middle horizontal, bottom curve
    if (topDensity > 0.2 && bottomDensity > 0.2 && horizontalDensity > 0.08) {
      scores[2] += 3;
      if (normalized.topRightRatio > 0.15) scores[2] += 1;
      if (normalized.bottomLeftRatio > 0.15) scores[2] += 1;
    }
    if (normalized.centerY > 0.4 && normalized.centerY < 0.6) scores[2] += 1;

    // 3: Two similar curves (top and bottom)
    if (Math.abs(topDensity - bottomDensity) < 0.1 && topDensity > 0.2) {
      scores[3] += 3;
      if (rightDensity > leftDensity * 1.2) scores[3] += 2;
    }
    if (horizontalDensity > 0.1) scores[3] += 1;

    // 4: Vertical line with horizontal intersection
    if (verticalDensity > 0.08 && horizontalDensity > 0.08) {
      scores[4] += 2;
      if (normalized.topLeftRatio + normalized.topRightRatio > 0.25) scores[4] += 2;
      if (normalized.bottomLeftRatio < 0.1) scores[4] += 1;
    }
    if (leftDensity > 0.2 && rightDensity > 0.2) scores[4] += 1;

    // 5: Top horizontal, middle vertical, bottom curve
    if (topDensity > 0.22 && horizontalDensity > 0.1) {
      scores[5] += 3;
      if (normalized.centerY > 0.45) scores[5] += 1;
      if (normalized.bottomLeftRatio > 0.12) scores[5] += 1;
    }

    // 6: Bottom heavy with curve
    if (bottomDensity > topDensity * 1.15) {
      scores[6] += 3;
      if (normalized.bottomLeftRatio > 0.15) scores[6] += 2;
      if (leftDensity > 0.2) scores[6] += 1;
      if (horizontalDensity > 0.08) scores[6] += 1;
    }

    // 7: Top heavy, minimal bottom
    if (topDensity > 0.25 && bottomDensity < 0.15) {
      scores[7] += 4;
      if (normalized.topRightRatio > 0.15) scores[7] += 1;
    }
    if (horizontalDensity > 0.1 && normalized.centerY < 0.5) scores[7] += 1;

    // 8: Two loops, balanced
    if (topDensity > 0.2 && bottomDensity > 0.2 && 
        leftDensity > 0.15 && rightDensity > 0.15) {
      scores[8] += 3;
      if (Math.abs(topDensity - bottomDensity) < 0.1) scores[8] += 2;
      if (horizontalDensity > 0.1) scores[8] += 1;
    }

    // 9: Top heavy with curve
    if (topDensity > bottomDensity * 1.15) {
      scores[9] += 3;
      if (normalized.topRightRatio > 0.15) scores[9] += 2;
      if (rightDensity > 0.2) scores[9] += 1;
      if (bottomDensity > 0.15 && normalized.bottomLeftRatio > 0.1) scores[9] += 1;
    }

    // Find the digit with highest score
    let maxScore = 0;
    let bestDigit: number | null = null;
    
    for (let digit = 0; digit <= 9; digit++) {
      if (scores[digit] > maxScore) {
        maxScore = scores[digit];
        bestDigit = digit;
      }
    }

    // Only return if we have a confident match (score >= 3)
    if (bestDigit !== null && maxScore >= 3) {
      return bestDigit;
    }

    // Fallback for very simple cases
    if (verticalDensity > 0.15 && horizontalDensity < 0.05) return 1;
    if (horizontalDensity > 0.15 && verticalDensity < 0.05) return 0;

    return null;
  }, []);

  const recognizeDigit = useCallback(async (canvas: HTMLCanvasElement): Promise<number | null> => {
    setIsRecognizing(true);

    try {
      // Get the original canvas context to find drawing bounds
      const originalCtx = canvas.getContext('2d');
      if (!originalCtx) return null;

      const imageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Find the bounding box of the drawing
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let hasDrawing = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          
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

      // Add padding
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      const width = maxX - minX;
      const height = maxY - minY;

      // Create processed canvas - normalize to 28x28 (MNIST standard)
      const targetSize = 28;
      const processedCanvas = document.createElement('canvas');
      const processedCtx = processedCanvas.getContext('2d');
      if (!processedCtx) return null;

      processedCanvas.width = targetSize;
      processedCanvas.height = targetSize;

      // White background
      processedCtx.fillStyle = 'white';
      processedCtx.fillRect(0, 0, targetSize, targetSize);

      // Draw and scale the cropped image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        const croppedImageData = originalCtx.getImageData(minX, minY, width, height);
        tempCtx.putImageData(croppedImageData, 0, 0);
        processedCtx.drawImage(tempCanvas, 0, 0, targetSize, targetSize);
      }

      // Convert to grayscale and invert (black on white)
      const processedImageData = processedCtx.getImageData(0, 0, targetSize, targetSize);
      const processedData = processedImageData.data;

      for (let i = 0; i < processedData.length; i += 4) {
        const gray = processedData[i] * 0.299 + processedData[i + 1] * 0.587 + processedData[i + 2] * 0.114;
        const inverted = 255 - gray;
        const value = inverted < 128 ? 0 : 255;
        
        processedData[i] = value;
        processedData[i + 1] = value;
        processedData[i + 2] = value;
      }

      processedCtx.putImageData(processedImageData, 0, 0);

      // Use pattern matching for recognition
      const recognized = recognizeDigitPattern(processedImageData);
      
      if (recognized !== null) {
        setLastRecognized(recognized.toString());
        return recognized;
      }

      return null;
    } catch (error) {
      console.error('Recognition error:', error);
      return null;
    } finally {
      setIsRecognizing(false);
    }
  }, [recognizeDigitPattern]);

  return {
    recognizeDigit,
    isRecognizing,
    lastRecognized,
  };
};
