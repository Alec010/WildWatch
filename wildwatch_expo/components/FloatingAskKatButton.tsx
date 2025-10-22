import React, { useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BUTTON_POSITION_KEY = "floatingButtonPosition";

// Clear old position (call this if you need to reset)
export const clearButtonPosition = async () => {
  try {
    await AsyncStorage.removeItem(BUTTON_POSITION_KEY);
    console.log("Button position cleared");
  } catch (error) {
    console.error("Error clearing button position:", error);
  }
};

// Helper function to calculate dynamic heights based on device size
const getTabBarHeight = (width: number, height: number) => {
  const isTablet = Math.min(width, height) >= 600;
  const baseHeight = Platform.OS === "ios" ? 95 : 95;
  return isTablet ? baseHeight + 10 : baseHeight;
};

const getStatusBarHeight = () => {
  return Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
};

interface FloatingAskKatButtonProps {
  onPress: () => void;
  primaryColor?: string;
  buttonSize?: number;
  margin?: number;
}

const FloatingAskKatButton: React.FC<FloatingAskKatButtonProps> = ({
  onPress,
  primaryColor = Colors.maroon,
  buttonSize: propButtonSize,
  margin: propMargin,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dimensions, setDimensions] = React.useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  // Calculate responsive sizes based on device type
  const isTablet = Math.min(dimensions.width, dimensions.height) >= 600;
  const buttonSize = propButtonSize || (isTablet ? 70 : 60);
  const margin = propMargin ?? 0; // Use 0 for edge-to-edge, allow override with propMargin

  const currentPosition = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Save button position to storage
  const savePosition = async (x: number, y: number) => {
    try {
      await AsyncStorage.setItem(BUTTON_POSITION_KEY, JSON.stringify({ x, y }));
    } catch (error) {
      console.error("Error saving button position:", error);
    }
  };

  // Load button position from storage
  const loadPosition = async (): Promise<{ x: number; y: number } | null> => {
    try {
      const savedPosition = await AsyncStorage.getItem(BUTTON_POSITION_KEY);
      if (savedPosition) {
        return JSON.parse(savedPosition);
      }
    } catch (error) {
      console.error("Error loading button position:", error);
    }
    return null;
  };

  // Constrain position to screen bounds
  const constrainPosition = (
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Calculate dynamic heights based on current dimensions
    const tabBarHeight = getTabBarHeight(width, height);
    const statusBarHeight = getStatusBarHeight();

    // Account for tab bar at bottom and status bar at top
    const maxX = width - buttonSize - margin;
    const maxY = height - buttonSize - margin - tabBarHeight;
    const minX = margin;
    const minY = margin + statusBarHeight;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // Adjust position to nearest edge
  const snapToEdge = (x: number, y: number, width: number, height: number) => {
    // Calculate dynamic heights based on current dimensions
    const tabBarHeight = getTabBarHeight(width, height);
    const statusBarHeight = getStatusBarHeight();

    // Calculate distances to each edge (accounting for safe zones)
    const distToLeft = x - margin;
    const distToRight = width - buttonSize - margin - x;
    const distToTop = y - (margin + statusBarHeight);
    const distToBottom = height - buttonSize - margin - tabBarHeight - y;

    // Find the nearest edge
    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    let snapX = x;
    let snapY = y;

    if (minDist === distToLeft) {
      // Snap to left edge
      snapX = margin;
    } else if (minDist === distToRight) {
      // Snap to right edge
      snapX = width - buttonSize - margin;
    } else if (minDist === distToTop) {
      // Snap to top edge
      snapY = margin + statusBarHeight;
    } else {
      // Snap to bottom edge
      snapY = height - buttonSize - margin - tabBarHeight;
    }

    // Ensure position is within bounds
    return constrainPosition(snapX, snapY, width, height);
  };

  // Pan responder for draggable button
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new position
        const newX = currentPosition.current.x + gestureState.dx;
        const newY = currentPosition.current.y + gestureState.dy;

        // Constrain position to screen bounds in real-time
        const constrainedPos = constrainPosition(
          newX,
          newY,
          dimensions.width,
          dimensions.height
        );

        // Update pan with constrained values
        pan.setValue({
          x: constrainedPos.x - currentPosition.current.x,
          y: constrainedPos.y - currentPosition.current.y,
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        pan.flattenOffset();

        // Get current position from pan values
        const currentX = currentPosition.current.x + gestureState.dx;
        const currentY = currentPosition.current.y + gestureState.dy;

        // Constrain first, then snap to nearest edge
        const constrainedPos = constrainPosition(
          currentX,
          currentY,
          dimensions.width,
          dimensions.height
        );

        const snappedPos = snapToEdge(
          constrainedPos.x,
          constrainedPos.y,
          dimensions.width,
          dimensions.height
        );

        // Update current position reference
        currentPosition.current = snappedPos;

        // Save position to storage
        savePosition(snappedPos.x, snappedPos.y);

        Animated.spring(pan, {
          toValue: snappedPos,
          useNativeDriver: false,
          tension: 150,
          friction: 10,
        }).start();
      },
    })
  ).current;

  // Listen for dimension changes (orientation changes and tablet/phone transitions)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const newWidth = window.width;
      const newHeight = window.height;

      console.log(`Dimension change detected: ${newWidth}x${newHeight}`);

      // Update dimensions state
      setDimensions({ width: newWidth, height: newHeight });

      // Adjust button position to stay within new bounds
      if (!isDragging.current) {
        // Get current position relative to the old dimensions
        const oldX = currentPosition.current.x;
        const oldY = currentPosition.current.y;

        // First, constrain to new bounds
        const constrainedPos = constrainPosition(
          oldX,
          oldY,
          newWidth,
          newHeight
        );

        // Then snap to nearest edge after orientation change
        const snappedPos = snapToEdge(
          constrainedPos.x,
          constrainedPos.y,
          newWidth,
          newHeight
        );

        // Update current position reference
        currentPosition.current = snappedPos;

        // Save new position
        savePosition(snappedPos.x, snappedPos.y);

        // Animate to new position smoothly
        Animated.spring(pan, {
          toValue: snappedPos,
          useNativeDriver: false,
          tension: 120,
          friction: 12,
        }).start();
      }
    });

    return () => subscription?.remove();
  }, [buttonSize, margin]);

  // Set initial position of the draggable button
  useEffect(() => {
    const initializePosition = async () => {
      const savedPosition = await loadPosition();

      if (savedPosition) {
        // Use saved position if available and constrain to current bounds
        const constrainedPos = constrainPosition(
          savedPosition.x,
          savedPosition.y,
          dimensions.width,
          dimensions.height
        );

        // Snap to edge to apply new margin settings
        const snappedPos = snapToEdge(
          constrainedPos.x,
          constrainedPos.y,
          dimensions.width,
          dimensions.height
        );

        pan.setValue(snappedPos);
        currentPosition.current = snappedPos;
        savePosition(snappedPos.x, snappedPos.y);
      } else {
        // Use default position if no saved position (bottom right, above tab bar)
        const tabBarHeight = getTabBarHeight(
          dimensions.width,
          dimensions.height
        );
        const initialX = dimensions.width - buttonSize - margin;
        const initialY = dimensions.height - buttonSize - margin - tabBarHeight;

        // Constrain to ensure it's within bounds
        const constrainedInitial = constrainPosition(
          initialX,
          initialY,
          dimensions.width,
          dimensions.height
        );

        pan.setValue(constrainedInitial);
        currentPosition.current = constrainedInitial;
        // Save the initial position
        savePosition(constrainedInitial.x, constrainedInitial.y);
      }
    };

    initializePosition();
  }, [buttonSize, margin]);

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: primaryColor,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 6,
          borderWidth: isTablet ? 4 : 3,
          borderColor: "white",
          zIndex: 1000,
        },
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={{
          width: buttonSize - 10,
          height: buttonSize - 10,
          borderRadius: (buttonSize - 10) / 2,
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "rgba(255, 255, 255, 0.3)",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1,
          elevation: 2,
        }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name="paw-outline" size={isTablet ? 28 : 24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingAskKatButton;
