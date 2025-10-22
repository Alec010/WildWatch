import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { storage, ChatMessage } from "../lib/storage";
import { config } from "../lib/config";
import { useResponsive } from "../src/hooks/useResponsive";

interface ChatRequest {
  message: string;
}
interface ChatResponse {
  reply: string;
}

export default function ChatbotScreen() {
  const { spacing, fontSize } = useResponsive();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get screen dimensions with state for dynamic updates
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  // Calculate responsive values based on current dimensions
  const isTablet = Math.min(dimensions.width, dimensions.height) >= 600;
  const isLandscape = dimensions.width > dimensions.height;
  const screenHeight = dimensions.height;
  const screenWidth = dimensions.width;

  // Bottom sheet animation
  const translateY = useRef(new Animated.Value(0)).current;
  const CLOSE_THRESHOLD = isTablet ? 200 : 150; // Larger threshold for tablets

  // Listen for dimension changes (orientation changes)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Load token and chat messages on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedToken, savedMessages] = await Promise.all([
          storage.getToken(),
          storage.getChatMessages(),
        ]);

        setToken(savedToken);

        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          // Only show welcome message if no previous messages
          setMessages([
            {
              sender: "bot",
              text: "Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?",
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setToken(null);
        setMessages([
          {
            sender: "bot",
            text: "Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?",
            timestamp: Date.now(),
          },
        ]);
      }
    };

    loadData();
  }, []);

  // Save messages to storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      storage.setChatMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [messages]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
        // Scroll to bottom when keyboard appears to ensure input is visible
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Additional effect to ensure input stays visible
  useEffect(() => {
    if (isKeyboardVisible) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible]);

  // Pan responder for drag to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical drags
        return (
          Math.abs(gestureState.dy) > 5 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow dragging down (positive dy)
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.flattenOffset();

        if (gestureState.dy > CLOSE_THRESHOLD) {
          // Close the bottom sheet
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !token) return;
    const userMessage: ChatMessage = {
      sender: "user",
      text: messageText.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch(`${config.API.BASE_URL}/chatbot`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText.trim() } as ChatRequest),
      });
      if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: data.reply,
          timestamp: Date.now(),
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I encountered an error. Please try again in a moment.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickResponses: string[] = [
    "How do I report an incident?",
    "What offices are available?",
    "Tell me about WildWatch",
    "How to contact security?",
    "Where is the admin office?",
    "What are the reporting hours?",
    "How to track my report?",
    "Emergency procedures",
  ];

  // Calculate responsive dimensions
  const getResponsiveSizes = () => {
    // Bottom sheet height based on device and orientation
    let bottomSheetHeightPercent = 0.93;
    if (isTablet) {
      bottomSheetHeightPercent = isLandscape ? 0.88 : 0.9;
    } else {
      bottomSheetHeightPercent = isLandscape ? 0.85 : 0.93;
    }

    // Calculate actual pixel width for message bubbles
    let bubbleMaxWidthPercent = 0.75; // 75% default
    if (isTablet) {
      bubbleMaxWidthPercent = isLandscape ? 0.6 : 0.7;
    }

    return {
      bottomSheetHeight: screenHeight * bottomSheetHeightPercent,
      horizontalPadding: isTablet ? 32 : 24,
      headerFontSize: isTablet ? 24 : 20,
      subHeaderFontSize: isTablet ? 15 : 13,
      messageFontSize: isTablet ? 17 : 15,
      avatarSize: isTablet ? 48 : 44,
      avatarIconSize: isTablet ? 26 : 22,
      borderRadius: isTablet ? 28 : 24,
      messageBubbleMaxWidth: screenWidth * bubbleMaxWidthPercent,
      inputMinHeight: isTablet ? 64 : 56,
      handleBarWidth: isTablet ? 64 : 48,
    };
  };

  const sizes = getResponsiveSizes();
  const bottomSheetHeight = sizes.bottomSheetHeight;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "transparent",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: screenWidth,
        height: screenHeight,
      }}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={1}
        onPress={() => router.back()}
      />
      <Animated.View
        style={{
          height: bottomSheetHeight,
          width: screenWidth,
          backgroundColor: "white",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          borderTopColor: "rgba(139, 0, 0, 0.1)",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 12,
          transform: [{ translateY }],
        }}
      >
        {/* Handle bar - draggable area */}
        <View
          {...panResponder.panHandlers}
          style={{
            alignItems: "center",
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          <View
            style={{
              width: sizes.handleBarWidth,
              height: 5,
              backgroundColor: "#D1D5DB",
              borderRadius: 3,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: sizes.horizontalPadding,
            paddingVertical: isTablet ? 24 : 20,
            borderBottomWidth: 1,
            borderBottomColor: "#F1F5F9",
            backgroundColor: "rgba(248, 250, 252, 0.8)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: sizes.avatarSize,
                height: sizes.avatarSize,
                borderRadius: sizes.avatarSize / 2,
                backgroundColor: "#8B0000",
                alignItems: "center",
                justifyContent: "center",
                marginRight: isTablet ? 16 : 14,
                shadowColor: "#8B0000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Ionicons
                name="paw-sharp"
                size={sizes.avatarIconSize}
                color="white"
              />
            </View>
            <View>
              <Text
                style={{
                  fontSize: sizes.headerFontSize,
                  fontWeight: "800",
                  color: "#8B0000",
                  letterSpacing: 0.3,
                }}
              >
                Ask Kat
              </Text>
              <Text
                style={{
                  fontSize: sizes.subHeaderFontSize,
                  color: "#6B7280",
                  fontWeight: "500",
                }}
              >
                Your AI Assistant
              </Text>
            </View>
          </View>
          {messages.length > 1 && (
            <TouchableOpacity
              onPress={async () => {
                await storage.clearChatMessages();
                setMessages([
                  {
                    sender: "bot",
                    text: "Hi! I can help you with incident reporting, offices, or WildWatch. How can I assist you today?",
                    timestamp: Date.now(),
                  },
                ]);
              }}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 18,
                backgroundColor: "white",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
                flexDirection: "row",
              }}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color="#6B7280"
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  fontWeight: "600",
                }}
              >
                Clear Chat
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          enabled={true}
        >
          <View style={{ flex: 1, flexDirection: "column" }}>
            <ScrollView
              ref={scrollViewRef}
              style={{
                flex: 1,
                paddingHorizontal: sizes.horizontalPadding,
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: isTablet ? 24 : 20,
                paddingBottom: isTablet ? 24 : 20,
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            >
              {messages.map((m, idx) => (
                <MessageBubble
                  key={idx}
                  message={m}
                  isFirst={idx === 0}
                  isTablet={isTablet}
                  messageFontSize={sizes.messageFontSize}
                  messageBubbleMaxWidth={sizes.messageBubbleMaxWidth}
                />
              ))}
              {isLoading && <LoadingDots isTablet={isTablet} />}
            </ScrollView>

            {messages.length === 1 && (
              <View
                style={{
                  paddingHorizontal: sizes.horizontalPadding,
                  paddingVertical: isTablet ? 24 : 20,
                  paddingBottom: 6,
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: isTablet ? 18 : 16,
                    fontWeight: "700",
                    color: "#374151",
                    marginBottom: isTablet ? 20 : 16,
                    letterSpacing: 0.2,
                  }}
                >
                  Suggested questions:
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingRight: sizes.horizontalPadding,
                  }}
                  decelerationRate="fast"
                  snapToInterval={isTablet ? 220 : 200}
                  snapToAlignment="start"
                >
                  {quickResponses.map((q, index) => (
                    <TouchableOpacity
                      key={q}
                      style={{
                        borderColor: "#8B0000",
                        borderWidth: 1.5,
                        borderRadius: isTablet ? 28 : 24,
                        paddingHorizontal: isTablet ? 22 : 18,
                        paddingVertical: isTablet ? 14 : 12,
                        marginRight: isTablet ? 16 : 12,
                        backgroundColor: "white",
                        shadowColor: "#8B0000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                        minWidth: isTablet ? 180 : 160,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => sendMessage(q)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontSize: isTablet ? 15 : 13,
                          color: "#8B0000",
                          fontWeight: "600",
                          letterSpacing: 0.1,
                          textAlign: "center",
                          lineHeight: isTablet ? 18 : 16,
                        }}
                      >
                        {q}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View
              style={{
                backgroundColor: "white",
                paddingHorizontal: sizes.horizontalPadding,
                paddingVertical: isTablet ? 24 : 20,
                paddingBottom:
                  Platform.OS === "ios"
                    ? isTablet
                      ? 36
                      : 30
                    : isTablet
                    ? 36
                    : 30,
                borderTopWidth: 1,
                borderTopColor: "#F1F5F9",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  backgroundColor: "#FFFFFF",
                  borderRadius: sizes.borderRadius,
                  paddingHorizontal: 4,
                  borderWidth: 0.5,
                  borderColor: input.trim() ? "#8B0000" : "#E2E8F0",
                  shadowColor: input.trim() ? "#8B0000" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: input.trim() ? 0.15 : 0.05,
                  shadowRadius: 2,
                  elevation: input.trim() ? 3 : 1,
                  minHeight: sizes.inputMinHeight,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: isTablet ? 18 : 16,
                    color: "#1F2937",
                    paddingHorizontal: isTablet ? 24 : 20,
                    maxHeight: isTablet ? 140 : 120,
                    minHeight: isTablet ? 56 : 48,
                    fontWeight: "500",
                    lineHeight: isTablet ? 24 : 22,
                    textAlignVertical: "top",
                  }}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask me anything..."
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                  multiline
                  onFocus={() => {
                    // Ensure input is visible when focused
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 200);
                  }}
                  onBlur={() => {
                    // Optional: handle blur if needed
                  }}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (input.trim() && !isLoading) {
                      sendMessage(input);
                    }
                  }}
                />
                <TouchableOpacity
                  style={{
                    width: isTablet ? 56 : 48,
                    height: isTablet ? 56 : 48,
                    backgroundColor:
                      input.trim() && !isLoading ? "#8B0000" : "#F3F4F6",
                    borderRadius: isTablet ? 28 : 24,
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 8,
                    marginRight: 4,
                    marginBottom: 4,
                    shadowColor:
                      input.trim() && !isLoading ? "#8B0000" : "transparent",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: input.trim() && !isLoading ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: input.trim() && !isLoading ? 6 : 0,
                    transform: [
                      { scale: input.trim() && !isLoading ? 1.05 : 1 },
                    ],
                  }}
                  onPress={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      color="white"
                      size={isTablet ? "large" : "small"}
                    />
                  ) : (
                    <Ionicons
                      name="send"
                      size={isTablet ? 24 : 20}
                      color={input.trim() && !isLoading ? "white" : "#9CA3AF"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

// Format bot messages with better styling
const formatBotMessage = (text: string) => {
  const lines = text.split("\n");
  const elements: React.ReactElement[] = [];

  // Helper to format inline styles (bold, italic, code)
  const formatInlineText = (text: string, baseStyle: any) => {
    const parts: React.ReactElement[] = [];
    let currentText = text;
    let key = 0;

    // Match **bold**, *italic*, and `code`
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(currentText)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <Text key={`text-${key++}`} style={baseStyle}>
            {currentText.substring(lastIndex, match.index)}
          </Text>
        );
      }

      // Add formatted text
      if (match[2]) {
        // Bold **text**
        parts.push(
          <Text
            key={`bold-${key++}`}
            style={[baseStyle, { fontWeight: "700", color: "#1F2937" }]}
          >
            {match[2]}
          </Text>
        );
      } else if (match[3]) {
        // Italic *text*
        parts.push(
          <Text
            key={`italic-${key++}`}
            style={[baseStyle, { fontStyle: "italic", color: "#4B5563" }]}
          >
            {match[3]}
          </Text>
        );
      } else if (match[4]) {
        // Code `text`
        parts.push(
          <Text
            key={`code-${key++}`}
            style={[
              baseStyle,
              {
                fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                backgroundColor: "#F3F4F6",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                color: "#8B0000",
                fontSize: 14,
              },
            ]}
          >
            {match[4]}
          </Text>
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      parts.push(
        <Text key={`text-${key++}`} style={baseStyle}>
          {currentText.substring(lastIndex)}
        </Text>
      );
    }

    return parts.length > 0 ? parts : <Text style={baseStyle}>{text}</Text>;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<View key={`space-${index}`} style={{ height: 10 }} />);
      return;
    }

    // Title (## Title or line ending with :)
    const titleMatch = trimmed.match(/^##\s+(.+)$/);
    const sectionMatch = trimmed.match(/^(.+):$/);

    if (titleMatch) {
      elements.push(
        <View
          key={index}
          style={{
            marginBottom: 12,
            marginTop: index > 0 ? 12 : 0,
            paddingBottom: 8,
            borderBottomWidth: 2,
            borderBottomColor: "#8B0000",
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: "#8B0000",
              fontWeight: "800",
              letterSpacing: 0.3,
            }}
          >
            {titleMatch[1]}
          </Text>
        </View>
      );
    } else if (sectionMatch && sectionMatch[1].length < 50) {
      // Section header (text ending with :)
      elements.push(
        <View key={index} style={{ marginTop: 12, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 16,
              color: "#8B0000",
              fontWeight: "700",
              letterSpacing: 0.2,
            }}
          >
            {sectionMatch[1]}:
          </Text>
        </View>
      );
    }
    // Bullet points
    else if (trimmed.match(/^[•\-\*]\s+(.+)$/)) {
      const bulletMatch = trimmed.match(/^[•\-\*]\s+(.+)$/);
      if (bulletMatch) {
        elements.push(
          <View
            key={index}
            style={{
              flexDirection: "row",
              marginBottom: 8,
              alignItems: "flex-start",
              paddingLeft: 4,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#8B0000",
                marginRight: 12,
                marginTop: 8,
              }}
            />
            <Text
              style={{
                fontSize: 15,
                color: "#1F2937",
                lineHeight: 22,
                fontWeight: "400",
                letterSpacing: 0.2,
                flex: 1,
              }}
            >
              {formatInlineText(bulletMatch[1], {})}
            </Text>
          </View>
        );
      }
    }
    // Numbered lists
    else if (trimmed.match(/^(\d+)[.)]\s+(.+)$/)) {
      const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (numberedMatch) {
        elements.push(
          <View
            key={index}
            style={{
              flexDirection: "row",
              marginBottom: 8,
              alignItems: "flex-start",
              paddingLeft: 4,
            }}
          >
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 12,
                minWidth: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#8B0000",
                  fontWeight: "700",
                }}
              >
                {numberedMatch[1]}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                color: "#1F2937",
                lineHeight: 22,
                fontWeight: "400",
                letterSpacing: 0.2,
                flex: 1,
                marginTop: 3,
              }}
            >
              {formatInlineText(numberedMatch[2], {})}
            </Text>
          </View>
        );
      }
    }
    // Quote (> text)
    else if (trimmed.startsWith("> ")) {
      elements.push(
        <View
          key={index}
          style={{
            backgroundColor: "#FFFBEB",
            borderLeftWidth: 4,
            borderLeftColor: "#F59E0B",
            paddingVertical: 12,
            paddingHorizontal: 16,
            marginVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              color: "#92400E",
              lineHeight: 22,
              fontWeight: "500",
              fontStyle: "italic",
              letterSpacing: 0.2,
            }}
          >
            {formatInlineText(trimmed.substring(2), {})}
          </Text>
        </View>
      );
    }
    // Regular text with inline formatting
    else {
      elements.push(
        <Text
          key={index}
          style={{
            fontSize: 15,
            color: "#1F2937",
            lineHeight: 22,
            fontWeight: "400",
            letterSpacing: 0.2,
            marginBottom: 6,
          }}
        >
          {formatInlineText(trimmed, {})}
        </Text>
      );
    }
  });

  return elements;
};

const MessageBubble: React.FC<{
  message: ChatMessage;
  isFirst: boolean;
  isTablet: boolean;
  messageFontSize: number;
  messageBubbleMaxWidth: number;
}> = ({
  message,
  isFirst,
  isTablet,
  messageFontSize,
  messageBubbleMaxWidth,
}) => {
  const isBot = message.sender === "bot";
  const isUser = message.sender === "user";

  const avatarSize = isTablet ? 44 : 40;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 20,
        marginTop: isFirst ? 0 : 4,
        paddingHorizontal: 2,
        alignItems: "flex-end",
      }}
    >
      {isBot && (
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: "#8B0000",
            borderRadius: avatarSize / 2,
            alignItems: "center",
            justifyContent: "center",
            marginRight: isTablet ? 14 : 12,
            shadowColor: "#8B0000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 2,
            borderColor: "#FFD700", // gold
          }}
        >
          <Ionicons
            name="paw-outline"
            size={isTablet ? 18 : 16}
            color="white"
          />
        </View>
      )}

      <View
        style={{
          maxWidth: messageBubbleMaxWidth,
          minWidth: isTablet ? 100 : 80,
        }}
      >
        {/* Message Bubble */}
        <View
          style={{
            backgroundColor: isUser
              ? "linear-gradient(135deg, #8B0000 0%, #A31515 100%)"
              : "#FFFFFF",
            shadowColor: isUser ? "#8B0000" : "#000",
            shadowOffset: { width: 0, height: isUser ? 3 : 2 },
            shadowOpacity: isUser ? 0.35 : 0.08,
            shadowRadius: isUser ? 4 : 2,
            elevation: isUser ? 5 : 2,
            borderTopLeftRadius: isTablet ? 24 : 20,
            borderTopRightRadius: isTablet ? 24 : 20,
            borderBottomLeftRadius: isUser
              ? isTablet
                ? 24
                : 20
              : isTablet
              ? 10
              : 8,
            borderBottomRightRadius: isUser
              ? isTablet
                ? 10
                : 8
              : isTablet
              ? 24
              : 20,
            borderWidth: isBot ? 0.5 : 0,
            borderColor: isBot ? "#E5E7EB" : "transparent",
            paddingHorizontal: isTablet ? 20 : 18,
            paddingVertical: isTablet ? 16 : 14,
            ...(isUser && {
              backgroundColor: "#8B0000",
            }),
            ...(isBot && {
              backgroundColor: "#FFFFFF",
            }),
          }}
        >
          {isBot ? (
            <View>{formatBotMessage(message.text)}</View>
          ) : (
            <Text
              style={{
                fontSize: messageFontSize,
                color: "#FFFFFF",
                lineHeight: isTablet ? 24 : 22,
                fontWeight: "500",
                letterSpacing: 0.2,
              }}
            >
              {message.text}
            </Text>
          )}
        </View>

        {/* Timestamp */}
        <View
          style={{
            marginTop: isTablet ? 8 : 6,
            paddingHorizontal: 4,
            alignItems: isUser ? "flex-end" : "flex-start",
          }}
        >
          <Text
            style={{
              fontSize: isTablet ? 12 : 11,
              color: "#9CA3AF",
              fontWeight: "500",
            }}
          >
            {message.timestamp
              ? new Date(message.timestamp).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : ""}
          </Text>
        </View>
      </View>

      {isUser && (
        <View
          style={{
            width: avatarSize,
            height: avatarSize,
            backgroundColor: "white",
            borderRadius: avatarSize / 2,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: isTablet ? 14 : 12,
            shadowColor: "#8B0000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 2,
            borderColor: "#8B0000", // maroon
          }}
        >
          <Ionicons name="person" size={isTablet ? 22 : 20} color="#FFB300" />
        </View>
      )}
    </View>
  );
};

const LoadingDots: React.FC<{ isTablet: boolean }> = ({ isTablet }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const avatarSize = isTablet ? 44 : 40;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, 200);
    const animation3 = createAnimation(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getAnimatedStyle = (animValue: Animated.Value) => ({
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  });

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        marginBottom: 20,
        marginTop: 4,
        paddingHorizontal: 4,
        alignItems: "flex-end",
      }}
    >
      {/* Bot Avatar */}
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          backgroundColor: "#8B0000",
          borderRadius: avatarSize / 2,
          alignItems: "center",
          justifyContent: "center",
          marginRight: isTablet ? 14 : 12,
          shadowColor: "#8B0000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 3,
          borderColor: "white",
        }}
      >
        <Ionicons name="paw-outline" size={isTablet ? 24 : 22} color="white" />
      </View>

      {/* Loading Bubble */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
          borderTopLeftRadius: isTablet ? 24 : 20,
          borderTopRightRadius: isTablet ? 24 : 20,
          borderBottomLeftRadius: isTablet ? 10 : 8,
          borderBottomRightRadius: isTablet ? 24 : 20,
          borderWidth: 1.5,
          borderColor: "#E5E7EB",
          paddingHorizontal: isTablet ? 24 : 20,
          paddingVertical: isTablet ? 18 : 16,
          flexDirection: "row",
          alignItems: "center",
          gap: isTablet ? 10 : 8,
        }}
      >
        <Animated.View
          style={[
            {
              width: isTablet ? 12 : 10,
              height: isTablet ? 12 : 10,
              backgroundColor: "#8B0000",
              borderRadius: isTablet ? 6 : 5,
            },
            getAnimatedStyle(dot1),
          ]}
        />
        <Animated.View
          style={[
            {
              width: isTablet ? 12 : 10,
              height: isTablet ? 12 : 10,
              backgroundColor: "#8B0000",
              borderRadius: isTablet ? 6 : 5,
            },
            getAnimatedStyle(dot2),
          ]}
        />
        <Animated.View
          style={[
            {
              width: isTablet ? 12 : 10,
              height: isTablet ? 12 : 10,
              backgroundColor: "#8B0000",
              borderRadius: isTablet ? 6 : 5,
            },
            getAnimatedStyle(dot3),
          ]}
        />
      </View>
    </View>
  );
};
