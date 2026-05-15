import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { Colors, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { VOCABULARY, VocabItem } from '../../src/data/vocabulary';
import { useProfile } from '../../src/hooks/useProfile';
import { useSpeech } from '../../src/hooks/useSpeech';

const TOTAL = 15;

const CAT_META = {
  animals: { label: 'Kafshë',  emoji: '🐾', color: '#FF8A65' },
  fruit:   { label: 'Fruta',   emoji: '🍎', color: '#4CAF50' },
  colors:  { label: 'Ngjyra',  emoji: '🎨', color: '#2196F3' },
  family:  { label: 'Familja', emoji: '👨‍👩‍👧', color: '#9C27B0' },
} as const;

type CatId = keyof typeof CAT_META;

function buildQueue(): VocabItem[] {
  return [...VOCABULARY].sort(() => Math.random() - 0.5).slice(0, TOTAL);
}

function Summary({ score, total, onReplay, onHome, name }: {
  score: number; total: number; onReplay: () => void; onHome: () => void; name?: string;
}) {
  const stars = score >= Math.ceil(total * 0.9) ? 3 : score >= Math.ceil(total * 0.6) ? 2 : 1;
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

export default function CategorySort() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop } = useSpeech();

  const [queue, setQueue] = useState<VocabItem[]>(() => buildQueue());
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState<{ catId: string; ok: boolean } | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const locked = useRef(false);

  const item = queue[idx];

  useEffect(() => {
    if (item) speak(item.albanian);
  }, [idx, queue]);

  useEffect(() => () => stop(), []);

  const handle = useCallback((catId: CatId) => {
    if (locked.current || !item) return;
    locked.current = true;
    const ok = item.category === catId;
    setFlash({ catId, ok });
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      praise(activeProfile?.name);
      setShowBurst(true);
      setScore(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setShowFail(true);
    }
    setTimeout(() => {
      setFlash(null);
      setShowBurst(false);
      setShowFail(false);
      if (idx + 1 >= TOTAL) setDone(true);
      else setIdx(i => i + 1);
      locked.current = false;
    }, ok ? 1200 : 900);
  }, [item, idx, activeProfile]);

  function handleReplay() {
    setQueue(buildQueue());
    setIdx(0);
    setScore(0);
    setDone(false);
    setFlash(null);
    setShowBurst(false);
    setShowFail(false);
    locked.current = false;
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary score={score} total={TOTAL} onReplay={handleReplay} onHome={() => router.replace('/home')} name={activeProfile?.name} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Kthehu</Text>
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

      <Text style={styles.instruction}>Ku i takon? 👇</Text>
      <Text style={styles.instructionEn}>(Which category does it belong to?)</Text>

      <View style={styles.catGrid}>
        {(Object.entries(CAT_META) as [CatId, typeof CAT_META[CatId]][]).map(([catId, meta]) => {
          const isFlashed = flash?.catId === catId;
          const bg = isFlashed ? (flash!.ok ? Colors.successLight : Colors.errorLight) : `${meta.color}18`;
          const border = isFlashed ? (flash!.ok ? Colors.success : Colors.error) : meta.color;
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

      <FeedbackAnimation type="success" visible={showBurst} />
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
  wordCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: Radii.xl,
    paddingVertical: Spacing.xl, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  itemEmoji: { fontSize: FontSizes.huge },
  itemWord: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, marginTop: Spacing.sm },
  speakerBtn: { marginTop: Spacing.sm, padding: Spacing.xs },
  speakerIcon: { fontSize: FontSizes.xl },
  instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginTop: Spacing.lg },
  instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.md },
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
  // Summary
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  summaryTitle: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  summaryStars: { fontSize: 48, marginBottom: Spacing.md },
  summaryScore: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xxl },
  btn: { borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
  btnText: { color: Colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
});
