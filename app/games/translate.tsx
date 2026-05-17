import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { Colors, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { VOCABULARY, VocabItem, getRandomItems } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 6;

type Direction = 'alb-to-eng' | 'eng-to-alb';

type TranslateRound = {
  item: VocabItem;
  direction: Direction;
  correct: string;
  choices: string[];
};

function buildRound(item: VocabItem, direction: Direction): TranslateRound {
  const correct = direction === 'alb-to-eng' ? item.english : item.albanian;
  const pool = VOCABULARY
    .filter(v => v.id !== item.id)
    .map(v => direction === 'alb-to-eng' ? v.english : v.albanian);
  const wrongs = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return { item, direction, correct, choices: [correct, ...wrongs].sort(() => Math.random() - 0.5) };
}

function buildGame(): TranslateRound[] {
  const items = getRandomItems(ROUNDS);
  return items.map((item, i) => {
    // Alternate directions so both are practised
    const direction: Direction = i % 2 === 0 ? 'alb-to-eng' : 'eng-to-alb';
    return buildRound(item, direction);
  });
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChoiceTile({ label, state, onPress }: { label: string; state: 'idle' | 'correct' | 'wrong'; onPress: () => void }) {
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (state === 'correct') scale.value = withSpring(1.06, { damping: 8 });
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
  const color = state === 'correct' ? Colors.success : state === 'wrong' ? Colors.error : Colors.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[styles.choiceTile, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityLabel={label}
    >
      <Text style={[styles.choiceLabel, { color }]} adjustsFontSizeToFit numberOfLines={2}>{label}</Text>
    </AnimatedPressable>
  );
}

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const stars = score >= total ? 3 : score >= Math.ceil(total * 0.67) ? 2 : 1;
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

export default function Translate() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();

  const [game, setGame] = useState<TranslateRound[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [choiceStates, setChoiceStates] = useState<Record<string, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const advanceGame = useRef<(() => void) | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = game[roundIdx];

  useEffect(() => {
    setChoiceStates({});
    if (round) speak(round.item.albanian);
    return () => { if (failTimer.current) clearTimeout(failTimer.current); };
  }, [roundIdx, game]);

  useEffect(() => () => stop(), []);

  const handleChoice = useCallback((choice: string) => {
    if (choiceStates[choice]) return;
    const isCorrect = choice === round.correct;
    setChoiceStates(prev => ({ ...prev, [choice]: isCorrect ? 'correct' : 'wrong' }));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      setShowBurst(true);
      setScore(s => s + 1);
      speak(round.item.albanian, 0.85);
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
  }, [round, roundIdx, choiceStates, activeProfile]);

  function handleReplay() {
    setGame(buildGame());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setChoiceStates({});
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

  const isAlbToEng = round.direction === 'alb-to-eng';
  const sourceWord = isAlbToEng ? round.item.albanian : round.item.english;
  const directionLabel = isAlbToEng ? '🇦🇱 → 🇬🇧' : '🇬🇧 → 🇦🇱';

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

      <View style={styles.wordCard}>
        <Text style={styles.directionBadge}>{directionLabel}</Text>
        <Text style={styles.emoji}>{round.item.emoji}</Text>
        <Text style={styles.sourceWord}>{sourceWord}</Text>
        <Pressable onPress={() => speak(round.item.albanian)} style={styles.speakerBtn}>
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
      </View>

      <Text style={styles.instruction}>Përkthe! 💬</Text>
      <Text style={styles.instructionEn}>(Translate the word!)</Text>

      <View style={styles.choicesGrid}>
        {round.choices.map(choice => (
          <ChoiceTile
            key={choice}
            label={choice}
            onPress={() => handleChoice(choice)}
            state={choiceStates[choice] ?? 'idle'}
          />
        ))}
      </View>

      <FeedbackAnimation type="success" visible={showBurst} onComplete={() => advanceGame.current?.()} />
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
  wordCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.sm,
    backgroundColor: Colors.olderLight, borderRadius: Radii.xl,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  directionBadge: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.sm },
  emoji: { fontSize: FontSizes.huge },
  sourceWord: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.older, marginTop: Spacing.sm },
  speakerBtn: { marginTop: Spacing.sm, padding: Spacing.xs },
  speakerIcon: { fontSize: FontSizes.xl },
  instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.md },
  choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  choiceTile: {
    width: '44%', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm,
    borderRadius: Radii.xl, borderWidth: 3, alignItems: 'center', justifyContent: 'center', minHeight: 70,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  choiceLabel: { fontSize: FontSizes.md, fontWeight: '800', textAlign: 'center' },
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  summaryStars: { fontSize: 48, marginBottom: Spacing.md },
  summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xxl },
  btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
  btnText: { color: Colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
});
