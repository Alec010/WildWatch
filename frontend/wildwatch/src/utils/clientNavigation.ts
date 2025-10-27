// Helper functions for client-side navigation

/**
 * Opens a URL in a new tab/window
 * @param url The URL to open
 */
export function openInNewTab(url: string): void {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}

/**
 * Opens a URL in the current tab/window
 * @param url The URL to open
 */
export function navigateTo(url: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = url;
  }
}
