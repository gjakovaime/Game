import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, Radii, Spacing } from '../constants/colors';
import { useColors } from '../hooks/useTheme';

export const AVATARS = ['👦', '👧', '🧒', '👼', '🦄', '🐉', '🐸', '🦊', '🐨'];

type Props = {
  selected: string;
  onSelect: (avatar: string) => void;
};

export function AvatarPicker({ selected, onSelect }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.grid}>
      {AVATARS.map((avatar) => {
        const isSelected = avatar === selected;
        return (
          <Pressable
            key={avatar}
            onPress={() => onSelect(avatar)}
            style={[styles.cell, isSelected && styles.selected]}
            accessibilityRole="button"
            accessibilityLabel={`Choose avatar ${avatar}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={styles.emoji}>{avatar}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    cell: {
      width: 80,
      height: 80,
      borderRadius: Radii.xl,
      backgroundColor: colors.avatarBg,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: 'transparent',
    },
    selected: {
      borderColor: colors.primary,
      backgroundColor: colors.youngLight,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 6,
    },
    emoji: { fontSize: 40 },
  });
}
