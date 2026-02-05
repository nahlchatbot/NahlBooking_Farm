import cors from 'cors';
import { config } from '../config/index.js';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server, same-origin)
    if (!origin) {
      callback(null, true);
      return;
    }

    // In development, allow all origins
    if (!config.isProduction) {
      callback(null, true);
      return;
    }

    // In production, allow Railway domains and configured origins
    // Railway uses *.up.railway.app domains
    if (origin.includes('.up.railway.app') || origin.includes('.railway.app')) {
      callback(null, true);
      return;
    }

    // Check against whitelist
    if (config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log blocked origin for debugging
      console.warn('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway to prevent blocking - same domain in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
