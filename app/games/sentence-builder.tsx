import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneIllustration } from '../../src/components/SceneIllustration';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { WordTile } from '../../src/components/WordTile';
import { Colors, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { Sentence, getRandomSentences } from '../../src/data/sentences';
import { useProfile } from '../../src/hooks/useProfile';
import { useSpeech } from '../../src/hooks/useSpeech';

const ROUNDS = 5;

// ─── Instructions modal ───────────────────────────────────────────────────────

function InstructionsModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={iStyles.overlay}>
        <View style={iStyles.card}>
          <Text style={iStyles.header}>Si luhet? 🤔</Text>
          <Text style={iStyles.subEn}>(How do you play?)</Text>

          {[
            { emoji: '👀', albanian: 'Shiko foton!', english: 'Look at the picture!' },
            { emoji: '👆', albanian: 'Trokitni fjalët!', english: 'Tap the words!' },
            { emoji: '🧩', albanian: 'Bëni fjalinë!', english: 'Make the sentence!' },
            { emoji: '⭐', albanian: 'Kontrollo dhe shih!', english: 'Check and see!' },
          ].map((step, i) => (
            <View key={i} style={iStyles.step}>
              <Text style={iStyles.stepNum}>{i + 1}</Text>
              <Text style={iStyles.stepEmoji}>{step.emoji}</Text>
              <View style={iStyles.stepText}>
                <Text style={iStyles.stepAlb}>{step.albanian}</Text>
                <Text style={iStyles.stepEn}>{step.english}</Text>
              </View>
            </View>
          ))}

          <Pressable style={iStyles.btn} onPress={onDismiss}>
            <Text style={iStyles.btnText}>Hajde! 🚀</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const iStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  card: { backgroundColor: Colors.surface, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', maxWidth: 420 },
  header: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: 2 },
  subEn: { fontSize: FontSizes.sm, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.lg },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  stepNum: {
    width: 28, height: 28, borderRadius: Radii.full,
    backgroundColor: Colors.older, color: Colors.textOnPrimary,
    textAlign: 'center', lineHeight: 28, fontWeight: '900', fontSize: FontSizes.sm,
    marginRight: Spacing.sm,
  },
  stepEmoji: { fontSize: 28, marginRight: Spacing.sm },
  stepText: { flex: 1 },
  stepAlb: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  stepEn: { fontSize: FontSizes.xs, color: Colors.textLight },
  btn: {
    backgroundColor: Colors.older, borderRadius: Radii.full,
    paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  btnText: { color: Colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.lg },
});

// ─── Answer tray ──────────────────────────────────────────────────────────────

type TrayProps = {
  placed: string[];
  totalSlots: number;
  onRemove: (index: number) => void;
  flashColor?: string | null;
};

function AnswerTray({ placed, totalSlots, onRemove, flashColor }: TrayProps) {
  const borderColor = useSharedValue(Colors.border);

  useEffect(() => {
    if (flashColor) {
      borderColor.value = withSequence(
        withTiming(flashColor, { duration: 100 }),
        withTiming(flashColor, { duration: 600 }),
        withTiming(Colors.border, { duration: 300 }),
      );
    }
  }, [flashColor]);

  const animStyle = useAnimatedStyle(() => ({ borderColor: borderColor.value }));

  return (
    <Animated.View style={[trayStyles.tray, animStyle]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={trayStyles.scroll}>
        {Array.from({ length: totalSlots }).map((_, i) => {
          const word = placed[i];
          return word ? (
            <WordTile key={`placed-${i}`} word={word} onPress={() => onRemove(i)} variant="placed" />
          ) : (
            <WordTile key={`slot-${i}`} word="   " onPress={() => {}} variant="slot" />
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const trayStyles = StyleSheet.create({
  tray: {
    borderWidth: 2,
    borderRadius: Radii.lg,
    minHeight: 56,
    paddingVertical: Spacing.xs,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  scroll: { paddingHorizontal: Spacing.sm, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
});

// ─── Summary ──────────────────────────────────────────────────────────────────

function Summary({
  score, total, firstAttemptCount, onReplay, onHome, profileName,
}: {
  score: number; total: number; firstAttemptCount: number;
  onReplay: () => void; onHome: () => void; profileName?: string;
}) {
  const stars = firstAttemptCount >= total ? 3 : firstAttemptCount >= total * 0.6 ? 2 : 1;
  return (
    <View style={sumStyles.wrap}>
      <Text style={sumStyles.title}>Bravo{profileName ? `, ${profileName}` : ''}! 🎉</Text>
      <Text style={sumStyles.stars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={sumStyles.score}>{score}/{total} herë saktë!</Text>
      <Pressable style={[sumStyles.btn, { backgroundColor: Colors.secondary }]} onPress={onReplay}>
        <Text style={sumStyles.btnText}>Luaj përsëri! 🔄</Text>
      </Pressable>
      <Pressable style={[sumStyles.btn, { backgroundColor: Colors.primary, marginTop: Spacing.md }]} onPress={onHome}>
        <Text style={sumStyles.btnText}>Shko në shtëpi 🏠</Text>
      </Pressable>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  title: { fontSize: FontSizes.xxl, fontWeight: '900', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  stars: { fontSize: 48, marginBottom: Spacing.md },
  score: { fontSize: FontSizes.xl, fontWeight: '700', color: Colors.textLight, marginBottom: Spacing.xxl },
  btn: { borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
  btnText: { color: Colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SentenceBuilder() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();

  const [showInstructions, setShowInstructions] = useState(true);
  const [sentences, setSentences] = useState<Sentence[]>(() => getRandomSentences(ROUNDS));
  const [roundIdx, setRoundIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [score, setScore] = useState(0);
  const [firstAttemptCount, setFirstAttemptCount] = useState(0);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceGame = useRef<(() => void) | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sentence = sentences[roundIdx];

  function initRound(s: Sentence) {
    setPlaced([]);
    setPool([...s.words].sort(() => Math.random() - 0.5));
    setIsFirstAttempt(true);
    setFlashColor(null);
    setShowBurst(false);
  }

  useEffect(() => {
    if (sentence) initRound(sentence);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (failTimer.current) clearTimeout(failTimer.current);
    };
  }, [roundIdx, sentences]);

  useEffect(() => { return () => { stop(); }; }, [stop]);

  function showToast(msg: string, duration = 1800) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), duration);
  }

  function tapFromPool(word: string, poolIdx: number) {
    setPool((p) => p.filter((_, i) => i !== poolIdx));
    setPlaced((prev) => [...prev, word]);
  }

  function removeFromPlaced(placedIdx: number) {
    const word = placed[placedIdx];
    setPlaced((p) => p.filter((_, i) => i !== placedIdx));
    setPool((p) => [...p, word]);
  }

  const handleCheck = useCallback(() => {
    const isCorrect = placed.join(' ') === sentence.words.join(' ');
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFlashColor(Colors.success);
      setShowBurst(true);
      setScore((s) => s + 1);
      if (isFirstAttempt) setFirstAttemptCount((c) => c + 1);
      speak(sentence.albanian, 0.8);
      showToast('Saktë! ⭐');
      advanceGame.current = () => {
        setShowBurst(false);
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx((r) => r + 1);
      };
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      setFlashColor(Colors.error);
      setShowFail(true);
      failTimer.current = setTimeout(() => setShowFail(false), 1400);
      setIsFirstAttempt(false);
      showToast('Provo përsëri! 💪');
      setTimeout(() => {
        setPlaced([]);
        setPool([...sentence.words].sort(() => Math.random() - 0.5));
        setFlashColor(null);
      }, 800);
    }
  }, [placed, sentence, roundIdx, isFirstAttempt]);

  function handleReplay() {
    setSentences(getRandomSentences(ROUNDS));
    setRoundIdx(0);
    setScore(0);
    setFirstAttemptCount(0);
    setDone(false);
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <Summary
          score={score}
          total={ROUNDS}
          firstAttemptCount={firstAttemptCount}
          onReplay={handleReplay}
          onHome={() => router.replace('/home')}
          profileName={activeProfile?.name}
        />
      </SafeAreaView>
    );
  }

  const allPlaced = placed.length === sentence.words.length;

  return (
    <SafeAreaView style={styles.safe}>
      <InstructionsModal visible={showInstructions} onDismiss={() => setShowInstructions(false)} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Kthehu</Text>
        </Pressable>
        <Pressable onPress={() => setShowInstructions(true)} style={styles.helpBtn} accessibilityLabel="Show instructions">
          <Text style={styles.helpText}>❓</Text>
        </Pressable>
        <Text style={styles.progress}>{roundIdx + 1} / {ROUNDS}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= roundIdx && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Scene illustration */}
        <View style={styles.sceneWrap}>
          <SceneIllustration illustration={sentence.illustration} sentenceId={sentence.id} size="large" />
        </View>

        <Text style={styles.instruction}>Bëj fjalinë për foton! 👇</Text>
        <Text style={styles.instructionEn}>(Make the sentence for the picture!)</Text>

        {/* Answer tray */}
        <AnswerTray
          placed={placed}
          totalSlots={sentence.words.length}
          onRemove={removeFromPlaced}
          flashColor={flashColor}
        />

        {/* Word pool */}
        <View style={styles.pool}>
          {pool.map((word, i) => (
            <WordTile key={`${word}-${i}`} word={word} onPress={() => tapFromPool(word, i)} variant="pool" />
          ))}
        </View>

        {/* Check button */}
        <View style={styles.checkWrap}>
          <Pressable
            style={[styles.checkBtn, !allPlaced && styles.checkBtnDisabled]}
            onPress={handleCheck}
            disabled={!allPlaced}
            accessibilityRole="button"
            accessibilityLabel="Check my answer"
          >
            <Text style={styles.checkBtnText}>Kontrollo! ✅</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <FeedbackAnimation type="success" visible={showBurst} onComplete={() => advanceGame.current?.()} />
      <FeedbackAnimation type="fail" visible={showFail} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backBtn: { padding: Spacing.sm },
  backText: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '600' },
  helpBtn: { padding: Spacing.sm },
  helpText: { fontSize: FontSizes.lg },
  progress: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.older },
  scroll: { paddingBottom: Spacing.xxl },
  sceneWrap: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: Colors.textLight, marginBottom: Spacing.md },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 70,
  },
  checkWrap: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md },
  checkBtn: {
    backgroundColor: Colors.older,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.older,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkBtnDisabled: { opacity: 0.35 },
  checkBtnText: { color: Colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.lg },
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  toastText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
});
