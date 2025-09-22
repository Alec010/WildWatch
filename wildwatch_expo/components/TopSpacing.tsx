import React from 'react';
import { View } from 'react-native';

// Global constant for top spacing (reduced from 44 to 32)
export const TOP_SPACING_HEIGHT = 24;

interface TopSpacingProps {
  backgroundColor?: string;
}

export default function TopSpacing({ backgroundColor = '#FFFFFF' }: TopSpacingProps) {
  return (
    <View style={{ height: TOP_SPACING_HEIGHT, backgroundColor }} />
  );
}
