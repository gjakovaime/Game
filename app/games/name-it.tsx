import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameSummary } from '../../src/components/GameSummary';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { VOCAB_IMAGES } from '../../src/data/vocabImages';
import { VocabItem, getAvailableVocab, getDistractors, getRandomItems } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useWordProgress } from '../../src/hooks/useWordProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useT } from '../../src/hooks/useT';

const ROUNDS = 5;

type Round = { correct: VocabItem; choices: VocabItem[] };

function buildRound(item: VocabItem, vocab: VocabItem[]): Round {
  const distractors = getDistractors(item, 3, vocab);
  return { correct: item, choices: [item, ...distractors].sort(() => Math.random() - 0.5) };
}

function buildGame(): Round[] {
  const vocab = getRandomItems(ROUNDS);
  return vocab.map(item => buildRound(item, vocab));
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function WordChoice({ item, state, onPress }: { item: VocabItem; state: 'idle' | 'correct' | 'wrong'; onPress: () => void }) {
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
  const bg = state === 'correct' ? colors.successLight : state === 'wrong' ? colors.errorLight : colors.surface;
  const border = state === 'correct' ? colors.success : state === 'wrong' ? colors.error : colors.border;
  const textColor = state === 'correct' ? colors.success : state === 'wrong' ? colors.error : colors.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'idle'}
      style={[choiceStyle.btn, animStyle, { backgroundColor: bg, borderColor: border }]}
      accessibilityLabel={item.albanian}
    >
      <Text style={[choiceStyle.text, { color: textColor }]}>{item.albanian}</Text>
    </AnimatedPressable>
  );
}

const choiceStyle = StyleSheet.create({
  btn: {
    width: '44%', paddingVertical: Spacing.xl, borderRadius: Radii.xl,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  text: { fontSize: FontSizes.lg, fontWeight: '800' },
});

export default function NameIt() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars, daysUsed, loaded: progressLoaded } = useProgress();
  const { recordWordResult, getSmartItems } = useWordProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  const [game, setGame] = useState<Round[]>(() => buildGame());
  const [roundIdx, setRoundIdx] = useState(0);
  const [choiceStates, setChoiceStates] = useState<Record<string, 'idle' | 'correct' | 'wrong'>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSmartInit = useRef(false);

  useEffect(() => {
    if (didSmartInit.current || !progressLoaded) return;
    didSmartInit.current = true;
    const vocab = getAvailableVocab(daysUsed);
    setGame(getSmartItems(ROUNDS, vocab).map(item => buildRound(item, vocab)));
  }, [progressLoaded]);

  const round = game[roundIdx];

  useEffect(() => {
    setChoiceStates({});
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, [roundIdx, game]);

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.6) ? 2 : 1;
    recordStars('name-it', stars);
  }, [done]);

  useEffect(() => () => stop(), []);

  const handleChoice = useCallback((item: VocabItem) => {
    if (choiceStates[item.id]) return;
    if (Object.values(choiceStates).includes('correct')) return;
    const isCorrect = item.id === round.correct.id;
    setChoiceStates(prev => ({ ...prev, [item.id]: isCorrect ? 'correct' : 'wrong' }));

    recordWordResult(round.correct.id, isCorrect);
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScore(s => s + 1);
      speak(round.correct.albanian);
      advanceTimer.current = setTimeout(() => {
        setChoiceStates({});
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx(r => r + 1);
      }, 700);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
    }
  }, [round, roundIdx, choiceStates, activeProfile, recordWordResult]);

  function handleReplay() {
    const vocab = getAvailableVocab(daysUsed);
    setGame(getSmartItems(ROUNDS, vocab).map(item => buildRound(item, vocab)));
    setRoundIdx(0);
    setScore(0);
    setDone(false);
    setChoiceStates({});
  }

  if (done) {
    const stars = (score >= ROUNDS ? 3 : score >= Math.ceil(ROUNDS * 0.6) ? 2 : 1) as 1 | 2 | 3;
    return (
      <SafeAreaView style={styles.safe}>
        <GameSummary stars={stars} scoreText={`${score}/${ROUNDS} saktë!`} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  const vocabImage = VOCAB_IMAGES[round.correct.id];

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

      <View style={styles.pictureCard}>
        {vocabImage
          ? <Image source={vocabImage} style={styles.image} resizeMode="contain" />
          : <Text style={styles.emoji}>{round.correct.emoji}</Text>
        }
      </View>

      <Text style={styles.instruction}>{t.games['name-it'].instruction}</Text>
      <Text style={styles.instructionEn}>{t.games['name-it'].hint}</Text>

      <View style={styles.choicesGrid}>
        {round.choices.map(item => (
          <WordChoice
            key={item.id}
            item={item}
            onPress={() => handleChoice(item)}
            state={choiceStates[item.id] ?? 'idle'}
          />
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
    pictureCard: {
      marginHorizontal: Spacing.xl, marginTop: Spacing.sm,
      backgroundColor: colors.youngLight, borderRadius: Radii.xl,
      height: 170, justifyContent: 'center', alignItems: 'center',
    },
    emoji: { fontSize: FontSizes.huge + 16 },
    image: { width: 130, height: 130 },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.lg },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    choicesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  });
}
