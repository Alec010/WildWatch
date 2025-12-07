import { config } from '../../lib/config';

/**
 * Check if the server is reachable
 * @returns Promise<boolean> - true if server is reachable, false otherwise
 */
export async function checkServerStatus(): Promise<{
  isOnline: boolean;
  responseTime?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Try to reach a lightweight endpoint (health check or root)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check
    
    const response = await fetch(`${config.API.BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      isOnline: response.ok || response.status < 500,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    return {
      isOnline: false,
      responseTime,
      error: error.message,
    };
  }
}

/**
 * Get a user-friendly server status message
 */
export async function getServerStatusMessage(): Promise<string> {
  const status = await checkServerStatus();
  
  if (status.isOnline) {
    if (status.responseTime && status.responseTime > 3000) {
      return `Server is responding slowly (${Math.round(status.responseTime / 1000)}s). You may experience delays.`;
    }
    return 'Server is online and responding normally.';
  } else {
    if (status.error?.includes('Network request failed') || status.error?.includes('Failed to fetch')) {
      return 'Cannot reach the server. Please check your internet connection.';
    }
    return 'Server is currently unavailable. Please try again later.';
  }
}

