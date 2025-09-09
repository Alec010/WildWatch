import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { userAPI } from '../src/features/users/api/user_api';
import { useUserProfile } from '../src/features/users/hooks/useUserProfile';
import type { UserProfile, UserUpdateRequest } from '../src/features/users/models/UserProfileModels';
import { storage } from '../lib/storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
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

const primaryColor = '#8B0000';
const accentColor = '#E09F3E';
const backgroundColor = '#F9F7F7';
const cardColor = '#FFFFFF';
const textPrimaryColor = '#333333';
const textSecondaryColor = '#666666';

// Types moved to feature models and imported at top

interface ProfileSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, icon, iconTint, backgroundColor = cardColor, children }) => (
  <View className="bg-white rounded-2xl mb-4 shadow-sm" style={{ backgroundColor, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderRadius: 16 }}>
    <View>
      <View className="flex-row items-center p-4">
        <Ionicons name={icon} size={24} color={iconTint} />
        <View style={{ width: 12 }} />
        <Text className="font-bold text-gray-900" style={{ fontSize: 16, color: textPrimaryColor }}>
          {title}
        </Text>
      </View>
      <View className="h-px bg-gray-200" style={{ backgroundColor: '#EEEEEE' }} />
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
  <View className="mb-4" style={style}>
    <Text className="text-sm font-medium mb-2 text-gray-700" style={{ fontSize: 12, color: textSecondaryColor }}>
      {label}
    </Text>
    <View className="relative">
      {leadingIcon && <View className="absolute left-4 top-4 z-10">{leadingIcon}</View>}
      <TextInput
        className={`w-full h-14 pr-4 border rounded-xl text-base ${readOnly ? 'border-gray-200 bg-gray-50 text-gray-600' : 'border-gray-300 text-gray-900'}`}
        value={value}
        onChangeText={onValueChange}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textAlignVertical="center"
        style={{ backgroundColor: readOnly ? '#FAFAFA' : 'white', borderColor: readOnly ? '#E5E7EB' : '#D1D5DB', color: readOnly ? textSecondaryColor : textPrimaryColor, fontSize: 16, textAlign: 'left', paddingHorizontal: leadingIcon ? 56 : 16, paddingVertical: 8, borderRadius: 12 }}
      />
    </View>
  </View>
);

export default function ProfileScreen() {
  const { userProfile, isLoading, error, fetchUserProfile, updateUserProfile, setUserProfile } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [originalValues, setOriginalValues] = useState({ firstName: '', lastName: '', middleInitial: '', contactNumber: '' });

  useEffect(() => {
    // Hydrated by hook
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
    try { router.push('/chatbot' as never); } catch { router.back(); }
  };

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
    <SafeAreaView className="flex-1" style={{ backgroundColor }} edges={['left','right','bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ height: 200, marginBottom: 16 }}>
          <View style={{ height: 140 }}>
            <View style={{ flex: 1, backgroundColor: primaryColor }} />
          </View>
          <View className="bg-white rounded-2xl shadow-sm" style={{ marginHorizontal: 16, marginTop: 70, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderRadius: 16 }}>
            <View className="p-4">
              <View style={{ height: 40 }} />
              <View className="items-center mb-2">
                <Text className="font-bold text-center" style={{ fontSize: 22, color: textPrimaryColor }}>{firstName}</Text>
              </View>
              <View style={{ height: 4 }} />
              <View className="items-center">
                <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${accentColor}26`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text className="font-medium text-center" style={{ fontSize: 12, color: `${accentColor}CC` }}>ID: {userProfile.schoolIdNumber} • {userProfile.role}</Text>
                </View>
              </View>
              <View style={{ height: 8 }} />
            </View>
          </View>
          <View className="absolute" style={{ top: 30, left: '50%', width: 90, height: 90, marginLeft: -45 }}>
            <View className="rounded-full items-center justify-center border-3" style={{ width: 90, height: 90, backgroundColor: cardColor, borderColor: cardColor, borderWidth: 3, padding: 3 }}>
              <View className="rounded-full items-center justify-center" style={{ width: 84, height: 84, backgroundColor }}>
                <Ionicons name="person" size={50} color={primaryColor} />
              </View>
            </View>
          </View>
        </View>

        <ProfileSection title="Personal Information" icon="person-outline" iconTint={primaryColor}>
          <View className="flex-row px-4 py-2" style={{ gap: 8 }}>
            <View className="flex-1">
              <ProfileTextField value={firstName} onValueChange={(text) => setFirstName(text.replace(/^./, text[0]?.toUpperCase() || ''))} label="First Name" readOnly={!isEditing} placeholder="Enter first name" style={{ marginBottom: 0 }} />
            </View>
            <View style={{ width: 60 }}>
              <ProfileTextField value={middleInitial} onValueChange={(text) => setMiddleInitial(text.toUpperCase().slice(0, 1))} label="M.I." readOnly={!isEditing} placeholder="I" autoCapitalize="characters" style={{ marginBottom: 0 }} />
            </View>
            <View className="flex-1">
              <ProfileTextField value={lastName} onValueChange={(text) => setLastName(text.replace(/^./, text[0]?.toUpperCase() || ''))} label="Last Name" readOnly={!isEditing} placeholder="Enter last name" style={{ marginBottom: 0 }} />
            </View>
          </View>
          <View className="px-4 py-2">
            <ProfileTextField value={contactNumber} onValueChange={setContactNumber} label="Contact Number" readOnly={!isEditing} placeholder="Enter contact number" keyboardType="phone-pad" leadingIcon={<Ionicons name="call-outline" size={iconSize.medium} color={textSecondaryColor} />} />
          </View>
        </ProfileSection>

        <ProfileSection title="Account Information" icon="at-circle-outline" iconTint={primaryColor}>
          <View className="px-4 py-2 mb-4">
            <Text className="font-medium mb-2" style={{ fontSize: 12, color: textSecondaryColor }}>Institutional Email</Text>
            <View style={{ height: 4 }} />
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Ionicons name="mail-outline" size={iconSize.medium} color={textSecondaryColor} />
              </View>
              <TextInput className="w-full h-14 pr-4 border rounded-xl text-base" value={userProfile.email} editable={false} style={{ backgroundColor: `${backgroundColor}80`, borderColor: '#E5E7EB', color: textSecondaryColor, fontSize: 16, borderRadius: 12, paddingLeft: 56 }} />
            </View>
            <Text className="text-xs mt-2 ml-1" style={{ fontSize: 10, color: textSecondaryColor }}>Email cannot be changed</Text>
          </View>

          <View className="px-4 py-2">
            <Text className="font-medium mb-2" style={{ fontSize: 12, color: textSecondaryColor }}>Role</Text>
            <View style={{ height: 4 }} />
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Ionicons name="school-outline" size={iconSize.medium} color={textSecondaryColor} />
              </View>
              <TextInput className="w-full h-14 pr-4 border rounded-xl text-base" value={userProfile.role} editable={false} style={{ backgroundColor: `${backgroundColor}80`, borderColor: '#E5E7EB', color: textSecondaryColor, fontSize: 16, borderRadius: 12, paddingLeft: 56 }} />
            </View>
            <Text className="text-xs mt-2 ml-1" style={{ fontSize: 10, color: textSecondaryColor }}>Role is assigned by the system</Text>
          </View>
        </ProfileSection>

        <ProfileSection title="Account Actions" icon="settings-outline" iconTint={primaryColor}>
          <View className="p-4" style={{ gap: 12 }}>
            <TouchableOpacity className="bg-[#8B0000] rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 16, backgroundColor: primaryColor, borderRadius: 12 }} onPress={handleAskKat}>
              <Ionicons name="chatbubble-ellipses" size={iconSize.large} color="white" />
              <Text className="text-white font-medium ml-2" style={{ fontSize: fontSize.medium }}>Ask Kat</Text>
            </TouchableOpacity>

            {isEditing ? (
              <View className="flex-row" style={{ gap: 8 }}>
                <TouchableOpacity className="flex-1 border rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 16, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 12 }} onPress={handleCancelEdit}>
                  <Ionicons name="close" size={iconSize.large} color={textSecondaryColor} />
                  <Text className="font-medium ml-2" style={{ fontSize: fontSize.medium, color: textSecondaryColor }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-[#8B0000] rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 16, backgroundColor: primaryColor, borderRadius: 12 }} onPress={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? <ActivityIndicator color="white" size="small" /> : (<><Ionicons name="save" size={iconSize.large} color="white" /><Text className="text-white font-medium ml-2" style={{ fontSize: fontSize.medium }}>Save Changes</Text></>)}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity className="border rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 16, borderColor: primaryColor, borderWidth: 1, borderRadius: 12 }} onPress={() => setIsEditing(true)}>
                <Ionicons name="create-outline" size={iconSize.large} color={primaryColor} />
                <Text className="font-medium ml-2" style={{ fontSize: fontSize.medium, color: primaryColor }}>Edit Profile</Text>
              </TouchableOpacity>
            )}

            {!isEditing && (
              <TouchableOpacity className="border rounded-xl flex-row items-center justify-center" style={{ paddingVertical: 16, borderColor: primaryColor, borderWidth: 1, borderRadius: 12 }} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={iconSize.large} color={primaryColor} />
                <Text className="text-white font-medium ml-2" style={{ fontSize: fontSize.medium, color: primaryColor }}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        </ProfileSection>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

