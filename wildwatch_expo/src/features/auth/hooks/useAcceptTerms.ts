import { authAPI } from '../api/auth_api';

export const acceptTerms = async () => {
  try {
    const response = await authAPI.acceptTerms();
    return response;
  } catch (error) {
    throw error;
  }
};
