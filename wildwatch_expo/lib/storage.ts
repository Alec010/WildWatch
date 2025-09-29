import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'authToken';
const CHAT_MESSAGES_KEY = 'chatMessages';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: number;
}

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
  }
};
