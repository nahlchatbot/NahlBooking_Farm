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
  // npm workspace runs from /app/backend, so go up one level to /app/
  const projectRoot = path.join(process.cwd(), '..');
  const adminPath = path.join(projectRoot, 'admin/dist');
  const frontendPath = path.join(projectRoot, 'frontend');

  console.log('Static file paths:');
  console.log('  CWD:', process.cwd());
  console.log('  Project root:', projectRoot);
  console.log('  Admin:', adminPath);
  console.log('  Frontend:', frontendPath);

  // Check if directories exist
  import('fs').then(fs => {
    console.log('  Admin exists:', fs.existsSync(adminPath));
    console.log('  Admin/assets exists:', fs.existsSync(path.join(adminPath, 'assets')));
    console.log('  Frontend exists:', fs.existsSync(frontendPath));
    if (fs.existsSync(adminPath)) {
      console.log('  Admin contents:', fs.readdirSync(adminPath));
    }
  });

  // Serve ALL admin files (not just assets subfolder)
  app.use('/admin', express.static(adminPath, {
    index: false, // Don't auto-serve index.html, we handle that below
  }));

  // Admin SPA - serve index.html for /admin and /admin/* routes (not assets)
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });
  app.get('/admin/*', (req, res, next) => {
    // Skip if this looks like a file request (has extension)
    if (req.path.includes('.')) {
      return next();
    }
    res.sendFile(path.join(adminPath, 'index.html'));
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
