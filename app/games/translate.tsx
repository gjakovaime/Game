import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { SummaryCelebration } from '../../src/components/SummaryCelebration';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { VocabItem, getAvailableVocab, getRandomItems } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useWordProgress } from '../../src/hooks/useWordProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 6;

type Direction = 'alb-to-eng' | 'eng-to-alb';

type TranslateRound = {
  item: VocabItem;
  direction: Direction;
  correct: string;
  choices: string[];
};

function buildRound(item: VocabItem, direction: Direction, vocab: VocabItem[]): TranslateRound {
  const correct = direction === 'alb-to-eng' ? item.english : item.albanian;
  const pool = vocab
    .filter(v => v.id !== item.id)
    .map(v => direction === 'alb-to-eng' ? v.english : v.albanian);
  const wrongs = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return { item, direction, correct, choices: [correct, ...wrongs].sort(() => Math.random() - 0.5) };
}

function buildGame(items: VocabItem[], vocab: VocabItem[]): TranslateRound[] {
  return items.map((item, i) => {
    const direction: Direction = i % 2 === 0 ? 'alb-to-eng' : 'eng-to-alb';
    return buildRound(item, direction, vocab);
  });
}

function buildFallbackGame(): TranslateRound[] {
  const vocab = getRandomItems(20);
  return buildGame(vocab.slice(0, ROUNDS), vocab);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ChoiceTile({ label, state, onPress }: { label: string; state: 'idle' | 'correct' | 'wrong'; onPress: () => void }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'correct') {
      Animated.spring(scale, { toValue: 1.06, damping: 8, useNativeDriver: true }).start();
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
  const color = state === 'correct' ? colors.success : state === 'wrong' ? colors.error : colors.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[choiceTileStyles.tile, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityLabel={label}
    >
      <Text style={[choiceTileStyles.label, { color }]} adjustsFontSizeToFit numberOfLines={2}>{label}</Text>
    </AnimatedPressable>
  );
}

const choiceTileStyles = StyleSheet.create({
  tile: {
    width: '44%', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm,
    borderRadius: Radii.xl, borderWidth: 3, alignItems: 'center', justifyContent: 'center', minHeight: 70,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  label: { fontSize: FontSizes.md, fontWeight: '800', textAlign: 'center' },
});

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const colors = useColors();
  const styles = useMemo(() => makeSumStyles(colors), [colors]);
  const stars = score >= total ? 3 : score >= Math.ceil(total * 0.67) ? 2 : 1;
  const { recordStars } = useProgress();
  useEffect(() => { recordStars('translate', stars); }, []);

  return (
    <View style={styles.wrap}>
      <SummaryCelebration />
      <Text style={styles.title}>Bravo{name ? `, ${name}` : ''}! 🎉</Text>
      <Text style={styles.stars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={styles.score}>{score}/{total} saktë!</Text>
      <Pressable style={[styles.btn, { backgroundColor: colors.secondary }]} onPress={onReplay}>
        <Text style={styles.btnText}>Luaj përsëri! 🔄</Text>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: colors.primary, marginTop: Spacing.md }]} onPress={onHome}>
        <Text style={styles.btnText}>Shko në shtëpi 🏠</Text>
      </Pressable>
    </View>
  );
}

function makeSumStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    title: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.text, marginBottom: Spacing.md, textAlign: 'center' },
    stars: { fontSize: 48, marginBottom: Spacing.md },
    score: { fontSize: FontSizes.xl, fontWeight: '700', color: colors.textLight, marginBottom: Spacing.xxl },
    btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
    btnText: { color: colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
  });
}

export default function Translate() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, speakEnglish, praise, stop, mistake } = useSpeech();
  const { daysUsed, loaded: progressLoaded } = useProgress();
  const { recordWordResult, getSmartItems } = useWordProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [game, setGame] = useState<TranslateRound[]>(() => buildFallbackGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [choiceStates, setChoiceStates] = useState<Record<string, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSmartInit = useRef(false);

  useEffect(() => {
    if (didSmartInit.current || !progressLoaded) return;
    didSmartInit.current = true;
    const vocab = getAvailableVocab(daysUsed);
    setGame(buildGame(getSmartItems(ROUNDS, vocab), vocab));
  }, [progressLoaded]);

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
    const isCorrect = choice === round.correct;
    setChoiceStates(prev => ({ ...prev, [choice]: isCorrect ? 'correct' : 'wrong' }));
    recordWordResult(round.item.id, isCorrect);

    if (isCorrect) {
      setScore(s => s + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      if (round.direction === 'alb-to-eng') {
        speakEnglish(round.correct, 0.9);
      } else {
        speak(round.correct, 0.85);
      }
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
  }, [round, roundIdx, choiceStates, recordWordResult]);

  function handleReplay() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (failTimer.current) clearTimeout(failTimer.current);
    const vocab = getAvailableVocab(daysUsed);
    setGame(buildGame(getSmartItems(ROUNDS, vocab), vocab));
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
        <Pressable onPress={() => isAlbToEng ? speak(round.item.albanian) : speakEnglish(round.item.english)} style={styles.speakerBtn}>
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
    wordCard: {
      marginHorizontal: Spacing.xl, marginTop: Spacing.sm,
      backgroundColor: colors.olderLight, borderRadius: Radii.xl,
      paddingVertical: Spacing.lg, alignItems: 'center',
    },
    directionBadge: { fontSize: FontSizes.md, fontWeight: '700', color: colors.textLight, marginBottom: Spacing.sm },
    emoji: { fontSize: FontSizes.huge },
    sourceWord: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.older, marginTop: Spacing.sm },
    speakerBtn: { marginTop: Spacing.sm, padding: Spacing.xs },
    speakerIcon: { fontSize: FontSizes.xl },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.lg },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  });
}
