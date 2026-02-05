import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import {
  adminLoginSchema,
  updateBookingSchema,
  createBlackoutDateSchema,
  updateChaletSchema,
  updatePricingSchema,
} from '../types/validation.js';

// Controllers
import { loginHandler, meHandler } from '../controllers/admin/auth.controller.js';
import {
  listBookingsHandler,
  getBookingHandler,
  updateBookingHandler,
  cancelBookingHandler,
} from '../controllers/admin/bookings.controller.js';
import {
  listBlackoutDatesHandler,
  createBlackoutDateHandler,
  deleteBlackoutDateHandler,
} from '../controllers/admin/blackout.controller.js';
import { getDashboardStatsHandler } from '../controllers/admin/dashboard.controller.js';
import {
  listChaletsHandler,
  getChaletHandler,
  updateChaletHandler,
} from '../controllers/admin/chalets.controller.js';
import {
  listPricingHandler,
  updatePricingHandler,
} from '../controllers/admin/pricing.controller.js';
import {
  listSettingsHandler,
  updateSettingHandler,
  bulkUpdateSettingsHandler,
} from '../controllers/admin/settings.controller.js';

const router = Router();

// Auth routes (no authentication required)
router.post('/auth/login', loginLimiter, validate(adminLoginSchema), loginHandler);

// All routes below require authentication
router.use(authenticateAdmin);

// Auth
router.get('/auth/me', meHandler);

// Dashboard
router.get('/dashboard/stats', getDashboardStatsHandler);

// Bookings
router.get('/bookings', listBookingsHandler);
router.get('/bookings/:id', getBookingHandler);
router.patch('/bookings/:id', validate(updateBookingSchema), updateBookingHandler);
router.delete('/bookings/:id', cancelBookingHandler);

// Blackout Dates
router.get('/blackout-dates', listBlackoutDatesHandler);
router.post('/blackout-dates', validate(createBlackoutDateSchema), createBlackoutDateHandler);
router.delete('/blackout-dates/:id', deleteBlackoutDateHandler);

// Chalets
router.get('/chalets', listChaletsHandler);
router.get('/chalets/:id', getChaletHandler);
router.patch('/chalets/:id', validate(updateChaletSchema), updateChaletHandler);

// Pricing
router.get('/pricing', listPricingHandler);
router.patch('/pricing/:id', validate(updatePricingSchema), updatePricingHandler);

// Settings
router.get('/settings', listSettingsHandler);
router.patch('/settings/:key', updateSettingHandler);
router.put('/settings', bulkUpdateSettingsHandler);

export default router;
