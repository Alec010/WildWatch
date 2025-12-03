import { getBackendUrl } from '@/config';
import tokenService from './tokenService';
import Cookies from 'js-cookie';

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
    try {
      // Try to refresh token
      const newToken = await tokenService.refreshToken();

      if (newToken) {
        // Retry request with new token
        headers.set('Authorization', `Bearer ${newToken}`);
        const retryResponse = await fetch(url, {
          ...fetchOptions,
          headers,
        });

        // If retry still returns 401, clear all storage and redirect to login
        if (retryResponse.status === 401) {
          const { clearAllStorage } = await import('./storageCleanup');
          clearAllStorage();
          tokenService.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Authentication failed');
        }

        return retryResponse;
      }
    } catch (error) {
      console.error('Token refresh failed during API call:', error);
      // Clear all storage and redirect to login
      if (typeof window !== 'undefined' && Cookies.get('token')) {
        const { clearAllStorage } = await import('./storageCleanup');
        clearAllStorage();
        tokenService.removeToken();
        window.location.href = '/login';
      }
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

  // Extend resolution date
  extendResolutionDate: async (incidentId: string, newEstimatedDate: string) => {
    // Convert the date string to ISO format for LocalDateTime parsing
    const date = new Date(newEstimatedDate);
    const isoDateTime = date.toISOString();

    const response = await fetch(`${getBackendUrl()}/api/incidents/${incidentId}/extend-resolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
      body: JSON.stringify({ newEstimatedDate: isoDateTime }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to extend resolution date');
    }

    return response.json();
  },

  // Office Bulletin methods
  createBulletin: async (formData: FormData) => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create bulletin');
    }

    return response.json();
  },

  getBulletins: async () => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch bulletins');
    }

    return response.json();
  },

  getMyBulletins: async () => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins/my-bulletins`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch my bulletins');
    }

    return response.json();
  },

  getResolvedIncidents: async () => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins/resolved-incidents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch resolved incidents');
    }

    return response.json();
  },

  // Bulletin upvote methods
  toggleBulletinUpvote: async (bulletinId: string) => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins/${bulletinId}/upvote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to toggle upvote');
    }

    return response.json();
  },

  getBulletinUpvoteStatus: async (bulletinId: string) => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins/${bulletinId}/upvote-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get upvote status');
    }

    return response.json();
  },

  getBulletinUpvoteCount: async (bulletinId: string) => {
    const response = await fetch(`${getBackendUrl()}/api/office-bulletins/${bulletinId}/upvote-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get upvote count');
    }

    return response.json();
  },

  // Notification methods
  getNotifications: async () => {
    const response = await fetch(`${getBackendUrl()}/api/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch notifications');
    }

    return response.json();
  },

  getUnreadNotificationCount: async () => {
    const response = await fetch(`${getBackendUrl()}/api/notifications/count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to get notification count');
    }

    return response.json();
  },

  markNotificationAsRead: async (notificationId: string) => {
    const response = await fetch(`${getBackendUrl()}/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to mark notification as read');
    }

    return true;
  },

  markAllNotificationsAsRead: async () => {
    const response = await fetch(`${getBackendUrl()}/api/notifications/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to mark all notifications as read');
    }

    return true;
  },

  // Activity Log methods (existing notification system)
  getActivityLogs: async (page = 0, size = 10) => {
    const response = await fetch(`${getBackendUrl()}/api/activity-logs?page=${page}&size=${size}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch activity logs');
    }

    const data = await response.json();
    return data.content || data; // Return the content array or the data itself
  },

  markActivityLogAsRead: async (activityLogId: string) => {
    const response = await fetch(`${getBackendUrl()}/api/activity-logs/${activityLogId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to mark activity log as read');
    }

    return true;
  },

  markAllActivityLogsAsRead: async () => {
    const response = await fetch(`${getBackendUrl()}/api/activity-logs/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await tokenService.getValidToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to mark all activity logs as read');
    }

    return true;
  },
};

export default apiClient;
