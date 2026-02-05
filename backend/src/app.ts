import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsMiddleware } from './middleware/cors.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { config } from './config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(corsMiddleware);

// Rate limiting
app.use('/api', generalLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (config.isProduction) {
  // Resolve paths relative to project root (not dist folder)
  const projectRoot = path.join(__dirname, '../..');
  const adminPath = path.join(projectRoot, 'admin/dist');
  const frontendPath = path.join(projectRoot, 'frontend');

  console.log('Static file paths:');
  console.log('  Admin:', adminPath);
  console.log('  Frontend:', frontendPath);

  // Serve admin portal - redirect /admin to /admin/
  app.get('/admin', (req, res) => {
    res.redirect('/admin/');
  });

  // Serve admin static files
  app.use('/admin', express.static(adminPath, {
    index: 'index.html',
    fallthrough: true,
  }));

  // Admin SPA fallback
  app.get('/admin/*', (req, res, next) => {
    const indexPath = path.join(adminPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Admin index.html not found:', indexPath);
        next(err);
      }
    });
  });

  // Serve frontend (customer website)
  app.use(express.static(frontendPath));

  // Serve booking view page
  app.get('/booking/:ref', (req, res) => {
    res.sendFile(path.join(frontendPath, 'booking.html'));
  });

  // Fallback to index.html for frontend routes
  app.get('*', (req, res, next) => {
    // Skip API routes and admin routes
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
