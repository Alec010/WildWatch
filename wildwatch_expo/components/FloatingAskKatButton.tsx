import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

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
  margin = 20,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const currentPosition = useRef({ x: 0, y: 0 });

  // Pan responder for draggable button
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        pan.flattenOffset();
        
        // Get current position from gesture
        const currentX = gestureState.moveX - buttonSize / 2;
        const currentY = gestureState.moveY - buttonSize / 2;
        
        // Determine which side to magnet to based on horizontal position
        const screenCenterX = screenWidth / 2;
        const magnetToLeft = currentX < screenCenterX;
        
        // Calculate magnet position
        const magnetX = magnetToLeft ? margin : screenWidth - buttonSize - margin;
        
        // Constrain Y position to screen bounds
        const maxY = screenHeight - buttonSize - 100; // 100 for bottom safe area
        const magnetY = Math.max(50, Math.min(maxY, currentY));
        
        // Update current position reference
        currentPosition.current = { x: magnetX, y: magnetY };
        
        Animated.spring(pan, {
          toValue: { x: magnetX, y: magnetY },
          useNativeDriver: false,
          tension: 150,
          friction: 10,
        }).start();
      },
    })
  ).current;

  // Set initial position of the draggable button
  useEffect(() => {
    const initialX = screenWidth - buttonSize - margin;
    const initialY = screenHeight - buttonSize - 100;
    pan.setValue({ x: initialX, y: initialY });
    currentPosition.current = { x: initialX, y: initialY };
  }, [screenWidth, screenHeight, buttonSize, margin, pan]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: primaryColor,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: 3,
          borderColor: 'white',
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
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: 'rgba(255, 255, 255, 0.3)',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 2
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
