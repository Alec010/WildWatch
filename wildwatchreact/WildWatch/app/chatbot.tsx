import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Colors matching Android Studio exactly
const primaryColor = '#8B0000'; // WildWatchRed
const backgroundColor = '#F9F7F7'; // Light background
const cardColor = '#FFFFFF'; // White

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  reply: string;
}

export default function ChatbotScreen() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // API Base URL - same as other screens
  const API_BASE_URL = 'http://192.168.1.11:8080/api';

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !token) return;

    const userMessage: ChatMessage = {
      sender: 'user',
      text: messageText.trim()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim()
        } as ChatRequest),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      const botMessage: ChatMessage = {
        sender: 'bot',
        text: data.reply
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        sender: 'bot',
        text: 'Sorry, I encountered an error. Please try again in a moment.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
    }
  };

  const handleQuickResponse = (response: string) => {
    sendMessage(response);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* Top Navigation Bar */}
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="mr-3"
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={28} 
              color="#8B0000" 
            />
          </TouchableOpacity>
          <Text 
            className="font-bold text-[#8B0000] text-xl"
            style={{ fontSize: 20 }}
          >
            Ask Kat
          </Text>
        </View>
        
        {/* Right side (empty for consistency with dashboard) */}
        <View className="flex-row items-center space-x-4">
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages List */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        >
          {messages.map((message, index) => (
            <ChatMessageItem 
              key={index} 
              message={message} 
              isFirst={index === 0}
            />
          ))}
          
          {isLoading && <LoadingIndicator />}
        </ScrollView>

        {/* Quick Responses (only show on first message) */}
        {messages.length === 1 && (
          <QuickResponses onResponseClick={handleQuickResponse} />
        )}

        {/* Input Area */}
        <InputArea
          input={input}
          onInputChange={setInput}
          onSendClick={handleSendMessage}
          isLoading={isLoading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface ChatMessageItemProps {
  message: ChatMessage;
  isFirst: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, isFirst }) => (
  <View 
    style={{ 
      flexDirection: 'row',
      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
      marginBottom: 8,
      marginTop: isFirst ? 0 : 8
    }}
  >
    {message.sender === 'bot' && (
      <>
        {/* Bot Avatar */}
        <View 
          style={{ 
            width: 32, 
            height: 32, 
            backgroundColor: `${primaryColor}B3`, // 70% opacity
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8
          }}
        >
          <Ionicons 
            name="chatbubble-ellipses" 
            size={20} 
            color="white" 
          />
        </View>
      </>
    )}

    {/* Message Bubble */}
    <View 
      style={{
        maxWidth: 280,
        backgroundColor: message.sender === 'user' ? primaryColor : cardColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: message.sender === 'user' ? 16 : 4,
        borderBottomRightRadius: message.sender === 'user' ? 4 : 16,
      }}
    >
      <Text 
        style={{ 
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 14,
          color: message.sender === 'user' ? 'white' : 'black',
          lineHeight: 20,
        }}
      >
        {message.text}
      </Text>
    </View>

    {message.sender === 'user' && (
      <>
        <View style={{ width: 8 }} />
        {/* User Avatar */}
        <View 
          style={{ 
            width: 32, 
            height: 32, 
            backgroundColor: primaryColor,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8
          }}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color="white" 
          />
        </View>
      </>
    )}
  </View>
);

const LoadingIndicator: React.FC = () => (
  <View style={{ 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 8, 
    marginLeft: 40 
  }}>
    <View 
      style={{ 
        width: 8, 
        height: 8, 
        backgroundColor: `${primaryColor}66`, // 40% opacity
        borderRadius: 4,
        marginRight: 4
      }}
    />
    <View 
      style={{ 
        width: 8, 
        height: 8, 
        backgroundColor: `${primaryColor}66`, // 40% opacity
        borderRadius: 4,
        marginRight: 4
      }}
    />
    <View 
      style={{ 
        width: 8, 
        height: 8, 
        backgroundColor: `${primaryColor}66`, // 40% opacity
        borderRadius: 4
      }}
    />
  </View>
);

interface QuickResponsesProps {
  onResponseClick: (response: string) => void;
}

const QuickResponses: React.FC<QuickResponsesProps> = ({ onResponseClick }) => {
  const quickResponses = [
    'How do I report an incident?',
    'What offices are available?',
    'Tell me about WildWatch',
    'How to contact security?',
    'Where is the admin office?',
    'What are the reporting hours?',
    'How to track my report?',
    'Emergency procedures'
  ];

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
      <Text 
        style={{ 
          fontSize: 12, 
          fontWeight: '500',
          color: '#6B7280',
          marginBottom: 8
        }}
      >
        Suggested questions:
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {quickResponses.map((response, index) => (
          <TouchableOpacity
            key={index}
            style={{
              borderColor: `${primaryColor}4D`, // 30% opacity
              borderWidth: 1,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8
            }}
            onPress={() => onResponseClick(response)}
          >
            <Text 
              style={{ 
                fontSize: 12,
                color: '#8B0000'
              }}
            >
              {response}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

interface InputAreaProps {
  input: string;
  onInputChange: (text: string) => void;
  onSendClick: () => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  input, 
  onInputChange, 
  onSendClick, 
  isLoading 
}) => (
  <View 
    style={{
      backgroundColor: 'white',
      paddingHorizontal: 16,
      paddingVertical: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        style={{
          flex: 1,
          borderColor: `${primaryColor}4D`, // 30% opacity
          borderWidth: 1,
          fontSize: 16,
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginRight: 8
        }}
        value={input}
        onChangeText={onInputChange}
        placeholder="Type your message here..."
        placeholderTextColor="#9CA3AF"
        editable={!isLoading}
        multiline
      />
      <TouchableOpacity
        style={{
          width: 48,
          height: 48,
          backgroundColor: input.trim() && !isLoading ? primaryColor : '#E5E7EB',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onPress={onSendClick}
        disabled={!input.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Ionicons 
            name="send" 
            size={24} 
            color={input.trim() ? "white" : "#9CA3AF"} 
          />
        )}
      </TouchableOpacity>
    </View>
  </View>
);
