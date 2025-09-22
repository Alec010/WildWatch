import { getBackendUrl } from '@/config';
import tokenService from './tokenService';

interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Enhanced fetch wrapper that handles token refresh automatically
 */
async function apiClient(endpoint: string, options: ApiOptions = {}): Promise<Response> {
  const { skipAuth = false, ...fetchOptions } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${getBackendUrl()}${endpoint}`;

  // Get headers from options or create new object
  const headers = new Headers(fetchOptions.headers);
  
  // Add authentication header if not skipped
  if (!skipAuth) {
    const token = await tokenService.getValidToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set content type if not already set and body is not FormData
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  // Handle 401 responses (token expired/invalid)
  if (response.status === 401 && !skipAuth) {
    console.log('Received 401, attempting token refresh...');
    
    try {
      // Try to refresh token
      const newToken = await tokenService.refreshToken();
      
      if (newToken) {
        // Retry request with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(url, {
          ...fetchOptions,
          headers,
        });
      }
    } catch (error) {
      console.error('Token refresh failed during API call:', error);
      // Token service will handle redirect to login
      throw new Error('Authentication failed');
    }
  }

  return response;
}

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
  get: (endpoint: string, options?: ApiOptions) =>
    apiClient(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, data?: any, options?: ApiOptions) =>
    apiClient(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    }),

  put: (endpoint: string, data?: any, options?: ApiOptions) =>
    apiClient(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (endpoint: string, data?: any, options?: ApiOptions) =>
    apiClient(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (endpoint: string, options?: ApiOptions) =>
    apiClient(endpoint, { ...options, method: 'DELETE' }),
};

export default apiClient;
