import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
  const { activeProfile, profiles, switchProfile, loaded } = useProfile();
  const [showProfiles, setShowProfiles] = useState(false);

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
          <Pressable onPress={() => setShowProfiles(true)}>
            <ProfileBadge profile={activeProfile} />
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/onboarding')}
            accessibilityLabel="Add profile"
          >
            <Text style={styles.addBtnText}>+ Lojtar</Text>
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

      {/* Profile switcher modal */}
      <Modal visible={showProfiles} transparent animationType="slide" onRequestClose={() => setShowProfiles(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowProfiles(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Zgjidh lojtarin</Text>
            {profiles.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.profileRow, p.id === activeProfile.id && styles.profileRowActive]}
                onPress={() => { switchProfile(p.id); setShowProfiles(false); }}
              >
                <Text style={styles.profileEmoji}>{p.avatarEmoji}</Text>
                <Text style={styles.profileName}>{p.name}</Text>
                {p.id === activeProfile.id && <Text style={styles.check}>✓</Text>}
              </Pressable>
            ))}
            <Pressable style={styles.closeBtn} onPress={() => setShowProfiles(false)}>
              <Text style={styles.closeBtnText}>Mbyll</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  addBtn: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  addBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSizes.sm },
  welcome: { marginBottom: Spacing.xl },
  welcomeText: { fontSize: FontSizes.xl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.xs },
  welcomeSub: { fontSize: FontSizes.md, color: Colors.text, marginBottom: 2 },
  welcomeSubEn: { fontSize: FontSizes.sm, color: Colors.textLight },
  sectionLabel: { fontSize: FontSizes.md, fontWeight: '800', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  footer: { textAlign: 'center', fontSize: FontSizes.md, color: Colors.textLight, marginTop: Spacing.xl },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
  },
  modalTitle: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  profileRowActive: { backgroundColor: Colors.avatarBg, borderWidth: 2, borderColor: Colors.primary },
  profileEmoji: { fontSize: 32, marginRight: Spacing.md },
  profileName: { flex: 1, fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  check: { fontSize: FontSizes.lg, color: Colors.primary, fontWeight: '900' },
  closeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  closeBtnText: { color: Colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.md },
});
