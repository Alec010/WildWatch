// Simple configuration toggle
// Set to true to use local backend, false to use deployed backend
const useLocalBackend = true;

// Backend URLs
const LOCAL_BACKEND = "http://localhost:8080";
const DEPLOYED_BACKEND = "https://wildwatch-9djc.onrender.com";

// Get the active backend URL based on the toggle
const getBackendUrl = () => useLocalBackend ? LOCAL_BACKEND : DEPLOYED_BACKEND;

// WebSocket URLs - SockJS works with HTTP/HTTPS URLs
const LOCAL_WS = "http://localhost:8080"; 
const DEPLOYED_WS = "https://wildwatch-9djc.onrender.com";

// Get the active WebSocket URL based on the toggle
const getWsUrl = () => {
  // For development in Next.js, use the backend URL directly
  return useLocalBackend ? LOCAL_WS : DEPLOYED_WS;
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
  useLocalBackend,
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
