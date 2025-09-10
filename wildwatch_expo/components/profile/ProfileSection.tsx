import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconTint: string;
  backgroundColor?: string;
  children: React.ReactNode;
}

export const ProfileSection: React.FC<Props> = ({ title, icon, iconTint, backgroundColor = '#FFFFFF', children }) => (
  <View className="bg-white rounded-2xl mb-4 shadow-sm" style={{ backgroundColor, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderRadius: 16 }}>
    <View>
      <View className="flex-row items-center p-4">
        <Ionicons name={icon} size={24} color={iconTint} />
        <View style={{ width: 12 }} />
        <Text className="font-bold text-gray-900" style={{ fontSize: 16 }}>{title}</Text>
      </View>
      <View className="h-px bg-gray-200" style={{ backgroundColor: '#EEEEEE' }} />
      {children}
    </View>
  </View>
);



