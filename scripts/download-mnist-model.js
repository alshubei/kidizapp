#!/usr/bin/env node

/**
 * Helper script to download MNIST ONNX model
 * 
 * Usage:
 *   node scripts/download-mnist-model.js
 * 
 * This will download a pretrained MNIST model to public/models/mnist.onnx
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://github.com/onnx/models/raw/main/validated/vision/classification/mnist/model/mnist-12.onnx';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'models');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'mnist.onnx');

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, outputPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

console.log('Downloading MNIST ONNX model...');
console.log(`URL: ${MODEL_URL}`);
console.log(`Output: ${OUTPUT_FILE}`);

downloadFile(MODEL_URL, OUTPUT_FILE)
  .then(() => {
    console.log('✅ Model downloaded successfully!');
    console.log(`   Location: ${OUTPUT_FILE}`);
  })
  .catch((error) => {
    console.error('❌ Failed to download model:', error.message);
    console.log('\nAlternative: Download manually from:');
    console.log('  https://github.com/onnx/models/tree/main/validated/vision/classification/mnist');
    console.log(`  Save to: ${OUTPUT_FILE}`);
    process.exit(1);
  });

