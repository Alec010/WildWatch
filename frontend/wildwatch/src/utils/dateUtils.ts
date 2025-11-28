/**
 * Parse a date string from the backend as UTC+8 (Asia/Manila)
 * Backend sends LocalDateTime in UTC+8 timezone
 */
export function parseUTCDate(dateString: string): Date {
  if (!dateString) {
    return new Date()
  }
  
  // If dateString already has timezone info, use it as-is
  if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
    return new Date(dateString)
  }
  
  // If no timezone, treat as UTC+8 by appending '+08:00'
  return new Date(dateString + '+08:00')
}

/**
 * Format date for display (UTC+8 / Asia/Manila)
 */
export function formatDate(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}

/**
 * Format date with year (UTC+8 / Asia/Manila)
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
    timeZone: "Asia/Manila",
  })
}

/**
 * Format date only (no time) (UTC+8 / Asia/Manila)
 */
export function formatDateOnly(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  })
}

/**
 * Format time only (UTC+8 / Asia/Manila)
 */
export function formatTime(dateString: string): string {
  const date = parseUTCDate(dateString)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Manila",
  })
}

/**
 * Format date for "Today/Yesterday" display (UTC+8 / Asia/Manila)
 */
export function formatRelativeDate(dateString: string): string {
  const date = parseUTCDate(dateString)
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }))
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateStr = date.toLocaleDateString("en-US", { timeZone: "Asia/Manila" })
  const todayStr = today.toLocaleDateString("en-US", { timeZone: "Asia/Manila" })
  const yesterdayStr = yesterday.toLocaleDateString("en-US", { timeZone: "Asia/Manila" })

  if (dateStr === todayStr) {
    return `Today, ${formatTime(dateString)}`
  } else if (dateStr === yesterdayStr) {
    return `Yesterday, ${formatTime(dateString)}`
  } else {
    return `${formatDateOnly(dateString)}, ${formatTime(dateString)}`
  }
}
