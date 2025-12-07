import Cookies from 'js-cookie';

// Helper to check if we're on the client side
const isClient = typeof window !== 'undefined';
import { getBackendUrl } from '@/config';

interface TokenInfo {
  token: string;
  expiresAt: number;
}

class TokenService {
  private static instance: TokenService;
  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() { }

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
    if (!isClient) return null;
    return Cookies.get('token') || null;
  }

  /**
   * Set token in cookies and schedule refresh
   */
  setToken(token: string): void {
    if (!isClient) return;

    // Use 'lax' instead of 'strict' for better cross-site cookie support
    // This is especially important for Android browsers during OAuth redirects
    // 'lax' still provides CSRF protection while allowing cookies on top-level navigations
    Cookies.set('token', token, {
      expires: 7,
      secure: true,
      sameSite: 'lax', // Changed from 'strict' to 'lax' for Android compatibility
      path: '/',
    });

    // Schedule automatic refresh
    this.scheduleTokenRefresh(token);

    // Dispatch custom event to notify UserContext
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('token-changed'));
    }
  }

  /**
   * Remove token and clear refresh timer
   */
  removeToken(): void {
    if (isClient) {
      Cookies.remove('token');
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      // Dispatch custom event to notify UserContext
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('token-changed'));
      }
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
      return null;
    }

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

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clean up all storage
      this.removeToken();

      // Clear all storage on authentication failure
      if (typeof window !== 'undefined') {
        import('./storageCleanup').then(({ clearAllStorage }) => {
          clearAllStorage();
        });
        window.location.href = '/login';
      }

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
















