import type { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import models from "../models";
import { handleControllerError } from "../utils/error-handler";
import { HttpStatusCode } from "axios";
import { 
  validateCoordinates, 
  autoGenerateGoogleMapsLink,
  extractCoordinatesFromGoogleMapsLink 
} from "../utils/google-maps";

/**
 * Create a new order
 * @route POST /api/orders
 */
async function createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      shippingAddress,
      billingAddress,
      shippingMethod,
      shippingCost,
      estimatedDeliveryDate,
      notes,
      internalNotes,
      mercatelyOrderId,
      createdBy
    } = req.body;

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

    if (!createdBy || !Types.ObjectId.isValid(createdBy)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Valid createdBy user ID is required."
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

    // Validate createdBy user exists
    const createdByUser = await models.user.findById(createdBy);
    if (!createdByUser) {
      res.status(HttpStatusCode.NotFound).send({
        message: "CreatedBy user not found."
      });
      return;
    }

    // Validate Google Maps location data if provided
    if (shippingAddress) {
      const { latitude, longitude, googleMapsLink } = shippingAddress;
      
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
          shippingAddress.latitude = extractedCoords.latitude;
          shippingAddress.longitude = extractedCoords.longitude;
        }
      }
      
      // Auto-generate Google Maps link if coordinates exist but link doesn't
      autoGenerateGoogleMapsLink(shippingAddress);
    }

    // Create the order
    const newOrder = new models.order({
      customer,
      items,
      subtotal: subtotal || 0,
      tax: tax || 0,
      taxRate: taxRate || 0,
      discount: discount || 0,
      discountType: discountType || 'fixed',
      discountCode,
      total: total || subtotal || 0,
      paymentMethod: paymentMethod || 'cash',
      paymentReference,
      shippingAddress,
      billingAddress,
      shippingMethod: shippingMethod || 'delivery',
      shippingCost: shippingCost || 0,
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
 * Get all orders with pagination and filtering
 * @route GET /api/orders
 */
async function getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
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
async function getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
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
async function updateOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { updatedBy, ...updateData } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    if (updatedBy && !Types.ObjectId.isValid(updatedBy)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid updatedBy user ID format."
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

    // If updatedBy is provided, validate user exists
    if (updatedBy) {
      const updatedByUser = await models.user.findById(updatedBy);
      if (!updatedByUser) {
        res.status(HttpStatusCode.NotFound).send({
          message: "UpdatedBy user not found."
        });
        return;
      }
      updateData.updatedBy = updatedBy;
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
async function deleteOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
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
async function getOrdersByCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrdersByCustomer
};