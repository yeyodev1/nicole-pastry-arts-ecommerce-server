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
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mercately' | 'other';
  paymentReference?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    recipientName: string;
    recipientPhone: string;
    // Google Maps location fields
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    locationNotes?: string; // Additional location instructions
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    recipientName: string;
    recipientPhone: string;
    // Google Maps location fields
    latitude?: number;
    longitude?: number;
    googleMapsLink?: string;
    locationNotes?: string; // Additional location instructions
  };
  shippingMethod: 'pickup' | 'delivery' | 'shipping';
  shippingCost: number;
  estimatedDeliveryDate?: Date;
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
    required: [true, 'Order number is required'],
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
    enum: ['cash', 'card', 'transfer', 'mercately', 'other'],
    required: [true, 'Payment method is required']
  },
  paymentReference: {
    type: String,
    trim: true
  },
  shippingAddress: {
    street: {
      type: String,
      required: [true, 'Shipping street is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Shipping city is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Shipping state is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Shipping zip code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Shipping country is required'],
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
      trim: true
    },
    // Google Maps location fields
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
          return /^https:\/\/(www\.)?google\.com\/maps/.test(v) || /^https:\/\/maps\.google\.com/.test(v) || /^https:\/\/goo\.gl\/maps/.test(v);
        },
        message: 'Google Maps link must be a valid Google Maps URL'
      }
    },
    locationNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Location notes cannot exceed 300 characters']
    }
  },
  billingAddress: {
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
    },
    recipientName: {
      type: String,
      trim: true
    },
    recipientPhone: {
      type: String,
      trim: true
    },
    // Google Maps location fields
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
          return /^https:\/\/(www\.)?google\.com\/maps/.test(v) || /^https:\/\/maps\.google\.com/.test(v) || /^https:\/\/goo\.gl\/maps/.test(v);
        },
        message: 'Google Maps link must be a valid Google Maps URL'
      }
    },
    locationNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Location notes cannot exceed 300 characters']
    }
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
  const calculatedTotal = this.subtotal + this.tax + this.shippingCost - this.discount;
  if (Math.abs(this.total - calculatedTotal) > 0.01) {
    return next(new Error('Total amount does not match calculated total'));
  }
  
  next();
});

// Pre-save middleware to validate item totals
orderSchema.pre('save', function(this: IOrder, next: any) {
  for (const item of this.items) {
    const calculatedTotal = item.quantity * item.unitPrice;
    if (Math.abs(item.totalPrice - calculatedTotal) > 0.01) {
      return next(new Error(`Item total for ${item.productName} does not match calculated total`));
    }
  }
  
  // Validate subtotal matches sum of item totals
  const calculatedSubtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  if (Math.abs(this.subtotal - calculatedSubtotal) > 0.01) {
    return next(new Error('Subtotal does not match sum of item totals'));
  }
  
  next();
});

const Order = model<IOrder>('Order', orderSchema);

export default Order;