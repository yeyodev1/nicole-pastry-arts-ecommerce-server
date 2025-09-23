import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrdersByCustomer
} from "../controllers/order.controller";

const router = Router();

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
 *   paymentMethod?: 'cash' | 'card' | 'transfer' | 'mercately',
 *   paymentReference?: string,
 *   shippingAddress?: object,
 *   billingAddress?: object,
 *   shippingMethod?: 'pickup' | 'delivery',
 *   shippingCost?: number,
 *   estimatedDeliveryDate?: Date,
 *   notes?: string,
 *   internalNotes?: string,
 *   mercatelyOrderId?: string,
 *   createdBy: ObjectId
 * }
 */
router.post("/", createOrder);

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
router.get("/", getAllOrders);

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
router.get("/customer/:customerId", getOrdersByCustomer);

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private
 * @params {
 *   id: ObjectId
 * }
 */
router.get("/:id", getOrderById);

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
router.put("/:id", updateOrder);

/**
 * @route DELETE /api/orders/:id
 * @desc Delete order by ID
 * @access Private
 * @params {
 *   id: ObjectId
 * }
 */
router.delete("/:id", deleteOrder);

export default router;