import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SummaryCelebration } from '../../src/components/SummaryCelebration';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { MATH_CONFIG, getNumber, getWrongAnswers } from '../../src/data/numbers';
import { VOCABULARY } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 6;

type CountRound = { count: number; emoji: string; choices: number[] };

function buildRound(): CountRound {
  const count = Math.floor(Math.random() * (MATH_CONFIG.countMax - MATH_CONFIG.countMin + 1)) + MATH_CONFIG.countMin;
  const item = VOCABULARY[Math.floor(Math.random() * VOCABULARY.length)];
  const wrongs = getWrongAnswers(count, 3);
  return { count, emoji: item.emoji, choices: [count, ...wrongs].sort(() => Math.random() - 0.5) };
}

function buildGame(): CountRound[] {
  return Array.from({ length: ROUNDS }, buildRound);
}

function EmojiGrid({ emoji, count }: { emoji: string; count: number }) {
  const size = count <= 4 ? 54 : count <= 7 ? 44 : 34;
  return (
    <View style={gridStyles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <Text key={i} style={[gridStyles.emoji, { fontSize: size, lineHeight: size + 10 }]}>{emoji}</Text>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', padding: Spacing.md },
  emoji: { margin: 4 },
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NumberChoice({ n, state, onPress }: { n: number; state: 'idle' | 'correct' | 'wrong'; onPress: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'correct') {
      Animated.spring(scale, { toValue: 1.06, damping: 8, useNativeDriver: true }).start();
    }
    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const animStyle = { transform: [{ scale }, { translateX: shakeX }] };
  const numberItem = getNumber(n);
  const bg = state === 'correct' ? colors.successLight : state === 'wrong' ? colors.errorLight : colors.surface;
  const border = state === 'correct' ? colors.success : state === 'wrong' ? colors.error : colors.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[choiceStyle.tile, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityLabel={String(n)}
    >
      <Text style={[choiceStyle.numeral, state === 'correct' && { color: colors.success }]}>{n}</Text>
      {numberItem && <Text style={[choiceStyle.albanianNum, state === 'correct' && { color: colors.success }]}>{numberItem.albanian}</Text>}
    </AnimatedPressable>
  );
}

const choiceStyle = StyleSheet.create({
  tile: {
    width: '44%', paddingVertical: Spacing.lg, borderRadius: Radii.xl,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  numeral: { fontSize: FontSizes.xxl, fontWeight: '900' },
  albanianNum: { fontSize: FontSizes.sm, fontWeight: '600', marginTop: 2 },
});

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stars = score >= total ? 3 : score >= Math.ceil(total * 0.7) ? 2 : 1;
  return (
    <View style={styles.summary}>
      <SummaryCelebration />
      <Text style={styles.summaryTitle}>Bravo{name ? `, ${name}` : ''}! 🎉</Text>
      <Text style={styles.summaryStars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={styles.summaryScore}>{score}/{total} saktë!</Text>
      <Pressable style={[styles.btn, { backgroundColor: colors.secondary }]} onPress={onReplay}>
        <Text style={styles.btnText}>Luaj përsëri! 🔄</Text>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: colors.primary, marginTop: Spacing.md }]} onPress={onHome}>
        <Text style={styles.btnText}>Shko në shtëpi 🏠</Text>
      </Pressable>
    </View>
  );
}

export default function CountMatch() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars } = useProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [game, setGame] = useState<CountRound[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [choiceStates, setChoiceStates] = useState<Record<number, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = game[roundIdx];

  useEffect(() => {
    setChoiceStates({});
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, [roundIdx, game]);

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.7) ? 2 : 1;
    recordStars('count-match', stars);
  }, [done]);

  useEffect(() => () => stop(), []);

  const handleChoice = useCallback((n: number) => {
    if (choiceStates[n]) return;
    if (Object.values(choiceStates).includes('correct')) return;
    const isCorrect = n === round.count;
    setChoiceStates(prev => ({ ...prev, [n]: isCorrect ? 'correct' : 'wrong' }));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScore(s => s + 1);
      const word = getNumber(n)?.albanian ?? String(n);
      speak(word);
      advanceTimer.current = setTimeout(() => {
        setChoiceStates({});
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx(r => r + 1);
      }, 700);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
    }
  }, [round, roundIdx, choiceStates, activeProfile]);

  function handleReplay() {
    setGame(buildGame());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setChoiceStates({});
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary score={score} total={ROUNDS} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

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

      <View style={styles.countCard}>
        <EmojiGrid emoji={round.emoji} count={round.count} />
      </View>

      <Text style={styles.instruction}>Sa ka? 🔢</Text>
      <Text style={styles.instructionEn}>(How many are there?)</Text>

      <View style={styles.choicesGrid}>
        {round.choices.map(n => (
          <NumberChoice key={n} n={n} onPress={() => handleChoice(n)} state={choiceStates[n] ?? 'idle'} />
        ))}
      </View>
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
    dotActive: { backgroundColor: colors.young },
    countCard: {
      marginHorizontal: Spacing.xl, marginTop: Spacing.sm,
      backgroundColor: colors.youngLight, borderRadius: Radii.xl,
      minHeight: 160, justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.lg },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
    summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.text, marginBottom: Spacing.md, textAlign: 'center' },
    summaryStars: { fontSize: 48, marginBottom: Spacing.md },
    summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: colors.textLight, marginBottom: Spacing.xxl },
    btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
    btnText: { color: colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
  });
}
