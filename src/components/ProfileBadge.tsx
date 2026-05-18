import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Profile } from '../hooks/useProfile';
import { ColorPalette, FontSizes, Radii, Spacing } from '../constants/colors';
import { useColors } from '../hooks/useTheme';

type Props = {
  profile: Profile;
};

export function ProfileBadge({ profile }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.caret}>▾</Text>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.avatarBg,
      borderRadius: Radii.full,
      paddingRight: Spacing.md,
      paddingLeft: Spacing.xs,
      paddingVertical: Spacing.xs,
      alignSelf: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: Radii.full,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.sm,
    },
    avatarEmoji: { fontSize: 24 },
    name: { fontSize: FontSizes.md, fontWeight: '700', color: colors.text },
    caret: { fontSize: 12, color: colors.textLight, marginLeft: Spacing.xs },
  });
}
