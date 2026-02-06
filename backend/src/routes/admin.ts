import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/rbac.js';
import { validate } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import {
  adminLoginSchema,
  updateBookingSchema,
  createBlackoutDateSchema,
  createChaletSchema,
  updateChaletSchema,
  addChaletImageSchema,
  updatePricingSchema,
  createAdminUserSchema,
  updateAdminUserSchema,
  changePasswordSchema,
} from '../types/validation.js';

// Controllers
import { loginHandler, meHandler } from '../controllers/admin/auth.controller.js';
import {
  listAdminUsersHandler,
  getAdminUserHandler,
  createAdminUserHandler,
  updateAdminUserHandler,
  deleteAdminUserHandler,
  changePasswordHandler,
} from '../controllers/admin/users.controller.js';
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
  getCalendarHandler,
  blockDateHandler,
  unblockDateHandler,
} from '../controllers/admin/calendar.controller.js';
import {
  listChaletsHandler,
  getChaletHandler,
  createChaletHandler,
  updateChaletHandler,
  deleteChaletHandler,
  addChaletImageHandler,
  deleteChaletImageHandler,
  reorderChaletImagesHandler,
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
import {
  getBookingsReportHandler,
  getRevenueReportHandler,
  getOccupancyReportHandler,
  getCustomersReportHandler,
  exportBookingsCsvHandler,
  exportRevenueCsvHandler,
} from '../controllers/admin/reports.controller.js';

const router = Router();

// Auth routes (no authentication required)
router.post('/auth/login', loginLimiter, validate(adminLoginSchema), loginHandler);

// All routes below require authentication
router.use(authenticateAdmin);

// Auth
router.get('/auth/me', meHandler);

// Dashboard
router.get('/dashboard/stats', getDashboardStatsHandler);

// Calendar
router.get('/calendar', getCalendarHandler);
router.post('/calendar/block', blockDateHandler);
router.post('/calendar/unblock', unblockDateHandler);

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
router.post('/chalets', validate(createChaletSchema), createChaletHandler);
router.patch('/chalets/:id', validate(updateChaletSchema), updateChaletHandler);
router.delete('/chalets/:id', deleteChaletHandler);
// Chalet Images
router.post('/chalets/:id/images', validate(addChaletImageSchema), addChaletImageHandler);
router.delete('/chalets/:id/images/:imageId', deleteChaletImageHandler);
router.patch('/chalets/:id/images/reorder', reorderChaletImagesHandler);

// Pricing
router.get('/pricing', listPricingHandler);
router.patch('/pricing/:id', validate(updatePricingSchema), updatePricingHandler);

// Settings
router.get('/settings', listSettingsHandler);
router.patch('/settings/:key', updateSettingHandler);
router.put('/settings', bulkUpdateSettingsHandler);

// Reports
router.get('/reports/bookings', getBookingsReportHandler);
router.get('/reports/revenue', getRevenueReportHandler);
router.get('/reports/occupancy', getOccupancyReportHandler);
router.get('/reports/customers', getCustomersReportHandler);
router.get('/reports/export/bookings', exportBookingsCsvHandler);
router.get('/reports/export/revenue', exportRevenueCsvHandler);

// Admin Users (SUPER_ADMIN only)
router.get('/users', requireSuperAdmin, listAdminUsersHandler);
router.get('/users/:id', requireSuperAdmin, getAdminUserHandler);
router.post('/users', requireSuperAdmin, validate(createAdminUserSchema), createAdminUserHandler);
router.patch('/users/:id', requireSuperAdmin, validate(updateAdminUserSchema), updateAdminUserHandler);
router.delete('/users/:id', requireSuperAdmin, deleteAdminUserHandler);
router.post('/users/:id/change-password', requireSuperAdmin, validate(changePasswordSchema), changePasswordHandler);

export default router;
