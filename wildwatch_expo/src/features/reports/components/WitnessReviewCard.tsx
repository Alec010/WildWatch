import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WitnessInfo } from '../models/report';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WitnessReviewCardProps {
  witness: WitnessInfo;
  index: number;
}

export const WitnessReviewCard: React.FC<WitnessReviewCardProps> = ({
  witness,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleExpanded = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const displayName = witness.name || `Witness #${index + 1}`;
  const hasContact = witness.contact && witness.contact.length > 0;

  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
          borderBottomWidth: isExpanded ? 1 : 0,
          borderBottomColor: '#E5E7EB',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{
            backgroundColor: '#FEE2E2',
            padding: 8,
            borderRadius: 20,
            marginRight: 12,
          }}>
            <Ionicons name="person" size={16} color="#800000" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '500', color: '#1F2937', fontSize: 14 }}>
              {displayName}
            </Text>
            {hasContact && (
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>
                {witness.contact}
              </Text>
            )}
            {witness.isRegisteredUser && (
              <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '500', marginTop: 2 }}>
                Registered User
              </Text>
            )}
          </View>
        </View>
        
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6B7280" 
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={{ padding: 16, backgroundColor: 'white' }}>
          <View style={{ gap: 12 }}>
            {/* Full Name */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="person-outline" size={14} color="#800000" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Full Name</Text>
              </View>
              <Text style={{ 
                fontWeight: '500', 
                color: '#1F2937', 
                fontSize: 14,
                marginLeft: 20,
              }}>
                {witness.name || "Not provided"}
              </Text>
            </View>

            {/* Contact Information */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="call-outline" size={14} color="#800000" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Contact Information</Text>
              </View>
              <Text style={{ 
                color: '#374151', 
                fontSize: 14,
                marginLeft: 20,
              }}>
                {witness.contact || "Not provided"}
              </Text>
            </View>

            {/* Additional Notes */}
            {witness.additionalNotes && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="document-text-outline" size={14} color="#800000" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>Additional Notes</Text>
                </View>
                <Text style={{ 
                  color: '#374151', 
                  fontSize: 14,
                  marginLeft: 20,
                  lineHeight: 20,
                }}>
                  {witness.additionalNotes}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};
