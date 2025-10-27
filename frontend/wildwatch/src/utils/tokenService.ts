import Cookies from 'js-cookie';
import { getBackendUrl } from '@/config';

interface TokenInfo {
  token: string;
  expiresAt: number;
}

class TokenService {
  private static instance: TokenService;
  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Decode JWT token to get expiration time
   */
  private decodeToken(token: string): TokenInfo | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        token,
        expiresAt: payload.exp * 1000 // Convert to milliseconds
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired or will expire soon (within 5 minutes)
   */
  private isTokenExpiringSoon(tokenInfo: TokenInfo): boolean {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return tokenInfo.expiresAt - now < fiveMinutes;
  }

  /**
   * Get current token from cookies
   */
  getToken(): string | null {
    return Cookies.get('token') || null;
  }

  /**
   * Set token in cookies and schedule refresh
   */
  setToken(token: string): void {
    Cookies.set('token', token, {
      expires: 7,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    // Schedule automatic refresh
    this.scheduleTokenRefresh(token);
  }

  /**
   * Remove token and clear refresh timer
   */
  removeToken(): void {
    Cookies.remove('token');
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Schedule automatic token refresh before expiration
   */
  private scheduleTokenRefresh(token: string): void {
    const tokenInfo = this.decodeToken(token);
    if (!tokenInfo) return;

    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Calculate when to refresh (5 minutes before expiration)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    const refreshTime = tokenInfo.expiresAt - now - fiveMinutes;

    // Only schedule if token has more than 5 minutes left
    if (refreshTime > 0) {
      console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  /**
   * Refresh the current token
   */
  async refreshToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const currentToken = this.getToken();
    if (!currentToken) {
      console.log('No token to refresh');
      return null;
    }

    console.log('Refreshing token...');

    this.refreshPromise = this.performTokenRefresh(currentToken);
    
    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(token: string): Promise<string> {
    try {
      const response = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      const newToken = data.token;

      // Update token in cookies and schedule next refresh
      this.setToken(newToken);
      
      console.log('Token refreshed successfully');
      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, redirect to login
      this.removeToken();
      window.location.href = '/login';
      throw error;
    }
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(): Promise<string | null> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return null;
    }

    const tokenInfo = this.decodeToken(currentToken);
    if (!tokenInfo) {
      this.removeToken();
      return null;
    }

    // If token is expired or expiring soon, refresh it
    if (this.isTokenExpiringSoon(tokenInfo)) {
      console.log('Token expiring soon, refreshing...');
      try {
        return await this.refreshToken();
      } catch (error) {
        console.error('Failed to refresh expiring token:', error);
        return null;
      }
    }

    return currentToken;
  }

  /**
   * Initialize token service and schedule refresh if token exists
   */
  initialize(): void {
    const token = this.getToken();
    if (token) {
      this.scheduleTokenRefresh(token);
    }
  }
}

export default TokenService.getInstance();
















