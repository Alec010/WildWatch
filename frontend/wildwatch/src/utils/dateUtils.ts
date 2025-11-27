/**
 * Parse a date string from the backend as UTC
 * Backend sends LocalDateTime without timezone, which we treat as UTC
 */
export function parseUTCDate(dateString: string): Date {
  if (!dateString) {
    return new Date()
  }
  
  // If dateString already has timezone info, use it as-is
  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
    return new Date(dateString)
  }
  
  // If no timezone, treat as UTC by appending 'Z'
  return new Date(dateString + 'Z')
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })
}

/**
 * Format date with year
 */
export function formatDateWithYear(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Format time only
 */
export function formatTime(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Format date for "Today/Yesterday" display
 */
export function formatRelativeDate(dateString: string): string {
  const date = parseUTCDate(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${formatTime(dateString)}`
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${formatTime(dateString)}`
  } else {
    return `${formatDateOnly(dateString)}, ${formatTime(dateString)}`
  }
}
