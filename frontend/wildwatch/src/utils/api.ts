// Import configuration
import { getBackendUrl, getWsUrl } from '../config';

// Function to get the current backend URL (dynamic)
export const getApiBaseUrl = () => getBackendUrl();

// Function to get the current WebSocket URL (dynamic)
export const getWsBaseUrl = () => getWsUrl();

// Legacy exports for backward compatibility (but these are evaluated at module load time)
export const API_BASE_URL = getBackendUrl();
export const WS_BASE_URL = getWsUrl(); 

/**
 * Search for users by name or email
 * Used for @mention functionality in witness selection
 * 
 * @param query Search query (name or email)
 * @param page Page number (zero-based)
 * @param size Number of results per page
 * @returns Promise with search results
 */
export const searchUsers = async (query: string, page = 0, size = 10) => {
  // Check if we're in a browser environment
  const isClient = typeof window !== 'undefined';
  
  let token = null;
  if (isClient) {
    token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];
  }

  if (!token) {
    console.error('No authentication token found. User might need to log in again.');
    // Instead of throwing an error, return empty results
    return { content: [], totalElements: 0, totalPages: 0 };
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      console.error('Authentication token expired or invalid. Redirecting to login...');
      // Clear the token cookie if in browser
      if (isClient) {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      // Don't redirect immediately, just return empty results
      // The component using this function can handle the redirection if needed
      return { content: [], totalElements: 0, totalPages: 0 };
    }

    if (!response.ok) {
      console.error(`Error searching users: ${response.status}`);
      return { content: [], totalElements: 0, totalPages: 0 };
    }

    return response.json();
  } catch (error) {
    console.error('Error during user search:', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
};