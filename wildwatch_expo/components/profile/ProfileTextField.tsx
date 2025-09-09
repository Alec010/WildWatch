import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface Props {
  value: string;
  onValueChange: (text: string) => void;
  label: string;
  readOnly?: boolean;
  leadingIcon?: React.ReactNode;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: any;
  colors?: { textPrimary: string; textSecondary: string };
}

export const ProfileTextField: React.FC<Props> = ({ value, onValueChange, label, readOnly = true, leadingIcon, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', style, colors = { textPrimary: '#333333', textSecondary: '#666666' } }) => (
  <View className="mb-4" style={style}>
    <Text className="text-sm font-medium mb-2" style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
    <View className="relative">
      {leadingIcon ? <View className="absolute left-4 top-4 z-10">{leadingIcon}</View> : null}
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
        style={{ backgroundColor: readOnly ? '#FAFAFA' : 'white', borderColor: readOnly ? '#E5E7EB' : '#D1D5DB', color: readOnly ? colors.textSecondary : colors.textPrimary, fontSize: 16, textAlign: 'left', paddingHorizontal: leadingIcon ? 56 : 16, paddingVertical: 8, borderRadius: 12 }}
      />
    </View>
  </View>
);



