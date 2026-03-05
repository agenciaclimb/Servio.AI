const fs = require('fs');
const path = require('path');

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
      // Isentar rotas internas
      if (req.url.startsWith('/internal')) return next();
      
      // Se comecar com /api/ ou for exatamente /api (com ou sem query)
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

// 2. Fix app routes that only have /api/ to use array ['/api/x', '/x']
// Example: app.post('/api/enhance-job', ...) -> app.post(['/api/enhance-job', '/enhance-job'], ...)
// We skip replacing if it's already an array
const routeRegex = /app\.(get|post|put|delete|patch)\(\s*'(?:\/api)(\/[^']+)'\s*,/g;

content = content.replace(routeRegex, (match, method, strippedPath) => {
  // Replace with array syntax
  return "app." + method + "(['/api" + strippedPath + "', '" + strippedPath + "'],";
});

fs.writeFileSync(indexPath, content, 'utf8');
console.log('index.js successfully patched!');
