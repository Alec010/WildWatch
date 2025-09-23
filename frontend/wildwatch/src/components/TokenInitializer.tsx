'use client';

import { useEffect } from 'react';
import tokenService from '@/utils/tokenService';

/**
 * Component to initialize token service and handle automatic refresh
 */
export default function TokenInitializer() {
  useEffect(() => {
    // Initialize token service on app start
    tokenService.initialize();
    console.log('Token service initialized');
  }, []);

  // This component doesn't render anything
  return null;
}
