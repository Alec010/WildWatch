/**
 * Comprehensive storage cleanup utility
 * Clears all cookies, localStorage, and sessionStorage
 */

/**
 * Clear all cookies
 */
export const clearAllCookies = (): void => {
  if (typeof window === 'undefined') return;

  // Get all cookies
  const cookies = document.cookie.split(';');

  // Clear each cookie by setting it to expire in the past
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Clear cookie for all possible paths and domains
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
  });
};

/**
 * Clear all localStorage items
 */
export const clearLocalStorage = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    // Fallback: try to remove known keys individually
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error in localStorage fallback cleanup:', e);
    }
  }
};

/**
 * Clear all sessionStorage items
 */
export const clearSessionStorage = (): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    // Fallback: try to remove known keys individually
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => sessionStorage.removeItem(key));
    } catch (e) {
      console.error('Error in sessionStorage fallback cleanup:', e);
    }
  }
};

/**
 * Comprehensive cleanup: clears all cookies, localStorage, and sessionStorage
 * This should be called on signout/logout
 */
export const clearAllStorage = (): void => {
  clearAllCookies();
  clearLocalStorage();
  clearSessionStorage();
};

