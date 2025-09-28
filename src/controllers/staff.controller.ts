import type { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { Types } from "mongoose";
import models from "../models";
import { AuthRequest } from "../types/auth.types";

/**
 * Get staff dashboard with sales summary and key metrics
 */
export async function getStaffDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Parallel queries for dashboard metrics
    const [
      todayOrdersCount,
      todayRevenue,
      pendingOrdersCount,
      processingOrdersCount,
      deliveredTodayCount,
      weeklyRevenue,
      monthlyRevenue,
      topDeliveryZones,
      recentOrders
    ] = await Promise.all([
      // Today's orders count
      models.order.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),

      // Today's revenue
      models.order.aggregate([
        {
          $match: {
            createdAt: { $gte: today, $lt: tomorrow },
            paymentStatus: "paid"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" }
          }
        }
      ]),

      // Pending orders count
      models.order.countDocuments({ status: "pending" }),

      // Processing orders count
      models.order.countDocuments({ status: "processing" }),

      // Delivered today count
      models.order.countDocuments({
        status: "delivered",
        updatedAt: { $gte: today, $lt: tomorrow }
      }),

      // Weekly revenue
      models.order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfWeek },
            paymentStatus: "paid"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" }
          }
        }
      ]),

      // Monthly revenue
      models.order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            paymentStatus: "paid"
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$total" }
          }
        }
      ]),

      // Top delivery zones
      models.order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: "$deliveryZone",
            count: { $sum: 1 },
            revenue: { $sum: "$total" }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 5
        }
      ]),

      // Recent orders
      models.order.find()
        .populate("customer", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderNumber status total paymentStatus deliveryZone createdAt customer")
    ]);

    const dashboardData = {
      todayOrders: todayOrdersCount,
      todayRevenue: todayRevenue[0]?.total || 0,
      pendingOrders: pendingOrdersCount,
      processingOrders: processingOrdersCount,
      deliveredToday: deliveredTodayCount,
      weeklyRevenue: weeklyRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      topDeliveryZones,
      recentOrders
    };

    res.status(HttpStatusCode.Ok).send({
      message: "Staff dashboard data retrieved successfully.",
      dashboard: dashboardData
    });
    return;

  } catch (error) {
    console.error("Error getting staff dashboard:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving dashboard data."
    });
    return;
  }
}

/**
 * Get orders with staff-specific filters and sorting
 */
export async function getStaffOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      deliveryZone,
      startDate,
      endDate,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (deliveryZone) {
      filter.deliveryZone = deliveryZone;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { 'billingInfo.firstName': searchRegex },
        { 'billingInfo.lastName': searchRegex },
        { 'billingInfo.phone': searchRegex }
      ];
    }

    // Execute queries in parallel
    const [orders, totalCount] = await Promise.all([
      models.order.find(filter)
        .populate("customer", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      models.order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(HttpStatusCode.Ok).send({
      message: "Orders retrieved successfully.",
      orders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
    return;

  } catch (error) {
    console.error("Error getting staff orders:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving orders."
    });
    return;
  }
}

/**
 * Update order status with staff-specific validations
 */
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reason, estimatedDeliveryDate, actualDeliveryDate, internalNotes } = req.body;
    const authReq = req as AuthRequest;

    // Validate order ID
    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    // Validate required status
    if (!status) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Status is required."
      });
      return;
    }

    // Validate status value
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid status value."
      });
      return;
    }

    // Validate reason for cancellation/refund
    if ((status === 'cancelled' || status === 'refunded') && !reason) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Reason is required for cancellation or refund."
      });
      return;
    }

    // Find the order
    const order = await models.order.findById(id);
    if (!order) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    // Prepare update object
    const updateData: any = {
      status,
      updatedBy: authReq.user._id
    };

    if (reason) {
      updateData.cancellationReason = reason;
    }

    if (estimatedDeliveryDate) {
      updateData.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
    }

    if (actualDeliveryDate && status === 'delivered') {
      updateData.actualDeliveryDate = new Date(actualDeliveryDate);
    }

    if (internalNotes) {
      updateData.internalNotes = internalNotes;
    }

    // Update the order
    const updatedOrder = await models.order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("customer", "firstName lastName email phone");

    res.status(HttpStatusCode.Ok).send({
      message: "Order status updated successfully.",
      order: updatedOrder
    });
    return;

  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error updating order status."
    });
    return;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentReference, paymentMethod, notes } = req.body;
    const authReq = req as AuthRequest;

    // Validate order ID
    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    // Validate required payment status
    if (!paymentStatus) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Payment status is required."
      });
      return;
    }

    // Validate payment status value
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid payment status value."
      });
      return;
    }

    // Find the order
    const order = await models.order.findById(id);
    if (!order) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    // Prepare update object
    const updateData: any = {
      paymentStatus,
      updatedBy: authReq.user._id
    };

    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    if (notes) {
      updateData.paymentNotes = notes;
    }

    // Update the order
    const updatedOrder = await models.order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("customer", "firstName lastName email phone");

    res.status(HttpStatusCode.Ok).send({
      message: "Payment status updated successfully.",
      order: updatedOrder
    });
    return;

  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error updating payment status."
    });
    return;
  }
}

/**
 * Get detailed order information for staff view
 */
export async function getOrderDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Validate order ID
    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    // Find the order with full details
    const order = await models.order.findById(id)
      .populate("customer", "firstName lastName email phone isActive")
      .populate("updatedBy", "firstName lastName email");

    if (!order) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    res.status(HttpStatusCode.Ok).send({
      message: "Order details retrieved successfully.",
      order
    });
    return;

  } catch (error) {
    console.error("Error getting order details:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving order details."
    });
    return;
  }
}

/**
 * Get today's orders for quick staff overview
 */
export async function getTodayOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await models.order.find({
      createdAt: { $gte: today, $lt: tomorrow }
    })
      .populate("customer", "firstName lastName phone")
      .sort({ createdAt: -1 });

    res.status(HttpStatusCode.Ok).send({
      message: "Today's orders retrieved successfully.",
      orders,
      count: orders.length
    });
    return;

  } catch (error) {
    console.error("Error getting today's orders:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving today's orders."
    });
    return;
  }
}

/**
 * Get all pending orders that need attention
 */
export async function getPendingOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await models.order.find({ status: "pending" })
      .populate("customer", "firstName lastName phone")
      .sort({ createdAt: 1 }); // Oldest first for priority

    res.status(HttpStatusCode.Ok).send({
      message: "Pending orders retrieved successfully.",
      orders,
      count: orders.length
    });
    return;

  } catch (error) {
    console.error("Error getting pending orders:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving pending orders."
    });
    return;
  }
}

/**
 * Get orders within a specific date range with analytics
 */
export async function getOrdersByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Start date and end date are required."
      });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get orders in date range
    const orders = await models.order.find({
      createdAt: { $gte: start, $lte: end }
    })
      .populate("customer", "firstName lastName phone")
      .sort({ createdAt: -1 });

    // Analytics aggregation
    const analytics = await models.order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            status: "$status",
            paymentStatus: "$paymentStatus"
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: "$total" }
        }
      }
    ]);

    res.status(HttpStatusCode.Ok).send({
      message: "Orders by date range retrieved successfully.",
      orders,
      analytics,
      dateRange: { startDate, endDate },
      totalOrders: orders.length
    });
    return;

  } catch (error) {
    console.error("Error getting orders by date range:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving orders by date range."
    });
    return;
  }
}

/**
 * Add or update internal notes for an order
 */
export async function addInternalNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { internalNotes, append = false } = req.body;
    const authReq = req as AuthRequest;

    // Validate order ID
    if (!Types.ObjectId.isValid(id)) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Invalid order ID format."
      });
      return;
    }

    if (!internalNotes) {
      res.status(HttpStatusCode.BadRequest).send({
        message: "Internal notes are required."
      });
      return;
    }

    // Find the order
    const order = await models.order.findById(id);
    if (!order) {
      res.status(HttpStatusCode.NotFound).send({
        message: "Order not found."
      });
      return;
    }

    // Prepare notes update
    let updatedNotes = internalNotes;
    if (append && order.internalNotes) {
      const timestamp = new Date().toISOString();
      const staffName = `${authReq.user.firstName} ${authReq.user.lastName}`;
      updatedNotes = `${order.internalNotes}\n\n[${timestamp} - ${staffName}]\n${internalNotes}`;
    }

    // Update the order
    const updatedOrder = await models.order.findByIdAndUpdate(
      id,
      { 
        internalNotes: updatedNotes,
        updatedBy: authReq.user._id
      },
      { new: true }
    ).populate("customer", "firstName lastName email phone");

    res.status(HttpStatusCode.Ok).send({
      message: "Internal notes updated successfully.",
      order: updatedOrder
    });
    return;

  } catch (error) {
    console.error("Error updating internal notes:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error updating internal notes."
    });
    return;
  }
}

/**
 * Get delivery schedule for today and upcoming days
 */
export async function getDeliverySchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, days = 3 } = req.query;
    
    const startDate = date ? new Date(date as string) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + parseInt(days as string));

    // Get orders scheduled for delivery
    const deliveryOrders = await models.order.find({
      $or: [
        {
          estimatedDeliveryDate: { $gte: startDate, $lt: endDate }
        },
        {
          status: { $in: ['confirmed', 'processing', 'shipped'] },
          createdAt: { $gte: startDate, $lt: endDate }
        }
      ]
    })
      .populate("customer", "firstName lastName phone")
      .sort({ estimatedDeliveryDate: 1, createdAt: 1 });

    // Group by delivery zone for better organization
    const scheduleByZone = deliveryOrders.reduce((acc: any, order: any) => {
      const zone = order.deliveryZone || 'unassigned';
      if (!acc[zone]) {
        acc[zone] = [];
      }
      acc[zone].push(order);
      return acc;
    }, {});

    res.status(HttpStatusCode.Ok).send({
      message: "Delivery schedule retrieved successfully.",
      schedule: scheduleByZone,
      totalDeliveries: deliveryOrders.length,
      dateRange: { startDate, endDate }
    });
    return;

  } catch (error) {
    console.error("Error getting delivery schedule:", error);
    res.status(HttpStatusCode.InternalServerError).send({
      message: "Error retrieving delivery schedule."
    });
    return;
  }
}