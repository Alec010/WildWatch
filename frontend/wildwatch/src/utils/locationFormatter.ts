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

/**
 * Formats location for table display - removes plus codes, postal codes, province, and country
 * Only shows: Building Code - Room - Street Address, City
 * Example output: "NGE BUILDING - NGE102 - Natalio B. Bacalso Ave, Cebu City"
 */
export function formatLocationForTable(locationData: LocationData): string {
  if (!locationData) {
    return 'Location not specified';
  }

  // Get building name/code - prefer buildingName/fullName over buildingCode
  let rawBuildingCode = locationData.buildingName || locationData.building?.fullName || locationData.buildingCode || locationData.building?.code || null;
  let buildingCode = formatBuildingText(rawBuildingCode);
  if (buildingCode) {
    buildingCode = buildingCode.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Get room (trim and clean if exists)
  let room = (locationData.room && locationData.room.trim()) ? locationData.room.trim() : null;
  if (room) {
    room = room.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    // If room becomes empty after cleaning, set to null
    if (!room || room.length === 0) {
      room = null;
    }
  }

  // Get full address (prefer formattedAddress, fallback to location)
  let address = locationData.formattedAddress || locationData.location || null;

  // If building/room not found in properties, try to parse from location string
  // Format: "BUILDING - ROOM - ADDRESS" or "BUILDING - ADDRESS"
  // Also check if location string has a more complete building name than what's in buildingCode
  if (address) {
    // Check if location contains " - " pattern (building/room separator)
    const parts = address.split(' - ').map(p => p.trim());
    if (parts.length >= 2) {
      // First part might be building name/code - use it if it's more complete than existing buildingCode
      if (parts[0]) {
        const potentialBuilding = formatBuildingText(parts[0]);
        if (potentialBuilding) {
          const formattedPotential = potentialBuilding.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
          // Use the location string building if we don't have one, or if it's longer (more complete)
          if (!buildingCode || formattedPotential.length > buildingCode.length) {
            buildingCode = formattedPotential;
          }
        }
      }
      // Second part might be room (if there are 3+ parts) or address
      if (parts.length >= 3) {
        // Always parse room from location string if available (location string is source of truth)
        if (parts[1]) {
          const parsedRoom = parts[1].replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
          // Use parsed room if it exists and is not empty
          if (parsedRoom && parsedRoom.length > 0) {
            room = parsedRoom;
          }
        }
        // Address is everything after room
        address = parts.slice(2).join(' - ');
      } else if (parts.length === 2) {
        // Only building and address, no room
        address = parts[1];
      }
    }
  }

  // If no address available, return fallback
  if (!address) {
    return 'Location not specified';
  }

  // Process address to remove unwanted parts
  let processedAddress = address;

  // Remove plus codes (pattern: 4-8 alphanumeric + "+" + 2-4 alphanumeric)
  // Can appear at start or anywhere in the string, optionally followed by comma
  processedAddress = processedAddress.replace(/\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,4}\b\s*,?\s*/gi, '').trim();

  // Split by comma and process each part
  const addressParts = processedAddress.split(',').map(part => part.trim()).filter(part => part.length > 0);

  const filteredParts: string[] = [];
  let foundPostalCode = false;

  for (let i = 0; i < addressParts.length; i++) {
    const part = addressParts[i];

    // Check if this part contains a postal code (4+ digits)
    if (/^\d{4,}/.test(part) || /\s+\d{4,}/.test(part)) {
      foundPostalCode = true;
      // Extract just the text part if it contains both text and postal code
      const textOnly = part.replace(/\s*\d{4,}.*$/, '').trim();
      if (textOnly) {
        // This might be "6000 Cebu" - skip the whole thing
        continue;
      }
      continue;
    }

    // If we found a postal code in previous iteration, skip province/country that follows
    if (foundPostalCode) {
      const lowerPart = part.toLowerCase();
      // Skip if it's a province or country
      if (lowerPart === 'philippines' || lowerPart === 'ph' || lowerPart === 'philippine' ||
        ['cebu', 'manila', 'quezon', 'laguna', 'cavite', 'rizal', 'bulacan', 'pampanga'].includes(lowerPart)) {
        continue;
      }
      // Reset flag after checking
      foundPostalCode = false;
    }

    // Skip country names (usually at the end)
    const lowerPart = part.toLowerCase();
    if (lowerPart === 'philippines' || lowerPart === 'ph' || lowerPart === 'philippine') {
      continue;
    }

    // Collect parts (typically street address and city)
    // Limit to first 2 meaningful parts to avoid including province/country
    if (filteredParts.length < 2) {
      filteredParts.push(part);
    }
  }

  // Clean each part: remove underscores and dashes, replace with spaces
  const cleanedParts = filteredParts.map(part => {
    return part.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  });

  // Join the filtered parts (should be street and city)
  let addressDisplay = cleanedParts.join(', ') || address;

  // If addressDisplay still has the original address (fallback), clean it too
  if (addressDisplay === address) {
    addressDisplay = addressDisplay.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Build the final string with clean separators
  // Enclose room in parentheses when it exists
  if (buildingCode && room) {
    return `${buildingCode} - (${room}) - ${addressDisplay}`;
  } else if (buildingCode) {
    return `${buildingCode} - ${addressDisplay}`;
  } else if (room) {
    return `(${room}) - ${addressDisplay}`;
  } else {
    return addressDisplay;
  }
}
















