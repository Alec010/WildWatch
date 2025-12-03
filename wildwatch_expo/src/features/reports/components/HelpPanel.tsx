import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface HelpPanelProps {
  modifier?: unknown;
  darkRed: string;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ modifier, darkRed }) => (
  <View
    style={[
      {
        backgroundColor: '#8B0000',
        borderColor: '#8B0000',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
      },
      modifier as any,
    ]}
  >
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <Ionicons name="warning" size={24} color="#FFFFFF" style={{ marginTop: 2, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
          Evidence Guidelines
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
          Tips for submitting evidence:
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 14, lineHeight: 20 }}>
          • Upload clear, high-quality images{"\n"}
          • Include relevant timestamps in photos if possible{"\n"}
          • Ensure witness additional notes are detailed and accurate{"\n"}
          • Provide contact information for follow-up
        </Text>
      </View>
    </View>
  </View>
);



