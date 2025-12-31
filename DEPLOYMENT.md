# Deployment Guide

## Fixing 404 Errors on Page Refresh

This app uses client-side routing (React Router), so all routes need to be served through `index.html`. The configuration depends on your deployment platform.

## Development

Vite's dev server automatically handles SPA routing - no configuration needed. Just run:
```bash
npm run dev
```

## Preview/Build Testing

Vite's preview server should handle routing automatically:
```bash
npm run build
npm run preview
```

If you still get 404s, use the custom server:
```bash
npm run serve
```

## Production Deployment

### Netlify
The `public/_redirects` file is automatically used. No additional configuration needed.

### Vercel
The `vercel.json` file is automatically used. No additional configuration needed.

### Apache
The `public/.htaccess` file will be used if you deploy to an Apache server. Make sure mod_rewrite is enabled.

### Nginx
Add this to your nginx configuration:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Node.js/Express
Use the provided `server.js`:
```bash
npm install express
node server.js
```

Or use a static file server like `serve`:
```bash
npm install -g serve
serve -s dist
```

### GitHub Pages
GitHub Pages doesn't support server-side redirects. You'll need to:
1. Use HashRouter instead of BrowserRouter (not recommended)
2. Or use a GitHub Action to deploy to a platform that supports SPA routing
3. Or use a service like Netlify/Vercel that supports SPA routing

## Service Worker

The service worker has been updated to handle navigation requests and serve `index.html` for all routes when offline or when network requests fail.

