import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SummaryCelebration } from '../../src/components/SummaryCelebration';
import { Colors, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { VOCAB_IMAGES } from '../../src/data/vocabImages';
import { VocabItem, getDistractors, getRandomItems } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 5;

type RoundItem = { correct: VocabItem; choices: VocabItem[] };

function buildRound(item: VocabItem): RoundItem {
  const distractors = getDistractors(item, 3);
  while (distractors.length < 3) {
    const extras = getRandomItems(1).filter(
      (v) => v.id !== item.id && !distractors.find((d) => d.id === v.id)
    );
    if (extras.length) distractors.push(extras[0]);
    else break;
  }
  const choices = [item, ...distractors].sort(() => Math.random() - 0.5);
  return { correct: item, choices };
}

function buildGame(): RoundItem[] {
  const items = getRandomItems(ROUNDS);
  return items.map(buildRound);
}

type TileProps = {
  item: VocabItem;
  onPress: () => void;
  state: 'idle' | 'correct' | 'wrong';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChoiceTile({ item, onPress, state }: TileProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'correct') {
      Animated.spring(scale, { toValue: 1.08, damping: 8, useNativeDriver: true }).start();
    } else if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const animStyle = { transform: [{ scale }, { translateX: shakeX }] };

  const bgColor =
    state === 'correct' ? Colors.successLight :
    state === 'wrong' ? Colors.errorLight :
    Colors.surface;

  const borderColor =
    state === 'correct' ? Colors.success :
    state === 'wrong' ? Colors.error :
    Colors.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state === 'correct'}
      style={[styles.tile, animStyle, { backgroundColor: bgColor, borderColor }]}
      accessibilityRole="button"
      accessibilityLabel={item.english}
    >
      {VOCAB_IMAGES[item.id]
        ? <Image source={VOCAB_IMAGES[item.id]} style={styles.tileImage} resizeMode="contain" accessibilityRole="image" />
        : <Text style={styles.tileEmoji}>{item.emoji}</Text>
      }
    </AnimatedPressable>
  );
}

type SummaryProps = {
  score: number;
  total: number;
  onReplay: () => void;
  onHome: () => void;
  profileName?: string;
};

function Summary({ score, total, onReplay, onHome, profileName }: SummaryProps) {
  const stars = score >= total ? 3 : score >= total * 0.6 ? 2 : 1;
  return (
    <View style={styles.summary}>
      <SummaryCelebration />
      <Text style={styles.summaryTitle}>Bravo{profileName ? `, ${profileName}` : ''}! 🎉</Text>
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

export default function PictureMatch() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();

  const [game, setGame] = useState<RoundItem[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [tileStates, setTileStates] = useState<Record<string, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = game[roundIdx];

  useEffect(() => {
    if (round) speak(round.correct.albanian);
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, [roundIdx, game]);

  useEffect(() => {
    if (done) praise();
  }, [done]);

  useEffect(() => { return () => { stop(); }; }, [stop]);

  function resetTiles() {
    setTileStates({});
  }

  const handleChoice = useCallback((item: VocabItem) => {
    if (tileStates[item.id]) return;
    if (Object.values(tileStates).includes('correct')) return;
    const isCorrect = item.id === round.correct.id;
    setTileStates((prev) => ({ ...prev, [item.id]: isCorrect ? 'correct' : 'wrong' }));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScore((s) => s + 1);
      advanceTimer.current = setTimeout(() => {
        resetTiles();
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx((r) => r + 1);
      }, 700);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
    }
  }, [round, roundIdx, tileStates, activeProfile]);

  function handleReplay() {
    setGame(buildGame());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    resetTiles();
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary
          score={score}
          total={ROUNDS}
          onReplay={handleReplay}
          onHome={() => router.replace('/home')}
          profileName={activeProfile?.name}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Kthehu</Text>
        </Pressable>
        <Text style={styles.progress}>{roundIdx + 1} / {ROUNDS}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= roundIdx && styles.dotActive]} />
        ))}
      </View>

      {/* Word card */}
      <View style={styles.wordCard}>
        <Text style={styles.wordAlbanian}>{round.correct.albanian}</Text>
        <Pressable onPress={() => speak(round.correct.albanian)} style={styles.speakerBtn} accessibilityLabel="Hear the word">
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
      </View>

      <Text style={styles.instruction}>Gjej foton e saktë! 👇</Text>
      <Text style={styles.instructionEn}>(Find the correct picture!)</Text>

      {/* 2×2 grid */}
      <View style={styles.grid}>
        {round.choices.map((item) => (
          <ChoiceTile
            key={item.id}
            item={item}
            onPress={() => handleChoice(item)}
            state={tileStates[item.id] ?? 'idle'}
          />
        ))}
      </View>

    </SafeAreaView>
  );
}

const TILE_SIZE = 140;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backBtn: { padding: Spacing.sm },
  backText: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '600' },
  progress: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.young },
  wordCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.youngLight,
    borderRadius: Radii.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  wordAlbanian: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.young },
  speakerBtn: { padding: Spacing.sm },
  speakerIcon: { fontSize: FontSizes.xl },
  instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: Radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tileEmoji: { fontSize: 70 },
  tileImage: { width: TILE_SIZE * 0.75, height: TILE_SIZE * 0.75 },
  // Summary
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  summaryStars: { fontSize: 48, marginBottom: Spacing.md },
  summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xxl },
  btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
  btnText: { color: Colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
});
