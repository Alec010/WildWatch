// Backend URLs
const LOCAL_BACKEND = "http://localhost:8080";
const DEPLOYED_BACKEND = "https://wildwatch-zgaw.onrender.com";

// Get the active backend URL based on environment
const getBackendUrl = () => {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Always use deployed backend (even on localhost:3000)
  // Only use local backend if explicitly set via NEXT_PUBLIC_USE_LOCAL_BACKEND=true
  if (process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true') {
    return LOCAL_BACKEND;
  }
  
  // Default to deployed backend
  return DEPLOYED_BACKEND;
};

module.exports = {
  LOCAL_BACKEND,
  DEPLOYED_BACKEND,
  getBackendUrl
};
