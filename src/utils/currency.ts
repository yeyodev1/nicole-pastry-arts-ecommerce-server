/**
 * Currency utility functions for handling monetary conversions
 */

/**
 * Convert cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars with 2 decimal places
 */
export function centsToDollars(cents: number): number {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return 0;
  }
  return Number((cents / 100).toFixed(2));
}

/**
 * Convert dollars to cents
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  if (typeof dollars !== 'number' || isNaN(dollars)) {
    return 0;
  }
  return Math.round(dollars * 100);
}

/**
 * Format currency for display
 * @param amount - Amount in dollars
 * @param currency - Currency symbol (default: '$')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '$'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency}0.00`;
  }
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Validate if a monetary value is valid
 * @param value - Value to validate
 * @returns True if valid monetary value
 */
export function isValidMonetaryValue(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Detect if a monetary value is likely in cents (vs dollars)
 * @param value - Monetary value to check
 * @param referenceValue - Optional reference value to compare against
 * @returns True if value appears to be in cents
 */
function isLikelyInCents(value: number, referenceValue?: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  
  // If we have a reference value, compare magnitudes
  if (referenceValue && typeof referenceValue === 'number' && !isNaN(referenceValue)) {
    // If the value is more than 50x the reference, it's likely in cents
    if (value > (referenceValue * 50)) {
      return true;
    }
  }
  
  // If value is greater than 1000 and is a whole number, likely cents
  if (value >= 1000 && Number.isInteger(value)) {
    return true;
  }
  
  // If value has no decimal places and is > 100, likely cents
  if (Number.isInteger(value) && value > 100) {
    return true;
  }
  
  return false;
}

/**
 * Smart conversion that detects if values need conversion from cents to dollars
 * @param value - Value to potentially convert
 * @param referenceValue - Optional reference value for comparison
 * @returns Value in dollars
 */
function smartCurrencyConvert(value: number, referenceValue?: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 0;
  }
  
  if (isLikelyInCents(value, referenceValue)) {
    return centsToDollars(value);
  }
  
  return value;
}

/**
 * Convert monetary values from cents to dollars for order processing
 * @param orderData - Order data with monetary values in mixed formats
 * @returns Order data with monetary values in dollars
 */
export function convertOrderMonetaryValues(orderData: any): any {
  const converted = { ...orderData };
  
  // First, determine reference values (subtotal is usually most reliable)
  const subtotalRef = converted.subtotal;
  
  // Smart convert main monetary fields
  if (converted.subtotal !== undefined) {
    converted.subtotal = smartCurrencyConvert(converted.subtotal);
  }
  if (converted.tax !== undefined) {
    converted.tax = smartCurrencyConvert(converted.tax, subtotalRef);
  }
  if (converted.discount !== undefined) {
    converted.discount = smartCurrencyConvert(converted.discount, subtotalRef);
  }
  if (converted.total !== undefined) {
    converted.total = smartCurrencyConvert(converted.total, subtotalRef);
  }
  if (converted.shippingCost !== undefined) {
    converted.shippingCost = smartCurrencyConvert(converted.shippingCost, subtotalRef);
  }
  
  // Convert item monetary values
  if (converted.items && Array.isArray(converted.items)) {
    converted.items = converted.items.map((item: any) => ({
      ...item,
      unitPrice: item.unitPrice !== undefined ? smartCurrencyConvert(item.unitPrice, subtotalRef) : item.unitPrice,
      totalPrice: item.totalPrice !== undefined ? smartCurrencyConvert(item.totalPrice, subtotalRef) : item.totalPrice
    }));
  }
  
  return converted;
}