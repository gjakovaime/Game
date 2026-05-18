import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useProfile } from '../src/hooks/useProfile';
import { useColors } from '../src/hooks/useTheme';

export default function Index() {
  const { activeProfile, loaded } = useProfile();
  const colors = useColors();

  if (!loaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return activeProfile ? <Redirect href="/home" /> : <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
