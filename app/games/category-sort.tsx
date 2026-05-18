import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameSummary } from '../../src/components/GameSummary';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { VocabItem, getAvailableVocab } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useWordProgress } from '../../src/hooks/useWordProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useT } from '../../src/hooks/useT';

const TOTAL = 15;

const CAT_META = {
  animals: { label: 'Kafshë',  emoji: '🐾', color: '#FF8A65' },
  fruit:   { label: 'Fruta',   emoji: '🍎', color: '#4CAF50' },
  colors:  { label: 'Ngjyra',  emoji: '🎨', color: '#2196F3' },
  family:  { label: 'Familja', emoji: '👨‍👩‍👧', color: '#9C27B0' },
} as const;

type CatId = keyof typeof CAT_META;

function buildQueue(items: VocabItem[]): VocabItem[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, TOTAL);
}

export default function CategorySort() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars, daysUsed, loaded: progressLoaded } = useProgress();
  const { recordWordResult, getSmartItems } = useWordProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  const [queue, setQueue] = useState<VocabItem[]>(() => buildQueue(getAvailableVocab(0)));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState<{ catId: string; ok: boolean } | null>(null);
  const locked = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didSmartInit = useRef(false);

  useEffect(() => {
    if (didSmartInit.current || !progressLoaded) return;
    didSmartInit.current = true;
    const vocab = getAvailableVocab(daysUsed);
    setQueue(getSmartItems(TOTAL, vocab));
  }, [progressLoaded]);

  const item = queue[idx];

  useEffect(() => {
    if (item) speak(item.albanian);
  }, [idx, queue]);

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = score >= Math.ceil(TOTAL * 0.9) ? 3 : score >= Math.ceil(TOTAL * 0.6) ? 2 : 1;
    recordStars('category-sort', stars);
  }, [done]);

  useEffect(() => () => stop(), []);

  const handle = useCallback((catId: CatId) => {
    if (locked.current || !item) return;
    locked.current = true;
    const ok = item.category === catId;
    recordWordResult(item.id, ok);
    setFlash({ catId, ok });
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScore(s => s + 1);
      advanceTimer.current = setTimeout(() => {
        setFlash(null);
        if (idx + 1 >= TOTAL) setDone(true);
        else setIdx(i => i + 1);
        locked.current = false;
      }, 700);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      advanceTimer.current = setTimeout(() => {
        setFlash(null);
        if (idx + 1 >= TOTAL) setDone(true);
        else setIdx(i => i + 1);
        locked.current = false;
      }, 900);
    }
  }, [item, idx, activeProfile, recordWordResult]);

  function handleReplay() {
    const vocab = getAvailableVocab(daysUsed);
    setQueue(getSmartItems(TOTAL, vocab));
    setIdx(0);
    setScore(0);
    setDone(false);
    setFlash(null);
    locked.current = false;
  }

  if (done) {
    const stars = (score >= Math.ceil(TOTAL * 0.9) ? 3 : score >= Math.ceil(TOTAL * 0.6) ? 2 : 1) as 1 | 2 | 3;
    return (
      <SafeAreaView style={styles.safe}>
        <GameSummary stars={stars} scoreText={`${score}/${TOTAL} saktë!`} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{t.back}</Text>
        </Pressable>
        <Text style={styles.progress}>{idx + 1} / {TOTAL}</Text>
      </View>

      <View style={styles.wordCard}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <Text style={styles.itemWord}>{item.albanian}</Text>
        <Pressable onPress={() => speak(item.albanian)} style={styles.speakerBtn}>
          <Text style={styles.speakerIcon}>🔊</Text>
        </Pressable>
      </View>

      <Text style={styles.instruction}>{t.games['category-sort'].instruction}</Text>
      <Text style={styles.instructionEn}>{t.games['category-sort'].hint}</Text>

      <View style={styles.catGrid}>
        {(Object.entries(CAT_META) as [CatId, typeof CAT_META[CatId]][]).map(([catId, meta]) => {
          const isFlashed = flash?.catId === catId;
          const bg = isFlashed ? (flash!.ok ? colors.successLight : colors.errorLight) : `${meta.color}18`;
          const border = isFlashed ? (flash!.ok ? colors.success : colors.error) : meta.color;
          return (
            <Pressable
              key={catId}
              onPress={() => handle(catId)}
              style={[styles.catBtn, { backgroundColor: bg, borderColor: border }]}
              accessibilityLabel={meta.label}
            >
              <Text style={styles.catBtnEmoji}>{meta.emoji}</Text>
              <Text style={[styles.catBtnLabel, { color: meta.color }]}>{meta.label}</Text>
            </Pressable>
          );
        })}
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
    wordCard: {
      marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
      backgroundColor: colors.surface, borderRadius: Radii.xl,
      paddingVertical: Spacing.xl, alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
    },
    itemEmoji: { fontSize: FontSizes.huge },
    itemWord: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.text, marginTop: Spacing.sm },
    speakerBtn: { marginTop: Spacing.sm, padding: Spacing.xs },
    speakerIcon: { fontSize: FontSizes.xl },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginTop: Spacing.lg },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
    catGrid: {
      flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
      paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.sm,
    },
    catBtn: {
      width: '45%', paddingVertical: Spacing.xl, borderRadius: Radii.xl,
      borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    },
    catBtnEmoji: { fontSize: 40 },
    catBtnLabel: { fontSize: FontSizes.md, fontWeight: '800', marginTop: Spacing.sm },
  });
}
