// Backend URLs
const LOCAL_BACKEND = "http://localhost:8080";
const DEPLOYED_BACKEND = "https://wildwatch-zgaw.onrender.com";

// Get the active backend URL based on environment
const getBackendUrl = () => {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Check if we're in production (Vercel deployment)
  if (process.env.NODE_ENV === 'production') {
    return DEPLOYED_BACKEND;
  }
  
  // Default to localhost in development
  return LOCAL_BACKEND;
};

// WebSocket URLs - SockJS works with HTTP/HTTPS URLs
const LOCAL_WS = "http://localhost:8080"; 
const DEPLOYED_WS = "https://wildwatch-zgaw.onrender.com";

// Get the active WebSocket URL based on environment
// Note: SockJS requires HTTP/HTTPS URLs, not WS/WSS URLs
// SockJS handles the protocol upgrade internally
const getWsUrl = () => {
  return getBackendUrl();
};

// Google Maps Configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const CAMPUS_CENTER = {
  lat: 10.2955,
  lng: 123.8800
};
const CAMPUS_ZOOM = 17;

// Debug logging
console.log('Google Maps API Key configured:', !!GOOGLE_MAPS_API_KEY);
if (!GOOGLE_MAPS_API_KEY) {
  console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in .env.local');
}

// Export for ES modules (frontend)
export {
  LOCAL_BACKEND,
  DEPLOYED_BACKEND,
  getBackendUrl,
  LOCAL_WS,
  DEPLOYED_WS,
  getWsUrl,
  GOOGLE_MAPS_API_KEY,
  CAMPUS_CENTER,
  CAMPUS_ZOOM
};

// We don't need CommonJS exports in an ESM file
