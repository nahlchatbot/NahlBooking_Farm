import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { requireSuperAdmin, requireAdmin } from '../middleware/rbac.js';
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
  sendReminderHandler,
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
  listPricingMatrixHandler,
  upsertPricingMatrixHandler,
} from '../controllers/admin/pricing.controller.js';
import {
  listBookingTypesHandler,
  getBookingTypeHandler,
  createBookingTypeHandler,
  updateBookingTypeHandler,
  deleteBookingTypeHandler,
} from '../controllers/admin/bookingTypes.controller.js';
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
import { listAuditLogsHandler } from '../controllers/admin/auditlog.controller.js';

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
router.post('/calendar/block', requireAdmin, blockDateHandler);
router.post('/calendar/unblock', requireAdmin, unblockDateHandler);

// Bookings
router.get('/bookings', listBookingsHandler);
router.get('/bookings/:id', getBookingHandler);
router.patch('/bookings/:id', requireAdmin, validate(updateBookingSchema), updateBookingHandler);
router.delete('/bookings/:id', requireAdmin, cancelBookingHandler);
router.post('/bookings/:id/remind', requireAdmin, sendReminderHandler);

// Blackout Dates
router.get('/blackout-dates', listBlackoutDatesHandler);
router.post('/blackout-dates', requireAdmin, validate(createBlackoutDateSchema), createBlackoutDateHandler);
router.delete('/blackout-dates/:id', requireAdmin, deleteBlackoutDateHandler);

// Chalets
router.get('/chalets', listChaletsHandler);
router.get('/chalets/:id', getChaletHandler);
router.post('/chalets', requireAdmin, validate(createChaletSchema), createChaletHandler);
router.patch('/chalets/:id', requireAdmin, validate(updateChaletSchema), updateChaletHandler);
router.delete('/chalets/:id', requireAdmin, deleteChaletHandler);
// Chalet Images
router.post('/chalets/:id/images', requireAdmin, validate(addChaletImageSchema), addChaletImageHandler);
router.delete('/chalets/:id/images/:imageId', requireAdmin, deleteChaletImageHandler);
router.patch('/chalets/:id/images/reorder', requireAdmin, reorderChaletImagesHandler);

// Booking Types
router.get('/booking-types', listBookingTypesHandler);
router.get('/booking-types/:id', getBookingTypeHandler);
router.post('/booking-types', requireAdmin, createBookingTypeHandler);
router.patch('/booking-types/:id', requireAdmin, updateBookingTypeHandler);
router.delete('/booking-types/:id', requireAdmin, deleteBookingTypeHandler);

// Pricing
router.get('/pricing', listPricingHandler);
router.patch('/pricing/:id', requireAdmin, validate(updatePricingSchema), updatePricingHandler);
router.get('/pricing/matrix', listPricingMatrixHandler);
router.post('/pricing/matrix', requireAdmin, upsertPricingMatrixHandler);

// Settings
router.get('/settings', listSettingsHandler);
router.patch('/settings/:key', requireSuperAdmin, updateSettingHandler);
router.put('/settings', requireSuperAdmin, bulkUpdateSettingsHandler);

// Reports
router.get('/reports/bookings', getBookingsReportHandler);
router.get('/reports/revenue', getRevenueReportHandler);
router.get('/reports/occupancy', getOccupancyReportHandler);
router.get('/reports/customers', getCustomersReportHandler);
router.get('/reports/export/bookings', exportBookingsCsvHandler);
router.get('/reports/export/revenue', exportRevenueCsvHandler);

// Audit Logs (SUPER_ADMIN only)
router.get('/audit-logs', requireSuperAdmin, listAuditLogsHandler);

// Admin Users (SUPER_ADMIN only)
router.get('/users', requireSuperAdmin, listAdminUsersHandler);
router.get('/users/:id', requireSuperAdmin, getAdminUserHandler);
router.post('/users', requireSuperAdmin, validate(createAdminUserSchema), createAdminUserHandler);
router.patch('/users/:id', requireSuperAdmin, validate(updateAdminUserSchema), updateAdminUserHandler);
router.delete('/users/:id', requireSuperAdmin, deleteAdminUserHandler);
router.post('/users/:id/change-password', requireSuperAdmin, validate(changePasswordSchema), changePasswordHandler);

export default router;
