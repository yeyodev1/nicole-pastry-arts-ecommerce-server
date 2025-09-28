import { Schema, model, Document, Types } from 'mongoose';

// TypeScript interface for Order Item
export interface IOrderItem {
  productId: string; // Mercately product web_id
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
}

// TypeScript interface for Billing Information
export interface IBillingInfo {
  cedula: string; // Ecuador national ID (mandatory)
  fullName: string;
  phone: string; // Mandatory phone number
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

// TypeScript interface for Delivery Zones
export type DeliveryZone = 'samanes_suburbio' | 'norte_sur_esteros' | 'sambo' | 'via_costa' | 'aurora';

// TypeScript interface for Order
export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string; // Unique order identifier (e.g., "ORDER-2024-001")
  customer: Types.ObjectId; // Reference to User model
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  discountCode?: string;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mercately' | 'payphone' | 'other';
  paymentReference?: string;
  // Mandatory billing information
  billingInfo: IBillingInfo;
  // Delivery information (separate from billing)
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    recipientName: string;
    recipientPhone: string;
    // Google Maps location fields (optional for faster delivery)
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    locationNotes?: string; // Additional location instructions
  };
  // Delivery zone and method
  deliveryZone: DeliveryZone; // Mandatory delivery zone selection
  shippingMethod: 'pickup' | 'delivery' | 'shipping';
  shippingCost: number;
  estimatedDeliveryDate?: Date;
  deliveryDateWithMargin?: Date; // Estimated delivery date + 2-3 days margin
  actualDeliveryDate?: Date;
  notes?: string;
  internalNotes?: string; // Only visible to staff/admin
  mercatelyOrderId?: string; // If synced with Mercately
  createdBy: Types.ObjectId; // User who created the order (staff/admin)
  updatedBy?: Types.ObjectId; // Last user who updated the order
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for Order Item
const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: String,
    required: [true, 'Product ID is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  productSku: {
    type: String,
    required: [true, 'Product SKU is required'],
    trim: true,
    maxlength: [50, 'Product SKU cannot exceed 50 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  productImage: {
    type: String,
    trim: true
  }
}, { _id: false });

// Mongoose Schema for Order
const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: false,
    trim: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
    index: true
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax cannot be negative'],
    default: 0
  },
  taxRate: {
    type: Number,
    required: [true, 'Tax rate is required'],
    min: [0, 'Tax rate cannot be negative'],
    max: [1, 'Tax rate cannot exceed 100%'],
    default: 0
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  discountCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'mercately', 'payphone', 'other'],
    required: [true, 'Payment method is required']
  },
  paymentReference: {
    type: String,
    trim: true
  },
  // Mandatory billing information
  billingInfo: {
    cedula: {
      type: String,
      required: [true, 'Cedula is required'],
      trim: true,
      validate: {
        validator: function(v: string) {
          // Ecuador cedula validation (10 digits)
          return /^\d{10}$/.test(v);
        },
        message: 'Cedula must be a valid 10-digit Ecuador national ID'
      }
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required for billing'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required for billing'],
      trim: true,
      validate: {
        validator: function(v: string) {
          // Ecuador phone validation (mobile: 09xxxxxxxx or landline: 0xxxxxxxx)
          return /^0[2-9]\d{7,8}$/.test(v);
        },
        message: 'Phone must be a valid Ecuador phone number'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Email must be a valid email address'
      }
    },
    address: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      zipCode: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true,
        default: 'Ecuador'
      }
    }
  },
  // Delivery information (separate from billing)
  deliveryAddress: {
    street: {
      type: String,
      required: [true, 'Delivery street is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Delivery city is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Delivery state is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Delivery zip code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Delivery country is required'],
      trim: true,
      default: 'Ecuador'
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true
    },
    recipientPhone: {
      type: String,
      required: [true, 'Recipient phone is required'],
      trim: true,
      validate: {
        validator: function(v: string) {
          // Ecuador phone validation
          return /^0[2-9]\d{7,8}$/.test(v);
        },
        message: 'Recipient phone must be a valid Ecuador phone number'
      }
    },
    // Google Maps location fields (optional for faster delivery)
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    googleMapsLink: {
      type: String,
      trim: true,
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Optional field
          
          // More permissive validation for various Google Maps and Waze URL formats
          const validPatterns = [
            /^https:\/\/(www\.)?google\.com\/maps/,           // Standard Google Maps
            /^https:\/\/maps\.google\.com/,                   // Alternative Google Maps
            /^https:\/\/goo\.gl\/maps/,                       // Google Maps short URL
            /^https:\/\/maps\.app\.goo\.gl/,                  // Google Maps app short URL
            /^https:\/\/(www\.)?google\.com\.ec\/maps/,       // Ecuador Google Maps
            /^https:\/\/maps\.google\.com\.ec/,               // Ecuador Google Maps alternative
            /^https:\/\/(www\.)?waze\.com\/ul/,               // Waze URLs
            /^https:\/\/(www\.)?waze\.com\/live-map/          // Waze live map URLs
          ];
          
          return validPatterns.some(pattern => pattern.test(v));
        },
        message: 'Link must be a valid Google Maps or Waze URL'
      }
    },
    locationNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Location notes cannot exceed 300 characters']
    }
  },
  // Delivery zone selection (mandatory)
  deliveryZone: {
    type: String,
    enum: ['samanes_suburbio', 'norte_sur_esteros', 'sambo', 'via_costa', 'aurora'],
    required: [true, 'Delivery zone is required'],
    index: true
  },
  shippingMethod: {
    type: String,
    enum: ['pickup', 'delivery', 'shipping'],
    required: [true, 'Shipping method is required'],
    default: 'delivery'
  },
  shippingCost: {
    type: Number,
    min: [0, 'Shipping cost cannot be negative'],
    default: 0
  },
  estimatedDeliveryDate: {
    type: Date
  },
  deliveryDateWithMargin: {
    type: Date,
    index: true
  },
  actualDeliveryDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  internalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  mercatelyOrderId: {
    type: String,
    trim: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
    index: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better query performance
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function(this: IOrder) {
  return `#${this.orderNumber}`;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function(this: IOrder) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total products count (unique products)
orderSchema.virtual('totalProducts').get(function(this: IOrder) {
  return this.items.length;
});

// Pre-save middleware to calculate delivery date with margin
orderSchema.pre('save', function(this: IOrder, next: any) {
  // Calculate delivery date with margin (2-3 days) if estimatedDeliveryDate is provided
  if (this.estimatedDeliveryDate && !this.deliveryDateWithMargin) {
    const marginDays = Math.floor(Math.random() * 2) + 2; // Random between 2-3 days
    const deliveryWithMargin = new Date(this.estimatedDeliveryDate);
    deliveryWithMargin.setDate(deliveryWithMargin.getDate() + marginDays);
    this.deliveryDateWithMargin = deliveryWithMargin;
  }
  
  next();
});

// Pre-save middleware to generate order number if not provided
orderSchema.pre('save', async function(this: IOrder, next: any) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last order number for this year-month
    const lastOrder = await model<IOrder>('Order').findOne({
      orderNumber: new RegExp(`^ORDER-${year}-${month}-`)
    }).sort({ orderNumber: -1 });
    
    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }
    
    this.orderNumber = `ORDER-${year}-${month}-${String(nextNumber).padStart(3, '0')}`;
  }
  
  // Validate that total matches calculated total
  const calculatedTotal = Number((this.subtotal + this.tax + this.shippingCost - this.discount).toFixed(2));
  const providedTotal = Number(this.total.toFixed(2));
  
  if (Math.abs(providedTotal - calculatedTotal) > 0.01) {
    return next(new Error(
      `Total amount does not match calculated total. ` +
      `Provided: ${providedTotal}, Calculated: ${calculatedTotal} ` +
      `(Subtotal: ${this.subtotal}, Tax: ${this.tax}, Shipping: ${this.shippingCost}, Discount: ${this.discount})`
    ));
  }
  
  next();
});

// Pre-save middleware to validate item totals
orderSchema.pre('save', function(this: IOrder, next: any) {
  for (const item of this.items) {
    const calculatedTotal = Number((item.quantity * item.unitPrice).toFixed(2));
    const providedTotal = Number(item.totalPrice.toFixed(2));
    
    if (Math.abs(providedTotal - calculatedTotal) > 0.01) {
      return next(new Error(
        `Item total for ${item.productName} does not match calculated total. ` +
        `Provided: ${providedTotal}, Calculated: ${calculatedTotal} ` +
        `(Quantity: ${item.quantity}, Unit Price: ${item.unitPrice})`
      ));
    }
  }
  
  // Validate subtotal matches sum of item totals
  const calculatedSubtotal = Number(this.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
  const providedSubtotal = Number(this.subtotal.toFixed(2));
  
  if (Math.abs(providedSubtotal - calculatedSubtotal) > 0.01) {
    return next(new Error(
      `Subtotal does not match sum of item totals. ` +
      `Provided: ${providedSubtotal}, Calculated: ${calculatedSubtotal}`
    ));
  }
  
  next();
});

const Order = model<IOrder>('Order', orderSchema);

export default Order;