import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from './config';
import { storage } from './storage';

export const api = axios.create({
  baseURL: config.API.BASE_URL,
  timeout: config.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header from storage
api.interceptors.request.use(async (request: InternalAxiosRequestConfig) => {
  try {
    const token = await storage.getToken();
    if (token) {
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Ignore token errors
  }
  return request;
});

// Enhanced error handler with better error messages
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      await storage.removeToken();
    }

    // Enhance error message based on error type
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      error.message = 'Network connection failed. Please check your internet connection and try again.';
    } else if (error.code === 'ETIMEDOUT') {
      error.message = 'Request timed out. The server is taking too long to respond.';
    } else if (!error.response) {
      error.message = 'Unable to connect to the server. Please check your network connection.';
    } else {
      // Use server error message if available
      const serverMessage = error.response?.data?.message || error.response?.data?.error;
      if (serverMessage) {
        error.message = serverMessage;
      } else {
        // Provide user-friendly messages based on status code
        switch (error.response.status) {
          case 400:
            error.message = 'Invalid request. Please check your input and try again.';
            break;
          case 401:
            error.message = 'Invalid email or password. Please try again.';
            break;
          case 403:
            error.message = 'Access denied. You do not have permission to perform this action.';
            break;
          case 404:
            error.message = 'The requested resource was not found.';
            break;
          case 500:
            error.message = 'Internal server error. Please try again later.';
            break;
          case 502:
            error.message = 'Bad gateway. The server is temporarily unavailable.';
            break;
          case 503:
            error.message = 'Service unavailable. The server is temporarily down for maintenance.';
            break;
          default:
            error.message = `Server error (${error.response.status}). Please try again later.`;
        }
      }
    }

    throw error;
  }
);

// Domain-specific APIs now live under src/features/**/api/*.ts
