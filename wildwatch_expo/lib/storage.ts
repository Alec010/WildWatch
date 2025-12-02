import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';
const CHAT_MESSAGES_KEY = 'chatMessages';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: number;
}
const EVIDENCE_FILES_KEY = 'evidenceFiles';
const LOCATION_DATA_KEY = 'locationData';
const REPORT_FORM_KEY = 'reportForm';
const REPORT_STEP_KEY = 'reportStep';
const REPORT_FLOW_STEP_KEY = 'reportFlowStep'; // Overall flow: 1=camera, 2=location, 3=report

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

  // Save chat messages
  setChatMessages: async (messages: ChatMessage[]) => {
    try {
      const messagesWithTimestamp = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || Date.now()
      }));
      await AsyncStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messagesWithTimestamp));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  },

  // Get chat messages
  getChatMessages: async (): Promise<ChatMessage[]> => {
    try {
      const messages = await AsyncStorage.getItem(CHAT_MESSAGES_KEY);
      if (messages) {
        return JSON.parse(messages);
      }
      return [];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  },

  // Clear chat messages
  clearChatMessages: async () => {
    try {
      await AsyncStorage.removeItem(CHAT_MESSAGES_KEY);
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  },

  // Save evidence files
  setEvidenceFiles: async (files: any[]) => {
    try {
      // Validate files array
      if (!Array.isArray(files)) {
        console.error('setEvidenceFiles: files must be an array');
        return;
      }

      // Filter out invalid files and limit size
      const validFiles = files
        .filter(file => file && file.uri && typeof file.uri === 'string')
        .slice(0, 20); // Limit to 20 files to prevent storage issues

      // Check total size (rough estimate)
      const jsonString = JSON.stringify(validFiles);
      if (jsonString.length > 5 * 1024 * 1024) { // 5MB limit
        console.error('Evidence files too large, truncating');
        // Keep only first 10 files
        const truncated = validFiles.slice(0, 10);
        await AsyncStorage.setItem(EVIDENCE_FILES_KEY, JSON.stringify(truncated));
      } else {
        await AsyncStorage.setItem(EVIDENCE_FILES_KEY, jsonString);
      }
    } catch (error: any) {
      console.error('Error saving evidence files:', error);
      // If storage is full or other error, try to clear old data
      if (error?.message?.includes('quota') || error?.message?.includes('size')) {
        try {
          await AsyncStorage.removeItem(EVIDENCE_FILES_KEY);
          // Try saving again with fewer files
          const limitedFiles = files.slice(0, 5);
          await AsyncStorage.setItem(EVIDENCE_FILES_KEY, JSON.stringify(limitedFiles));
        } catch (retryError) {
          console.error('Failed to save even with limited files:', retryError);
        }
      }
    }
  },

  // Get evidence files
  getEvidenceFiles: async (): Promise<any[]> => {
    try {
      const files = await AsyncStorage.getItem(EVIDENCE_FILES_KEY);
      if (!files) return [];

      try {
        const parsed = JSON.parse(files);
        // Validate it's an array
        if (!Array.isArray(parsed)) {
          console.error('Evidence files is not an array, clearing corrupted data');
          await AsyncStorage.removeItem(EVIDENCE_FILES_KEY);
          return [];
        }
        // Validate each file has required properties
        return parsed.filter(file => file && file.uri);
      } catch (parseError) {
        console.error('Error parsing evidence files, clearing corrupted data:', parseError);
        await AsyncStorage.removeItem(EVIDENCE_FILES_KEY);
        return [];
      }
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
  },

  // Save location data
  setLocationData: async (locationData: any) => {
    try {
      await AsyncStorage.setItem(LOCATION_DATA_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Error saving location data:', error);
    }
  },

  // Get location data
  getLocationData: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(LOCATION_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting location data:', error);
      return null;
    }
  },

  // Remove location data
  removeLocationData: async () => {
    try {
      await AsyncStorage.removeItem(LOCATION_DATA_KEY);
    } catch (error) {
      console.error('Error removing location data:', error);
    }
  },

  // Save report form data
  setReportForm: async (formData: any) => {
    try {
      await AsyncStorage.setItem(REPORT_FORM_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving report form:', error);
    }
  },

  // Get report form data
  getReportForm: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(REPORT_FORM_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting report form:', error);
      return null;
    }
  },

  // Remove report form data
  removeReportForm: async () => {
    try {
      await AsyncStorage.removeItem(REPORT_FORM_KEY);
    } catch (error) {
      console.error('Error removing report form:', error);
    }
  },

  // Save current report step
  setReportStep: async (step: number) => {
    try {
      await AsyncStorage.setItem(REPORT_STEP_KEY, JSON.stringify(step));
    } catch (error) {
      console.error('Error saving report step:', error);
    }
  },

  // Get current report step
  getReportStep: async (): Promise<number | null> => {
    try {
      const data = await AsyncStorage.getItem(REPORT_STEP_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting report step:', error);
      return null;
    }
  },

  // Remove report step
  removeReportStep: async () => {
    try {
      await AsyncStorage.removeItem(REPORT_STEP_KEY);
    } catch (error) {
      console.error('Error removing report step:', error);
    }
  },

  // Save current report flow step (1=camera, 2=location, 3=report)
  setReportFlowStep: async (step: number) => {
    try {
      await AsyncStorage.setItem(REPORT_FLOW_STEP_KEY, JSON.stringify(step));
    } catch (error) {
      console.error('Error saving report flow step:', error);
    }
  },

  // Get current report flow step
  getReportFlowStep: async (): Promise<number> => {
    try {
      const data = await AsyncStorage.getItem(REPORT_FLOW_STEP_KEY);
      return data ? JSON.parse(data) : 1; // Default to step 1 (camera)
    } catch (error) {
      console.error('Error getting report flow step:', error);
      return 1;
    }
  },

  // Remove report flow step
  removeReportFlowStep: async () => {
    try {
      await AsyncStorage.removeItem(REPORT_FLOW_STEP_KEY);
    } catch (error) {
      console.error('Error removing report flow step:', error);
    }
  },

  // Clear all form data (location + report + evidence + step + flow step)
  clearAllFormData: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(LOCATION_DATA_KEY),
        AsyncStorage.removeItem(REPORT_FORM_KEY),
        AsyncStorage.removeItem(EVIDENCE_FILES_KEY),
        AsyncStorage.removeItem(REPORT_STEP_KEY),
        AsyncStorage.removeItem(REPORT_FLOW_STEP_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing all form data:', error);
    }
  },
};
