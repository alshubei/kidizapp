/**
 * Multi-digit segmentation using connected component analysis
 * Splits canvas into individual digit crops for recognition
 */

export interface DigitCrop {
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Simple connected component labeling (4-connectivity)
 */
function findConnectedComponents(
  binary: Uint8Array,
  width: number,
  height: number
): Array<{ pixels: Array<{ x: number; y: number }>; bbox: { minX: number; minY: number; maxX: number; maxY: number } }> {
  const visited = new Set<number>();
  const components: Array<{ pixels: Array<{ x: number; y: number }>; bbox: { minX: number; minY: number; maxX: number; maxY: number } }> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Skip if already visited or not a digit pixel
      if (visited.has(idx) || binary[idx] === 0) continue;
      
      // Start new component
      const pixels: Array<{ x: number; y: number }> = [];
      const stack: Array<{ x: number; y: number }> = [{ x, y }];
      let minX = x, minY = y, maxX = x, maxY = y;
      
      // Flood fill
      while (stack.length > 0) {
        const { x: cx, y: cy } = stack.pop()!;
        const cidx = cy * width + cx;
        
        if (visited.has(cidx) || cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        if (binary[cidx] === 0) continue;
        
        visited.add(cidx);
        pixels.push({ x: cx, y: cy });
        
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
        
        // 4-connectivity neighbors
        stack.push(
          { x: cx + 1, y: cy },
          { x: cx - 1, y: cy },
          { x: cx, y: cy + 1 },
          { x: cx, y: cy - 1 }
        );
      }
      
      // Filter out noise (too small components)
      if (pixels.length >= 20) { // Minimum pixel count for a digit
        components.push({
          pixels,
          bbox: { minX, minY, maxX, maxY }
        });
      }
    }
  }
  
  return components;
}

/**
 * Convert canvas to binary array
 */
function canvasToBinary(canvas: HTMLCanvasElement): { binary: Uint8Array; width: number; height: number } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Cannot get canvas context');
  
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to grayscale and threshold
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    // Invert: dark pixels (digits) become 255, light background becomes 0
    binary[i / 4] = gray < 128 ? 255 : 0;
  }
  
  return { binary, width, height };
}

/**
 * Segment canvas into individual digit crops
 * Returns crops sorted left-to-right
 */
export function segmentDigits(canvas: HTMLCanvasElement): DigitCrop[] {
  const { binary, width, height } = canvasToBinary(canvas);
  
  // Find connected components
  const components = findConnectedComponents(binary, width, height);
  
  if (components.length === 0) return [];
  
  // Sort components left-to-right by center X
  components.sort((a, b) => {
    const aCenterX = (a.bbox.minX + a.bbox.maxX) / 2;
    const bCenterX = (b.bbox.minX + b.bbox.maxX) / 2;
    return aCenterX - bCenterX;
  });
  
  // Create crops with padding
  const crops: DigitCrop[] = [];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  
  for (const component of components) {
    const { minX, minY, maxX, maxY } = component.bbox;
    const padding = 5;
    
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropX, maxX - minX + 2 * padding);
    const cropHeight = Math.min(height - cropY, maxY - minY + 2 * padding);
    
    // Create new canvas for this digit
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (cropCtx) {
      // White background
      cropCtx.fillStyle = '#1a3a1a'; // Match original canvas background
      cropCtx.fillRect(0, 0, cropWidth, cropHeight);
      
      // Draw the cropped region
      const sourceImageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
      cropCtx.putImageData(sourceImageData, 0, 0);
      
      crops.push({
        canvas: cropCanvas,
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight
      });
    }
  }
  
  return crops;
}

