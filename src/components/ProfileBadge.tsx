import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Profile } from '../hooks/useProfile';
import { Colors, FontSizes, Radii, Spacing } from '../constants/colors';

type Props = {
  profile: Profile;
};

export function ProfileBadge({ profile }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push('/home' as any)}
      accessibilityRole="button"
      accessibilityLabel={`Profile: ${profile.name}`}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.avatarBg,
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
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
});
