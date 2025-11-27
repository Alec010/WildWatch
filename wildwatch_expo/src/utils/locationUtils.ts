/**
 * Sanitizes a location string by removing Google Plus Codes or other
 * alphanumeric grid identifiers that typically appear at the beginning
 * of geocoding results (for example: "7VWJ+38W Taguig, Metro Manila").
 *
 * The goal is to keep the human-readable portion of the address while
 * hiding the machine-specific plus code from UI surfaces.
 */
export const sanitizeLocation = (location?: string | null): string | null => {
  if (!location) {
    return null;
  }

  const trimmedLocation = location.trim();
  if (!trimmedLocation) {
    return null;
  }

  const plusCodePattern = /^[0-9A-Z]{4,}\+[0-9A-Z]{2,}(?:[\s,-]+)?/i;
  if (!plusCodePattern.test(trimmedLocation)) {
    return trimmedLocation;
  }

  const cleaned = trimmedLocation
    .replace(plusCodePattern, "")
    .trim()
    .replace(/^,/, "")
    .trim();

  return cleaned || null;
};

/**
 * Convenience helper to derive a presentable location string.
 * Falls back to building names or coordinates when necessary.
 */
export const resolveDisplayLocation = ({
  location,
  fallbackLabel,
}: {
  location?: string | null;
  fallbackLabel?: string;
}): string | null => {
  return sanitizeLocation(location) || fallbackLabel || null;
};

