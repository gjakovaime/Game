import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const PARTICLES = [
  { emoji: '⭐', size: 30 },
  { emoji: '🎉', size: 28 },
  { emoji: '🌟', size: 32 },
  { emoji: '✨', size: 26 },
  { emoji: '💫', size: 28 },
  { emoji: '🎊', size: 26 },
  { emoji: '⭐', size: 24 },
  { emoji: '🌟', size: 28 },
  { emoji: '✨', size: 30 },
  { emoji: '💫', size: 24 },
  { emoji: '🎉', size: 26 },
  { emoji: '⭐', size: 22 },
  { emoji: '🌟', size: 30 },
  { emoji: '✨', size: 28 },
];

type ParticleProps = {
  emoji: string;
  size: number;
  angle: number;
  delay: number;
  radius: number;
};

function Particle({ emoji, size, angle, delay, radius }: ParticleProps) {
  const opacity = useSharedValue(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(0);

  const rad = (angle * Math.PI) / 180;
  const targetX = Math.cos(rad) * radius;
  const targetY = Math.sin(rad) * radius;

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(350, withTiming(0, { duration: 500 }))
      )
    );
    tx.value = withDelay(delay, withTiming(targetX, { duration: 850, easing: Easing.out(Easing.quad) }));
    ty.value = withDelay(
      delay,
      withSequence(
        withTiming(targetY, { duration: 550, easing: Easing.out(Easing.quad) }),
        withTiming(targetY + 140, { duration: 450, easing: Easing.in(Easing.quad) })
      )
    );
    scale.value = withDelay(delay, withSpring(1, { damping: 5, stiffness: 200 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.particle, animStyle]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}

type BurstProps = {
  visible: boolean;
  onComplete?: () => void;
};

export function StarBurst({ visible }: BurstProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <Particle
          key={i}
          emoji={p.emoji}
          size={p.size}
          angle={(i / PARTICLES.length) * 360 + (i % 2 === 0 ? 0 : 13)}
          delay={i * 35}
          radius={75 + (i % 4) * 22}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '36%',
  },
});
