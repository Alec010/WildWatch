import React from 'react';
import { View, Text, Dimensions } from 'react-native';

export interface ProgressStepProps {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const ProgressStep: React.FC<ProgressStepProps> = ({ number, title, isActive, isCompleted }) => {
  const isSmallIPhone: boolean = Dimensions.get('window').height < 700;
  const isIPhone15Pro: boolean = Dimensions.get('window').height >= 800 && Dimensions.get('window').height < 900;
  const isIPhone15ProMax: boolean = Dimensions.get('window').height >= 900;

  const getSpacing = () => {
    if (isSmallIPhone) return { stepSize: 28, fontSize: 10, titleSize: 10 } as const;
    if (isIPhone15Pro) return { stepSize: 32, fontSize: 11, titleSize: 11 } as const;
    if (isIPhone15ProMax) return { stepSize: 36, fontSize: 12, titleSize: 12 } as const;
    return { stepSize: 30, fontSize: 10, titleSize: 10 } as const;
  };

  const { stepSize, fontSize, titleSize } = getSpacing();

  return (
    <View style={{ alignItems: 'center', minWidth: 80 }}>
      <View
        style={{
          width: stepSize,
          height: stepSize,
          borderRadius: stepSize / 2,
          backgroundColor: isCompleted ? '#8B0000' : isActive ? '#8B0000' : '#E5E7EB',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          borderWidth: isCompleted ? 0 : isActive ? 2 : 1,
          borderColor: isActive ? '#8B0000' : '#D1D5DB',
          shadowColor: isCompleted || isActive ? '#8B0000' : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isCompleted || isActive ? 0.3 : 0,
          shadowRadius: 4,
          elevation: isCompleted || isActive ? 4 : 0,
        }}
      >
        <Text
          style={{
            color: isCompleted || isActive ? '#FFFFFF' : '#9CA3AF',
            fontSize: fontSize,
            fontWeight: 'bold',
          }}
        >
          {isCompleted ? '✓' : number}
        </Text>
      </View>
      <Text
        style={{
          fontSize: titleSize,
          fontWeight: isActive || isCompleted ? '700' : '500',
          color: isActive ? '#8B0000' : isCompleted ? '#8B0000' : '#9CA3AF',
          textAlign: 'center',
          lineHeight: titleSize + 2,
        }}
      >
        {title}
      </Text>
    </View>
  );
};



