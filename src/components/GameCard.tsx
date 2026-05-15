import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors, FontSizes, Radii, Spacing } from '../constants/colors';

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  bgColor: string;
  accentColor: string;
  route: string;
  locked?: boolean;
  lockedMessage?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GameCard({ title, subtitle, emoji, bgColor, accentColor, route, locked, lockedMessage }: Props) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePressIn() { scale.value = withSpring(0.96, { damping: 15 }); }
  function handlePressOut() { scale.value = withSpring(1, { damping: 15 }); }

  function handlePress() {
    if (!locked) router.push(route as any);
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, animStyle, { backgroundColor: bgColor }]}
      accessibilityRole="button"
      accessibilityLabel={locked ? `${title} — ${lockedMessage}` : title}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.text}>
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        <Text style={styles.subtitle}>{locked ? (lockedMessage ?? 'Coming soon!') : subtitle}</Text>
      </View>
      {locked ? (
        <Text style={styles.lock}>🔒</Text>
      ) : (
        <View style={[styles.arrow, { backgroundColor: accentColor }]}>
          <Text style={styles.arrowText}>▶</Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    fontSize: 52,
    marginRight: Spacing.md,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textLight,
    lineHeight: 18,
  },
  lock: {
    fontSize: FontSizes.xl,
    marginLeft: Spacing.sm,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  arrowText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
