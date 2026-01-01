# Offline Handwritten Digit Recognition

High-accuracy, fully offline digit recognition using ONNX models.

## Setup

### 1. Install Dependencies

```bash
yarn add onnxruntime-web
```

### 2. Download MNIST Model

You need to download a pretrained MNIST model and convert it to ONNX format.

**Option A: Use Hugging Face Model (Recommended)**

1. Go to [Hugging Face Model Hub](https://huggingface.co/models?search=mnist+onnx)
2. Download a pretrained MNIST ONNX model (e.g., `mnist.onnx`)
3. Place it in `public/models/mnist.onnx`

**Option B: Convert PyTorch Model to ONNX**

If you have a PyTorch MNIST model:

```python
import torch
import torch.onnx

# Load your trained model
model = YourMNISTModel()
model.load_state_dict(torch.load('mnist_model.pth'))
model.eval()

# Create dummy input
dummy_input = torch.randn(1, 1, 28, 28)

# Export to ONNX
torch.onnx.export(
    model,
    dummy_input,
    "mnist.onnx",
    input_names=['input'],
    output_names=['output'],
    dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
)
```

**Option C: Use Pre-converted Model**

Download a pre-converted ONNX model:
- [ONNX Model Zoo - MNIST](https://github.com/onnx/models/tree/main/validated/vision/classification/mnist)
- Place `model.onnx` in `public/models/mnist.onnx`

### 3. Directory Structure

```
public/
  models/
    mnist.onnx    # Your ONNX model file
```

## Usage

### Basic Usage (Single Digit)

```typescript
import { recognizeDigit } from '@/lib/digit-recognition/recognize';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const digit = await recognizeDigit(canvas);
// Returns: number | null (0-9)
```

### Multi-Digit Recognition

```typescript
import { recognizeNumber } from '@/lib/digit-recognition/recognize';

const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const number = await recognizeNumber(canvas);
// Returns: string | null (e.g., "13", "89", "0")
```

### Preload Model (Optional)

```typescript
import { initializeModel } from '@/lib/digit-recognition/recognize';

// Preload model for faster first recognition
await initializeModel('/models/mnist.onnx');
```

## Integration with Existing Hook

Update `useHandwritingRecognition.ts`:

```typescript
import { recognizeNumber } from '@/lib/digit-recognition/recognize';

const recognizeDigit = useCallback(async (canvas: HTMLCanvasElement): Promise<number | null> => {
  setIsRecognizing(true);
  try {
    const numberStr = await recognizeNumber(canvas);
    if (numberStr) {
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
}, []);
```

## Preprocessing Pipeline

1. **Grayscale Conversion**: RGB → Grayscale using luminance formula
2. **Thresholding**: Otsu's method for optimal binary threshold
3. **Denoising**: Morphological operations to remove noise
4. **Bounding Box**: Tight crop around digit
5. **Centering**: Center digit in 28x28 canvas preserving aspect ratio
6. **Normalization**: Scale pixel values to 0-1 range

## Segmentation (Multi-Digit)

- Uses connected component analysis (4-connectivity)
- Filters noise (components < 20 pixels)
- Sorts digits left-to-right
- Creates individual crops with padding

## Model Requirements

- Input: `[1, 1, 28, 28]` float32 tensor (batch, channels, height, width)
- Output: `[1, 10]` float32 tensor (probabilities for digits 0-9)
- Input name: Usually `'input'`, `'data'`, or `'image'`
- Output name: Usually `'output'` or `'probabilities'`

## Performance

- First recognition: ~200-500ms (includes model loading)
- Subsequent: ~50-100ms per digit
- Multi-digit: ~50-100ms per digit + segmentation overhead

## Privacy

- **100% offline**: All processing happens in browser
- **No network requests**: Model and inference run locally
- **No data collection**: Images never leave the device

## Troubleshooting

### Model not found
- Ensure model is in `public/models/mnist.onnx`
- Check file path in `recognizeNumber()` call

### Low accuracy
- Ensure digits are drawn clearly
- Check preprocessing output (add debug logging)
- Verify model is trained on similar data distribution

### Slow performance
- Model loads once and is cached
- Use WebGL execution provider (automatic)
- Consider model quantization for smaller/faster models

