import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, FontSizes, Radii, Spacing } from '../constants/colors';
import { useColors } from '../hooks/useTheme';
import type { Badge } from '../hooks/useProgress';

type Props = {
  badge: Badge;
  onDismiss: () => void;
};

export function BadgeToast({ badge, onDismiss }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <Pressable style={styles.inner} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss badge">
        <Text style={styles.emoji}>{badge.emoji}</Text>
        <View style={styles.text}>
          <Text style={styles.title}>Arritjet e re!</Text>
          <Text style={styles.name}>{badge.title}</Text>
          <Text style={styles.desc}>{badge.description}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 16,
      left: Spacing.md,
      right: Spacing.md,
      zIndex: 200,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Radii.xl,
      borderWidth: 2,
      borderColor: colors.accent,
      padding: Spacing.md,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 16,
      gap: Spacing.md,
    },
    emoji: { fontSize: 44 },
    text: { flex: 1 },
    title: { fontSize: FontSizes.xs, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 1 },
    name: { fontSize: FontSizes.md, fontWeight: '900', color: colors.text },
    desc: { fontSize: FontSizes.sm, color: colors.textLight, marginTop: 2 },
  });
}
