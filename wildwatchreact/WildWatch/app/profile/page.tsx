import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device-specific constants for iPhone compatibility
const isIPhone = Platform.OS === 'ios';
const isSmallIPhone = screenHeight <= 667; // iPhone SE, iPhone 8
const isMediumIPhone = screenHeight > 667 && screenHeight <= 812; // iPhone X, XS, 11 Pro, 12 mini
const isLargeIPhone = screenHeight > 812 && screenHeight <= 844; // iPhone XR, 11, 12, 13
const isXLargeIPhone = screenHeight > 844 && screenHeight <= 932; // iPhone 12 Pro Max, 13 Pro Max, 14 Plus, 15 Plus
const isIPhone15Pro = screenHeight > 932 && screenHeight <= 1000; // iPhone 15 Pro, 16 Pro, 17 Pro
const isIPhone15ProMax = screenHeight > 1000; // iPhone 15 Pro Max, 16 Pro Max, 17 Pro Max

// Responsive spacing and sizing
const getResponsiveSpacing = () => {
  if (isSmallIPhone) return { small: 8, medium: 12, large: 16, xlarge: 20 };
  if (isMediumIPhone) return { small: 10, medium: 14, large: 18, xlarge: 24 };
  if (isLargeIPhone) return { small: 12, medium: 16, large: 20, xlarge: 28 };
  if (isXLargeIPhone) return { small: 14, medium: 18, large: 22, xlarge: 30 };
  if (isIPhone15Pro) return { small: 16, medium: 20, large: 24, xlarge: 32 };
  return { small: 18, medium: 22, large: 26, xlarge: 34 }; // iPhone 15 Pro Max and larger
};

const spacing = getResponsiveSpacing();

// Responsive font sizes
const getResponsiveFontSize = () => {
  if (isSmallIPhone) return { small: 10, medium: 12, large: 14, xlarge: 16, xxlarge: 20, title: 22 };
  if (isMediumIPhone) return { small: 11, medium: 13, large: 15, xlarge: 17, xxlarge: 22, title: 24 };
  if (isLargeIPhone) return { small: 12, medium: 14, large: 16, xlarge: 18, xxlarge: 24, title: 26 };
  if (isXLargeIPhone) return { small: 13, medium: 15, large: 17, xlarge: 19, xxlarge: 25, title: 27 };
  if (isIPhone15Pro) return { small: 14, medium: 16, large: 18, xlarge: 20, xxlarge: 26, title: 28 };
  return { small: 15, medium: 17, large: 19, xlarge: 21, xxlarge: 27, title: 29 }; // iPhone 15 Pro Max and larger
};

const fontSize = getResponsiveFontSize();

// Responsive icon sizes
const getResponsiveIconSize = () => {
  if (isSmallIPhone) return { small: 12, medium: 16, large: 20, xlarge: 24 };
  if (isMediumIPhone) return { small: 14, medium: 18, large: 22, xlarge: 26 };
  if (isLargeIPhone) return { small: 16, medium: 20, large: 24, xlarge: 28 };
  if (isXLargeIPhone) return { small: 18, medium: 22, large: 26, xlarge: 30 };
  if (isIPhone15Pro) return { small: 20, medium: 24, large: 28, xlarge: 32 };
  return { small: 22, medium: 26, large: 30, xlarge: 34 }; // iPhone 15 Pro Max and larger
};

const iconSize = getResponsiveIconSize();

// API Base URL - same as AuthContext
const API_BASE_URL = 'http://192.168.1.11:8080/api';

// Colors matching Android Studio exactly
const primaryColor = '#8B0000'; // WildWatchRed
const secondaryColor = '#9E2A2B'; // Slightly lighter red
const accentColor = '#E09F3E'; // Gold accent
const backgroundColor = '#F9F7F7'; // Light background
const cardColor = '#FFFFFF'; // White
const textPrimaryColor = '#333333'; // Dark text
const textSecondaryColor = '#666666'; // Secondary text

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  email: string;
  schoolIdNumber: string;
  contactNumber: string;
  role: string;
  authProvider: string;
}

interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  contactNumber: string;
}

interface ProfileSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  title, 
  icon, 
  iconTint, 
  backgroundColor = cardColor,
  children 
}) => (
  <View 
    className="bg-white rounded-2xl mb-4 shadow-sm"
    style={{ 
      backgroundColor,
      marginHorizontal: spacing.large,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <View className="p-4">
      {/* Section Header */}
      <View className="flex-row items-center mb-3">
        <Ionicons 
          name={icon} 
          size={24} 
          color={iconTint} 
        />
        <View style={{ width: 12 }} />
        <Text 
          className="font-bold text-gray-900"
          style={{ fontSize: 16, color: textPrimaryColor }}
        >
          {title}
        </Text>
      </View>
      
      <View className="h-px bg-gray-200 mb-3" />
      
      {/* Section Content */}
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

const ProfileTextField: React.FC<ProfileTextFieldProps> = ({ 
  value, 
  onValueChange, 
  label, 
  readOnly = true,
  leadingIcon,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style
}) => (
  <View className="mb-3" style={style}>
    <Text 
      className="text-sm font-medium mb-2"
      style={{ fontSize: 12, color: textSecondaryColor }}
    >
      {label}
    </Text>
    <View className="relative">
      {leadingIcon && (
        <View className="absolute left-3 top-3 z-10">
          {leadingIcon}
        </View>
      )}
      <TextInput
        className={`w-full h-12 pl-${leadingIcon ? '12' : '4'} pr-4 border rounded-xl text-base ${
          readOnly 
            ? 'border-gray-200 bg-gray-50 text-gray-600' 
            : 'border-gray-300 focus:border-[#8B0000] text-gray-900'
        }`}
        value={value}
        onChangeText={onValueChange}
        editable={!readOnly}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={{
          backgroundColor: readOnly ? '#FAFAFA' : 'white',
          borderColor: readOnly ? '#E5E7EB' : '#D1D5DB',
          color: readOnly ? textSecondaryColor : textPrimaryColor,
        }}
      />
    </View>
  </View>
);

export default function ProfileScreen() {
  const { user: authUser, token, logout } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  
  // Store original values for cancel functionality
  const [originalValues, setOriginalValues] = useState({
    firstName: '',
    lastName: '',
    middleInitial: '',
    contactNumber: ''
  });

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.firstName);
      setLastName(userProfile.lastName);
      setMiddleInitial(userProfile.middleInitial || '');
      setContactNumber(userProfile.contactNumber);
      
      // Store original values
      setOriginalValues({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        middleInitial: userProfile.middleInitial || '',
        contactNumber: userProfile.contactNumber
      });
    }
  }, [userProfile]);

  const fetchUserProfile = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const profileData = await response.json();
      setUserProfile(profileData);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError(error.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token || !userProfile) return;

    // Check if there are any changes
    if (
      firstName === originalValues.firstName &&
      lastName === originalValues.lastName &&
      middleInitial === originalValues.middleInitial &&
      contactNumber === originalValues.contactNumber
    ) {
      Alert.alert('No Changes', 'No changes to save.');
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    
    try {
      const updateRequest: UserUpdateRequest = {
        firstName,
        lastName,
        middleInitial: middleInitial || undefined,
        contactNumber
      };

      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateRequest),
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.status}`);
      }

      const updatedProfile = await response.json();
      setUserProfile(updatedProfile);
      
      // Update original values
      setOriginalValues({
        firstName,
        lastName,
        middleInitial: middleInitial || '',
        contactNumber
      });
      
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setFirstName(originalValues.firstName);
    setLastName(originalValues.lastName);
    setMiddleInitial(originalValues.middleInitial);
    setContactNumber(originalValues.contactNumber);
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const handleAskKat = () => {
    // Navigate to chatbot or open chat interface
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#8B0000" />
          <Text 
            className="text-[#8B0000] mt-2"
            style={{ fontSize: fontSize.medium }}
          >
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons 
            name="person-circle-outline" 
            size={iconSize.xlarge} 
            color="#9CA3AF" 
          />
          <Text 
            className="text-gray-500 mt-4 text-center"
            style={{ fontSize: fontSize.medium }}
          >
            Failed to load profile. Please try again.
          </Text>
          {error && (
            <Text 
              className="text-red-500 mt-2 text-center"
              style={{ fontSize: fontSize.small }}
            >
              {error}
            </Text>
          )}
          <TouchableOpacity
            className="bg-[#8B0000] rounded-xl px-6 py-3 mt-4"
            onPress={fetchUserProfile}
          >
            <Text className="text-white font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor }}>
      {/* Top App Bar */}
      <View 
        className="flex-row justify-between items-center"
        style={{ 
          paddingHorizontal: spacing.large,
          paddingVertical: isSmallIPhone ? 6 : isMediumIPhone ? 8 : isLargeIPhone ? 10 : isXLargeIPhone ? 12 : isIPhone15Pro ? 14 : 16,
          height: isSmallIPhone ? 45 : isMediumIPhone ? 55 : isLargeIPhone ? 65 : isXLargeIPhone ? 70 : isIPhone15Pro ? 75 : 80
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons 
            name="arrow-back" 
            size={iconSize.large} 
            color={primaryColor} 
          />
        </TouchableOpacity>
        
        <View style={{ width: iconSize.large }} />
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View 
          style={{ 
            height: 200,
            marginBottom: spacing.large
          }}
        >
          {/* Gradient Background */}
          <View style={{ height: 140 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: primaryColor,
              }}
            />
          </View>

          {/* Profile Card */}
          <View 
            className="bg-white rounded-2xl shadow-sm"
            style={{ 
              marginHorizontal: spacing.large,
              marginTop: 70,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <View className="p-4">
              <View style={{ height: 40 }} />
              
              {/* Name */}
              <View className="items-center mb-1">
                <Text 
                  className="font-bold"
                  style={{ fontSize: 22, color: textPrimaryColor }}
                >
                  {firstName}
                </Text>
              </View>
              
              <View style={{ height: 4 }} />
              
              {/* ID and Role */}
              <View className="items-center">
                <View 
                  className="rounded-full px-3 py-1.5"
                  style={{ backgroundColor: `${accentColor}26` }}
                >
                  <Text 
                    className="font-medium"
                    style={{ fontSize: 12, color: `${accentColor}CC` }}
                  >
                    ID: {userProfile.schoolIdNumber} • {userProfile.role}
                  </Text>
                </View>
              </View>
              
              <View style={{ height: 8 }} />
            </View>
          </View>

          {/* Profile Image */}
          <View 
            className="absolute top-30 left-1/2"
            style={{ 
              width: 90,
              height: 90,
              marginLeft: -45,
            }}
          >
            {/* Profile Image Background */}
            <View 
              className="rounded-full items-center justify-center border-3"
              style={{ 
                width: 90,
                height: 90,
                backgroundColor: cardColor,
                borderColor: cardColor,
                borderWidth: 3,
                padding: 3,
              }}
            >
              {/* Profile Image */}
              <View 
                className="rounded-full items-center justify-center"
                style={{ 
                  width: 84,
                  height: 84,
                  backgroundColor,
                }}
              >
                <Ionicons 
                  name="person" 
                  size={50} 
                  color={primaryColor} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Personal Information Section */}
        <ProfileSection
          title="Personal Information"
          icon="person-outline"
          iconTint={primaryColor}
        >
          {/* Name Fields Row */}
          <View 
            className="flex-row"
            style={{ 
              paddingHorizontal: spacing.large,
              paddingVertical: 8,
              gap: 8
            }}
          >
            {/* First Name */}
            <View className="flex-1">
              <ProfileTextField
                value={firstName}
                onValueChange={(text) => setFirstName(text.replace(/^./, text[0]?.toUpperCase() || ''))}
                label="First Name"
                readOnly={!isEditing}
                placeholder="Enter first name"
              />
            </View>

            {/* Middle Initial */}
            <View style={{ width: 60 }}>
              <ProfileTextField
                value={middleInitial}
                onValueChange={(text) => setMiddleInitial(text.toUpperCase().slice(0, 1))}
                label="M.I."
                readOnly={!isEditing}
                placeholder="I"
                autoCapitalize="characters"
              />
            </View>

            {/* Last Name */}
            <View className="flex-1">
              <ProfileTextField
                value={lastName}
                onValueChange={(text) => setLastName(text.replace(/^./, text[0]?.toUpperCase() || ''))}
                label="Last Name"
                readOnly={!isEditing}
                placeholder="Enter last name"
              />
            </View>
          </View>

          {/* Contact Number */}
          <ProfileTextField
            value={contactNumber}
            onValueChange={setContactNumber}
            label="Contact Number"
            readOnly={!isEditing}
            placeholder="Enter contact number"
            keyboardType="phone-pad"
            leadingIcon={
              <Ionicons 
                name="call-outline" 
                size={iconSize.small} 
                color={textSecondaryColor} 
              />
            }
            style={{
              paddingHorizontal: spacing.large,
              paddingVertical: 8
            }}
          />
        </ProfileSection>

        {/* Account Information Section */}
        <ProfileSection
          title="Account Information"
          icon="at-circle-outline"
          iconTint={primaryColor}
        >
          {/* Institutional Email */}
          <View 
            style={{ 
              paddingHorizontal: spacing.large,
              paddingVertical: 8
            }}
          >
            <Text 
              className="font-medium"
              style={{ fontSize: 12, color: textSecondaryColor }}
            >
              Institutional Email
            </Text>
            
            <View style={{ height: 4 }} />
            
            <View className="relative">
              <View className="absolute left-3 top-3 z-10">
                <Ionicons 
                  name="mail-outline" 
                  size={iconSize.small} 
                  color={textSecondaryColor} 
                />
              </View>
              <TextInput
                className="w-full h-12 pl-12 pr-4 border rounded-xl text-base"
                value={userProfile.email}
                editable={false}
                style={{
                  backgroundColor: `${backgroundColor}80`,
                  borderColor: '#E5E7EB',
                  color: textSecondaryColor,
                }}
              />
            </View>
            
            <Text 
              className="text-xs mt-1 ml-1"
              style={{ fontSize: 10, color: textSecondaryColor }}
            >
              Email cannot be changed
            </Text>
          </View>

          {/* Role */}
          <View 
            style={{ 
              paddingHorizontal: spacing.large,
              paddingVertical: 8
            }}
          >
            <Text 
              className="font-medium"
              style={{ fontSize: 12, color: textSecondaryColor }}
            >
              Role
            </Text>
            
            <View style={{ height: 4 }} />
            
            <View className="relative">
              <View className="absolute left-3 top-3 z-10">
                <Ionicons 
                  name="school-outline" 
                  size={iconSize.small} 
                  color={textSecondaryColor} 
                />
              </View>
              <TextInput
                className="w-full h-12 pl-12 pr-4 border rounded-xl text-base"
                value={userProfile.role}
                editable={false}
                style={{
                  backgroundColor: `${backgroundColor}80`,
                  borderColor: '#E5E7EB',
                  color: textSecondaryColor,
                }}
              />
            </View>
            
            <Text 
              className="text-xs mt-1 ml-1"
              style={{ fontSize: 10, color: textSecondaryColor }}
            >
              Role is assigned by the system
            </Text>
          </View>
        </ProfileSection>

        {/* Account Actions Section */}
        <ProfileSection
          title="Account Actions"
          icon="settings-outline"
          iconTint={primaryColor}
        >
          {/* Action buttons */}
          <View 
            style={{ 
              padding: spacing.large,
              gap: 12
            }}
          >
            {/* Ask Kat Button (always visible) */}
            <TouchableOpacity
              className="bg-[#8B0000] rounded-xl flex-row items-center justify-center"
              style={{ 
                paddingVertical: 12,
                backgroundColor: primaryColor
              }}
              onPress={handleAskKat}
            >
              <Ionicons 
                name="chatbubble-ellipses" 
                size={iconSize.medium} 
                color="white" 
              />
              <Text 
                className="text-white font-medium ml-2"
                style={{ fontSize: fontSize.medium }}
              >
                Ask Kat
              </Text>
            </TouchableOpacity>

            {isEditing ? (
              // Show both Save and Cancel buttons when editing
              <View className="flex-row" style={{ gap: 8 }}>
                {/* Cancel Button */}
                <TouchableOpacity
                  className="flex-1 border rounded-xl flex-row items-center justify-center"
                  style={{ 
                    paddingVertical: 12,
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                  }}
                  onPress={handleCancelEdit}
                >
                  <Ionicons 
                    name="close" 
                    size={iconSize.medium} 
                    color={textSecondaryColor} 
                  />
                  <Text 
                    className="font-medium ml-2"
                    style={{ fontSize: fontSize.medium, color: textSecondaryColor }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                {/* Save Button */}
                <TouchableOpacity
                  className="flex-1 bg-[#8B0000] rounded-xl flex-row items-center justify-center"
                  style={{ 
                    paddingVertical: 12,
                    backgroundColor: primaryColor
                  }}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons 
                        name="save" 
                        size={iconSize.medium} 
                        color="white" 
                      />
                      <Text 
                        className="text-white font-medium ml-2"
                        style={{ fontSize: fontSize.medium }}
                      >
                        Save Changes
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Edit Profile Button (only when not editing)
              <TouchableOpacity
                className="border rounded-xl flex-row items-center justify-center"
                style={{ 
                  paddingVertical: 12,
                  borderColor: primaryColor,
                  borderWidth: 1,
                }}
                onPress={() => setIsEditing(true)}
              >
                <Ionicons 
                  name="create-outline" 
                  size={iconSize.medium} 
                  color={primaryColor} 
                />
                <Text 
                  className="font-medium ml-2"
                  style={{ fontSize: fontSize.medium, color: primaryColor }}
                >
                  Edit Profile
                </Text>
              </TouchableOpacity>
            )}

            {/* Logout Button (only show when not editing) */}
            {!isEditing && (
              <TouchableOpacity
                className="border rounded-xl flex-row items-center justify-center"
                style={{ 
                  paddingVertical: 12,
                  borderColor: primaryColor,
                  borderWidth: 1,
                }}
                onPress={handleLogout}
              >
                <Ionicons 
                  name="log-out-outline" 
                  size={iconSize.medium} 
                  color={primaryColor} 
                />
                <Text 
                  className="font-medium ml-2"
                  style={{ fontSize: fontSize.medium, color: primaryColor }}
                >
                  Logout
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ProfileSection>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
