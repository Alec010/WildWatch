import { Text, View } from '@/components/Themed';
import EditScreenInfo from '@/components/EditScreenInfo';

export default function TabOneScreen() {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-xl font-bold">Tab One</Text>
      <View className="my-8 h-[1px] w-4/5 bg-gray-200 dark:bg-gray-700" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}
