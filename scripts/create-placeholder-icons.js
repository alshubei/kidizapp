#!/usr/bin/env node

/**
 * Create placeholder PWA icons using Node.js Canvas API
 * Run: node scripts/create-placeholder-icons.js
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '..', 'public');

// Check if canvas is available
let Canvas;
try {
  Canvas = await import('canvas');
} catch (error) {
  console.error('Canvas package not found. Install it with:');
  console.error('  yarn add canvas');
  console.error('\nOr create icons manually using the HTML tool:');
  console.error('  Open scripts/create-simple-icons.html in a browser');
  process.exit(1);
}

function createIcon(size) {
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#6bcb77');
  gradient.addColorStop(1, '#4d96ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw a simple shape (circle with number)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.3, 0, 2 * Math.PI);
  ctx.fill();
  
  // Add text "K" for KidizApp
  ctx.fillStyle = '#4d96ff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('K', size / 2, size / 2);
  
  return canvas.toBuffer('image/png');
}

console.log('Creating placeholder PWA icons...');

sizes.forEach(size => {
  const icon = createIcon(size);
  const filename = path.join(outputDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filename, icon);
  console.log(`✅ Created ${filename}`);
});

console.log('\n✅ All icons created successfully!');

