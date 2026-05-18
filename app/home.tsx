import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeToast } from '../src/components/BadgeToast';
import { ProfileBadge } from '../src/components/ProfileBadge';
import { ColorPalette, FontSizes, Radii, Spacing } from '../src/constants/colors';
import { buttonGloss } from '../src/constants/styles';
import { TIER_UNLOCK_DAYS } from '../src/data/vocabulary';
import { useColors, useTheme } from '../src/hooks/useTheme';
import { ALL_BADGES, Badge, useProgress } from '../src/hooks/useProgress';
import { MasteryStats, useWordProgress } from '../src/hooks/useWordProgress';
import { useProfile } from '../src/hooks/useProfile';
import { GameDef, Unit, UNITS } from '../src/data/units';

// ─── Stars display ────────────────────────────────────────────────────────────

function StarsRow({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3].map(i => (
        <Text key={i} style={{ fontSize: size, lineHeight: size + 4 }}>
          {i <= count ? '⭐' : '☆'}
        </Text>
      ))}
    </View>
  );
}

// ─── Single game node ─────────────────────────────────────────────────────────

type GameNodeProps = {
  game: GameDef;
  stars: number;
  locked: boolean;
  unitColor: string;
  isLast: boolean;
};

function GameNode({ game, stars, locked, unitColor, isLast }: GameNodeProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeNodeStyles(colors), [colors]);

  function handlePress() {
    if (!locked) router.push(game.route as any);
  }

  const opacity = locked ? 0.4 : 1;

  return (
    <View style={styles.row}>
      <View style={styles.lineCol}>
        <View style={[styles.lineSegment, isLast && { opacity: 0 }]} />
      </View>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed && !locked ? 0.85 : opacity },
        ]}
        accessibilityRole="button"
        accessibilityLabel={locked ? `${game.title} — bllokim` : game.title}
      >
        <View style={[styles.circle, { backgroundColor: locked ? colors.border : unitColor }]}>
          <Text style={styles.circleEmoji}>{game.emoji}</Text>
          {stars > 0 && !locked && (
            <View style={[styles.starBadge, { backgroundColor: colors.background }]}>
              <Text style={styles.starBadgeText}>{stars}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, locked && { color: colors.textLight }]} numberOfLines={1}>
            {game.title}
          </Text>
          {locked
            ? <Text style={styles.lockedLabel}>🔒 E bllokuar</Text>
            : <StarsRow count={stars} size={14} />
          }
        </View>
        {!locked && (
          <View style={[styles.arrow, { backgroundColor: unitColor }]}>
            <Text style={styles.arrowText}>▶</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function makeNodeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
    lineCol: { width: 28, alignItems: 'center', paddingTop: 52 },
    lineSegment: { width: 2, flex: 1, backgroundColor: colors.border, minHeight: 20 },
    card: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: Radii.xl,
      padding: Spacing.md, marginLeft: Spacing.sm, marginBottom: Spacing.sm,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
    },
    circle: {
      width: 56, height: 56, borderRadius: Radii.full,
      justifyContent: 'center', alignItems: 'center',
      marginRight: Spacing.md, position: 'relative',
    },
    circleEmoji: { fontSize: 28 },
    starBadge: {
      position: 'absolute', bottom: -4, right: -4,
      width: 20, height: 20, borderRadius: Radii.full,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.star,
    },
    starBadgeText: { fontSize: 10, fontWeight: '900', color: colors.star },
    info: { flex: 1 },
    title: { fontSize: FontSizes.md, fontWeight: '800', color: colors.text, marginBottom: 4 },
    lockedLabel: { fontSize: FontSizes.sm, color: colors.textLight },
    arrow: { width: 32, height: 32, borderRadius: Radii.full, justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm },
    arrowText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  });
}

// ─── Unit header ──────────────────────────────────────────────────────────────

type UnitHeaderProps = {
  unit: Unit;
  totalStars: number;
  maxStars: number;
  unlocked: boolean;
  starsNeeded: number;
};

function UnitHeader({ unit, totalStars, maxStars, unlocked, starsNeeded }: UnitHeaderProps) {
  const colors = useColors();
  const styles = useMemo(() => makeHeaderStyles(colors), [colors]);
  const pct = maxStars > 0 ? totalStars / maxStars : 0;

  return (
    <View style={[styles.wrap, { borderColor: unlocked ? unit.color : colors.border }]}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{unit.emoji}</Text>
        <View style={styles.titleWrap}>
          <Text style={[styles.unitNum, { color: unlocked ? unit.color : colors.textLight }]}>
            UNIT {unit.num}
          </Text>
          <Text style={[styles.title, { color: unlocked ? colors.text : colors.textLight }]}>
            {unit.title}
          </Text>
          <Text style={styles.subtitle}>
            {unlocked ? unit.subtitle : `Nevojiten ${starsNeeded} yje më shumë ⭐`}
          </Text>
        </View>
        {!unlocked && <Text style={styles.lockBig}>🔒</Text>}
      </View>
      {unlocked && (
        <>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: unit.color }]} />
          </View>
          <Text style={[styles.progressLabel, { color: unit.color }]}>
            {totalStars} / {maxStars} yje
          </Text>
        </>
      )}
    </View>
  );
}

function makeHeaderStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: {
      borderRadius: Radii.xl, borderWidth: 2,
      backgroundColor: colors.surface, padding: Spacing.md, marginBottom: Spacing.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    },
    top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    emoji: { fontSize: 36 },
    titleWrap: { flex: 1 },
    unitNum: { fontSize: FontSizes.xs, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    title: { fontSize: FontSizes.lg, fontWeight: '900' },
    subtitle: { fontSize: FontSizes.sm, color: colors.textLight, marginTop: 2 },
    lockBig: { fontSize: 28 },
    progressBg: {
      height: 8, borderRadius: Radii.full, backgroundColor: colors.background,
      marginTop: Spacing.sm, overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: Radii.full },
    progressLabel: { fontSize: FontSizes.xs, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  });
}

// ─── Mastery bar ──────────────────────────────────────────────────────────────

function MasteryBar({ masteryStats, daysUsed }: { masteryStats: MasteryStats; daysUsed: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeMasteryStyles(colors), [colors]);
  const { total, mastered, familiar, learning } = masteryStats;
  const active = mastered + familiar + learning;
  if (active === 0) return null;

  const nextTierDay = daysUsed < 3 ? 3 : daysUsed < 7 ? 7 : null;
  const daysToNext = nextTierDay !== null ? nextTierDay - daysUsed : null;
  const nextTierCount = daysUsed < 3 ? 7 : daysUsed < 7 ? 3 : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>Fjalori im</Text>
        <Text style={styles.count}>{active}/{total} fjalë</Text>
      </View>
      <View style={styles.bar}>
        {mastered > 0 && (
          <View style={[styles.seg, { flex: mastered, backgroundColor: colors.success }]} />
        )}
        {familiar > 0 && (
          <View style={[styles.seg, { flex: familiar, backgroundColor: colors.primary }]} />
        )}
        {learning > 0 && (
          <View style={[styles.seg, { flex: learning, backgroundColor: colors.secondary }]} />
        )}
        <View style={[styles.seg, { flex: total - active, backgroundColor: colors.border }]} />
      </View>
      <View style={styles.legend}>
        <Text style={[styles.dot, { color: colors.success }]}>● </Text>
        <Text style={styles.legendText}>Zotëruar ({mastered})</Text>
        <Text style={[styles.dot, { color: colors.primary }]}>  ● </Text>
        <Text style={styles.legendText}>Njohur ({familiar})</Text>
        <Text style={[styles.dot, { color: colors.secondary }]}>  ● </Text>
        <Text style={styles.legendText}>Duke mësuar ({learning})</Text>
      </View>
      {daysToNext !== null && nextTierCount !== null && daysToNext > 0 && (
        <Text style={styles.unlockHint}>
          🔓 {nextTierCount} fjalë të reja shfaqen pas {daysToNext} ditë
        </Text>
      )}
    </View>
  );
}

function makeMasteryStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.surface, borderRadius: Radii.xl, borderWidth: 1,
      borderColor: colors.border, padding: Spacing.md, marginBottom: Spacing.md,
    },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
    title: { fontSize: FontSizes.sm, fontWeight: '800', color: colors.text },
    count: { fontSize: FontSizes.sm, color: colors.textLight },
    bar: {
      flexDirection: 'row', height: 10, borderRadius: Radii.full,
      overflow: 'hidden', marginBottom: Spacing.sm,
    },
    seg: { height: '100%' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
    dot: { fontSize: FontSizes.xs },
    legendText: { fontSize: FontSizes.xs, color: colors.textLight },
    unlockHint: {
      marginTop: Spacing.sm, fontSize: FontSizes.xs, color: colors.primary,
      fontWeight: '700',
    },
  });
}

// ─── Badge shelf ──────────────────────────────────────────────────────────────

function BadgeShelf({ earnedIds }: { earnedIds: string[] }) {
  const colors = useColors();
  const styles = useMemo(() => makeShelfStyles(colors), [colors]);
  if (earnedIds.length === 0) return null;
  const badges = ALL_BADGES.filter(b => earnedIds.includes(b.id));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Arritjet e mia</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {badges.map(b => (
          <View key={b.id} style={styles.chip} accessibilityLabel={b.title}>
            <Text style={styles.chipEmoji}>{b.emoji}</Text>
            <Text style={styles.chipName} numberOfLines={1}>{b.title}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function makeShelfStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: { marginBottom: Spacing.lg },
    label: { fontSize: FontSizes.xs, fontWeight: '800', color: colors.textLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: Spacing.sm },
    row: { gap: Spacing.sm, paddingRight: Spacing.sm },
    chip: {
      alignItems: 'center', backgroundColor: colors.surface,
      borderRadius: Radii.lg, borderWidth: 1, borderColor: colors.border,
      paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, minWidth: 70,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    chipEmoji: { fontSize: 24, marginBottom: 4 },
    chipName: { fontSize: 10, fontWeight: '700', color: colors.text, textAlign: 'center' },
  });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const colors = useColors();
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeProfile, profiles, switchProfile, loaded, reload } = useProfile();
  const { getStars, getUnitStars, isUnitUnlocked, starsNeededToUnlock, earnedBadges, reload: reloadProgress, daysUsed, recordAppOpen } = useProgress();
  const { masteryStats, reload: reloadWords } = useWordProgress();
  const [showProfiles, setShowProfiles] = useState(false);
  const [toastBadge, setToastBadge] = useState<Badge | null>(null);

  useEffect(() => {
    if (loaded && !activeProfile) router.replace('/onboarding');
  }, [loaded, activeProfile, router]);

  useFocusEffect(useCallback(() => {
    reload();
    reloadProgress();
    reloadWords();
    recordAppOpen();
    if (!activeProfile?.id) return;
    const pendingKey = `@albanian/pendingBadge/${activeProfile.id}`;
    AsyncStorage.getItem(pendingKey).then(badgeId => {
      if (!badgeId) return;
      const badge = ALL_BADGES.find(b => b.id === badgeId);
      if (badge) setToastBadge(badge);
      AsyncStorage.removeItem(pendingKey);
    });
  }, [reload, reloadProgress, reloadWords, recordAppOpen, activeProfile?.id]));

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!activeProfile) return null;

  const totalStarsEarned = UNITS.reduce((s, u) => s + u.games.reduce((ss, g) => ss + getStars(g.id), 0), 0);
  const totalStarsPossible = UNITS.reduce((s, u) => s + u.games.length * 3, 0);

  return (
    <SafeAreaView style={styles.safe}>
      {toastBadge && (
        <BadgeToast badge={toastBadge} onDismiss={() => setToastBadge(null)} />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => setShowProfiles(v => !v)} accessibilityRole="button" accessibilityLabel="Switch player">
            <ProfileBadge profile={activeProfile} />
          </Pressable>
          <View style={styles.headerRight}>
            <Text style={styles.totalStars}>⭐ {totalStarsEarned}/{totalStarsPossible}</Text>
            <Pressable onPress={toggleTheme} style={styles.themeBtn} accessibilityRole="button" accessibilityLabel="Toggle theme">
              <Text style={styles.themeBtnText}>{theme === 'dark' ? '☀️' : '🌙'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeText}>
            Mirë se erdhe, {activeProfile.name}! {activeProfile.avatarEmoji}
          </Text>
          <Text style={styles.welcomeSub}>Mëso shqipen duke luajtur!</Text>
        </View>

        {/* Mastery bar */}
        <MasteryBar masteryStats={masteryStats} daysUsed={daysUsed} />

        {/* Badge shelf */}
        <BadgeShelf earnedIds={earnedBadges} />

        {/* Units */}
        {UNITS.map((unit, unitIdx) => {
          const unlocked = isUnitUnlocked(unitIdx);
          const needed = starsNeededToUnlock(unitIdx);
          const unitStars = getUnitStars(unitIdx);
          const maxUnitStars = unit.games.length * 3;

          return (
            <View key={unit.id} style={styles.unitSection}>
              <UnitHeader
                unit={unit}
                totalStars={unitStars}
                maxStars={maxUnitStars}
                unlocked={unlocked}
                starsNeeded={needed}
              />
              <View style={styles.gameList}>
                {unit.games.map((game, gameIdx) => (
                  <GameNode
                    key={game.id}
                    game={game}
                    stars={getStars(game.id)}
                    locked={!unlocked}
                    unitColor={unit.color}
                    isLast={gameIdx === unit.games.length - 1}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <Text style={styles.footer}>Vazhdo të mësosh!</Text>
      </ScrollView>

      {showProfiles && (
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowProfiles(false)} />
      )}

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

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.xxl },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    totalStars: { fontSize: FontSizes.md, fontWeight: '800', color: colors.star },
    themeBtn: {
      width: 36, height: 36, borderRadius: Radii.full,
      backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    themeBtnText: { fontSize: 18 },

    welcome: { marginBottom: Spacing.lg },
    welcomeText: { fontSize: FontSizes.xl, fontWeight: '900', color: colors.text, marginBottom: 4 },
    welcomeSub: { fontSize: FontSizes.sm, color: colors.textLight },

    unitSection: { marginBottom: Spacing.xl },
    gameList: { paddingLeft: 4 },

    footer: { textAlign: 'center', fontSize: FontSizes.md, color: colors.textLight, marginTop: Spacing.lg },

    dropdown: {
      position: 'absolute', top: 72, left: Spacing.lg,
      backgroundColor: colors.surface, borderRadius: Radii.lg,
      borderWidth: 1, borderColor: colors.border, minWidth: 200,
      shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25, shadowRadius: 12, elevation: 12, zIndex: 100, overflow: 'hidden',
    },
    dropdownRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    dropdownRowActive: { backgroundColor: colors.background },
    dropdownEmoji: { fontSize: 24, marginRight: Spacing.sm },
    dropdownName: { flex: 1, fontSize: FontSizes.md, fontWeight: '700', color: colors.text },
    dropdownCheck: { fontSize: FontSizes.md, color: colors.primary, fontWeight: '900' },
    dropdownAddRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    dropdownAddText: { fontSize: FontSizes.sm, fontWeight: '700', color: colors.primary },
  });
}
