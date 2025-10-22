import React from "react";
import { View } from "react-native";
import { usePathname, router } from "expo-router";
import Toast from "react-native-toast-message";
import FloatingAskKatButton from "./FloatingAskKatButton";
import Colors from "../constants/Colors";

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  // Check if current page is an auth page or chatbot page
  const isAuthPage = pathname?.startsWith("/auth");
  const isChatbotPage = pathname === "/chatbot";

  const handleAskKat = () => {
    router.push({
      pathname: "/chatbot",
      params: { presentation: "modal" },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Show Ask Kat button on all pages except auth pages and chatbot page */}
      {!isAuthPage && !isChatbotPage && (
        <FloatingAskKatButton
          onPress={handleAskKat}
          primaryColor={Colors.maroon}
        />
      )}

      <Toast />
    </View>
  );
};

export default GlobalLayout;
