import React, { useEffect, useState } from "react";
import { Animated, Image, Text, View } from "react-native";

interface CircularLoaderProps {
  subtitle?: string;
}

export function CircularLoader({
  subtitle = "Loading...",
}: CircularLoaderProps) {
  const numberOfCircles = 4;
  const scaleValues = Array.from(
    { length: numberOfCircles },
    () => useState(new Animated.Value(0.3))[0]
  );

  useEffect(() => {
    const animations = scaleValues.map((scaleValue, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 180),
          Animated.timing(scaleValue, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.delay(100),
        ])
      )
    );

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, []);

  const renderCircle = (index: number) => {
    const opacity = scaleValues[index].interpolate({
      inputRange: [0.3, 1.3],
      outputRange: [0.1, 1],
    });

    const isCatPosition = index === 3; // Last position for cat
    const baseSize = isCatPosition ? 32 : 10;

    // Create straight horizontal line
    const verticalOffset = 0;

    return (
      <Animated.View
        key={index}
        style={{
          width: baseSize,
          height: baseSize,
          borderRadius: baseSize / 2,
          backgroundColor: isCatPosition ? "transparent" : "#8B0000",
          marginHorizontal: 6,
          opacity: opacity,
          transform: [
            { scale: scaleValues[index] },
            { translateY: verticalOffset },
          ],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isCatPosition ? (
          <Image
            source={require("../assets/images/loader_cat.png")}
            style={{
              width: 32,
              height: 32,
              resizeMode: "contain",
            }}
          />
        ) : null}
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 items-center justify-center">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {Array.from({ length: numberOfCircles }).map((_, index) =>
          renderCircle(index)
        )}
      </View>
      <Text className="text-[#8B0000] mt-6 text-base font-semibold">
        {subtitle}
      </Text>
    </View>
  );
}
