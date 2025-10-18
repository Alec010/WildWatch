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
 * Example output: "Natalio B. Bacalso Ave (NGE BUILDING)"
 */
export function formatLocationCompact(locationData: LocationData): string {
  if (!locationData) {
    return 'Location not specified';
  }

  let displayText = '';
  
  // For compact display, try to extract a shorter address
  if (locationData.formattedAddress) {
    // Try to extract the street name from the full address
    const addressParts = locationData.formattedAddress.split(',');
    if (addressParts.length >= 2) {
      // Use the second part which is usually the street name
      displayText = addressParts[1].trim();
    } else {
      displayText = locationData.formattedAddress;
    }
  } else if (locationData.location) {
    displayText = locationData.location;
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















