import axios from 'axios';
import { config } from './config';

export const api = axios.create({
  baseURL: config.API.BASE_URL,
  timeout: config.API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple auth service
export const authAPI = {
  login: async (email: string, password: string) => {
    console.log('Attempting login to:', config.API.BASE_URL + '/auth/login');
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  register: async (userData: {
    firstName: string;
    lastName: string;
    middleInitial?: string;
    email: string;
    schoolIdNumber: string;
    password: string;
    confirmPassword: string;
    contactNumber: string;
    termsAccepted: boolean;
  }) => {
    console.log('Attempting registration to:', config.API.BASE_URL + '/auth/register');
    console.log('Registration data being sent:', JSON.stringify(userData, null, 2));
    try {
      const response = await api.post('/auth/register', userData);
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },
  
  getProfile: async (token: string) => {
    const response = await api.get('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
