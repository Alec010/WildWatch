/**
 * Utility functions for formatting location displays
 */

interface LocationData {
  location?: string;
  formattedAddress?: string;
  buildingName?: string;
  buildingCode?: string;
  room?: string; // Optional specific room/location within the building
  building?: {
    fullName?: string;
    code?: string;
  };
}

/**
 * Helper function to format building codes/names by replacing underscores with spaces
 * Example: "NGE_BUILDING" → "NGE BUILDING"
 */
function formatBuildingText(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.replace(/_/g, ' ');
}

/**
 * Formats a raw location string by replacing underscores with spaces
 * Used when location is stored as a single string in the database
 * Example: "NGE_BUILDING - 7VVJ+QFR..." → "NGE BUILDING - 7VVJ+QFR..."
 */
export function formatLocationString(location: string | null | undefined): string {
  if (!location) return 'Location not specified';
  return location.replace(/_/g, ' ');
}

/**
 * Formats location for display according to the agreed format:
 * IF building exists AND room exists: "BuildingCode - Room - FullAddress"
 * ELSE IF building exists: "BuildingCode - FullAddress"
 * ELSE IF room exists: "Room - FullAddress"
 * ELSE: "FullAddress" (or location/coordinates as fallback)
 * 
 * Example outputs:
 * - "RTL - RTL203 - Cebu Institute of Technology - University, N. Bacalso Ave, Cebu City, 6000 Cebu, Philippines"
 * - "RTL - Cebu Institute of Technology - University, N. Bacalso Ave, Cebu City, 6000 Cebu, Philippines"
 * - "RTL203 - Cebu Institute of Technology - University, N. Bacalso Ave, Cebu City, 6000 Cebu, Philippines"
 */
export function formatLocationDisplay(locationData: LocationData): string {
  if (!locationData) {
    return 'Location not specified';
  }

  // Get building code and format it (replace underscores with spaces)
  const rawBuildingCode = locationData.buildingCode || locationData.building?.code || null;
  const buildingCode = formatBuildingText(rawBuildingCode);
  
  // Get room (trim if exists)
  const room = (locationData.room && locationData.room.trim()) ? locationData.room.trim() : null;
  
  // Get full address (prefer formattedAddress, fallback to location)
  const address = locationData.formattedAddress || locationData.location || null;
  
  // If no address available, return fallback
  if (!address) {
    return 'Location not specified';
  }

  // Build location string based on available fields
  if (buildingCode && room) {
    // Building + Room + Address
    return `${buildingCode} - ${room} - ${address}`;
  } else if (buildingCode) {
    // Building + Address
    return `${buildingCode} - ${address}`;
  } else if (room) {
    // Room + Address (edge case - building detection failed)
    return `${room} - ${address}`;
  } else {
    // Just Address (fallback)
    return address;
  }
}

/**
 * Formats location for compact display (shorter version)
 * Excludes plus codes, province, and country. Includes building names.
 * Example output: "Natalio B. Bacalso Ave, Cebu City (NGE BUILDING)"
 */
export function formatLocationCompact(locationData: LocationData): string {
  if (!locationData) {
    return 'Location not specified';
  }

  // If locationData only has a location string (no separate fields), format it directly
  if (locationData.location && !locationData.buildingName && !locationData.building?.fullName && !locationData.formattedAddress) {
    return formatLocationString(locationData.location);
  }

  let displayText = '';

  // Use formattedAddress if available, otherwise fall back to location
  const addressToProcess = locationData.formattedAddress || locationData.location;

  if (addressToProcess) {
    // Split address by comma
    const addressParts = addressToProcess.split(',').map(part => part.trim());

    // Filter out parts that look like plus codes (pattern: alphanumeric with + symbol)
    // and exclude province/country (typically last 2 parts after postal code)
    const filteredParts: string[] = [];

    for (let i = 0; i < addressParts.length; i++) {
      let part = addressParts[i];

      // Remove plus code from the beginning of the part if it exists
      // Plus code pattern: 4+ characters + "+" + 2-4 characters
      // Example: "7VWJ+38W", "8X64+7J2", "7vwh+gwv", "7VVJ+QFR"
      part = part.replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}\s*/i, '').trim();

      // Skip if the part is now empty (it was just a plus code)
      if (!part) {
        continue;
      }

      // Skip if it looks like a postal code + province (e.g., "6000 Cebu")
      if (/^\d{4,}\s+[A-Za-z]/.test(part)) {
        break; // Stop processing, rest is province/country
      }

      // Skip if it's just a country name (typically last part, single word or common country names)
      if (i === addressParts.length - 1 && (part.toLowerCase() === 'philippines' || part.toLowerCase() === 'ph')) {
        continue;
      }

      filteredParts.push(part);
    }

    // Join the remaining parts (street and city)
    displayText = filteredParts.slice(0, 2).join(', ') || addressToProcess;
  } else {
    displayText = 'Location not specified';
  }

  // Add building information if available (format with spaces)
  let buildingInfo = '';

  if (locationData.buildingName) {
    buildingInfo = formatBuildingText(locationData.buildingName) || '';
  } else if (locationData.building?.fullName) {
    buildingInfo = formatBuildingText(locationData.building.fullName) || '';
  }

  // If we have building info, append it in parentheses
  if (buildingInfo) {
    displayText += ` (${buildingInfo})`;
  }

  return displayText;
}

/**
 * Gets just the building name for display
 * Example output: "NGE BUILDING"
 */
export function getBuildingName(locationData: LocationData): string {
  if (!locationData) {
    return '';
  }

  const rawName = locationData.buildingName || locationData.building?.fullName;
  return formatBuildingText(rawName) || '';
}

/**
 * Gets just the building code for display
 * Example output: "NGE"
 */
export function getBuildingCode(locationData: LocationData): string {
  if (!locationData) {
    return '';
  }

  const rawCode = locationData.buildingCode || locationData.building?.code;
  return formatBuildingText(rawCode) || '';
}

/**
 * Checks if location has building information
 */
export function hasBuilding(locationData: LocationData): boolean {
  return !!(locationData?.buildingName || locationData?.building?.fullName);
}
















