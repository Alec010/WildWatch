/**
 * Parse a date string from the backend as UTC+8 (Asia/Manila)
 * Backend sends LocalDateTime in UTC+8 timezone
 */
export function parseUTCDate(dateString: string): Date {
  if (!dateString) {
    return new Date();
  }

  // If dateString already has timezone info, use it as-is
  if (
    dateString.includes("Z") ||
    dateString.includes("+") ||
    dateString.includes("-", 10)
  ) {
    return new Date(dateString);
  }

  // Normalise common backend formats before applying timezone
  const trimmed = dateString.trim();

  // Pure date (YYYY-MM-DD) – treat as midnight Asia/Manila
  const pureDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (pureDateRegex.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00+08:00`);
  }

  // Date + time without timezone, allow space or 'T' separator
  const dateTimeRegex =
    /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/;
  if (dateTimeRegex.test(trimmed)) {
    const normalised = trimmed.replace(" ", "T");
    return new Date(`${normalised}+08:00`);
  }

  // Fallback: let JS try to parse as-is
  return new Date(trimmed);
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
