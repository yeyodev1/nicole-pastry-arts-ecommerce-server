import type { DeliveryZone } from '../models/order.model';

/**
 * Validates Ecuador cedula (national ID) using the official algorithm
 * @param cedula - The 10-digit cedula string
 * @returns boolean indicating if the cedula is valid
 */
export function validateEcuadorCedula(cedula: string): boolean {
  // Remove any non-digit characters and check length
  const cleanCedula = cedula.replace(/\D/g, '');
  if (cleanCedula.length !== 10) {
    return false;
  }

  // Convert to array of numbers
  const digits = cleanCedula.split('').map(Number);
  
  // Check province code (first two digits should be between 01-24)
  const provinceCode = parseInt(cleanCedula.substring(0, 2));
  if (provinceCode < 1 || provinceCode > 24) {
    return false;
  }

  // Check third digit (should be less than 6 for natural persons)
  if (digits[2] >= 6) {
    return false;
  }

  // Calculate verification digit using Ecuador's algorithm
  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let product = digits[i] * coefficients[i];
    if (product >= 10) {
      product = product - 9;
    }
    sum += product;
  }

  const remainder = sum % 10;
  const verificationDigit = remainder === 0 ? 0 : 10 - remainder;

  return verificationDigit === digits[9];
}

/**
 * Validates Ecuador phone number format
 * @param phone - The phone number string
 * @returns boolean indicating if the phone is valid
 */
export function validateEcuadorPhone(phone: string): boolean {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Ecuador phone formats:
  // Mobile: 09xxxxxxxx (10 digits starting with 09)
  // Landline: 0xxxxxxxx (9 digits starting with 0, second digit 2-7)
  
  if (cleanPhone.length === 10 && cleanPhone.startsWith('09')) {
    return true; // Mobile phone
  }
  
  if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) {
    const secondDigit = parseInt(cleanPhone[1]);
    return secondDigit >= 2 && secondDigit <= 7; // Landline
  }
  
  return false;
}

/**
 * Delivery zone pricing configuration for Guayaquil, Ecuador
 */
export const DELIVERY_ZONE_PRICES: Record<DeliveryZone, number> = {
  samanes_suburbio: 6.00,    // Samanes and Suburbio: $6
  norte_sur_esteros: 7.00,   // Norte de Guayaquil (Pascuales) or Sur (Esteros): $7
  sambo: 6.00,               // Sambo: $6
  via_costa: 7.00,           // Vía a la Costa: $7
  aurora: 8.00               // Aurora: $8
};

/**
 * Gets the delivery price for a specific zone
 * @param zone - The delivery zone
 * @returns The price in USD for the delivery zone
 */
export function getDeliveryZonePrice(zone: DeliveryZone): number {
  return DELIVERY_ZONE_PRICES[zone];
}

/**
 * Gets all available delivery zones with their prices
 * @returns Array of delivery zones with their information
 */
export function getAvailableDeliveryZones(): Array<{
  zone: DeliveryZone;
  name: string;
  price: number;
  description: string;
}> {
  return [
    {
      zone: 'samanes_suburbio',
      name: 'Samanes y Suburbio',
      price: DELIVERY_ZONE_PRICES.samanes_suburbio,
      description: 'Samanes and Suburbio areas'
    },
    {
      zone: 'norte_sur_esteros',
      name: 'Norte/Sur de Guayaquil',
      price: DELIVERY_ZONE_PRICES.norte_sur_esteros,
      description: 'Norte de Guayaquil (Pascuales) or Sur de Guayaquil (Esteros)'
    },
    {
      zone: 'sambo',
      name: 'Sambo',
      price: DELIVERY_ZONE_PRICES.sambo,
      description: 'Sambo area'
    },
    {
      zone: 'via_costa',
      name: 'Vía a la Costa',
      price: DELIVERY_ZONE_PRICES.via_costa,
      description: 'Vía a la Costa area'
    },
    {
      zone: 'aurora',
      name: 'Aurora',
      price: DELIVERY_ZONE_PRICES.aurora,
      description: 'Aurora area'
    }
  ];
}

/**
 * Validates if a delivery zone is valid
 * @param zone - The delivery zone to validate
 * @returns boolean indicating if the zone is valid
 */
export function isValidDeliveryZone(zone: string): zone is DeliveryZone {
  return Object.keys(DELIVERY_ZONE_PRICES).includes(zone as DeliveryZone);
}