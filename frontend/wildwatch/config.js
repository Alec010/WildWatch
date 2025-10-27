// Backend URLs
const LOCAL_BACKEND = "http://localhost:8080";
const DEPLOYED_BACKEND = "https://wildwatch-9djc.onrender.com";

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

module.exports = {
  LOCAL_BACKEND,
  DEPLOYED_BACKEND,
  getBackendUrl
};
