import React, { useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BUTTON_POSITION_KEY = "floatingButtonPosition";

interface FloatingAskKatButtonProps {
  onPress: () => void;
  primaryColor?: string;
  buttonSize?: number;
  margin?: number;
}

const FloatingAskKatButton: React.FC<FloatingAskKatButtonProps> = ({
  onPress,
  primaryColor = Colors.maroon,
  buttonSize = 60,
  margin = 8,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dimensions, setDimensions] = React.useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });
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
    const maxX = width - buttonSize - margin;
    const maxY = height - buttonSize - margin;
    const minX = margin;
    const minY = margin;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  // Adjust position to nearest edge
  const snapToEdge = (x: number, y: number, width: number, height: number) => {
    // Calculate distances to each edge
    const distToLeft = x;
    const distToRight = width - x - buttonSize;
    const distToTop = y;
    const distToBottom = height - y - buttonSize;

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
      snapY = margin;
    } else {
      // Snap to bottom edge
      snapY = height - buttonSize - margin;
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
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (evt, gestureState) => {
        isDragging.current = false;
        pan.flattenOffset();

        // Get current position from gesture
        const currentX = gestureState.moveX - buttonSize / 2;
        const currentY = gestureState.moveY - buttonSize / 2;

        // Snap to nearest edge
        const snappedPos = snapToEdge(
          currentX,
          currentY,
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

  // Listen for dimension changes (orientation changes)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      const newWidth = window.width;
      const newHeight = window.height;

      setDimensions({ width: newWidth, height: newHeight });

      // Adjust button position to stay within new bounds
      if (!isDragging.current) {
        const constrainedPos = constrainPosition(
          currentPosition.current.x,
          currentPosition.current.y,
          newWidth,
          newHeight
        );

        // Snap to nearest edge after orientation change
        const snappedPos = snapToEdge(
          constrainedPos.x,
          constrainedPos.y,
          newWidth,
          newHeight
        );

        currentPosition.current = snappedPos;
        savePosition(snappedPos.x, snappedPos.y);

        Animated.spring(pan, {
          toValue: snappedPos,
          useNativeDriver: false,
          tension: 100,
          friction: 10,
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
        pan.setValue(constrainedPos);
        currentPosition.current = constrainedPos;
      } else {
        // Use default position if no saved position
        const initialX = dimensions.width - buttonSize - margin;
        const initialY = dimensions.height - buttonSize - 100;
        pan.setValue({ x: initialX, y: initialY });
        currentPosition.current = { x: initialX, y: initialY };
        // Save the initial position
        savePosition(initialX, initialY);
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
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: 3,
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
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 2,
        }}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name="paw-outline" size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingAskKatButton;
