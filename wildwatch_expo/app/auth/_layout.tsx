import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    />
  );
} 