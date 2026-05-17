import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Colors, FontSizes, Radii, Spacing } from '../constants/colors';

type Props = {
  word: string;
  onPress: () => void;
  variant?: 'pool' | 'placed' | 'slot';
  disabled?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WordTile({ word, onPress, variant = 'pool', disabled = false }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const animatedStyle = { transform: [{ scale }] };

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.93, damping: 15, useNativeDriver: true }).start();
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, damping: 15, useNativeDriver: true }).start();
  }

  const isSlot = variant === 'slot';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isSlot}
      style={[
        animatedStyle,
        styles.tile,
        variant === 'pool' && styles.pool,
        variant === 'placed' && styles.placed,
        variant === 'slot' && styles.slot,
      ]}
      accessibilityRole="button"
      accessibilityLabel={word}
    >
      <Text style={[styles.text, variant === 'placed' && styles.textPlaced, variant === 'slot' && styles.textSlot]}>
        {word}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    margin: Spacing.xs,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pool: {
    backgroundColor: Colors.older,
    shadowColor: Colors.older,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  placed: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  slot: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    minWidth: 72,
  },
  text: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textPlaced: {
    color: Colors.textOnPrimary,
  },
  textSlot: {
    color: Colors.border,
    fontSize: FontSizes.sm,
  },
});
