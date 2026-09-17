/**
 * Helper utility to determine if a satellite or hardware node has a genuine
 * external child website registered, avoiding self-referential loops or fake placeholders.
 */

export const isValidChildUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === 'N/A' ||
    trimmed === 'none' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === '-'
  ) {
    return false;
  }

  // Prevent recursive internal routes (like /site/... or current hostname)
  if (trimmed.startsWith('/site/') || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return false;
  }

  if (typeof window !== 'undefined') {
    const currentHost = window.location.host;
    const currentOrigin = window.location.origin;
    if (trimmed.includes(currentHost) || (currentOrigin && trimmed.includes(currentOrigin))) {
      return false;
    }
  }

  // Must be an actual URL with protocol or domain format
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    (trimmed.includes('.') && !trimmed.includes(' ') && trimmed.length > 4)
  );
};

export const formatExternalUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export interface ParsedLocationCoordinates {
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  success: boolean;
  message?: string;
}

/**
 * Parses user input that may be raw coordinates (e.g. "18.5204, 73.8567"),
 * or a Google Maps URL (e.g. containing /@lat,lng or ?q=lat,lng), or a maps link.
 */
export const parseLocationCoordinates = (input?: string | null): ParsedLocationCoordinates => {
  if (!input || typeof input !== 'string') {
    return { success: false, message: 'Please provide a coordinate pair or Google Maps URL.' };
  }
  let trimmed = input.trim();
  if (!trimmed) {
    return { success: false, message: 'Please provide a coordinate pair or Google Maps URL.' };
  }

  // Strip wrapping quotes or brackets
  trimmed = trimmed.replace(/^["'`<\[]+|["'`>\]]+$/g, '').trim();

  // 1. Check Google Maps URL with @lat,lng (e.g. https://www.google.com/maps/@18.52043,73.85674,15z)
  const atMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        googleMapsUrl: trimmed,
        success: true,
        message: `Extracted coordinates: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`
      };
    }
  }

  // 2. Check query parameter with q=lat,lng or query=lat,lng or ll=lat,lng
  const queryMatch = trimmed.match(/[?&](?:q|query|ll)=(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        googleMapsUrl: trimmed,
        success: true,
        message: `Extracted coordinates from query: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`
      };
    }
  }

  // 3. Check for standard coordinate pair like "18.5204, 73.8567" or "18.5204 73.8567"
  // Handles optional cardinal letters like 18.5204 N, 73.8567 E
  const coordRegex = /(-?\d{1,2}(?:\.\d+)?)\s*(?:°|[deg])?\s*([NSns])?[,\s\t/|]+(-?\d{1,3}(?:\.\d+)?)\s*(?:°|[deg])?\s*([EWew])?/;
  const coordMatch = trimmed.match(coordRegex);
  if (coordMatch) {
    let lat = parseFloat(coordMatch[1]);
    const latDir = coordMatch[2]?.toUpperCase();
    let lng = parseFloat(coordMatch[3]);
    const lngDir = coordMatch[4]?.toUpperCase();

    if (latDir === 'S' && lat > 0) lat = -lat;
    if (lngDir === 'W' && lng > 0) lng = -lng;

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const gMapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        googleMapsUrl: gMapsUrl,
        success: true,
        message: `Resolved Landlocked Coordinates: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`
      };
    }
  }

  // 4. If it is a generic Google Maps short link or search link (maps.app.goo.gl or goo.gl/maps)
  if (
    trimmed.includes('google.com/maps') ||
    trimmed.includes('maps.app.goo.gl') ||
    trimmed.includes('goo.gl/maps')
  ) {
    return {
      googleMapsUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
      success: true,
      message: 'Linked Google Maps location successfully'
    };
  }

  return {
    success: false,
    message: 'Could not extract coordinates. Use format like "18.5204, 73.8567" or a Google Maps link.'
  };
};

/**
 * Builds a reliable Google Maps URL from lat/lng or returns existing valid Google Maps URL.
 */
export const buildGoogleMapsUrl = (lat?: number, lng?: number, customUrl?: string): string => {
  if (customUrl && (customUrl.includes('maps') || customUrl.startsWith('http'))) {
    return customUrl;
  }
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
  }
  return '';
};

