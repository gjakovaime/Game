import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { GameSummary } from '../../src/components/GameSummary';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { VocabItem, getAvailableVocab } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useWordProgress } from '../../src/hooks/useWordProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useT } from '../../src/hooks/useT';

const ROUNDS = 5;

type Letter = { id: string; char: string };

function makeLetters(word: string): Letter[] {
  return word.split('').map((char, i) => ({ id: `${i}-${char}`, char }));
}

function scramble(letters: Letter[]): Letter[] {
  const arr = [...letters];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.length > 1 && arr.every((l, i) => l.id === letters[i].id)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }
  return arr;
}

function buildItems(vocab: VocabItem[]): VocabItem[] {
  return vocab
    .filter(v => v.albanian.length <= 8)
    .sort(() => Math.random() - 0.5)
    .slice(0, ROUNDS);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LetterTile({ letter, variant, onPress }: { letter: Letter; variant: 'pool' | 'placed'; onPress: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const animStyle = { transform: [{ scale }] };
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { Animated.spring(scale, { toValue: 0.88, damping: 15, useNativeDriver: true }).start(); }}
      onPressOut={() => { Animated.spring(scale, { toValue: 1, damping: 15, useNativeDriver: true }).start(); }}
      style={[tileStyles.letterTile, animStyle, { backgroundColor: variant === 'pool' ? colors.older : colors.secondary }]}
      accessibilityLabel={letter.char}
    >
      <Text style={tileStyles.letterChar}>{letter.char.toUpperCase()}</Text>
    </AnimatedPressable>
  );
}

const tileStyles = StyleSheet.create({
  letterTile: {
    width: 46, height: 46, borderRadius: Radii.md,
    justifyContent: 'center', alignItems: 'center', margin: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  letterChar: { fontSize: FontSizes.lg, fontWeight: '900', color: '#FFFFFF' },
});

function PlacedRow({ letters, onRemove, shaking }: { letters: Letter[]; onRemove: (letter: Letter) => void; shaking: boolean }) {
  const shakeX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (shaking) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [shaking]);
  const animStyle = { transform: [{ translateX: shakeX }] };
  return (
    <Animated.View style={[rowStyles.placedRow, animStyle]}>
      {letters.map(l => (
        <LetterTile key={l.id} letter={l} variant="placed" onPress={() => onRemove(l)} />
      ))}
    </Animated.View>
  );
}

const rowStyles = StyleSheet.create({
  placedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: Spacing.xs },
});

export default function WordScramble() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars, daysUsed, loaded: progressLoaded } = useProgress();
  const { recordWordResult, getSmartItems } = useWordProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  const [items, setItems] = useState<VocabItem[]>(() => buildItems(getAvailableVocab(0)));
  const [roundIdx, setRoundIdx] = useState(0);
  const [pool, setPool] = useState<Letter[]>([]);
  const [placed, setPlaced] = useState<Letter[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [shaking, setShaking] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const didSmartInit = useRef(false);

  useEffect(() => {
    if (didSmartInit.current || !progressLoaded) return;
    didSmartInit.current = true;
    const vocab = getAvailableVocab(daysUsed).filter(v => v.albanian.length <= 8);
    setItems(getSmartItems(ROUNDS, vocab));
  }, [progressLoaded]);

  const currentItem = items[roundIdx];

  useEffect(() => {
    if (!currentItem) return;
    const letters = makeLetters(currentItem.albanian);
    setPool(scramble(letters));
    setPlaced([]);
    setShaking(false);
    locked.current = false;
    speak(currentItem.albanian);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (failTimer.current) clearTimeout(failTimer.current);
    };
  }, [roundIdx, items]);

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = (score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.6) ? 2 : 1) as 1 | 2 | 3;
    recordStars('word-scramble', stars);
  }, [done]);

  useEffect(() => () => stop(), []);

  const tapFromPool = useCallback((letter: Letter) => {
    setPool(p => p.filter(l => l.id !== letter.id));
    setPlaced(p => [...p, letter]);
  }, []);

  const tapFromPlaced = useCallback((letter: Letter) => {
    setPlaced(p => p.filter(l => l.id !== letter.id));
    setPool(p => [...p, letter]);
  }, []);

  const handleCheck = useCallback(() => {
    if (!currentItem || locked.current) return;
    const attempt = placed.map(l => l.char).join('');
    const isCorrect = attempt === currentItem.albanian;
    recordWordResult(currentItem.id, isCorrect);
    if (isCorrect) {
      locked.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      setScore(s => s + 1);
      advanceTimer.current = setTimeout(() => {
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx(r => r + 1);
        locked.current = false;
      }, 800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      setShowFail(true);
      setShaking(true);
      failTimer.current = setTimeout(() => setShowFail(false), 1400);
      setTimeout(() => {
        setShaking(false);
        const letters = makeLetters(currentItem.albanian);
        setPool(scramble(letters));
        setPlaced([]);
      }, 650);
    }
  }, [placed, currentItem, roundIdx, recordWordResult]);

  function handleReplay() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (failTimer.current) clearTimeout(failTimer.current);
    const vocab = getAvailableVocab(daysUsed).filter(v => v.albanian.length <= 8);
    setItems(getSmartItems(ROUNDS, vocab));
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setShowFail(false);
    setShaking(false);
    locked.current = false;
  }

  if (done) {
    const stars = (score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.6) ? 2 : 1) as 1 | 2 | 3;
    return (
      <SafeAreaView style={styles.safe}>
        <GameSummary stars={stars} scoreText={`${score}/${ROUNDS} saktë!`} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const allPlaced = currentItem ? placed.length === currentItem.albanian.length : false;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t.back}</Text>
        </Pressable>
        <Text style={styles.progress}>{roundIdx + 1} / {ROUNDS}</Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= roundIdx && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.emojiCard}>
        <Text style={styles.hintEmoji}>{currentItem?.emoji}</Text>
        <Pressable onPress={() => speak(currentItem?.albanian)} style={styles.speakerBtn}>
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
      </View>

      <Text style={styles.instruction}>{t.games['word-scramble'].instruction}</Text>
      <Text style={styles.instructionEn}>{t.games['word-scramble'].hint}</Text>

      <View style={styles.placedWrap}>
        {placed.length > 0
          ? <PlacedRow letters={placed} onRemove={tapFromPlaced} shaking={shaking} />
          : <Text style={styles.placedPlaceholder}>_ _ _</Text>
        }
      </View>

      <View style={styles.poolRow}>
        {pool.map(l => (
          <LetterTile key={l.id} letter={l} variant="pool" onPress={() => tapFromPool(l)} />
        ))}
      </View>

      <View style={styles.checkWrap}>
        <Pressable
          onPress={handleCheck}
          disabled={!allPlaced}
          style={[styles.checkBtn, !allPlaced && styles.checkBtnDisabled]}
          accessibilityRole="button"
        >
          <Text style={styles.checkBtnText}>{t.games['word-scramble'].checkBtn}</Text>
        </Pressable>
      </View>

      <FeedbackAnimation type="fail" visible={showFail} />
    </SafeAreaView>
  );
}

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
    dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
    dot: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.older },
    emojiCard: {
      alignItems: 'center', marginTop: Spacing.sm,
      backgroundColor: colors.olderLight, marginHorizontal: Spacing.xl,
      borderRadius: Radii.xl, paddingVertical: Spacing.lg,
    },
    hintEmoji: { fontSize: FontSizes.huge },
    speakerBtn: { marginTop: Spacing.sm, padding: Spacing.xs },
    speakerIcon: { fontSize: FontSizes.xl },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.lg },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    placedWrap: {
      minHeight: 64, justifyContent: 'center', alignItems: 'center',
      marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
      borderWidth: 2, borderRadius: Radii.lg, borderColor: colors.border,
      borderStyle: 'dashed', backgroundColor: colors.surface,
    },
    placedPlaceholder: { fontSize: FontSizes.xl, color: colors.border, letterSpacing: 8, fontWeight: '700' },
    poolRow: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
      paddingHorizontal: Spacing.lg, minHeight: 70,
    },
    checkWrap: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
    checkBtn: {
      backgroundColor: colors.older, borderRadius: Radii.full,
      paddingVertical: Spacing.md, alignItems: 'center',
      shadowColor: colors.older, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    checkBtnDisabled: { opacity: 0.35 },
    checkBtnText: { color: colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.lg },
  });
}
