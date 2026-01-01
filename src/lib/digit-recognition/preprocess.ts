/**
 * Canvas preprocessing for digit recognition
 * Converts canvas to MNIST-compatible 28x28 grayscale image
 */

export interface PreprocessedImage {
  data: Float32Array; // 28x28 = 784 values, normalized 0-1
  width: number;
  height: number;
}

/**
 * Convert canvas to grayscale ImageData
 */
function toGrayscale(imageData: ImageData): Uint8Array {
  const data = imageData.data;
  const gray = new Uint8Array(imageData.width * imageData.height);
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert RGB to grayscale using luminance formula
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const grayValue = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    gray[i / 4] = grayValue;
  }
  
  return gray;
}

/**
 * Apply binary thresholding (Otsu's method approximation)
 */
function threshold(gray: Uint8Array, width: number, height: number): Uint8Array {
  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) {
    histogram[gray[i]]++;
  }
  
  // Find optimal threshold (simplified Otsu)
  let sum = 0;
  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 128;
  
  const total = gray.length;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }
  
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    
    wF = total - wB;
    if (wF === 0) break;
    
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = t;
    }
  }
  
  // Apply threshold (invert: white background -> black digits)
  const binary = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    binary[i] = gray[i] < threshold ? 255 : 0; // Inverted: dark becomes white (digit)
  }
  
  return binary;
}

/**
 * Remove noise using morphological operations (simple erosion/dilation)
 */
function denoise(binary: Uint8Array, width: number, height: number): Uint8Array {
  const result = new Uint8Array(binary);
  
  // Simple median filter to remove small noise
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const neighbors = [
        binary[(y - 1) * width + x],
        binary[(y + 1) * width + x],
        binary[y * width + (x - 1)],
        binary[y * width + (x + 1)],
        binary[idx]
      ];
      
      // If isolated pixel, remove it
      const whiteCount = neighbors.filter(v => v === 255).length;
      if (whiteCount < 2) {
        result[idx] = 0;
      }
    }
  }
  
  return result;
}

/**
 * Find tight bounding box around digit
 */
function findBoundingBox(binary: Uint8Array, width: number, height: number): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasContent = false;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] === 255) { // White pixel (digit)
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (!hasContent) return null;
  
  // Add small padding
  const padding = 2;
  return {
    minX: Math.max(0, minX - padding),
    minY: Math.max(0, minY - padding),
    maxX: Math.min(width - 1, maxX + padding),
    maxY: Math.min(height - 1, maxY + padding)
  };
}

/**
 * Center digit in 28x28 canvas with aspect ratio preservation
 */
function centerAndResize(
  binary: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  targetSize: number = 28
): Float32Array {
  const croppedWidth = bbox.maxX - bbox.minX + 1;
  const croppedHeight = bbox.maxY - bbox.minY + 1;
  
  // Calculate scale to fit in target size with padding
  const scale = Math.min(
    (targetSize - 4) / croppedWidth,
    (targetSize - 4) / croppedHeight
  );
  
  const scaledWidth = Math.round(croppedWidth * scale);
  const scaledHeight = Math.round(croppedHeight * scale);
  
  // Center position
  const offsetX = Math.floor((targetSize - scaledWidth) / 2);
  const offsetY = Math.floor((targetSize - scaledHeight) / 2);
  
  // Create target array (black background)
  const result = new Float32Array(targetSize * targetSize);
  
  // Scale and center the digit
  for (let ty = 0; ty < scaledHeight; ty++) {
    for (let tx = 0; tx < scaledWidth; tx++) {
      const srcX = Math.floor(tx / scale) + bbox.minX;
      const srcY = Math.floor(ty / scale) + bbox.minY;
      
      if (srcX >= 0 && srcX < srcWidth && srcY >= 0 && srcY < srcHeight) {
        const srcIdx = srcY * srcWidth + srcX;
        const targetX = tx + offsetX;
        const targetY = ty + offsetY;
        
        if (targetX >= 0 && targetX < targetSize && targetY >= 0 && targetY < targetSize) {
          const targetIdx = targetY * targetSize + targetX;
          // Normalize: 255 -> 1.0, 0 -> 0.0
          result[targetIdx] = binary[srcIdx] / 255.0;
        }
      }
    }
  }
  
  return result;
}

/**
 * Full preprocessing pipeline: canvas -> 28x28 normalized array
 */
export function preprocessCanvas(canvas: HTMLCanvasElement): PreprocessedImage | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Step 1: Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // Step 2: Convert to grayscale
  const gray = toGrayscale(imageData);
  
  // Step 3: Apply thresholding
  const binary = threshold(gray, width, height);
  
  // Step 4: Remove noise
  const denoised = denoise(binary, width, height);
  
  // Step 5: Find bounding box
  const bbox = findBoundingBox(denoised, width, height);
  if (!bbox) return null;
  
  // Step 6: Center and resize to 28x28
  const normalized = centerAndResize(denoised, width, height, bbox, 28);
  
  return {
    data: normalized,
    width: 28,
    height: 28
  };
}

