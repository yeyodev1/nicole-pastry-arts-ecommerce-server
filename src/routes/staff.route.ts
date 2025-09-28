import { Router } from "express";
import {
  getStaffDashboard,
  getStaffOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderDetails,
  getTodayOrders,
  getPendingOrders,
  getOrdersByDateRange,
  addInternalNotes,
  getDeliverySchedule
} from "../controllers/staff.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { wrapAuthHandler } from "../utils/auth-wrapper";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

// Apply staff role verification middleware
router.use(authMiddleware.staffOrAdmin);

/**
 * @route GET /api/staff/dashboard
 * @desc Get staff dashboard with sales summary and key metrics
 * @access Private (Staff/Admin only)
 * @returns {
 *   todayOrders: number,
 *   todayRevenue: number,
 *   pendingOrders: number,
 *   processingOrders: number,
 *   deliveredToday: number,
 *   weeklyRevenue: number,
 *   monthlyRevenue: number,
 *   topDeliveryZones: Array,
 *   recentOrders: Array
 * }
 */
router.get("/dashboard", wrapAuthHandler(getStaffDashboard));

/**
 * @route GET /api/staff/orders
 * @desc Get orders with staff-specific filters and sorting
 * @access Private (Staff/Admin only)
 * @query {
 *   page?: number,
 *   limit?: number,
 *   status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
 *   paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded',
 *   deliveryZone?: 'samanes_suburbio' | 'norte_sur_esteros' | 'sambo' | 'via_costa' | 'aurora',
 *   startDate?: string (ISO date),
 *   endDate?: string (ISO date),
 *   search?: string (customer name, order number, phone)
 * }
 */
router.get("/orders", wrapAuthHandler(getStaffOrders));

/**
 * @route GET /api/staff/orders/today
 * @desc Get today's orders for quick staff overview
 * @access Private (Staff/Admin only)
 */
router.get("/orders/today", wrapAuthHandler(getTodayOrders));

/**
 * @route GET /api/staff/orders/pending
 * @desc Get all pending orders that need attention
 * @access Private (Staff/Admin only)
 */
router.get("/orders/pending", wrapAuthHandler(getPendingOrders));

/**
 * @route GET /api/staff/orders/delivery-schedule
 * @desc Get delivery schedule for today and upcoming days
 * @access Private (Staff/Admin only)
 * @query {
 *   date?: string (ISO date, defaults to today),
 *   days?: number (number of days to include, defaults to 3)
 * }
 */
router.get("/orders/delivery-schedule", wrapAuthHandler(getDeliverySchedule));

/**
 * @route GET /api/staff/orders/date-range
 * @desc Get orders within a specific date range with analytics
 * @access Private (Staff/Admin only)
 * @query {
 *   startDate: string (ISO date),
 *   endDate: string (ISO date),
 *   groupBy?: 'day' | 'week' | 'month'
 * }
 */
router.get("/orders/date-range", wrapAuthHandler(getOrdersByDateRange));

/**
 * @route GET /api/staff/orders/:id
 * @desc Get detailed order information for staff view
 * @access Private (Staff/Admin only)
 * @params {
 *   id: ObjectId
 * }
 */
router.get("/orders/:id", wrapAuthHandler(getOrderDetails));

/**
 * @route PATCH /api/staff/orders/:id/status
 * @desc Update order status (staff-specific status changes)
 * @access Private (Staff/Admin only)
 * @params {
 *   id: ObjectId
 * }
 * @body {
 *   status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded',
 *   reason?: string (required for cancellation/refund),
 *   estimatedDeliveryDate?: Date,
 *   actualDeliveryDate?: Date (for delivered status),
 *   internalNotes?: string
 * }
 */
router.patch("/orders/:id/status", wrapAuthHandler(updateOrderStatus));

/**
 * @route PATCH /api/staff/orders/:id/payment-status
 * @desc Update payment status
 * @access Private (Staff/Admin only)
 * @params {
 *   id: ObjectId
 * }
 * @body {
 *   paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded',
 *   paymentReference?: string,
 *   paymentMethod?: 'cash' | 'card' | 'transfer' | 'mercately' | 'payphone' | 'other',
 *   notes?: string
 * }
 */
router.patch("/orders/:id/payment-status", wrapAuthHandler(updatePaymentStatus));

/**
 * @route PATCH /api/staff/orders/:id/notes
 * @desc Add or update internal notes for an order
 * @access Private (Staff/Admin only)
 * @params {
 *   id: ObjectId
 * }
 * @body {
 *   internalNotes: string,
 *   append?: boolean (if true, appends to existing notes)
 * }
 */
router.patch("/orders/:id/notes", wrapAuthHandler(addInternalNotes));

export default router;