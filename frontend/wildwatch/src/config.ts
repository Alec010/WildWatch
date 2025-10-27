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
