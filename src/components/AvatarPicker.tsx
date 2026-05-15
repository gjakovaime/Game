import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radii, Spacing } from '../constants/colors';

export const AVATARS = ['👦', '👧', '🧒', '👼', '🦄', '🐉', '🐸', '🦊', '🐨'];

type Props = {
  selected: string;
  onSelect: (avatar: string) => void;
};

export function AvatarPicker({ selected, onSelect }: Props) {
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

const styles = StyleSheet.create({
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
    backgroundColor: Colors.avatarBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF3E0',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  emoji: {
    fontSize: 40,
  },
});
