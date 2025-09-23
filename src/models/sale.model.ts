import { Schema, model, Document, Types } from 'mongoose';

// TypeScript interface for Sale Item
export interface ISaleItem {
  productId: string; // Mercately product web_id
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
}

// TypeScript interface for Sale
export interface ISale extends Document {
  _id: Types.ObjectId;
  saleNumber: string; // Unique sale identifier (e.g., "SALE-2024-001")
  customer: Types.ObjectId; // Reference to User model
  items: ISaleItem[];
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
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    recipientName: string;
    recipientPhone: string;
  };
  shippingMethod: 'pickup' | 'delivery' | 'shipping';
  shippingCost: number;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  internalNotes?: string; // Only visible to staff/admin
  mercatelyOrderId?: string; // If synced with Mercately
  createdBy: Types.ObjectId; // User who created the sale (staff/admin)
  updatedBy?: Types.ObjectId; // Last user who updated the sale
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema for Sale Item
const saleItemSchema = new Schema<ISaleItem>({
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

// Mongoose Schema for Sale
const saleSchema = new Schema<ISale>({
  saleNumber: {
    type: String,
    required: [true, 'Sale number is required'],
    unique: true,
    trim: true,
    index: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required'],
    index: true
  },
  items: {
    type: [saleItemSchema],
    required: [true, 'Sale items are required'],
    validate: {
      validator: function(items: ISaleItem[]) {
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
saleSchema.index({ createdAt: -1 });
saleSchema.index({ customer: 1, createdAt: -1 });
saleSchema.index({ status: 1, createdAt: -1 });
saleSchema.index({ paymentStatus: 1, createdAt: -1 });
saleSchema.index({ saleNumber: 1 }, { unique: true });

// Virtual for formatted sale number
saleSchema.virtual('formattedSaleNumber').get(function(this: ISale) {
  return `#${this.saleNumber}`;
});

// Virtual for total items count
saleSchema.virtual('totalItems').get(function(this: ISale) {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total products count (unique products)
saleSchema.virtual('totalProducts').get(function(this: ISale) {
  return this.items.length;
});

// Pre-save middleware to generate sale number if not provided
saleSchema.pre('save', async function(this: ISale, next: any) {
  if (!this.saleNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last sale number for this year-month
    const lastSale = await model<ISale>('Sale').findOne({
      saleNumber: new RegExp(`^SALE-${year}-${month}-`)
    }).sort({ saleNumber: -1 });
    
    let nextNumber = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.split('-').pop() || '0');
      nextNumber = lastNumber + 1;
    }
    
    this.saleNumber = `SALE-${year}-${month}-${String(nextNumber).padStart(3, '0')}`;
  }
  
  // Validate that total matches calculated total
  const calculatedTotal = this.subtotal + this.tax + this.shippingCost - this.discount;
  if (Math.abs(this.total - calculatedTotal) > 0.01) {
    return next(new Error('Total amount does not match calculated total'));
  }
  
  next();
});

// Pre-save middleware to validate item totals
saleSchema.pre('save', function(this: ISale, next: any) {
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

const Sale = model<ISale>('Sale', saleSchema);

export default Sale;