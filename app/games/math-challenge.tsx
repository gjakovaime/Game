import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { GameSummary } from '../../src/components/GameSummary';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { MathProblem, generateProblems, getNumber, getWrongAnswers } from '../../src/data/numbers';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useT } from '../../src/hooks/useT';

const ROUNDS = 6;

type Round = { problem: MathProblem; choices: number[] };

function buildGame(): Round[] {
  return generateProblems(ROUNDS).map(problem => {
    const wrongs = getWrongAnswers(problem.answer, 3);
    return { problem, choices: [problem.answer, ...wrongs].sort(() => Math.random() - 0.5) };
  });
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AnswerTile({ n, state, onPress }: { n: number; state: 'idle' | 'correct' | 'wrong'; onPress: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'correct') {
      Animated.spring(scale, { toValue: 1.08, damping: 8, useNativeDriver: true }).start();
    }
    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const animStyle = { transform: [{ scale }, { translateX: shakeX }] };
  const bg = state === 'correct' ? colors.successLight : state === 'wrong' ? colors.errorLight : colors.surface;
  const border = state === 'correct' ? colors.success : state === 'wrong' ? colors.error : colors.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[tileStyle.tile, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityLabel={String(n)}
    >
      <Text style={[tileStyle.num, state === 'correct' && { color: colors.success }]}>{n}</Text>
      <Text style={[tileStyle.word, state === 'correct' && { color: colors.success }]}>
        {getNumber(n)?.albanian ?? ''}
      </Text>
    </AnimatedPressable>
  );
}

const tileStyle = StyleSheet.create({
  tile: {
    width: '44%', paddingVertical: Spacing.lg, borderRadius: Radii.xl,
    borderWidth: 3, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  num: { fontSize: FontSizes.xxl, fontWeight: '900' },
  word: { fontSize: FontSizes.xs, marginTop: 2, fontWeight: '600' },
});

export default function MathChallenge() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars } = useProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  const [game, setGame] = useState<Round[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [tileStates, setTileStates] = useState<Record<number, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = game[roundIdx];

  useEffect(() => {
    setTileStates({});
    return () => {
      if (failTimer.current) clearTimeout(failTimer.current);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [roundIdx, game]);

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.7) ? 2 : 1;
    recordStars('math-challenge', stars);
  }, [done]);

  useEffect(() => () => stop(), []);

  const handleAnswer = useCallback((n: number) => {
    if (tileStates[n]) return;
    if (Object.values(tileStates).includes('correct')) return;
    const isCorrect = n === round.problem.answer;
    setTileStates(prev => ({ ...prev, [n]: isCorrect ? 'correct' : 'wrong' }));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScore(s => s + 1);
      const word = getNumber(n)?.albanian ?? String(n);
      speak(word);
      advanceTimer.current = setTimeout(() => {
        setTileStates({});
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx(r => r + 1);
      }, 700);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      setShowFail(true);
      failTimer.current = setTimeout(() => setShowFail(false), 1400);
    }
  }, [round, roundIdx, tileStates, activeProfile]);

  function handleReplay() {
    setGame(buildGame());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setTileStates({});
    setShowFail(false);
  }

  if (done) {
    const stars = (score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.7) ? 2 : 1) as 1 | 2 | 3;
    return (
      <SafeAreaView style={styles.safe}>
        <GameSummary stars={stars} scoreText={`${score}/${ROUNDS} saktë!`} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const { problem, choices } = round;
  const opSymbol = problem.op === '+' ? '+' : '−';

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

      <View style={styles.equationCard}>
        <Text style={styles.equationText}>
          {problem.a} {opSymbol} {problem.b} = ?
        </Text>
        <Text style={styles.equationSub}>
          {getNumber(problem.a)?.albanian} {problem.op === '+' ? 'plus' : 'minus'} {getNumber(problem.b)?.albanian}
        </Text>
      </View>

      <Text style={styles.instruction}>{t.games['math-challenge'].instruction}</Text>
      <Text style={styles.instructionEn}>{t.games['math-challenge'].hint}</Text>

      <View style={styles.tilesGrid}>
        {choices.map(n => (
          <AnswerTile key={n} n={n} onPress={() => handleAnswer(n)} state={tileStates[n] ?? 'idle'} />
        ))}
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
    equationCard: {
      marginHorizontal: Spacing.xl, marginTop: Spacing.sm,
      backgroundColor: colors.olderLight, borderRadius: Radii.xl,
      paddingVertical: Spacing.xl, alignItems: 'center',
    },
    equationText: { fontSize: 48, fontWeight: '900', color: colors.older, letterSpacing: 2 },
    equationSub: { fontSize: FontSizes.sm, color: colors.textLight, marginTop: Spacing.sm, fontStyle: 'italic' },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.lg },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  });
}
