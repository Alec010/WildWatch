import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export interface FormNavigationButtonsProps {
  onBackClick: () => void;
  onNextClick: () => void;
  backText: string;
  nextText: string;
  darkRed: string;
  disabled?: boolean;
}

export const FormNavigationButtons: React.FC<FormNavigationButtonsProps> = ({
  onBackClick,
  onNextClick,
  backText,
  nextText,
  darkRed,
  disabled = false,
}) => (
  <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
    <TouchableOpacity
      onPress={onBackClick}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600' }}>
        {backText}
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      onPress={onNextClick}
      disabled={disabled}
      style={{
        flex: 1,
        height: 48,
        borderRadius: 8,
        backgroundColor: disabled ? '#D1D5DB' : darkRed,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
        {nextText}
      </Text>
    </TouchableOpacity>
  </View>
);



