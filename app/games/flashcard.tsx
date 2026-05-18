import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SummaryCelebration } from '../../src/components/SummaryCelebration';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { VocabItem, getAvailableVocab } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useWordProgress } from '../../src/hooks/useWordProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 10;

function buildDeck(vocab: VocabItem[]): VocabItem[] {
  return [...vocab].sort(() => Math.random() - 0.5).slice(0, ROUNDS);
}

function Summary({ known, total, onReplay, onHome, name }: {
  known: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stars = known >= total ? 3 : known >= Math.ceil(total * 0.7) ? 2 : 1;
  const { recordStars } = useProgress();
  useEffect(() => { recordStars('flashcard', stars); }, []);

  return (
    <View style={styles.summary}>
      <SummaryCelebration />
      <Text style={styles.summaryTitle}>Bravo{name ? `, ${name}` : ''}! 🎉</Text>
      <Text style={styles.summaryStars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={styles.summaryScore}>{known}/{total} dija!</Text>
      <Pressable style={[styles.btn, { backgroundColor: colors.secondary }]} onPress={onReplay}>
        <Text style={styles.btnText}>Luaj përsëri! 🔄</Text>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: colors.primary, marginTop: Spacing.md }]} onPress={onHome}>
        <Text style={styles.btnText}>Shko në shtëpi 🏠</Text>
      </Pressable>
    </View>
  );
}

export default function Flashcard() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop } = useSpeech();
  const { daysUsed, loaded: progressLoaded } = useProgress();
  const { recordWordResult, getSmartItems } = useWordProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [deck, setDeck] = useState<VocabItem[]>(() => buildDeck(getAvailableVocab(0)));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const locked = useRef(false);
  const didSmartInit = useRef(false);

  useEffect(() => {
    if (didSmartInit.current || !progressLoaded) return;
    didSmartInit.current = true;
    const vocab = getAvailableVocab(daysUsed);
    setDeck(getSmartItems(ROUNDS, vocab));
  }, [progressLoaded]);

  const card = deck[idx];

  useEffect(() => {
    if (done) praise();
  }, [done]);

  useEffect(() => () => stop(), []);

  const flipCard = useCallback(() => {
    if (!flipped) speak(card.albanian);
    const toValue = flipped ? 0 : 180;
    Animated.spring(flipAnim, { toValue, damping: 12, stiffness: 120, useNativeDriver: true }).start();
    setFlipped(f => !f);
  }, [flipped, card, speak, flipAnim]);

  const advance = useCallback((didKnow: boolean) => {
    if (locked.current) return;
    locked.current = true;
    recordWordResult(card.id, didKnow);
    if (didKnow) {
      setKnown(k => k + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const dir = didKnow ? 300 : -300;
    Animated.timing(slideAnim, { toValue: dir, duration: 220, useNativeDriver: true }).start(() => {
      slideAnim.setValue(0);
      flipAnim.setValue(0);
      setFlipped(false);
      if (idx + 1 >= ROUNDS) {
        setDone(true);
      } else {
        setIdx(i => i + 1);
      }
      locked.current = false;
    });
  }, [idx, slideAnim, flipAnim, recordWordResult, card]);

  function handleReplay() {
    const vocab = getAvailableVocab(daysUsed);
    setDeck(getSmartItems(ROUNDS, vocab));
    setIdx(0);
    setFlipped(false);
    setKnown(0);
    setDone(false);
    flipAnim.setValue(0);
    slideAnim.setValue(0);
    locked.current = false;
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary known={known} total={ROUNDS} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Kthehu</Text>
        </Pressable>
        <Text style={styles.progress}>{idx + 1} / {ROUNDS}</Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i < idx && styles.dotDone, i === idx && styles.dotCurrent]} />
        ))}
      </View>

      <Text style={styles.instruction}>Trokite kartën për ta kthyer! 👆</Text>
      <Text style={styles.instructionEn}>(Tap the card to flip it!)</Text>

      <Animated.View style={[styles.cardWrap, { transform: [{ translateX: slideAnim }] }]}>
        <Pressable onPress={flipCard}>
          <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
            <Text style={styles.cardLabel}>🇦🇱 Shqip</Text>
            <Text style={styles.cardWord}>{card.albanian}</Text>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.tapHint}>Trokite për anglisht →</Text>
          </Animated.View>
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
            <Text style={styles.cardLabel}>🇬🇧 English</Text>
            <Text style={styles.cardWordBack}>{card.english}</Text>
            <Text style={styles.cardEmoji}>{card.emoji}</Text>
            <Text style={styles.cardWordSub}>{card.albanian}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionBtn, styles.noBtn]} onPress={() => advance(false)} accessibilityRole="button" accessibilityLabel="Don't know">
          <Text style={styles.actionBtnIcon}>✗</Text>
          <Text style={styles.actionBtnLabel}>S'di</Text>
        </Pressable>
        <View style={styles.actionSpacer} />
        <Pressable style={[styles.actionBtn, styles.yesBtn]} onPress={() => advance(true)} accessibilityRole="button" accessibilityLabel="Know it">
          <Text style={styles.actionBtnIcon}>✓</Text>
          <Text style={styles.actionBtnLabel}>Di!</Text>
        </Pressable>
      </View>

      <Text style={styles.tally}>{known} ✓  •  {idx - known} ✗  •  {ROUNDS - idx - 1} mbeten</Text>
    </SafeAreaView>
  );
}

const CARD_H = 260;

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    },
    backBtn: { padding: Spacing.sm },
    backText: { fontSize: FontSizes.md, color: colors.textLight, fontWeight: '600' },
    progress: { fontSize: FontSizes.md, color: colors.textLight, fontWeight: '700' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: Spacing.sm, flexWrap: 'wrap', paddingHorizontal: Spacing.xl },
    dot: { width: 8, height: 8, borderRadius: Radii.full, backgroundColor: colors.border },
    dotDone: { backgroundColor: colors.success },
    dotCurrent: { backgroundColor: colors.accent, width: 16 },
    instruction: { textAlign: 'center', fontSize: FontSizes.md, fontWeight: '700', color: colors.text, marginTop: Spacing.sm },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    cardWrap: { alignItems: 'center', paddingHorizontal: Spacing.lg },
    card: {
      width: '100%', height: CARD_H, borderRadius: Radii.xl,
      justifyContent: 'center', alignItems: 'center',
      padding: Spacing.xl, backfaceVisibility: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10,
    },
    cardFront: {
      backgroundColor: colors.surface,
      borderWidth: 2, borderColor: colors.accent,
    },
    cardBack: {
      backgroundColor: colors.background,
      borderWidth: 2, borderColor: colors.secondary,
      position: 'absolute', top: 0, left: 0, right: 0,
    },
    cardLabel: { fontSize: FontSizes.sm, fontWeight: '700', color: colors.textLight, marginBottom: Spacing.sm },
    cardWord: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.accent, textAlign: 'center', marginBottom: Spacing.sm },
    cardWordBack: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.secondary, textAlign: 'center', marginBottom: Spacing.sm },
    cardWordSub: { fontSize: FontSizes.md, color: colors.textLight, textAlign: 'center', marginTop: Spacing.xs },
    cardEmoji: { fontSize: 56, marginVertical: Spacing.sm },
    tapHint: { fontSize: FontSizes.xs, color: colors.textLight, marginTop: Spacing.md },
    actions: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.xl, marginTop: Spacing.xl,
    },
    actionSpacer: { flex: 1 },
    actionBtn: {
      width: 90, height: 90, borderRadius: Radii.full,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
    },
    noBtn: { backgroundColor: colors.error },
    yesBtn: { backgroundColor: colors.success },
    actionBtnIcon: { fontSize: 32, color: colors.textOnPrimary, fontWeight: '900', lineHeight: 36 },
    actionBtnLabel: { fontSize: FontSizes.sm, color: colors.textOnPrimary, fontWeight: '700' },
    tally: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginTop: Spacing.lg },
    summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.text, marginBottom: Spacing.md, textAlign: 'center' },
    summaryStars: { fontSize: 48, marginBottom: Spacing.md },
    summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: colors.textLight, marginBottom: Spacing.xxl },
    btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
    btnText: { color: colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
  });
}
