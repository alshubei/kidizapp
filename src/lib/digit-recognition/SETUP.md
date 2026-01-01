# ONNX Digit Recognition Setup

## Quick Setup

1. **Install dependencies** (already done):
   ```bash
   yarn add onnxruntime-web
   ```

2. **Copy WASM files** (run this once, or it runs automatically on dev/build):
   ```bash
   yarn copy-onnx-wasm
   ```
   
   Or manually:
   ```bash
   mkdir -p public/onnx-wasm
   cp node_modules/onnxruntime-web/dist/*.wasm* public/onnx-wasm/
   ```

3. **Download MNIST model**:
   ```bash
   node scripts/download-mnist-model.js
   ```
   
   Or manually download from:
   - https://github.com/onnx/models/tree/main/validated/vision/classification/mnist
   - Save to `public/models/mnist.onnx`

4. **Restart dev server** after copying WASM files:
   ```bash
   # Stop current server (Ctrl+C)
   yarn dev
   ```

## Troubleshooting WASM Errors

If you see: `expected magic word 00 61 73 6d, found 3c 21 64 6f`

This means ONNX Runtime is getting HTML (404 page) instead of WASM files.

**Solutions:**

1. **Verify WASM files exist**:
   ```bash
   ls public/onnx-wasm/*.wasm
   ```
   Should show multiple .wasm files

2. **Check browser console** for the actual URL being requested
   - Look for failed requests to `/onnx-wasm/...`
   - Verify the path is correct

3. **Restart dev server** after copying WASM files

4. **Verify Vite is serving public files**:
   - Try accessing: `http://localhost:8080/onnx-wasm/ort-wasm-simd-threaded.wasm`
   - Should download the file, not show HTML

5. **If still failing**, try using a CDN path:
   ```typescript
   ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
   ```

## File Structure

```
public/
  onnx-wasm/          # ONNX Runtime WASM files (auto-copied)
    *.wasm
  models/
    mnist.onnx        # MNIST model (download manually)
```

## Verification

After setup, check browser console for:
- ✅ "ONNX Runtime WASM paths configured: ..."
- ✅ "Loading ONNX model from: /models/mnist.onnx"
- ✅ "ONNX model loaded successfully"

If you see errors, check the troubleshooting section above.

