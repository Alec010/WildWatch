// Simple configuration toggle for Next.js config
// Set to true to use local backend, false to use deployed backend
const useLocalBackend = true;

// Backend URLs
const LOCAL_BACKEND = "http://localhost:8080";
const DEPLOYED_BACKEND = "https://wildwatch-9djc.onrender.com";

// Get the active backend URL based on the toggle
const getBackendUrl = () => useLocalBackend ? LOCAL_BACKEND : DEPLOYED_BACKEND;

module.exports = {
  useLocalBackend,
  LOCAL_BACKEND,
  DEPLOYED_BACKEND,
  getBackendUrl
};
