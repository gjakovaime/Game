import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { SummaryCelebration } from '../../src/components/SummaryCelebration';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { Sentence, getRandomSentences } from '../../src/data/sentences';
import { VOCABULARY } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 5;

type Round = { sentence: Sentence; blankIdx: number; choices: string[] };

function buildRound(sentence: Sentence): Round {
  const words = sentence.albanian.split(' ');
  const blankIdx = Math.floor(Math.random() * words.length);
  const correct = words[blankIdx].toLowerCase();
  const used = new Set(words.map(w => w.toLowerCase()));
  const wrongs = VOCABULARY
    .map(v => v.albanian)
    .filter(w => !used.has(w.toLowerCase()))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const choices = [correct, ...wrongs].sort(() => Math.random() - 0.5);
  return { sentence, blankIdx, choices };
}

function buildGame(): Round[] {
  return getRandomSentences(ROUNDS).map(buildRound);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChoiceBtn({ word, onPress, state }: { word: string; onPress: () => void; state: 'idle' | 'correct' | 'wrong' }) {
  const colors = useColors();
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const animStyle = { transform: [{ translateX: shakeX }] };
  const bg = state === 'correct' ? colors.successLight : state === 'wrong' ? colors.errorLight : colors.surface;
  const border = state === 'correct' ? colors.success : state === 'wrong' ? colors.error : colors.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[btnStyle.btn, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="button"
      accessibilityLabel={word}
    >
      <Text style={[btnStyle.text, state === 'correct' && { color: colors.success }, state === 'wrong' && { color: colors.error }]}>
        {word}
      </Text>
    </AnimatedPressable>
  );
}

const btnStyle = StyleSheet.create({
  btn: {
    width: '45%', paddingVertical: Spacing.lg, borderRadius: Radii.xl,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  text: { fontSize: FontSizes.lg, fontWeight: '800' },
});

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stars = score >= total ? 3 : score >= Math.ceil(total * 0.6) ? 2 : 1;
  const { recordStars } = useProgress();
  useEffect(() => { recordStars('fill-blank', stars); }, []);

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

export default function FillBlank() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [game, setGame] = useState<Round[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [choiceStates, setChoiceStates] = useState<Record<string, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = game[roundIdx];

  useEffect(() => {
    setChoiceStates({});
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (failTimer.current) clearTimeout(failTimer.current);
    };
  }, [roundIdx, game]);

  useEffect(() => {
    if (done) praise();
  }, [done]);

  useEffect(() => () => stop(), []);

  const handleChoice = useCallback((choice: string) => {
    if (choiceStates[choice]) return;
    if (Object.values(choiceStates).includes('correct')) return;
    const correct = round.sentence.albanian.split(' ')[round.blankIdx].toLowerCase();
    const isCorrect = choice === correct;

    setChoiceStates(prev => ({ ...prev, [choice]: isCorrect ? 'correct' : 'wrong' }));

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      setScore(s => s + 1);
      speak(round.sentence.albanian, 0.85);
      advanceTimer.current = setTimeout(() => {
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx(r => r + 1);
      }, 800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      setShowFail(true);
      failTimer.current = setTimeout(() => setShowFail(false), 1400);
    }
  }, [round, roundIdx, choiceStates]);

  function handleReplay() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (failTimer.current) clearTimeout(failTimer.current);
    setGame(buildGame());
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setChoiceStates({});
    setShowFail(false);
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary score={score} total={ROUNDS} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const { sentence, blankIdx, choices } = round;

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

      <View style={styles.sentenceCard}>
        <View style={styles.sentenceRow}>
          {sentence.albanian.split(' ').map((word, i) => (
            i === blankIdx ? (
              <View key={i} style={styles.blankSlot}>
                <Text style={styles.blankText}>{'_ _ _'}</Text>
              </View>
            ) : (
              <Text key={i} style={styles.sentenceWord}>{word}</Text>
            )
          ))}
        </View>
        <Pressable onPress={() => speak(sentence.albanian)} style={styles.speakerBtn}>
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
      </View>

      <Text style={styles.instruction}>Plotëso fjalinë! 👇</Text>
      <Text style={styles.instructionEn}>(Fill in the missing word!)</Text>

      <View style={styles.choicesGrid}>
        {choices.map((choice) => (
          <ChoiceBtn
            key={choice}
            word={choice}
            onPress={() => handleChoice(choice)}
            state={choiceStates[choice] ?? 'idle'}
          />
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
    sentenceCard: {
      marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
      backgroundColor: colors.olderLight, borderRadius: Radii.xl,
      paddingVertical: Spacing.xl, paddingHorizontal: Spacing.lg, alignItems: 'center',
    },
    sentenceRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
    sentenceWord: { fontSize: FontSizes.xl, fontWeight: '700', color: colors.text },
    blankSlot: {
      borderBottomWidth: 3, borderColor: colors.older,
      paddingHorizontal: Spacing.md, paddingBottom: 2, minWidth: 80, alignItems: 'center',
    },
    blankText: { fontSize: FontSizes.lg, color: colors.older, letterSpacing: 3, fontWeight: '700' },
    speakerBtn: { marginTop: Spacing.md, padding: Spacing.xs },
    speakerIcon: { fontSize: FontSizes.xl },
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
