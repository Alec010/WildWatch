import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, color }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
    <Ionicons name={icon} size={24} color={color} style={{ marginRight: 12 }} />
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: color }}>
      {title}
    </Text>
  </View>
);



