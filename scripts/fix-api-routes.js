import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, '../backend/src/index.js');
let content = fs.readFileSync(indexPath, 'utf8');

// 1. Insert Middleware after CORS
const corsEndMarker = "  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN'],\n  }));";
const middlewareCode = `

  // ===========================
  // API STRIP MIDDLEWARE
  // ===========================
  if (process.env.DISABLE_API_REWRITE !== 'true') {
    app.use((req, res, next) => {
      if (req.url.startsWith('/internal')) return next();
      
      if (req.url === '/api' || req.url.startsWith('/api/') || req.url.startsWith('/api?')) {
        req.url = req.url.replace(/^\\/api/, '');
        if (!req.url.startsWith('/')) req.url = '/' + req.url;
      }
      next();
    });
  }`;

if (!content.includes('API STRIP MIDDLEWARE')) {
  content = content.replace(corsEndMarker, corsEndMarker + middlewareCode);
}
fs.writeFileSync(indexPath, content, 'utf8');
console.log('index.js successfully patched with JUST the middleware!');
