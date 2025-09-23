/**
 * Google Maps utility functions
 */

/**
 * Generate a Google Maps link from latitude and longitude coordinates
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param label - Optional label for the location
 * @returns Google Maps URL
 */
export function generateGoogleMapsLink(
  latitude: number, 
  longitude: number, 
  label?: string
): string {
  const baseUrl = 'https://www.google.com/maps';
  const coords = `${latitude},${longitude}`;
  
  if (label) {
    // URL encode the label to handle special characters
    const encodedLabel = encodeURIComponent(label);
    return `${baseUrl}/place/${encodedLabel}/@${coords},17z`;
  }
  
  return `${baseUrl}/@${coords},17z`;
}

/**
 * Generate a Google Maps directions link to a specific location
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param label - Optional label for the destination
 * @returns Google Maps directions URL
 */
export function generateGoogleMapsDirectionsLink(
  latitude: number, 
  longitude: number, 
  label?: string
): string {
  const baseUrl = 'https://www.google.com/maps/dir';
  const destination = `${latitude},${longitude}`;
  
  if (label) {
    const encodedLabel = encodeURIComponent(label);
    return `${baseUrl}//${encodedLabel}/@${destination},17z`;
  }
  
  return `${baseUrl}//${destination}`;
}

/**
 * Validate if coordinates are within valid ranges
 * @param latitude - Latitude to validate
 * @param longitude - Longitude to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateCoordinates(latitude: number, longitude: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return {
      isValid: false,
      error: 'Latitude and longitude must be numbers'
    };
  }

  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      error: 'Latitude must be between -90 and 90 degrees'
    };
  }

  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      error: 'Longitude must be between -180 and 180 degrees'
    };
  }

  return { isValid: true };
}

/**
 * Extract coordinates from a Google Maps link
 * @param googleMapsLink - Google Maps URL
 * @returns Object with extracted coordinates or null if not found
 */
export function extractCoordinatesFromGoogleMapsLink(googleMapsLink: string): {
  latitude: number;
  longitude: number;
} | null {
  try {
    // Pattern to match coordinates in Google Maps URLs
    const coordPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const match = googleMapsLink.match(coordPattern);
    
    if (match && match[1] && match[2]) {
      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      
      const validation = validateCoordinates(latitude, longitude);
      if (validation.isValid) {
        return { latitude, longitude };
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Auto-generate Google Maps link if coordinates are provided but link is missing
 * @param shippingAddress - Shipping address object
 * @returns Updated shipping address with Google Maps link if applicable
 */
export function autoGenerateGoogleMapsLink(shippingAddress: any): any {
  if (!shippingAddress) return shippingAddress;
  
  const { latitude, longitude, googleMapsLink, recipientName, street, city } = shippingAddress;
  
  // If coordinates exist but no Google Maps link, generate one
  if (latitude && longitude && !googleMapsLink) {
    const label = recipientName || `${street}, ${city}`;
    shippingAddress.googleMapsLink = generateGoogleMapsLink(latitude, longitude, label);
  }
  
  return shippingAddress;
}