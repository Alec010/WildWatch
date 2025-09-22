import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WitnessInfo } from '../models/report';
import type { UserSearchResponse } from '../../users/models/UserModels';
import { useWitnessSearch } from '../hooks/useWitnessSearch';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WitnessInputProps {
  witness: WitnessInfo;
  index: number;
  onUpdate: (index: number, field: keyof WitnessInfo, value: string | number | boolean) => void;
  onRemove: (index: number) => void;
}

export const WitnessInput: React.FC<WitnessInputProps> = ({
  witness,
  index,
  onUpdate,
  onRemove,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    showSearchResults,
    selectUser,
    clearSearch,
  } = useWitnessSearch();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMentioning, setIsMentioning] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(witness.name || '');
  const nameInputRef = useRef<TextInput>(null);

  const handleSelectUser = (user: UserSearchResponse): void => {
    const witnessInfo: WitnessInfo = selectUser(user);
    onUpdate(index, 'userId', witnessInfo.userId!);
    onUpdate(index, 'name', witnessInfo.name);
    onUpdate(index, 'contact', witnessInfo.contact);
    onUpdate(index, 'isRegisteredUser', true);
    setNameInput(`@${user.fullName}`);
    setIsMentioning(false);
    clearSearch();
    Keyboard.dismiss();
  };

  const handleNameInputChange = (text: string): void => {
    setNameInput(text);
    
    if (text.startsWith('@')) {
      setIsMentioning(true);
      const searchQuery = text.substring(1).trim();
      if (searchQuery.length >= 2) {
        setSearchQuery(searchQuery);
      } else {
        clearSearch();
      }
    } else {
      setIsMentioning(false);
      clearSearch();
      // This is manual entry
      if (witness.isRegisteredUser) {
        // Clear registered user data
        onUpdate(index, 'userId', undefined);
        onUpdate(index, 'isRegisteredUser', false);
        onUpdate(index, 'contact', '');
      }
      onUpdate(index, 'name', text);
    }
  };

  const toggleExpanded = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const renderUserSearchItem = ({ item }: { item: UserSearchResponse }) => (
    <TouchableOpacity
      style={{
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}
      onPress={() => handleSelectUser(item)}
    >
      <View style={{
        backgroundColor: '#F3F4F6',
        padding: 6,
        borderRadius: 12,
        marginRight: 12,
      }}>
        <Ionicons name="person" size={14} color="#6B7280" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '500', color: '#1F2937', fontSize: 14 }}>{item.fullName}</Text>
        <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>{item.email}</Text>
        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>ID: {item.schoolIdNumber}</Text>
      </View>
    </TouchableOpacity>
  );

  // Update nameInput when witness changes externally
  useEffect(() => {
    if (witness.isRegisteredUser && witness.name) {
      setNameInput(`@${witness.name}`);
    } else if (!witness.isRegisteredUser) {
      setNameInput(witness.name || '');
    }
  }, [witness.name, witness.isRegisteredUser]);

  const displayName = witness.name || `Witness #${index + 1}`;
  const hasContact = witness.contact && witness.contact.length > 0;

  return (
    <View style={{
      marginBottom: 16,
      backgroundColor: 'white',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      overflow: 'visible', // Changed to visible for dropdown
    }}>
      {/* Header - Collapsible */}
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 16,
          backgroundColor: '#F9FAFB',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            backgroundColor: '#FEE2E2',
            padding: 8,
            borderRadius: 20,
            marginRight: 12,
          }}>
            <Ionicons name="person" size={20} color="#800000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '500', color: '#1F2937', fontSize: 16 }}>
              {displayName}
            </Text>
            {hasContact && (
              <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={1}>
                {witness.contact}
              </Text>
            )}
            {witness.isRegisteredUser && (
              <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '500' }}>
                Registered User
              </Text>
            )}
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
            style={{
              padding: 8,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
          </TouchableOpacity>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6B7280" 
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={{ padding: 16, position: 'relative' }}>
          {/* Name Input with @mention functionality */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="person-outline" size={14} color="#800000" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Name</Text>
            </View>
            
            <View style={{ position: 'relative' }}>
              <TextInput
                ref={nameInputRef}
                value={nameInput}
                onChangeText={handleNameInputChange}
                placeholder="Enter name or type @ to mention a user"
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isMentioning ? '#800000' : '#D1D5DB',
                  borderRadius: 6,
                  backgroundColor: witness.isRegisteredUser ? '#FEF3F2' : 'white',
                  fontSize: 14,
                  color: witness.isRegisteredUser ? '#7F1D1D' : '#1F2937',
                }}
                placeholderTextColor="#9CA3AF"
                editable={true}
              />
              
              {/* User Search Dropdown */}
              {isMentioning && (showSearchResults || isSearching) && (
                <View style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 6,
                  borderBottomRightRadius: 6,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 8,
                  zIndex: 1000,
                  maxHeight: 200,
                }}>
                  {isSearching && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#800000" />
                      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                        Searching users...
                      </Text>
                    </View>
                  )}
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <ScrollView
                      style={{ maxHeight: 200 }}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}
                    >
                      {searchResults.map((item) => (
                        <View key={item.id.toString()}>
                          {renderUserSearchItem({ item })}
                        </View>
                      ))}
                    </ScrollView>
                  )}
                  
                  {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        No users found matching "{searchQuery}"
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {witness.isRegisteredUser && (
              <Text style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: '500' }}>
                ✓ Registered user selected
              </Text>
            )}
          </View>

          {/* Contact Information */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="mail-outline" size={14} color="#800000" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Contact Information</Text>
            </View>
            {witness.isRegisteredUser ? (
              <View style={{
                padding: 12,
                backgroundColor: '#F3F4F6',
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 6,
              }}>
                <Text style={{ color: '#4B5563', fontSize: 14 }}>{witness.contact}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  Automatically filled from user profile
                </Text>
              </View>
            ) : (
              <TextInput
                value={witness.contact}
                onChangeText={(value) => onUpdate(index, 'contact', value)}
                placeholder="Email or phone number"
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 6,
                  backgroundColor: 'white',
                  fontSize: 14,
                }}
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />
            )}
          </View>

          {/* Additional Notes - Full Width */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="document-text-outline" size={14} color="#800000" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>Additional Notes</Text>
            </View>
            <TextInput
              value={witness.additionalNotes}
              onChangeText={(value) => onUpdate(index, 'additionalNotes', value)}
              placeholder="Describe what the witness observed..."
              style={{
                padding: 12,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 6,
                backgroundColor: 'white',
                minHeight: 100,
                fontSize: 14,
                textAlignVertical: 'top',
              }}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      )}
    </View>
  );
};