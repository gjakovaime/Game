import { useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, FontSizes, Radii, Spacing } from '../constants/colors';
import { useColors } from '../hooks/useTheme';

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
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(1)).current;
  const animStyle = { transform: [{ scale }] };

  function handlePressIn() { Animated.spring(scale, { toValue: 0.96, damping: 15, useNativeDriver: true }).start(); }
  function handlePressOut() { Animated.spring(scale, { toValue: 1, damping: 15, useNativeDriver: true }).start(); }

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

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
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
    emoji: { fontSize: 52, marginRight: Spacing.md },
    text: { flex: 1 },
    title: { fontSize: FontSizes.lg, fontWeight: '800', marginBottom: 4 },
    subtitle: { fontSize: FontSizes.sm, color: colors.textLight, lineHeight: 18 },
    lock: { fontSize: FontSizes.xl, marginLeft: Spacing.sm },
    arrow: {
      width: 36, height: 36, borderRadius: Radii.full,
      justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm,
    },
    arrowText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  });
}
