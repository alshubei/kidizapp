/**
 * ONNX-based digit recognition
 * Uses pretrained MNIST model for high-accuracy digit recognition
 */

import { preprocessCanvas, PreprocessedImage } from './preprocess';
import { segmentDigits, DigitCrop } from './segment-digits';

// Dynamic import to avoid bundling issues
let ort: any = null;
let ortLoadError: Error | null = null;

async function getOrt() {
  if (ortLoadError) {
    throw ortLoadError;
  }
  if (!ort) {
    try {
      ort = await import('onnxruntime-web');
      
      // Configure WASM paths immediately after import
      // This must be done before creating any sessions
      if (ort.env && ort.env.wasm) {
        // Use relative path - Vite serves public/ at root
        ort.env.wasm.wasmPaths = '/onnx-wasm/';
        console.log('ONNX Runtime WASM paths configured:', ort.env.wasm.wasmPaths);
        console.log('WASM files should be accessible at:', window.location.origin + '/onnx-wasm/');
      }
    } catch (error) {
      ortLoadError = error as Error;
      console.error('Failed to load ONNX Runtime:', error);
      throw error;
    }
  }
  return ort;
}

// Model session cache
let modelSession: any = null;
let modelLoading = false;
let modelLoadPromise: Promise<any> | null = null;

/**
 * Load ONNX model (cached after first load)
 */
async function loadModel(modelPath: string): Promise<any> {
  // Return cached session if available
  if (modelSession) {
    return modelSession;
  }
  
  // Return existing load promise if loading
  if (modelLoadPromise) {
    return modelLoadPromise;
  }
  
  // Start loading
  modelLoading = true;
  const ortModule = await getOrt();
  
  // WASM paths are already configured in getOrt()
  // Create inference session with WASM provider
  modelLoadPromise = ortModule.InferenceSession.create(modelPath, {
    executionProviders: ['wasm'], // Use WASM (more reliable than WebGL for this use case)
    graphOptimizationLevel: 'all'
  }).then(session => {
    modelSession = session;
    modelLoading = false;
    modelLoadPromise = null;
    return session;
  }).catch(error => {
    modelLoading = false;
    modelLoadPromise = null;
    throw error;
  });
  
  return modelLoadPromise;
}

/**
 * Recognize a single digit from preprocessed image
 */
async function recognizeSingleDigit(
  preprocessed: PreprocessedImage,
  session: any
): Promise<number | null> {
  try {
    const ortModule = await getOrt();
    
    // Prepare input tensor: shape [1, 1, 28, 28] for MNIST
    // Input name might vary, common names: 'input', 'data', 'image'
    const inputName = session.inputNames[0];
    
    // Create tensor from preprocessed data
    const tensor = new ortModule.Tensor('float32', preprocessed.data, [1, 1, 28, 28]);
    
    // Run inference
    const feeds: Record<string, any> = {};
    feeds[inputName] = tensor;
    
    const results = await session.run(feeds);
    
    // Get output (usually named 'output', 'probabilities', or similar)
    const outputName = session.outputNames[0];
    const output = results[outputName];
    
    // Output shape is typically [1, 10] (batch_size, num_classes)
    const probabilities = output.data as Float32Array;
    
    // Find digit with highest probability
    let maxProb = -1;
    let predictedDigit = -1;
    
    for (let i = 0; i < 10; i++) {
      if (probabilities[i] > maxProb) {
        maxProb = probabilities[i];
        predictedDigit = i;
      }
    }
    
    // Confidence threshold: only return if probability > 0.5
    if (maxProb > 0.5) {
      return predictedDigit;
    }
  
    return null;
  } catch (error) {
    console.error('Recognition error:', error);
    return null;
  }
}

/**
 * Recognize a single digit from canvas (single-digit mode)
 */
export async function recognizeDigit(
  canvas: HTMLCanvasElement,
  modelPath: string = '/models/mnist.onnx'
): Promise<number | null> {
  try {
    // Load model
    const session = await loadModel(modelPath);
    
    // Preprocess
    const preprocessed = preprocessCanvas(canvas);
    if (!preprocessed) return null;
    
    // Recognize
    return await recognizeSingleDigit(preprocessed, session);
  } catch (error) {
    console.error('Digit recognition error:', error);
    return null;
  }
}

/**
 * Recognize multi-digit number from canvas
 * Returns combined number string (e.g., "13", "89")
 */
export async function recognizeNumber(
  canvas: HTMLCanvasElement,
  modelPath: string = '/models/mnist.onnx'
): Promise<string | null> {
  try {
    // Load model
    const session = await loadModel(modelPath);
    
    // Segment into individual digits
    const crops = segmentDigits(canvas);
    
    if (crops.length === 0) {
      // No segments found, try recognizing whole canvas as single digit
      const preprocessed = preprocessCanvas(canvas);
      if (!preprocessed) return null;
      
      const digit = await recognizeSingleDigit(preprocessed, session);
      return digit !== null ? digit.toString() : null;
    }
    
    // Recognize each digit
    const digits: number[] = [];
    for (const crop of crops) {
      const preprocessed = preprocessCanvas(crop.canvas);
      if (preprocessed) {
        const digit = await recognizeSingleDigit(preprocessed, session);
        if (digit !== null) {
          digits.push(digit);
        }
      }
    }
    
    if (digits.length === 0) return null;
    
    // Combine into number string
    return digits.join('');
  } catch (error) {
    console.error('Number recognition error:', error);
    return null;
  }
}

/**
 * Initialize model (preload for faster recognition)
 */
export async function initializeModel(modelPath: string = '/models/mnist.onnx'): Promise<void> {
  try {
    await loadModel(modelPath);
    console.log('Digit recognition model loaded successfully');
  } catch (error) {
    console.error('Failed to load model:', error);
    throw error;
  }
}

