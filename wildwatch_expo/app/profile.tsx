import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userAPI } from '../src/features/users/api/user_api';
import { useUserProfile } from '../src/features/users/hooks/useUserProfile';
import type { UserProfile, UserUpdateRequest } from '../src/features/users/models/UserProfileModels';
import { storage } from '../lib/storage';
import { config } from '../lib/config';
import Colors from '../constants/Colors';
import { useThemeColor } from '../components/Themed';
import FloatingAskKatButton from '../components/FloatingAskKatButton';
import TopSpacing from '../components/TopSpacing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Sender = 'user' | 'bot';
interface ChatMessage { sender: Sender; text: string }
interface ChatRequest { message: string }
interface ChatResponse { reply: string }
const isIPhone = Platform.OS === 'ios';
const isSmallIPhone = screenHeight <= 667;
const isMediumIPhone = screenHeight > 667 && screenHeight <= 812;
const isLargeIPhone = screenHeight > 812 && screenHeight <= 844;
const isXLargeIPhone = screenHeight > 844 && screenHeight <= 932;
const isIPhone15Pro = screenHeight > 932 && screenHeight <= 1000;
const isIPhone15ProMax = screenHeight > 1000;

const getResponsiveSpacing = () => {
  if (isSmallIPhone) return { small: 8, medium: 12, large: 16, xlarge: 20 };
  if (isMediumIPhone) return { small: 10, medium: 14, large: 18, xlarge: 24 };
  if (isLargeIPhone) return { small: 12, medium: 16, large: 20, xlarge: 28 };
  if (isXLargeIPhone) return { small: 14, medium: 18, large: 22, xlarge: 30 };
  if (isIPhone15Pro) return { small: 16, medium: 20, large: 24, xlarge: 32 };
  return { small: 18, medium: 22, large: 26, xlarge: 34 };
};
const spacing = getResponsiveSpacing();

const getResponsiveFontSize = () => {
  if (isSmallIPhone) return { small: 10, medium: 12, large: 14, xlarge: 16, xxlarge: 20, title: 22 };
  if (isMediumIPhone) return { small: 11, medium: 13, large: 15, xlarge: 17, xxlarge: 22, title: 24 };
  if (isLargeIPhone) return { small: 12, medium: 14, large: 16, xlarge: 18, xxlarge: 24, title: 26 };
  if (isXLargeIPhone) return { small: 13, medium: 15, large: 17, xlarge: 19, xxlarge: 25, title: 27 };
  if (isIPhone15Pro) return { small: 14, medium: 16, large: 18, xlarge: 20, xxlarge: 26, title: 28 };
  return { small: 15, medium: 17, large: 19, xlarge: 21, xxlarge: 27, title: 29 };
};
const fontSize = getResponsiveFontSize();

const getResponsiveIconSize = () => {
  if (isSmallIPhone) return { small: 12, medium: 16, large: 20, xlarge: 24 };
  if (isMediumIPhone) return { small: 14, medium: 18, large: 22, xlarge: 26 };
  if (isLargeIPhone) return { small: 16, medium: 20, large: 24, xlarge: 28 };
  if (isXLargeIPhone) return { small: 18, medium: 22, large: 26, xlarge: 30 };
  if (isIPhone15Pro) return { small: 20, medium: 24, large: 28, xlarge: 32 };
  return { small: 22, medium: 26, large: 30, xlarge: 34 };
};
const iconSize = getResponsiveIconSize();

// Theme colors using the established WildWatch brand
const primaryColor = Colors.maroon; // #800000
const accentColor = Colors.gold; // #D4AF37
const backgroundColor = '#F8FAFC';
const cardColor = '#FFFFFF';
const textPrimaryColor = '#1A1A1A';
const textSecondaryColor = '#6B7280';
const borderColor = '#E5E7EB';
const shadowColor = '#000000';

// Types moved to feature models and imported at top

interface ProfileSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, icon, iconTint, backgroundColor = 'white', children }) => (
  <View style={{ 
    backgroundColor, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 4, 
    elevation: 2, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.08)',
    overflow: 'hidden'
  }}>
    <View>
      <View style={{ 
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: `${iconTint}08`,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(139, 0, 0, 0.1)'
      }}>
        <View style={{ 
          width: 32, 
          height: 32, 
          borderRadius: 16,
          backgroundColor: `${iconTint}15`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          shadowColor: iconTint,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 1
        }}>
          <Ionicons name={icon} size={16} color={iconTint} />
        </View>
        <Text style={{ 
          fontSize: 14, 
          color: textPrimaryColor, 
          fontWeight: '700',
          letterSpacing: 0.1
        }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  </View>
);

interface ProfileTextFieldProps {
  value: string;
  onValueChange: (text: string) => void;
  label: string;
  readOnly?: boolean;
  leadingIcon?: React.ReactNode;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: any;
}

const ProfileTextField: React.FC<ProfileTextFieldProps> = ({ value, onValueChange, label, readOnly = true, leadingIcon, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', style }) => (
  <View style={{ marginBottom: 16, ...style }}>
    <Text style={{ 
      fontSize: 12, 
      color: textSecondaryColor, 
      fontWeight: '600',
      marginBottom: 4,
      letterSpacing: 0.1
    }}>
      {label}
    </Text>
    <View style={{ position: 'relative' }}>
      {leadingIcon && <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 10 }}>{leadingIcon}</View>}
      <TextInput
        value={value}
        onChangeText={onValueChange}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textAlignVertical="center"
        style={{ 
          width: '100%',
          height: 44,
          paddingRight: 14,
          paddingLeft: leadingIcon ? 44 : 14,
          paddingVertical: 10,
          backgroundColor: readOnly ? '#F8FAFC' : 'white', 
          borderColor: readOnly ? '#E2E8F0' : primaryColor, 
          borderWidth: readOnly ? 1 : 1.5,
          color: readOnly ? textSecondaryColor : textPrimaryColor, 
          fontSize: 13, 
          textAlign: 'left', 
          borderRadius: 8,
          fontWeight: readOnly ? '500' : '400',
          shadowColor: readOnly ? 'transparent' : '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: readOnly ? 0 : 0.03,
          shadowRadius: 2,
          elevation: readOnly ? 0 : 1
        }}
      />
    </View>
  </View>
);

// Chatbot components
const MessageBubble: React.FC<{ message: ChatMessage; isFirst: boolean }> = ({ message, isFirst }) => (
  <View style={{ flexDirection: 'row', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8, marginTop: isFirst ? 0 : 8 }}>
    {message.sender === 'bot' && (
      <View style={{ width: 32, height: 32, backgroundColor: '#8B0000B3', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
        <Ionicons name="paw-outline" size={20} color="white" />
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

export default function ProfileScreen() {
  const { userProfile, isLoading, error, fetchUserProfile, updateUserProfile, setUserProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAskKatVisible, setIsAskKatVisible] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [originalValues, setOriginalValues] = useState({ firstName: '', lastName: '', middleInitial: '', contactNumber: '' });

  // Chatbot state
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'bot', text: 'Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?' }]);
  const [input, setInput] = useState<string>('');
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);

  useEffect(() => {
    // Hydrated by hook
  }, []);

  // Chatbot effects
  useEffect(() => { storage.getToken().then(setToken).catch(() => setToken(null)); }, []);

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
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName);
      setLastName(userProfile.lastName);
      setMiddleInitial(userProfile.middleInitial || '');
      setContactNumber(userProfile.contactNumber);
      setOriginalValues({ firstName: userProfile.firstName, lastName: userProfile.lastName, middleInitial: userProfile.middleInitial || '', contactNumber: userProfile.contactNumber });
    }
  }, [userProfile]);

  const onRefreshProfile = async () => { await fetchUserProfile(); };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    if (firstName === originalValues.firstName && lastName === originalValues.lastName && middleInitial === originalValues.middleInitial && contactNumber === originalValues.contactNumber) {
      Alert.alert('No Changes', 'No changes to save.');
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const updateRequest: UserUpdateRequest = { firstName, lastName, middleInitial: middleInitial || undefined, contactNumber };
      const updated = await updateUserProfile(updateRequest);
      setUserProfile(updated);
      setOriginalValues({ firstName, lastName, middleInitial: middleInitial || '', contactNumber });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(originalValues.firstName);
    setLastName(originalValues.lastName);
    setMiddleInitial(originalValues.middleInitial);
    setContactNumber(originalValues.contactNumber);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => { await storage.removeToken(); router.replace('/auth/login' as never); }, style: 'destructive' },
    ]);
  };

  const handleAskKat = () => {
    setIsAskKatVisible(true);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Chatbot functions
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !token) return;
    const userMessage: ChatMessage = { sender: 'user', text: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoadingChat(true);
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
    } finally { setIsLoadingChat(false); }
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left','right','bottom']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text className="text-[#8B0000] mt-4 text-center" style={{ fontSize: fontSize.medium }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['left','right','bottom']}>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="person-circle-outline" size={iconSize.xlarge} color="#9CA3AF" />
          <Text className="text-gray-500 mt-6 text-center" style={{ fontSize: fontSize.medium }}>Failed to load profile. Please try again.</Text>
          {error ? (<Text className="text-red-500 mt-3 text-center" style={{ fontSize: fontSize.small }}>{error}</Text>) : null}
          <TouchableOpacity className="bg-[#8B0000] rounded-xl px-8 py-4 mt-6" onPress={fetchUserProfile}>
            <Text className="text-white font-semibold text-base">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.maroon }}>
      {/* Top spacing for notch */}
      <TopSpacing />

      {/* Enhanced Top App Bar */}
      <View style={{
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
      }}>
        <TouchableOpacity 
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(139, 0, 0, 0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2
          }}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.maroon} />
        </TouchableOpacity>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: Colors.maroon,
            letterSpacing: 0.3
          }}>Profile</Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      <View className="flex-1" style={{ padding: 16 }}>
        {/* Profile Card */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: 'rgba(139, 0, 0, 0.08)'
        }}>
          {/* Left Section - Avatar and User Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {/* Profile Avatar with Initials */}
            <View style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: 'white',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
              borderWidth: 3,
              borderColor: 'white'
            }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: primaryColor,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: primaryColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: 1
                }}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            
            {/* User Info Section */}
            <View style={{ flex: 1 }}>
              {/* User Name with Enhanced Typography */}
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: textPrimaryColor,
                letterSpacing: 0.2,
                marginBottom: 3
              }}>{firstName.toUpperCase()}</Text>
              
              {/* Email with Better Styling */}
              <Text style={{
                fontSize: 12,
                color: textSecondaryColor,
                fontWeight: '500',
                opacity: 0.8,
                marginBottom: 4
              }}>{userProfile.email}</Text>
              
              {/* Role Badge */}
              <View style={{
                backgroundColor: `${primaryColor}15`,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 10,
                alignSelf: 'flex-start',
                borderWidth: 1,
                borderColor: `${primaryColor}30`
              }}>
                <Text style={{
                  fontSize: 10,
                  color: primaryColor,
                  fontWeight: '600',
                  letterSpacing: 0.1
                }}>{userProfile.role.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Right Section - Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 0, alignItems: 'center' }}>
            {isEditing ? (
              <>
                {/* Cancel Button */}
                  <TouchableOpacity
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={handleCancelEdit}
                  >
                    <Ionicons name="close" size={22} color={textSecondaryColor} />
                  </TouchableOpacity>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={primaryColor} size="small" />
                    ) : (
                      <Ionicons name="save" size={22} color={primaryColor} />
                    )}
                  </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Edit Profile Button */}
                <TouchableOpacity
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create" size={22} color={primaryColor} />
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity 
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out" size={22} color={primaryColor} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ProfileSection title="Personal Information" icon="person-outline" iconTint={primaryColor}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <ProfileTextField value={firstName} onValueChange={(text) => setFirstName(text.replace(/^./, text[0]?.toUpperCase() || ''))} label="First Name" readOnly={!isEditing} placeholder="Enter first name" style={{ marginBottom: 0 }} />
              </View>
              <View style={{ width: 80 }}>
                <ProfileTextField value={middleInitial} onValueChange={(text) => setMiddleInitial(text.toUpperCase().slice(0, 1))} label="M.I." readOnly={!isEditing} placeholder="I" autoCapitalize="characters" style={{ marginBottom: 0 }} />
              </View>
              <View style={{ flex: 1 }}>
                <ProfileTextField value={lastName} onValueChange={(text) => setLastName(text.replace(/^./, text[0]?.toUpperCase() || ''))} label="Last Name" readOnly={!isEditing} placeholder="Enter last name" style={{ marginBottom: 0 }} />
              </View>
            </View>
            <ProfileTextField value={contactNumber} onValueChange={setContactNumber} label="Contact Number" readOnly={!isEditing} placeholder="Enter contact number" keyboardType="phone-pad" leadingIcon={<Ionicons name="call-outline" size={16} color={textSecondaryColor} />} />
          </View>
        </ProfileSection>

        <ProfileSection title="Account Information" icon="at-circle-outline" iconTint={primaryColor}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: textSecondaryColor, fontWeight: '600', marginBottom: 4, letterSpacing: 0.1 }}>Institutional Email</Text>
              <View style={{ position: 'relative' }}>
                <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 10 }}>
                  <Ionicons name="mail-outline" size={16} color={textSecondaryColor} />
                </View>
                <TextInput
                  value={userProfile.email}
                  editable={false}
                  style={{
                    width: '100%',
                    height: 44,
                    paddingRight: 14,
                    paddingLeft: 44,
                    paddingVertical: 10,
                    backgroundColor: '#F8FAFC',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    color: textSecondaryColor,
                    fontSize: 13,
                    borderRadius: 8,
                    fontWeight: '500'
                  }}
                />
              </View>
              <Text style={{ fontSize: 10, color: textSecondaryColor, fontStyle: 'italic', marginTop: 4, marginLeft: 4 }}>Email cannot be changed</Text>
            </View>

            <View>
              <Text style={{ fontSize: 12, color: textSecondaryColor, fontWeight: '600', marginBottom: 4, letterSpacing: 0.1 }}>Role</Text>
              <View style={{ position: 'relative' }}>
                <View style={{ position: 'absolute', left: 14, top: 14, zIndex: 10 }}>
                  <Ionicons name="school-outline" size={16} color={textSecondaryColor} />
                </View>
                <TextInput
                  value={userProfile.role}
                  editable={false}
                  style={{
                    width: '100%',
                    height: 44,
                    paddingRight: 14,
                    paddingLeft: 44,
                    paddingVertical: 10,
                    backgroundColor: '#F8FAFC',
                    borderColor: '#E2E8F0',
                    borderWidth: 1,
                    color: textSecondaryColor,
                    fontSize: 13,
                    borderRadius: 8,
                    fontWeight: '500'
                  }}
                />
              </View>
              <Text style={{ fontSize: 10, color: textSecondaryColor, fontStyle: 'italic', marginTop: 4, marginLeft: 4 }}>Role is assigned by the system</Text>
            </View>
          </View>
        </ProfileSection>


      </View>

      {/* Floating Ask Kat Button Component */}
      <FloatingAskKatButton 
        onPress={handleAskKat}
        primaryColor={primaryColor}
        buttonSize={60}
        margin={20}
      />

       {/* Ask Kat Bottom Sheet Modal */}
       <Modal
         visible={isAskKatVisible}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setIsAskKatVisible(false)}
         statusBarTranslucent={true}
       >
         <KeyboardAvoidingView 
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
           style={{ flex: 1, backgroundColor: 'white' }}
         >
           <View 
             style={{
               flex: 1,
               backgroundColor: 'white',
               paddingTop: Platform.OS === 'ios' ? 50 : 20,
               paddingBottom: isKeyboardVisible ? 20 : 40,
               paddingHorizontal: 20,
               shadowColor: '#000',
               shadowOffset: { width: 0, height: -4 },
               shadowOpacity: 0.3,
               shadowRadius: 16,
               elevation: 16
             }}
           >
              {/* Header with Close Button */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                paddingBottom: 20,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: primaryColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    shadowColor: primaryColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3
                  }}>
                    <Ionicons name="paw-outline" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={{
                      fontSize: 20,
                      fontWeight: '800',
                      color: textPrimaryColor,
                      letterSpacing: 0.3
                    }}>Ask Kat</Text>
                    <Text style={{
                      fontSize: 13,
                      color: textSecondaryColor,
                      fontWeight: '500'
                    }}>Your AI Assistant</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setIsAskKatVisible(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#F8FAFC',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1
                  }}
                >
                  <Ionicons name="close" size={20} color={textSecondaryColor} />
                </TouchableOpacity>
              </View>

            {/* Chat Area */}
            <View style={{ flex: 1, marginBottom: isKeyboardVisible ? 10 : 0 }}>
              <ScrollView 
                ref={scrollViewRef} 
                style={{ 
                  flex: 1, 
                  backgroundColor: '#FAFBFC',
                  borderRadius: 16,
                  marginHorizontal: 4
                }} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ 
                  paddingTop: 20, 
                  paddingBottom: isKeyboardVisible ? 10 : 20,
                  paddingHorizontal: 16,
                  flexGrow: 1
                }}
              >
                {messages.map((m, idx) => (
                  <MessageBubble key={idx} message={m} isFirst={idx === 0} />
                ))}
                {isLoadingChat && <LoadingDots />}
              </ScrollView>

              {messages.length === 1 && (
                <View style={{ 
                  paddingHorizontal: 20, 
                  paddingVertical: 20,
                  backgroundColor: '#F8FAFC',
                  borderRadius: 12,
                  marginHorizontal: 4,
                  marginBottom: 16
                }}>
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: 12,
                    letterSpacing: 0.2
                  }}>Suggested questions:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                    {quickResponses.map((q) => (
                      <TouchableOpacity 
                        key={q} 
                        style={{ 
                          borderColor: '#8B000030', 
                          borderWidth: 1, 
                          borderRadius: 24, 
                          paddingHorizontal: 16, 
                          paddingVertical: 10, 
                          marginRight: 10,
                          backgroundColor: 'white',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1
                        }} 
                        onPress={() => sendMessage(q)}
                      >
                        <Text style={{ 
                          fontSize: 13, 
                          color: '#8B0000',
                          fontWeight: '500'
                        }}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Input Area - Fixed at bottom */}
            <View style={{ 
              backgroundColor: 'white', 
              paddingHorizontal: 20, 
              paddingVertical: isKeyboardVisible ? 12 : 20, 
              shadowColor: '#000', 
              shadowOffset: { width: 0, height: -2 }, 
              shadowOpacity: 0.1, 
              shadowRadius: 12, 
              elevation: 8,
              borderRadius: 16,
              marginHorizontal: 4,
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              marginBottom: isKeyboardVisible ? 0 : 0
            }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderRadius: 28,
                paddingHorizontal: 4,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: '#E2E8F0'
              }}>
                <TextInput 
                  style={{ 
                    flex: 1, 
                    borderColor: 'transparent', 
                    borderWidth: 0, 
                    fontSize: 16, 
                    borderRadius: 24, 
                    paddingHorizontal: 20, 
                    paddingVertical: 14, 
                    marginRight: 8,
                    backgroundColor: 'transparent',
                    color: textPrimaryColor,
                    minHeight: 48,
                    maxHeight: 120,
                    textAlignVertical: 'top'
                  }} 
                  value={input} 
                  onChangeText={setInput} 
                  placeholder="Type your message here..." 
                  placeholderTextColor="#9CA3AF" 
                  editable={!isLoadingChat} 
                  multiline
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (input.trim() && !isLoadingChat) {
                      sendMessage(input);
                    }
                  }}
                  blurOnSubmit={false}
                />
                <TouchableOpacity 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    backgroundColor: input.trim() && !isLoadingChat ? primaryColor : '#E5E7EB', 
                    borderRadius: 24, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    shadowColor: input.trim() && !isLoadingChat ? primaryColor : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: input.trim() && !isLoadingChat ? 2 : 0,
                    alignSelf: 'flex-end',
                    marginBottom: 0
                  }} 
                  onPress={() => sendMessage(input)} 
                  disabled={!input.trim() || isLoadingChat}
                >
                  {isLoadingChat ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={24} color={input.trim() ? 'white' : '#9CA3AF'} />}
                </TouchableOpacity>
              </View>
             </View>
           </View>
         </KeyboardAvoidingView>
       </Modal>
    </View>
  );
}



