import { Router } from 'express';
import publicRoutes from './public.js';
import adminRoutes from './admin.js';

const router = Router();

// Public API routes
router.use('/', publicRoutes);

// Admin API routes
router.use('/admin', adminRoutes);

export default router;
