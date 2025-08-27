// Simple configuration toggle
// Set to true to use local backend, false to use deployed backend
const useLocalBackend = false;

// Backend URLs
const LOCAL_BACKEND = "http://localhost:8080";
const DEPLOYED_BACKEND = "https://wildwatch-9djc.onrender.com";

// Get the active backend URL based on the toggle
const getBackendUrl = () => useLocalBackend ? LOCAL_BACKEND : DEPLOYED_BACKEND;

// WebSocket URLs
const LOCAL_WS = "ws://localhost:8080";
const DEPLOYED_WS = "wss://wildwatch-9djc.onrender.com";

// Get the active WebSocket URL based on the toggle
const getWsUrl = () => useLocalBackend ? LOCAL_WS : DEPLOYED_WS;

// Export for ES modules (frontend)
export {
  useLocalBackend,
  LOCAL_BACKEND,
  DEPLOYED_BACKEND,
  getBackendUrl,
  LOCAL_WS,
  DEPLOYED_WS,
  getWsUrl
};

// We don't need CommonJS exports in an ESM file
