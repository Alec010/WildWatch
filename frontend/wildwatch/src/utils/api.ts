// Import configuration
import { getWsUrl } from '../config';

// Use relative URL for API (handled by Next.js proxy)
export const API_BASE_URL = ""; // Empty string means use relative URLs (same origin)

// WebSocket still needs the full URL since it can't be proxied by Next.js
export const WS_BASE_URL = getWsUrl(); 