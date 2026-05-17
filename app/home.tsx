import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameCard } from '../src/components/GameCard';
import { ProfileBadge } from '../src/components/ProfileBadge';
import { Colors, FontSizes, Radii, Spacing } from '../src/constants/colors';
import { useProfile } from '../src/hooks/useProfile';

export default function Home() {
  const router = useRouter();
  const { activeProfile, profiles, switchProfile, loaded, reload } = useProfile();
  const [showProfiles, setShowProfiles] = useState(false);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  useEffect(() => {
    if (loaded && !activeProfile) {
      router.replace('/onboarding');
    }
  }, [loaded, activeProfile, router]);

  if (!loaded || !activeProfile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isYoung = activeProfile.ageGroup === 'young';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => setShowProfiles(v => !v)} accessibilityRole="button" accessibilityLabel="Switch player">
            <ProfileBadge profile={activeProfile} />
          </Pressable>
        </View>

        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>Mirë se erdhe, {activeProfile.name}! {activeProfile.avatarEmoji}</Text>
          <Text style={styles.welcomeSub}>
            {isYoung ? 'Hajde të luajmë dhe të mësojmë! 🌟' : 'Çfarë dëshiron të mësosh sot?'}
          </Text>
        </View>

        {/* Age 3–6 section */}
        <Text style={[styles.sectionLabel, { color: Colors.young }]}>🌸 Për të vegjëlit (3–6)</Text>
        <GameCard
          title="Gjej Foton!"
          subtitle="Dëgjo fjalën shqip dhe gjej foton e saktë."
          emoji="🖼️"
          bgColor={Colors.youngLight}
          accentColor={Colors.young}
          route="/games/picture-match"
        />
        <GameCard
          title="Gjej Çiftet!"
          subtitle="Ktheji kartat dhe përputh fjalën me foton."
          emoji="🎴"
          bgColor={Colors.youngLight}
          accentColor={Colors.young}
          route="/games/memory-match"
        />
        <GameCard
          title="Emërtoje!"
          subtitle="Shiko foton dhe zgjidh emrin e saktë shqip."
          emoji="🏷️"
          bgColor={Colors.youngLight}
          accentColor={Colors.young}
          route="/games/name-it"
        />
        <GameCard
          title="Numëro!"
          subtitle="Numëro sa janë dhe gjej numrin e saktë."
          emoji="🔢"
          bgColor={Colors.youngLight}
          accentColor={Colors.young}
          route="/games/count-match"
        />

        {/* Age 7+ section — only shown for older profiles */}
        {!isYoung && (
          <>
            <Text style={[styles.sectionLabel, { color: Colors.older }]}>🚀 Për të rriturit (7+)</Text>
            <GameCard
              title="Formulo Fjalinë!"
              subtitle="Shiko foton dhe formulo fjalinë shqip duke vendosur fjalët."
              emoji="🧩"
              bgColor={Colors.olderLight}
              accentColor={Colors.older}
              route="/games/sentence-builder"
            />
            <GameCard
              title="Plotëso Fjalinë!"
              subtitle="Gjej fjalën që mungon në fjali."
              emoji="✍️"
              bgColor={Colors.olderLight}
              accentColor={Colors.older}
              route="/games/fill-blank"
            />
            <GameCard
              title="Shkruaj Fjalën!"
              subtitle="Vendos shkronjat në rend të saktë."
              emoji="🔤"
              bgColor={Colors.olderLight}
              accentColor={Colors.older}
              route="/games/word-scramble"
            />
            <GameCard
              title="Kategorizoji!"
              subtitle="Vendos çdo fjalë në kategorinë e duhur."
              emoji="🗂️"
              bgColor={Colors.olderLight}
              accentColor={Colors.older}
              route="/games/category-sort"
            />
            <GameCard
              title="Përkthe!"
              subtitle="Përkthe fjalën nga shqipja në anglisht ose anasjelltas."
              emoji="💬"
              bgColor={Colors.olderLight}
              accentColor={Colors.older}
              route="/games/translate"
            />
            <GameCard
              title="Matematikë!"
              subtitle="Zgjidh mbledhjet dhe zbatimet dhe gjej përgjigjen."
              emoji="🧮"
              bgColor={Colors.olderLight}
              accentColor={Colors.older}
              route="/games/math-challenge"
            />
          </>
        )}

        {/* Fun footer */}
        <Text style={styles.footer}>Mëso shqipen duke luajtur!</Text>
      </ScrollView>

      {/* Dropdown overlay — closes on outside tap */}
      {showProfiles && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowProfiles(false)} />
      )}

      {/* Profile dropdown */}
      {showProfiles && (
        <View style={styles.dropdown}>
          {profiles.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.dropdownRow, p.id === activeProfile.id && styles.dropdownRowActive]}
              onPress={() => { switchProfile(p.id); setShowProfiles(false); }}
            >
              <Text style={styles.dropdownEmoji}>{p.avatarEmoji}</Text>
              <Text style={styles.dropdownName}>{p.name}</Text>
              {p.id === activeProfile.id && <Text style={styles.dropdownCheck}>✓</Text>}
            </Pressable>
          ))}
          <Pressable
            style={styles.dropdownAddRow}
            onPress={() => { setShowProfiles(false); router.push('/onboarding'); }}
          >
            <Text style={styles.dropdownAddText}>+ Lojtar i ri</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  welcome: { marginBottom: Spacing.xl },
  welcomeText: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.xs },
  welcomeSub: { fontSize: FontSizes.md, color: Colors.text, marginBottom: 2 },
  welcomeSubEn: { fontSize: FontSizes.sm, color: Colors.textLight },
  sectionLabel: { fontSize: FontSizes.md, fontWeight: '800', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  footer: { textAlign: 'center', fontSize: FontSizes.md, color: Colors.textLight, marginTop: Spacing.xl },
  // Dropdown
  dropdown: {
    position: 'absolute',
    top: 72,
    left: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dropdownRowActive: { backgroundColor: Colors.background },
  dropdownEmoji: { fontSize: 24, marginRight: Spacing.sm },
  dropdownName: { flex: 1, fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  dropdownCheck: { fontSize: FontSizes.md, color: Colors.primary, fontWeight: '900' },
  dropdownAddRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dropdownAddText: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.primary },
});
