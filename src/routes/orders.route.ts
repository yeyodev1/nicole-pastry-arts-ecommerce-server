import { Router } from "express";
import {
  createOrder,
  getDeliveryZones,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrdersByCustomer
} from "../controllers/order.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { wrapAuthHandler } from "../utils/auth-wrapper";

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Private
 * @body {
 *   customer: ObjectId,
 *   items: Array<{
 *     product: ObjectId,
 *     productName: string,
 *     quantity: number,
 *     unitPrice: number,
 *     totalPrice: number,
 *     sku?: string,
 *     notes?: string
 *   }>,
 *   subtotal: number,
 *   tax?: number,
 *   taxRate?: number,
 *   discount?: number,
 *   discountType?: 'fixed' | 'percentage',
 *   discountCode?: string,
 *   total: number,
 *   paymentMethod?: 'cash' | 'card' | 'transfer' | 'mercately' | 'payphone' | 'other',
 *   paymentReference?: string,
 *   billingInfo: {
 *     fullName: string,
 *     cedula: string,
 *     phone: string,
 *     email?: string,
 *     address?: string
 *   },
 *   deliveryAddress: {
 *     street: string,
 *     city: string,
 *     state: string,
 *     zipCode: string,
 *     country: string,
 *     recipientName: string,
 *     recipientPhone: string,
 *     latitude?: number,
 *     longitude?: number,
 *     googleMapsLink?: string,
 *     locationNotes?: string
 *   },
 *   deliveryZone: 'samanes_suburbio' | 'norte_sur_esteros' | 'sambo' | 'via_costa' | 'aurora',
 *   shippingMethod?: 'pickup' | 'delivery',
 *   estimatedDeliveryDate?: Date,
 *   notes?: string,
 *   internalNotes?: string,
 *   mercatelyOrderId?: string
 * }
 * @note createdBy is automatically assigned from authenticated user
 * @note orderNumber is automatically generated (format: ORDER-YYYY-MM-XXX)
 */
router.post("/", wrapAuthHandler(createOrder));

/**
 * @route GET /api/orders/delivery-zones
 * @desc Get available delivery zones with pricing
 * @access Private
 */
router.get("/delivery-zones", wrapAuthHandler(getDeliveryZones));

/**
 * @route GET /api/orders
 * @desc Get all orders with pagination and filtering
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number,
 *   customer?: ObjectId,
 *   status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
 *   paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded',
 *   paymentMethod?: 'cash' | 'card' | 'transfer' | 'mercately',
 *   startDate?: string (ISO date),
 *   endDate?: string (ISO date)
 * }
 */
router.get("/", wrapAuthHandler(getAllOrders));

/**
 * @route GET /api/orders/customer/:customerId
 * @desc Get all orders for a specific customer
 * @access Private
 * @params {
 *   customerId: ObjectId
 * }
 * @query {
 *   page?: number,
 *   limit?: number
 * }
 */
router.get("/customer/:customerId", wrapAuthHandler(getOrdersByCustomer));

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private
 * @params {
 *   id: ObjectId
 * }
 */
router.get("/:id", wrapAuthHandler(getOrderById));

/**
 * @route PUT /api/orders/:id
 * @desc Update order by ID
 * @access Private
 * @params {
 *   id: ObjectId
 * }
 * @body {
 *   items?: Array<{
 *     product: ObjectId,
 *     productName: string,
 *     quantity: number,
 *     unitPrice: number,
 *     totalPrice: number,
 *     sku?: string,
 *     notes?: string
 *   }>,
 *   subtotal?: number,
 *   tax?: number,
 *   taxRate?: number,
 *   discount?: number,
 *   discountType?: 'fixed' | 'percentage',
 *   discountCode?: string,
 *   total?: number,
 *   status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled',
 *   paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded',
 *   paymentMethod?: 'cash' | 'card' | 'transfer' | 'mercately',
 *   paymentReference?: string,
 *   shippingAddress?: object,
 *   billingAddress?: object,
 *   shippingMethod?: 'pickup' | 'delivery',
 *   shippingCost?: number,
 *   estimatedDeliveryDate?: Date,
 *   actualDeliveryDate?: Date,
 *   notes?: string,
 *   internalNotes?: string,
 *   mercatelyOrderId?: string,
 *   updatedBy?: ObjectId
 * }
 */
router.put("/:id", wrapAuthHandler(updateOrder));

/**
 * @route DELETE /api/orders/:id
 * @desc Delete order by ID
 * @access Private
 * @params {
 *   id: ObjectId
 * }
 */
router.delete("/:id", wrapAuthHandler(deleteOrder));

export default router;