#!/usr/bin/env node

/**
 * Script to generate PWA icons from a base SVG
 * This creates all required icon sizes for PWA
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Note: Requires sharp package: npm install -D sharp
 */

const fs = require('fs');
const path = require('path');

// Icon sizes required for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Base SVG icon (you can replace this with your actual icon design)
const baseSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2d5016" rx="80"/>
  <text x="256" y="320" font-size="280" text-anchor="middle" fill="#fef3e2" font-family="Arial, sans-serif" font-weight="bold">🧮</text>
</svg>`;

async function generateIcons() {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.error('Error: sharp package not found. Please install it with: npm install -D sharp');
      console.log('\nCreating placeholder instructions instead...');
      createPlaceholderInstructions();
      return;
    }

    const publicDir = path.join(__dirname, '..', 'public');
    
    // Create base SVG file
    const svgPath = path.join(publicDir, 'icon-base.svg');
    fs.writeFileSync(svgPath, baseSVG);
    console.log('✓ Created base SVG icon');

    // Generate PNG icons for each size
    for (const size of iconSizes) {
      const outputPath = path.join(publicDir, `icon-${size}x${size}.png`);
      
      await sharp(Buffer.from(baseSVG))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }

    console.log('\n✅ All icons generated successfully!');
    console.log('Icons are located in the public/ directory');
  } catch (error) {
    console.error('Error generating icons:', error);
    createPlaceholderInstructions();
  }
}

function createPlaceholderInstructions() {
  console.log('\n📝 Manual Icon Creation Instructions:');
  console.log('1. Create a 512x512px icon with your app design');
  console.log('2. Use an online tool like https://realfavicongenerator.net/');
  console.log('3. Or use ImageMagick: convert icon-512x512.png -resize 72x72 icon-72x72.png');
  console.log('4. Place all icons in the public/ directory');
  console.log('\nRequired sizes:', iconSizes.join(', '));
}

// Run if called directly
if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons, iconSizes };

