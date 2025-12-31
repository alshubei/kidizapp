# PWA Setup Instructions

## Icon Generation

The app requires icons in multiple sizes for PWA support. Here are the required sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

### Option 1: Using Online Tool (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload a 512x512px icon image
3. Configure settings:
   - iOS: Enable all sizes
   - Android: Enable all sizes
   - Windows: Enable tile
4. Download the generated icons
5. Place all PNG files in the `public/` directory with names:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### Option 2: Using ImageMagick
```bash
# Install ImageMagick first
# Then run:
convert your-icon-512x512.png -resize 72x72 public/icon-72x72.png
convert your-icon-512x512.png -resize 96x96 public/icon-96x96.png
convert your-icon-512x512.png -resize 128x128 public/icon-128x128.png
convert your-icon-512x512.png -resize 144x144 public/icon-144x144.png
convert your-icon-512x512.png -resize 152x152 public/icon-152x152.png
convert your-icon-512x512.png -resize 192x192 public/icon-192x192.png
convert your-icon-512x512.png -resize 384x384 public/icon-384x384.png
# 512x512 is already the right size
cp your-icon-512x512.png public/icon-512x512.png
```

### Option 3: Using HTML Generator (Easiest)
1. Open `scripts/create-simple-icons.html` in your browser
2. Click "Generate All Icons"
3. Click "Download" for each icon size
4. Save all files to the `public/` directory

### Option 4: Using Node.js Script
```bash
npm install -D sharp
node scripts/generate-icons.js
```

## Testing PWA

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open in browser and check:
   - Service worker is registered (DevTools > Application > Service Workers)
   - Manifest is loaded (DevTools > Application > Manifest)
   - Icons are displayed correctly

## Installing as PWA

### iOS/iPadOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will launch in standalone mode

### Android
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. The app will launch in standalone mode

## Features

- ✅ Offline support via service worker
- ✅ App icons for all platforms
- ✅ Standalone display mode
- ✅ Automatic redirect to home when launched as PWA
- ✅ Theme color matching app design
- ✅ Apple touch icons
- ✅ Windows tile configuration

