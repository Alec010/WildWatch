import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../lib/storage';
import { config } from '../lib/config';
import { useResponsive } from '../src/hooks/useResponsive';

type Sender = 'user' | 'bot';

interface ChatMessage { sender: Sender; text: string }
interface ChatRequest { message: string }
interface ChatResponse { reply: string }

export default function ChatbotScreen() {
  const { spacing, fontSize } = useResponsive();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'bot', text: 'Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?' }]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => { storage.getToken().then(setToken).catch(() => setToken(null)); }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => { scrollViewRef.current?.scrollToEnd({ animated: true }); }, 100);
      return () => clearTimeout(t);
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !token) return;
    const userMessage: ChatMessage = { sender: 'user', text: messageText.trim() };
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
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I encountered an error. Please try again in a moment.' }]);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F7F7' }}>
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-3" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#8B0000" />
          </TouchableOpacity>
          <Text className="font-bold text-[#8B0000] text-xl" style={{ fontSize: 20 }}>Ask Kat</Text>
        </View>
        <View className="flex-row items-center space-x-4" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView ref={scrollViewRef} style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}>
          {messages.map((m, idx) => (
            <MessageBubble key={idx} message={m} isFirst={idx === 0} />
          ))}
          {isLoading && <LoadingDots />}
        </ScrollView>

        {messages.length === 1 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>Suggested questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
              {quickResponses.map((q) => (
                <TouchableOpacity key={q} style={{ borderColor: '#8B00004D', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }} onPress={() => sendMessage(q)}>
                  <Text style={{ fontSize: 12, color: '#8B0000' }}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput style={{ flex: 1, borderColor: '#8B00004D', borderWidth: 1, fontSize: 16, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, marginRight: 8 }} value={input} onChangeText={setInput} placeholder="Type your message here..." placeholderTextColor="#9CA3AF" editable={!isLoading} multiline />
            <TouchableOpacity style={{ width: 48, height: 48, backgroundColor: input.trim() && !isLoading ? '#8B0000' : '#E5E7EB', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }} onPress={() => sendMessage(input)} disabled={!input.trim() || isLoading}>
              {isLoading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={24} color={input.trim() ? 'white' : '#9CA3AF'} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const MessageBubble: React.FC<{ message: ChatMessage; isFirst: boolean }> = ({ message, isFirst }) => (
  <View style={{ flexDirection: 'row', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8, marginTop: isFirst ? 0 : 8 }}>
    {message.sender === 'bot' && (
      <View style={{ width: 32, height: 32, backgroundColor: '#8B0000B3', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
        <Ionicons name="chatbubble-ellipses" size={20} color="white" />
      </View>
    )}
    <View style={{ maxWidth: 280, backgroundColor: message.sender === 'user' ? '#8B0000' : '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: message.sender === 'user' ? 16 : 4, borderBottomRightRadius: message.sender === 'user' ? 4 : 16 }}>
      <Text style={{ paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: message.sender === 'user' ? 'white' : 'black', lineHeight: 20 }}>{message.text}</Text>
    </View>
    {message.sender === 'user' && (
      <>
        <View style={{ width: 8 }} />
        <View style={{ width: 32, height: 32, backgroundColor: '#8B0000', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
          <Ionicons name="person" size={20} color="white" />
        </View>
      </>
    )}
  </View>
);

const LoadingDots: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 40 }}>
    <View style={{ width: 8, height: 8, backgroundColor: '#8B000066', borderRadius: 4, marginRight: 4 }} />
    <View style={{ width: 8, height: 8, backgroundColor: '#8B000066', borderRadius: 4, marginRight: 4 }} />
    <View style={{ width: 8, height: 8, backgroundColor: '#8B000066', borderRadius: 4 }} />
  </View>
);


