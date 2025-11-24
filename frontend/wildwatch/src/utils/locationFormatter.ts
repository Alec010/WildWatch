/**
 * Utility functions for formatting location displays
 */

interface LocationData {
  location?: string;
  formattedAddress?: string;
  buildingName?: string;
  buildingCode?: string;
  building?: {
    fullName?: string;
    code?: string;
  };
}

/**
 * Formats location for display with address and building information
 * Example output: "7VVJ+QFR, Natalio B. Bacalso Ave, Cebu City, 6000 Cebu, Philippines (NGE BUILDING)"
 */
export function formatLocationDisplay(locationData: LocationData): string {
  if (!locationData) {
    return 'Location not specified';
  }

  let displayText = '';

  // Use formattedAddress if available, otherwise fall back to location
  if (locationData.formattedAddress) {
    displayText = locationData.formattedAddress;
  } else if (locationData.location) {
    displayText = locationData.location;
  } else {
    displayText = 'Location not specified';
  }

  // Add building information if available
  let buildingInfo = '';

  // Try to get building name from multiple possible sources
  if (locationData.buildingName) {
    buildingInfo = locationData.buildingName;
  } else if (locationData.building?.fullName) {
    buildingInfo = locationData.building.fullName;
  }

  // If we have building info, append it in parentheses
  if (buildingInfo) {
    displayText += ` (${buildingInfo})`;
  }

  return displayText;
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

  // Add building information if available
  let buildingInfo = '';

  if (locationData.buildingName) {
    buildingInfo = locationData.buildingName;
  } else if (locationData.building?.fullName) {
    buildingInfo = locationData.building.fullName;
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

  if (locationData.buildingName) {
    return locationData.buildingName;
  } else if (locationData.building?.fullName) {
    return locationData.building.fullName;
  }

  return '';
}

/**
 * Gets just the building code for display
 * Example output: "NGE"
 */
export function getBuildingCode(locationData: LocationData): string {
  if (!locationData) {
    return '';
  }

  if (locationData.buildingCode) {
    return locationData.buildingCode;
  } else if (locationData.building?.code) {
    return locationData.building.code;
  }

  return '';
}

/**
 * Checks if location has building information
 */
export function hasBuilding(locationData: LocationData): boolean {
  return !!(locationData?.buildingName || locationData?.building?.fullName);
}
















