import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';
const EVIDENCE_FILES_KEY = 'evidenceFiles';

export const storage = {
  // Save auth token
  setToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  // Get auth token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove auth token
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },

  // Save evidence files
  setEvidenceFiles: async (files: any[]) => {
    try {
      await AsyncStorage.setItem(EVIDENCE_FILES_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Error saving evidence files:', error);
    }
  },

  // Get evidence files
  getEvidenceFiles: async (): Promise<any[]> => {
    try {
      const files = await AsyncStorage.getItem(EVIDENCE_FILES_KEY);
      return files ? JSON.parse(files) : [];
    } catch (error) {
      console.error('Error getting evidence files:', error);
      return [];
    }
  },

  // Remove evidence files
  removeEvidenceFiles: async () => {
    try {
      await AsyncStorage.removeItem(EVIDENCE_FILES_KEY);
    } catch (error) {
      console.error('Error removing evidence files:', error);
    }
  }
};
