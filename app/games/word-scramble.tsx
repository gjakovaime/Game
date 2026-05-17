import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { Colors, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { VOCABULARY, VocabItem } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useSpeech } from '../../src/hooks/useSpeech';

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

function buildItems(): VocabItem[] {
  return VOCABULARY
    .filter(v => v.albanian.length <= 8)
    .sort(() => Math.random() - 0.5)
    .slice(0, ROUNDS);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LetterTile({ letter, variant, onPress }: { letter: Letter; variant: 'pool' | 'placed'; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[styles.letterTile, animStyle, { backgroundColor: variant === 'pool' ? Colors.older : Colors.secondary }]}
      accessibilityLabel={letter.char}
    >
      <Text style={styles.letterChar}>{letter.char.toUpperCase()}</Text>
    </AnimatedPressable>
  );
}

function PlacedRow({ letters, onRemove, shaking }: { letters: Letter[]; onRemove: (letter: Letter) => void; shaking: boolean }) {
  const shakeX = useSharedValue(0);
  useEffect(() => {
    if (shaking) {
      shakeX.value = withRepeat(
        withSequence(withTiming(-10, { duration: 60 }), withTiming(10, { duration: 60 })),
        4, true, () => { shakeX.value = 0; }
      );
    }
  }, [shaking]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));
  return (
    <Animated.View style={[styles.placedRow, animStyle]}>
      {letters.map(l => (
        <LetterTile key={l.id} letter={l} variant="placed" onPress={() => onRemove(l)} />
      ))}
    </Animated.View>
  );
}

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const stars = score >= total ? 3 : score >= Math.ceil(total * 0.6) ? 2 : 1;
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryTitle}>Bravo{name ? `, ${name}` : ''}! 🎉</Text>
      <Text style={styles.summaryStars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={styles.summaryScore}>{score}/{total} saktë!</Text>
      <Pressable style={[styles.btn, { backgroundColor: Colors.secondary }]} onPress={onReplay}>
        <Text style={styles.btnText}>Luaj përsëri! 🔄</Text>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: Colors.primary, marginTop: Spacing.md }]} onPress={onHome}>
        <Text style={styles.btnText}>Shko në shtëpi 🏠</Text>
      </Pressable>
    </View>
  );
}

export default function WordScramble() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();

  const [items, setItems] = useState<VocabItem[]>(() => buildItems());
  const [roundIdx, setRoundIdx] = useState(0);
  const [pool, setPool] = useState<Letter[]>([]);
  const [placed, setPlaced] = useState<Letter[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [shaking, setShaking] = useState(false);
  const advanceGame = useRef<(() => void) | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentItem = items[roundIdx];

  useEffect(() => {
    if (!currentItem) return;
    const letters = makeLetters(currentItem.albanian);
    setPool(scramble(letters));
    setPlaced([]);
    setShaking(false);
    speak(currentItem.albanian);
    return () => { if (failTimer.current) clearTimeout(failTimer.current); };
  }, [roundIdx, items]);

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
    if (!currentItem) return;
    const attempt = placed.map(l => l.char).join('');
    if (attempt === currentItem.albanian) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      setShowBurst(true);
      setScore(s => s + 1);
      advanceGame.current = () => {
        setShowBurst(false);
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx(r => r + 1);
      };
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      setShowFail(true);
      failTimer.current = setTimeout(() => setShowFail(false), 1400);
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        const letters = makeLetters(currentItem.albanian);
        setPool(scramble(letters));
        setPlaced([]);
      }, 650);
    }
  }, [placed, currentItem, roundIdx, activeProfile]);

  function handleReplay() {
    setItems(buildItems());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setShowBurst(false);
    setShowFail(false);
    setShaking(false);
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary score={score} total={ROUNDS} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const allPlaced = currentItem ? placed.length === currentItem.albanian.length : false;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Kthehu</Text>
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

      <Text style={styles.instruction}>Shkruaj fjalën! 👆</Text>
      <Text style={styles.instructionEn}>(Spell the word by tapping the letters!)</Text>

      {/* Placed letters tray */}
      <View style={styles.placedWrap}>
        {placed.length > 0
          ? <PlacedRow letters={placed} onRemove={tapFromPlaced} shaking={shaking} />
          : <Text style={styles.placedPlaceholder}>_ _ _</Text>
        }
      </View>

      {/* Pool letters */}
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
          <Text style={styles.checkBtnText}>Kontrollo! ✅</Text>
        </Pressable>
      </View>

      <FeedbackAnimation type="success" visible={showBurst} onComplete={() => advanceGame.current?.()} />
      <FeedbackAnimation type="fail" visible={showFail} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  backBtn: { padding: Spacing.sm },
  backText: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '600' },
  progress: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.older },
  emojiCard: {
    alignItems: 'center', marginTop: Spacing.sm,
    backgroundColor: Colors.olderLight, marginHorizontal: Spacing.xl,
    borderRadius: Radii.xl, paddingVertical: Spacing.lg,
  },
  hintEmoji: { fontSize: FontSizes.huge },
  speakerBtn: { marginTop: Spacing.sm, padding: Spacing.xs },
  speakerIcon: { fontSize: FontSizes.xl },
  instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.md },
  placedWrap: {
    minHeight: 64, justifyContent: 'center', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    borderWidth: 2, borderRadius: Radii.lg, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.surface,
  },
  placedRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: Spacing.xs },
  placedPlaceholder: { fontSize: FontSizes.xl, color: Colors.border, letterSpacing: 8, fontWeight: '700' },
  poolRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    paddingHorizontal: Spacing.lg, minHeight: 70,
  },
  letterTile: {
    width: 46, height: 46, borderRadius: Radii.md,
    justifyContent: 'center', alignItems: 'center', margin: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3,
  },
  letterChar: { fontSize: FontSizes.lg, fontWeight: '900', color: Colors.textOnPrimary },
  checkWrap: { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg },
  checkBtn: {
    backgroundColor: Colors.older, borderRadius: Radii.full,
    paddingVertical: Spacing.md, alignItems: 'center',
    shadowColor: Colors.older, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  checkBtnDisabled: { opacity: 0.35 },
  checkBtnText: { color: Colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.lg },
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  summaryStars: { fontSize: 48, marginBottom: Spacing.md },
  summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xxl },
  btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
  btnText: { color: Colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
});
