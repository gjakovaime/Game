import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { Colors, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { MathProblem, generateProblems, getNumber, getWrongAnswers } from '../../src/data/numbers';
import { useProfile } from '../../src/hooks/useProfile';
import { useSpeech } from '../../src/hooks/useSpeech';

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
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (state === 'correct') scale.value = withSpring(1.08, { damping: 8 });
    if (state === 'wrong') {
      shakeX.value = withRepeat(
        withSequence(withTiming(-10, { duration: 55 }), withTiming(10, { duration: 55 })),
        4, true, () => { shakeX.value = 0; }
      );
    }
  }, [state]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
  }));

  const bg = state === 'correct' ? Colors.successLight : state === 'wrong' ? Colors.errorLight : Colors.surface;
  const border = state === 'correct' ? Colors.success : state === 'wrong' ? Colors.error : Colors.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[styles.tile, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityLabel={String(n)}
    >
      <Text style={[styles.tileNum, state === 'correct' && { color: Colors.success }]}>{n}</Text>
      <Text style={[styles.tileWord, state === 'correct' && { color: Colors.success }]}>
        {getNumber(n)?.albanian ?? ''}
      </Text>
    </AnimatedPressable>
  );
}

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const stars = score >= total ? 3 : score >= Math.ceil(total * 0.7) ? 2 : 1;
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

export default function MathChallenge() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();

  const [game, setGame] = useState<Round[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [tileStates, setTileStates] = useState<Record<number, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const advanceGame = useRef<(() => void) | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = game[roundIdx];

  useEffect(() => {
    setTileStates({});
    return () => { if (failTimer.current) clearTimeout(failTimer.current); };
  }, [roundIdx, game]);

  useEffect(() => () => stop(), []);

  const handleAnswer = useCallback((n: number) => {
    if (tileStates[n]) return;
    const isCorrect = n === round.problem.answer;
    setTileStates(prev => ({ ...prev, [n]: isCorrect ? 'correct' : 'wrong' }));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      setShowBurst(true);
      setScore(s => s + 1);
      const word = getNumber(n)?.albanian ?? String(n);
      speak(word);
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
    }
  }, [round, roundIdx, tileStates, activeProfile]);

  function handleReplay() {
    setGame(buildGame());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setTileStates({});
    setShowBurst(false);
    setShowFail(false);
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary score={score} total={ROUNDS} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const { problem, choices } = round;
  const opSymbol = problem.op === '+' ? '+' : '−';

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

      <View style={styles.equationCard}>
        <Text style={styles.equationText}>
          {problem.a} {opSymbol} {problem.b} = ?
        </Text>
        <Text style={styles.equationSub}>
          {getNumber(problem.a)?.albanian} {problem.op === '+' ? 'plus' : 'minus'} {getNumber(problem.b)?.albanian}
        </Text>
      </View>

      <Text style={styles.instruction}>Cila është përgjigjja? 🤔</Text>
      <Text style={styles.instructionEn}>(What is the answer?)</Text>

      <View style={styles.tilesGrid}>
        {choices.map(n => (
          <AnswerTile key={n} n={n} onPress={() => handleAnswer(n)} state={tileStates[n] ?? 'idle'} />
        ))}
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
  equationCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.sm,
    backgroundColor: Colors.olderLight, borderRadius: Radii.xl,
    paddingVertical: Spacing.xl, alignItems: 'center',
  },
  equationText: { fontSize: 48, fontWeight: '900', color: Colors.older, letterSpacing: 2 },
  equationSub: { fontSize: FontSizes.sm, color: Colors.textLight, marginTop: Spacing.sm, fontStyle: 'italic' },
  instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.md },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  tile: {
    width: '44%', paddingVertical: Spacing.lg, borderRadius: Radii.xl,
    borderWidth: 3, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  tileNum: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text },
  tileWord: { fontSize: FontSizes.xs, color: Colors.textLight, marginTop: 2, fontWeight: '600' },
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  summaryStars: { fontSize: 48, marginBottom: Spacing.md },
  summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xxl },
  btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
  btnText: { color: Colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
});
