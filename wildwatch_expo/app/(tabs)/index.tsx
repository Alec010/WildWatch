import React, { useEffect } from 'react';
import { router } from 'expo-router';

export default function IndexScreen() {
  useEffect(() => {
    // Redirect to dashboard immediately
    router.replace('/(tabs)/dashboard');
  }, []);

  // Return null to avoid rendering anything
  return null;
}
