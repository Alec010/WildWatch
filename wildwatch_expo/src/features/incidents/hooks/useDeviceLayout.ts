import { useWindowDimensions } from 'react-native';

export const useDeviceLayout = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  const isLandscape = screenWidth > screenHeight;
  const isTwoColumnLayout = screenWidth > 670;
  const isMobile = screenWidth < 768;
  const isSmallTablet = screenWidth >= 768 && screenWidth < 1024;
  const isBigTablet = screenWidth >= 1024;
  
  // Items per page based on device size
  const itemsPerPage = isMobile ? 6 : isSmallTablet ? 9 : 12;
  
  return {
    screenWidth,
    screenHeight,
    isLandscape,
    isTwoColumnLayout,
    isMobile,
    isSmallTablet,
    isBigTablet,
    itemsPerPage,
  };
};

