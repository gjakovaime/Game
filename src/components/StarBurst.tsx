import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

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
  const opacity = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const rad = (angle * Math.PI) / 180;
  const targetX = Math.cos(rad) * radius;
  const targetY = Math.sin(rad) * radius;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(350),
      Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(tx, { toValue: targetX, duration: 850, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(ty, { toValue: targetY, duration: 550, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(ty, { toValue: targetY + 140, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scale, { toValue: 1, damping: 5, stiffness: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const animStyle = { opacity, transform: [{ translateX: tx }, { translateY: ty }, { scale }] };

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
