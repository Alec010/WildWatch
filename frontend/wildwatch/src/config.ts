// Configuration values for the application

// Function to get backend URL safely (works in both server and client contexts)
export function getBackendUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Default to localhost in development
  return 'http://localhost:8080';
}

// Function to get WebSocket URL safely
export function getWsUrl(): string {
  const backendUrl = getBackendUrl();
  if (backendUrl.startsWith('https')) {
    return backendUrl.replace('https', 'wss');
  }
  return backendUrl.replace('http', 'ws');
}

// Google Maps API key (use environment variable)
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Campus map defaults
export const CAMPUS_CENTER = { lat: 40.4237, lng: -86.9212 }; // Default to Purdue University
export const CAMPUS_ZOOM = 16;
