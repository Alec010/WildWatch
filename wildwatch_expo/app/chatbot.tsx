import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage, ChatMessage } from '../lib/storage';
import { config } from '../lib/config';
import { useResponsive } from '../src/hooks/useResponsive';

interface ChatRequest { message: string }
interface ChatResponse { reply: string }

export default function ChatbotScreen() {
  const { spacing, fontSize } = useResponsive();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load token and chat messages on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedToken, savedMessages] = await Promise.all([
          storage.getToken(),
          storage.getChatMessages()
        ]);
        
        setToken(savedToken);
        
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Only show welcome message if no previous messages
          setMessages([{ 
            sender: 'bot', 
            text: 'Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?',
            timestamp: Date.now()
          }]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setToken(null);
        setMessages([{ 
          sender: 'bot', 
          text: 'Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?',
          timestamp: Date.now()
        }]);
      }
    };
    
    loadData();
  }, []);

  // Save messages to storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      storage.setChatMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, 100);
      return () => clearTimeout(t);
    }
  }, [messages]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setIsKeyboardVisible(true);
      // Scroll to bottom when keyboard appears to ensure input is visible
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Additional effect to ensure input stays visible
  useEffect(() => {
    if (isKeyboardVisible) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !token) return;
    const userMessage: ChatMessage = { 
      sender: 'user', 
      text: messageText.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      const res = await fetch(`${config.API.BASE_URL}/chatbot`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText.trim() } as ChatRequest),
      });
      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
      const data: ChatResponse = await res.json();
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: data.reply,
        timestamp: Date.now()
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        sender: 'bot', 
        text: 'Sorry, I encountered an error. Please try again in a moment.',
        timestamp: Date.now()
      }]);
    } finally { setIsLoading(false); }
  };

  const quickResponses: string[] = [
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
    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <View style={{ 
        height: '100%',
        backgroundColor: 'white', 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24,
        marginTop: '0%',
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* Handle bar */}
        <View style={{ 
          alignItems: 'center', 
          paddingTop: 16, 
          paddingBottom: 12 
        }}>
          <View style={{ 
            width: 48, 
            height: 5, 
            backgroundColor: '#D1D5DB', 
            borderRadius: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1
          }} />
        </View>

        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: 24, 
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
          backgroundColor: 'rgba(248, 250, 252, 0.8)'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#8B0000',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
              shadowColor: '#8B0000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4
            }}>
              <Ionicons name="paw-outline" size={22} color="white" />
            </View>
            <View>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                color: '#8B0000',
                letterSpacing: 0.3
              }}>Ask Kat</Text>
              <Text style={{ 
                fontSize: 13, 
                color: '#6B7280',
                fontWeight: '500'
              }}>Your AI Assistant</Text>
            </View>
          </View>
          {messages.length > 1 && (
            <TouchableOpacity 
              onPress={async () => {
                await storage.clearChatMessages();
                setMessages([{ 
                  sender: 'bot', 
                  text: 'Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?',
                  timestamp: Date.now()
                }]);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 18,
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                flexDirection: 'row'
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={{ 
                fontSize: 12, 
                color: '#6B7280', 
                fontWeight: '600' 
              }}>Clear Chat</Text>
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          enabled={true}
        >
          <View style={{ flex: 1, flexDirection: 'column' }}>
            <ScrollView 
              ref={scrollViewRef} 
              style={{ 
                flex: 1, 
                paddingHorizontal: 24
              }} 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ 
                paddingTop: 20, 
                paddingBottom: 20,
                flexGrow: 1
              }}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            >
              {messages.map((m, idx) => (
                <MessageBubble key={idx} message={m} isFirst={idx === 0} />
              ))}
              {isLoading && <LoadingDots />}
            </ScrollView>

            {messages.length === 1 && (
              <View style={{ 
                paddingHorizontal: 24, 
                paddingVertical: 20,
                paddingBottom: 6,
                marginBottom: 6
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '700', 
                  color: '#374151', 
                  marginBottom: 16,
                  letterSpacing: 0.2
                }}>Suggested questions:</Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={{ paddingRight: 24 }}
                  decelerationRate="fast"
                  snapToInterval={200}
                  snapToAlignment="start"
                >
                  {quickResponses.map((q, index) => (
                    <TouchableOpacity 
                      key={q} 
                      style={{ 
                        borderColor: '#8B0000', 
                        borderWidth: 1.5, 
                        borderRadius: 24, 
                        paddingHorizontal: 18, 
                        paddingVertical: 12, 
                        marginRight: 12,
                        backgroundColor: 'white',
                        shadowColor: '#8B0000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                        minWidth: 160,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }} 
                      onPress={() => sendMessage(q)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ 
                        fontSize: 13, 
                        color: '#8B0000', 
                        fontWeight: '600',
                        letterSpacing: 0.1,
                        textAlign: 'center',
                        lineHeight: 16
                      }}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ 
              backgroundColor: 'white', 
              paddingHorizontal: 24, 
              paddingVertical: 20, 
              paddingBottom: Platform.OS === 'ios' ? 65 : 40,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8
            }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'flex-end',
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                paddingHorizontal: 4,
                paddingVertical: 4,
                borderWidth: 2,
                borderColor: input.trim() ? '#8B0000' : '#E2E8F0',
                shadowColor: input.trim() ? '#8B0000' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: input.trim() ? 0.15 : 0.05,
                shadowRadius: 8,
                elevation: input.trim() ? 6 : 2,
                minHeight: 56
              }}>
                <TextInput 
                  style={{ 
                    flex: 1, 
                    fontSize: 16, 
                    color: '#1F2937',
                    paddingHorizontal: 20, 
                    paddingVertical: 16, 
                    maxHeight: 120,
                    minHeight: 48,
                    fontWeight: '500',
                    lineHeight: 22,
                    textAlignVertical: 'top'
                  }} 
                  value={input} 
                  onChangeText={setInput} 
                  placeholder="Ask me" 
                  placeholderTextColor="#9CA3AF" 
                  editable={!isLoading} 
                  multiline
                  onFocus={() => {
                    // Ensure input is visible when focused
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 200);
                  }}
                  onBlur={() => {
                    // Optional: handle blur if needed
                  }}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (input.trim() && !isLoading) {
                      sendMessage(input);
                    }
                  }}
                  blurOnSubmit={false}
                />
                <TouchableOpacity 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    backgroundColor: input.trim() && !isLoading ? '#8B0000' : '#F3F4F6', 
                    borderRadius: 24, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginLeft: 8,
                    marginRight: 4,
                    marginBottom: 4,
                    shadowColor: input.trim() && !isLoading ? '#8B0000' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: input.trim() && !isLoading ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: input.trim() && !isLoading ? 6 : 0,
                    transform: [{ scale: input.trim() && !isLoading ? 1.05 : 1 }]
                  }} 
                  onPress={() => sendMessage(input)} 
                  disabled={!input.trim() || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={input.trim() && !isLoading ? 'white' : '#9CA3AF'} 
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const MessageBubble: React.FC<{ message: ChatMessage; isFirst: boolean }> = ({ message, isFirst }) => (
  <View style={{ 
    flexDirection: 'row', 
    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start', 
    marginBottom: 16, 
    marginTop: isFirst ? 0 : 12,
    paddingHorizontal: 4
  }}>
    {message.sender === 'bot' && (
      <View style={{ 
        width: 36, 
        height: 36, 
        backgroundColor: '#8B0000', 
        borderRadius: 18, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginRight: 10,
        shadowColor: '#8B0000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'white'
      }}>
        <Ionicons name="paw-outline" size={20} color="white" />
      </View>
    )}
    <View style={{ 
      maxWidth: 280, 
      backgroundColor: message.sender === 'user' ? '#8B0000' : 'white', 
      shadowColor: message.sender === 'user' ? '#8B0000' : '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: message.sender === 'user' ? 0.3 : 0.1, 
      shadowRadius: 6, 
      elevation: 4, 
      borderTopLeftRadius: 20, 
      borderTopRightRadius: 20, 
      borderBottomLeftRadius: message.sender === 'user' ? 20 : 6, 
      borderBottomRightRadius: message.sender === 'user' ? 6 : 20,
      borderWidth: message.sender === 'bot' ? 1.5 : 0,
      borderColor: message.sender === 'bot' ? '#E2E8F0' : 'transparent'
    }}>
      <Text style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 15, 
        color: message.sender === 'user' ? 'white' : '#1F2937', 
        lineHeight: 22,
        fontWeight: message.sender === 'user' ? '500' : '400'
      }}>{message.text}</Text>
    </View>
    {message.sender === 'user' && (
      <>
        <View style={{ width: 10 }} />
        <View style={{ 
          width: 36, 
          height: 36, 
          backgroundColor: '#8B0000', 
          borderRadius: 18, 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginLeft: 10,
          shadowColor: '#8B0000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 4,
          borderWidth: 2,
          borderColor: 'white'
        }}>
          <Ionicons name="person" size={20} color="white" />
        </View>
      </>
    )}
  </View>
);

const LoadingDots: React.FC = () => (
  <View style={{ 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    marginLeft: 46,
    paddingVertical: 8
  }}>
    <View style={{ 
      width: 10, 
      height: 10, 
      backgroundColor: '#8B0000', 
      borderRadius: 5, 
      marginRight: 6,
      opacity: 0.4,
      shadowColor: '#8B0000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1
    }} />
    <View style={{ 
      width: 10, 
      height: 10, 
      backgroundColor: '#8B0000', 
      borderRadius: 5, 
      marginRight: 6,
      opacity: 0.7,
      shadowColor: '#8B0000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1
    }} />
    <View style={{ 
      width: 10, 
      height: 10, 
      backgroundColor: '#8B0000', 
      borderRadius: 5,
      opacity: 1,
      shadowColor: '#8B0000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1
    }} />
  </View>
);


