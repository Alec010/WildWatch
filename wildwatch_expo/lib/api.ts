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
    console.log('[API Interceptor] Retrieved token:', token);
    console.log('[API Interceptor] Request URL:', request.url);
    if (token) {
      request.headers = request.headers || {};
      request.headers.Authorization = `Bearer ${token}`;
      console.log('[API Interceptor] Token attached to request');
    } else {
      console.log('[API Interceptor] No token found');
    }
  } catch (error) {
    console.log('[API Interceptor] Error retrieving token:', error);
    // Ignore token errors
  }
  return request;
});

// Basic 401 handler hook point
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Optionally clear token; UI should redirect due to guard
      await storage.removeToken();
    }
    throw error;
  }
);

// Domain-specific APIs now live under src/features/**/api/*.ts
