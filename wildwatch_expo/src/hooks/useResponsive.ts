import { Dimensions, Platform } from 'react-native';

export interface ResponsiveSpacing { small: number; medium: number; large: number; xlarge: number }
export interface ResponsiveFontSize { small: number; medium: number; large: number; xlarge: number; xxlarge: number; title: number }
export interface ResponsiveIconSize { small: number; medium: number; large: number; xlarge: number }

export function useResponsive() {
  const { height } = Dimensions.get('window');
  const isIPhone: boolean = Platform.OS === 'ios';
  const isSmallIPhone: boolean = height <= 667;
  const isMediumIPhone: boolean = height > 667 && height <= 812;
  const isLargeIPhone: boolean = height > 812 && height <= 844;
  const isXLargeIPhone: boolean = height > 844 && height <= 932;
  const isIPhone15Pro: boolean = height > 932 && height <= 1000;
  const isIPhone15ProMax: boolean = height > 1000;

  const spacing: ResponsiveSpacing = isSmallIPhone
    ? { small: 8, medium: 12, large: 16, xlarge: 20 }
    : isMediumIPhone
    ? { small: 10, medium: 14, large: 18, xlarge: 24 }
    : isLargeIPhone
    ? { small: 12, medium: 16, large: 20, xlarge: 28 }
    : isXLargeIPhone
    ? { small: 14, medium: 18, large: 22, xlarge: 30 }
    : isIPhone15Pro
    ? { small: 16, medium: 20, large: 24, xlarge: 32 }
    : { small: 18, medium: 22, large: 26, xlarge: 34 };

  const fontSize: ResponsiveFontSize = isSmallIPhone
    ? { small: 10, medium: 12, large: 14, xlarge: 16, xxlarge: 20, title: 22 }
    : isMediumIPhone
    ? { small: 11, medium: 13, large: 15, xlarge: 17, xxlarge: 22, title: 24 }
    : isLargeIPhone
    ? { small: 12, medium: 14, large: 16, xlarge: 18, xxlarge: 24, title: 26 }
    : isXLargeIPhone
    ? { small: 13, medium: 15, large: 17, xlarge: 19, xxlarge: 25, title: 27 }
    : isIPhone15Pro
    ? { small: 14, medium: 16, large: 18, xlarge: 20, xxlarge: 26, title: 28 }
    : { small: 15, medium: 17, large: 19, xlarge: 21, xxlarge: 27, title: 29 };

  const iconSize: ResponsiveIconSize = isSmallIPhone
    ? { small: 12, medium: 16, large: 20, xlarge: 24 }
    : isMediumIPhone
    ? { small: 14, medium: 18, large: 22, xlarge: 26 }
    : isLargeIPhone
    ? { small: 16, medium: 20, large: 24, xlarge: 28 }
    : isXLargeIPhone
    ? { small: 18, medium: 22, large: 26, xlarge: 30 }
    : isIPhone15Pro
    ? { small: 20, medium: 24, large: 28, xlarge: 32 }
    : { small: 22, medium: 26, large: 30, xlarge: 34 };

  return {
    spacing,
    fontSize,
    iconSize,
    isIPhone,
    isSmallIPhone,
    isMediumIPhone,
    isLargeIPhone,
    isXLargeIPhone,
    isIPhone15Pro,
    isIPhone15ProMax,
  } as const;
}



