import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { HttpStatusCode } from "axios";
import models from "../models";
import { handleControllerError } from "../utils/error-handler";
import { convertOrderMonetaryValues } from "../utils/currency";
import { validateCoordinates, extractCoordinatesFromGoogleMapsLink, autoGenerateGoogleMapsLink } from "../utils/google-maps";
import { validateEcuadorCedula, validateEcuadorPhone, getDeliveryZonePrice, isValidDeliveryZone, getAvailableDeliveryZones } from "../utils/ecuador-validation";
import type { AuthRequest } from "../types/auth.types";
import type { DeliveryZone } from "../models/order.model";

/**
 * Create a new order
 * @route POST /api/orders
 */
async function createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      customer,
      items,
      subtotal,
      tax,
      taxRate,
      discount,
      discountType,
      discountCode,
      total,
      paymentMethod,
      paymentReference,
      paymentStatus,
      billingInfo,
      deliveryAddress,
      deliveryZone,
      shippingMethod,
      estimatedDeliveryDate,
      notes,
      internalNotes,
      mercatelyOrderId
    } = req.body;

    // Get authenticated user as createdBy
    const createdBy = req.user._id;

    // Convert monetary values from cents to dollars
    const convertedOrderData = convertOrderMonetaryValues(req.body);

    // Validate required fields
    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Customer and items are required."
      });
      return;
    }

    if (!Types.ObjectId.isValid(customer)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid customer ID format."
      });
      return;
    }

    // Validate billing information
    if (!billingInfo || !billingInfo.cedula || !billingInfo.fullName || !billingInfo.phone) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Billing information with cedula, full name, and phone are required."
      });
      return;
    }

    // Validate Ecuador cedula
    if (!validateEcuadorCedula(billingInfo.cedula)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid Ecuador cedula format."
      });
      return;
    }

    // Validate Ecuador phone numbers
    if (!validateEcuadorPhone(billingInfo.phone)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid Ecuador phone number format for billing."
      });
      return;
    }

    // Validate delivery address
    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || 
        !deliveryAddress.recipientName || !deliveryAddress.recipientPhone) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Complete delivery address information is required."
      });
      return;
    }

    // Validate delivery zone
    if (!deliveryZone || !isValidDeliveryZone(deliveryZone)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Valid delivery zone is required."
      });
      return;
    }

    // Validate delivery phone
    if (!validateEcuadorPhone(deliveryAddress.recipientPhone)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid Ecuador phone number format for delivery."
      });
      return;
    }

    // Validate customer exists
    const customerExists = await models.user.findById(customer);
    if (!customerExists) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Customer not found."
      });
      return;
    }

    // Validate Google Maps location data if provided
    if (deliveryAddress) {
      const { latitude, longitude, googleMapsLink } = deliveryAddress;
      
      // If coordinates are provided, validate them
      if (latitude !== undefined || longitude !== undefined) {
        if (latitude === undefined || longitude === undefined) {
          res.status(HttpStatusCode.BadRequest).send({
            message: "Both latitude and longitude are required when providing coordinates."
          });
          return;
        }
        
        const coordinatesValidation = validateCoordinates(latitude, longitude);
        if (!coordinatesValidation.isValid) {
          res.status(HttpStatusCode.BadRequest).send({
            message: coordinatesValidation.error
          });
          return;
        }
      }
      
      // If Google Maps link is provided without coordinates, try to extract them
      if (googleMapsLink && !latitude && !longitude) {
        const extractedCoords = extractCoordinatesFromGoogleMapsLink(googleMapsLink);
        if (extractedCoords) {
          deliveryAddress.latitude = extractedCoords.latitude;
          deliveryAddress.longitude = extractedCoords.longitude;
        }
      }
      
      // Auto-generate Google Maps link if coordinates exist but link doesn't
      autoGenerateGoogleMapsLink(deliveryAddress);
    }

    // Calculate shipping cost based on delivery zone
    const calculatedShippingCost = getDeliveryZonePrice(deliveryZone as DeliveryZone);

    // Recalculate subtotal from item totals (this is the correct approach)
    const calculatedSubtotal = Number(convertedOrderData.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0).toFixed(2));
    
    // Calculate tax based on the corrected subtotal
    const calculatedTax = Number((calculatedSubtotal * (taxRate || 0)).toFixed(2));
    
    // Use provided discount or default to 0
    const calculatedDiscount = convertedOrderData.discount || 0;
    
    // Calculate final total
    const calculatedTotal = calculatedSubtotal + calculatedTax + calculatedShippingCost - calculatedDiscount;

    // Determine payment status - if paymentReference exists and no explicit status provided, assume paid
    let finalPaymentStatus = paymentStatus || 'pending';
    if (!paymentStatus && paymentReference && String(paymentReference).trim() !== '') {
      finalPaymentStatus = 'paid';
    }

    // Create the order using converted monetary values and calculated total
    const newOrder = new models.order({
      customer,
      items: convertedOrderData.items,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      taxRate: taxRate || 0,
      discount: calculatedDiscount,
      discountType: discountType || 'fixed',
      discountCode,
      total: Number(calculatedTotal.toFixed(2)), // Use calculated total instead of provided
      paymentMethod: paymentMethod || 'cash',
      paymentReference,
      paymentStatus: finalPaymentStatus, // Handle payment status intelligently
      billingInfo,
      deliveryAddress,
      deliveryZone: deliveryZone as DeliveryZone,
      shippingMethod: shippingMethod || 'delivery',
      shippingCost: calculatedShippingCost,
      estimatedDeliveryDate,
      notes,
      internalNotes,
      mercatelyOrderId,
      createdBy
    });

    const savedOrder = await newOrder.save();

    // Add order to customer's orders array
    await models.user.findByIdAndUpdate(
      customer,
      { $push: { orders: savedOrder._id } }
    );

    res.status(HttpStatusCode.Created).send({
      message: "Order created successfully.",
      order: savedOrder
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Create order");
  }
}

/**
 * Get available delivery zones with pricing
 * @route GET /api/orders/delivery-zones
 */
async function getDeliveryZones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deliveryZones = getAvailableDeliveryZones();

    res.status(HttpStatusCode.Ok).send({
      message: "Delivery zones retrieved successfully.",
      deliveryZones
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get delivery zones");
  }
}

/**
 * Get all orders with pagination and filtering
 * @route GET /api/orders
 */
async function getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    
    if (req.query.customer) {
      if (!Types.ObjectId.isValid(req.query.customer as string)) {
        res.status(HttpStatusCode.BadRequest).send({
          message: "Invalid customer ID format."
        });
        return;
      }
      filter.customer = req.query.customer;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    // Execute queries in parallel
    const [orders, totalOrders] = await Promise.all([
      models.order
        .find(filter)
        .populate('customer', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      models.order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(HttpStatusCode.Ok).send({
      message: "Orders retrieved successfully.",
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get all orders");
  }
}

/**
 * Get order by ID
 * @route GET /api/orders/:id
 */
async function getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    const order = await models.order
      .findById(id)
      .populate('customer', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!order) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    res.status(HttpStatusCode.Ok).send({
      message: "Order retrieved successfully.",
      order
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get order by ID");
  }
}

/**
 * Update order by ID
 * @route PUT /api/orders/:id
 */
async function updateOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Set updatedBy to authenticated user
    updateData.updatedBy = req.user._id;

    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    // Check if order exists
    const existingOrder = await models.order.findById(id);
    if (!existingOrder) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    // Validate Google Maps location data if shippingAddress is being updated
    if (updateData.shippingAddress) {
      const { latitude, longitude, googleMapsLink } = updateData.shippingAddress;
      
      // If coordinates are provided, validate them
      if (latitude !== undefined || longitude !== undefined) {
        if (latitude === undefined || longitude === undefined) {
          res.status(HttpStatusCode.BadRequest).send({
            message: "Both latitude and longitude are required when providing coordinates."
          });
          return;
        }
        
        const coordinatesValidation = validateCoordinates(latitude, longitude);
        if (!coordinatesValidation.isValid) {
          res.status(HttpStatusCode.BadRequest).send({
            message: coordinatesValidation.error
          });
          return;
        }
      }
      
      // If Google Maps link is provided without coordinates, try to extract them
      if (googleMapsLink && !latitude && !longitude) {
        const extractedCoords = extractCoordinatesFromGoogleMapsLink(googleMapsLink);
        if (extractedCoords) {
          updateData.shippingAddress.latitude = extractedCoords.latitude;
          updateData.shippingAddress.longitude = extractedCoords.longitude;
        }
      }
      
      // Auto-generate Google Maps link if coordinates exist but link doesn't
      autoGenerateGoogleMapsLink(updateData.shippingAddress);
    }

    // Update the order
    const updatedOrder = await models.order
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('customer', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    res.status(HttpStatusCode.Ok).send({
      message: "Order updated successfully.",
      order: updatedOrder
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Update order");
  }
}

/**
 * Delete order by ID
 * @route DELETE /api/orders/:id
 */
async function deleteOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    const order = await models.order.findById(id);
    if (!order) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    // Remove order from customer's orders array
    await models.user.findByIdAndUpdate(
      order.customer,
      { $pull: { orders: order._id } }
    );

    // Delete the order
    await models.order.findByIdAndDelete(id);

    res.status(HttpStatusCode.Ok).send({
      message: "Order deleted successfully."
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Delete order");
  }
}

/**
 * Get orders by customer ID
 * @route GET /api/orders/customer/:customerId
 */
async function getOrdersByCustomer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!Types.ObjectId.isValid(customerId)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid customer ID format."
      });
      return;
    }

    // Check if customer exists
    const customer = await models.user.findById(customerId);
    if (!customer) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Customer not found."
      });
      return;
    }

    // Execute queries in parallel
    const [orders, totalOrders] = await Promise.all([
      models.order
        .find({ customer: customerId })
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      models.order.countDocuments({ customer: customerId })
    ]);

    const totalPages = Math.ceil(totalOrders / limit);

    res.status(HttpStatusCode.Ok).send({
      message: "Customer orders retrieved successfully.",
      orders,
      customer: {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get orders by customer");
  }
}

export {
  createOrder,
  getDeliveryZones,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrdersByCustomer
};