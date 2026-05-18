import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameSummary } from '../../src/components/GameSummary';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { VOCAB_IMAGES } from '../../src/data/vocabImages';
import { VocabItem, getAvailableVocab, getRandomItems } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useWordProgress } from '../../src/hooks/useWordProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useT } from '../../src/hooks/useT';

const PAIR_COUNT = 6;
const COLS = 3;
const ROWS = (PAIR_COUNT * 2) / COLS;

type CardData = { id: string; pairId: string; type: 'word' | 'emoji'; item: VocabItem };
type CardState = 'hidden' | 'flipped' | 'matched';

function buildCards(items: VocabItem[]): CardData[] {
  const cards: CardData[] = [];
  for (const item of items) {
    cards.push({ id: `${item.id}-word`,  pairId: item.id, type: 'word',  item });
    cards.push({ id: `${item.id}-emoji`, pairId: item.id, type: 'emoji', item });
  }
  return cards.sort(() => Math.random() - 0.5);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function MemoryCard({ card, state, onPress, cardSize }: { card: CardData; state: CardState; onPress: () => void; cardSize: number }) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const prevRevealed = useRef(false);
  const isRevealed = state !== 'hidden';

  useEffect(() => {
    if (isRevealed && !prevRevealed.current) {
      scale.setValue(0.75);
      Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }).start();
    }
    prevRevealed.current = isRevealed;
  }, [isRevealed]);

  const animStyle = { transform: [{ scale }] };
  const bg = state === 'matched' ? colors.successLight : isRevealed ? colors.surface : colors.youngLight;
  const border = state === 'matched' ? colors.success : isRevealed ? colors.young : colors.border;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={state !== 'hidden'}
      style={[cardStyle.card, animStyle, { width: cardSize, height: cardSize, backgroundColor: bg, borderColor: border }]}
      accessibilityRole="button"
      accessibilityLabel={isRevealed ? (card.type === 'emoji' ? card.item.english : card.item.albanian) : 'hidden card'}
    >
      {isRevealed ? (
        card.type === 'emoji' ? (
          VOCAB_IMAGES[card.item.id]
            ? <Image source={VOCAB_IMAGES[card.item.id]} style={{ width: cardSize * 0.65, height: cardSize * 0.65 }} resizeMode="contain" />
            : <Text style={{ fontSize: cardSize * 0.42 }}>{card.item.emoji}</Text>
        ) : (
          <Text style={[cardStyle.cardWord, { fontSize: Math.max(cardSize * 0.17, 10), color: colors.text }]} adjustsFontSizeToFit numberOfLines={2}>{card.item.albanian}</Text>
        )
      ) : (
        <Text style={{ fontSize: cardSize * 0.38 }}>🎴</Text>
      )}
    </AnimatedPressable>
  );
}

const cardStyle = StyleSheet.create({
  card: {
    borderRadius: Radii.lg, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  cardWord: { fontWeight: '800', textAlign: 'center', paddingHorizontal: 4 },
});

export default function MemoryMatch() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars, daysUsed, loaded: progressLoaded } = useProgress();
  const { recordWordResult, getSmartItems } = useWordProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  const [cards, setCards] = useState<CardData[]>(() => buildCards(getRandomItems(PAIR_COUNT)));
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [done, setDone] = useState(false);
  const [gridSize, setGridSize] = useState({ w: 0, h: 0 });
  const locked = useRef(false);
  const matchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSmartInit = useRef(false);

  useEffect(() => {
    if (didSmartInit.current || !progressLoaded) return;
    didSmartInit.current = true;
    const vocab = getAvailableVocab(daysUsed);
    setCards(buildCards(getSmartItems(PAIR_COUNT, vocab)));
  }, [progressLoaded]);

  const cardSize = gridSize.w > 0
    ? Math.floor(Math.min(
        (gridSize.w - Spacing.lg * 2 - Spacing.sm * (COLS - 1)) / COLS,
        (gridSize.h - Spacing.xs * 2 - Spacing.sm * (ROWS - 1)) / ROWS,
      ))
    : 80;

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = moves <= PAIR_COUNT + 2 ? 3 : moves <= PAIR_COUNT * 2 ? 2 : 1;
    recordStars('memory-match', stars);
  }, [done]);

  useEffect(() => {
    return () => {
      stop();
      if (matchTimer.current) clearTimeout(matchTimer.current);
    };
  }, []);

  const handleCard = useCallback((card: CardData) => {
    if (locked.current) return;
    if (cardStates[card.id] === 'matched') return;
    if (flipped.includes(card.id)) return;

    const newFlipped = [...flipped, card.id];
    setCardStates(prev => ({ ...prev, [card.id]: 'flipped' }));
    setFlipped(newFlipped);

    if (newFlipped.length < 2) {
      speak(card.item.albanian);
      return;
    }

    locked.current = true;
    setMoves(m => m + 1);
    const [a, b] = newFlipped;
    const cardA = cards.find(c => c.id === a)!;
    const cardB = cards.find(c => c.id === b)!;

    if (cardA.pairId === cardB.pairId) {
      recordWordResult(cardA.item.id, true);
      const newMatches = matches + 1;
      setMatches(newMatches);
      setCardStates(prev => ({ ...prev, [a]: 'matched', [b]: 'matched' }));
      setFlipped([]);
      speak(card.item.albanian);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise();
      matchTimer.current = setTimeout(() => {
        if (newMatches >= PAIR_COUNT) setDone(true);
        locked.current = false;
      }, 600);
    } else {
      speak(card.item.albanian);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      mistake();
      matchTimer.current = setTimeout(() => {
        setCardStates(prev => ({ ...prev, [a]: 'hidden', [b]: 'hidden' }));
        setFlipped([]);
        locked.current = false;
      }, 900);
    }
  }, [cards, cardStates, flipped, matches, speak, praise, mistake, recordWordResult]);

  function handleReplay() {
    if (matchTimer.current) clearTimeout(matchTimer.current);
    const vocab = getAvailableVocab(daysUsed);
    setCards(buildCards(getSmartItems(PAIR_COUNT, vocab)));
    setCardStates({});
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setDone(false);
    locked.current = false;
  }

  if (done) {
    const stars = (moves <= PAIR_COUNT + 2 ? 3 : moves <= PAIR_COUNT * 2 ? 2 : 1) as 1 | 2 | 3;
    return (
      <SafeAreaView style={styles.safe}>
        <GameSummary stars={stars} scoreText={`${moves} lëvizje!`} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t.back}</Text>
        </Pressable>
        <Text style={styles.stats}>{matches}/{PAIR_COUNT} çifte  •  {moves} 🔄</Text>
      </View>

      <Text style={styles.instruction}>{t.games['memory-match'].instruction}</Text>
      <Text style={styles.instructionEn}>{t.games['memory-match'].hint}</Text>

      <View
        style={styles.grid}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          setGridSize({ w: width, h: height });
        }}
      >
        {cards.map(card => (
          <MemoryCard
            key={card.id}
            card={card}
            state={cardStates[card.id] ?? 'hidden'}
            onPress={() => handleCard(card)}
            cardSize={cardSize}
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
    stats: { fontSize: FontSizes.sm, color: colors.textLight, fontWeight: '700' },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.md },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    grid: {
      flex: 1, flexDirection: 'row', flexWrap: 'wrap',
      justifyContent: 'center', alignContent: 'center',
      gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
    },
  });
}
