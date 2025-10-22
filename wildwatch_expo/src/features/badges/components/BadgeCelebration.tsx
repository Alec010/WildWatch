import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface BadgeCelebrationProps {
  isVisible: boolean;
  badgeName: string;
  onComplete?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function BadgeCelebration({ 
  isVisible, 
  badgeName, 
  onComplete 
}: BadgeCelebrationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const trophyScaleAnim = useRef(new Animated.Value(0)).current;
  
  const star1Anim = useRef(new Animated.Value(0)).current;
  const star2Anim = useRef(new Animated.Value(0)).current;
  const star3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      trophyScaleAnim.setValue(0);
      star1Anim.setValue(0);
      star2Anim.setValue(0);
      star3Anim.setValue(0);

      // Start animations
      Animated.parallel([
        // Background fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Card scale and rotate
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(rotateAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Trophy animation (delayed)
      Animated.sequence([
        Animated.delay(200),
        Animated.spring(trophyScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Stars animation (staggered)
      Animated.stagger(150, [
        Animated.spring(star1Anim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(star2Anim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(star3Anim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3 seconds
      const timeoutId = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#F59E0B', '#FBBF24', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Trophy Icon */}
            <Animated.View 
              style={[
                styles.trophyContainer,
                {
                  transform: [{ scale: trophyScaleAnim }],
                },
              ]}
            >
              <Ionicons name="trophy" size={80} color="white" />
            </Animated.View>

            {/* Badge Claimed Text */}
            <Text style={styles.title}>Badge Claimed!</Text>

            {/* Badge Name */}
            <Text style={styles.badgeName}>{badgeName}</Text>

            {/* Stars */}
            <View style={styles.starsContainer}>
              {[star1Anim, star2Anim, star3Anim].map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.starWrapper,
                    {
                      transform: [
                        { scale: anim },
                        { 
                          rotate: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-180deg', '0deg'],
                          })
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="star" size={32} color="white" />
                </Animated.View>
              ))}
            </View>

            {/* Congratulations */}
            <Text style={styles.congratsText}>Congratulations! 🎉</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  trophyContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  badgeName: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  starWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  congratsText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

