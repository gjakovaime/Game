import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneIllustration } from '../../src/components/SceneIllustration';
import { FeedbackAnimation } from '../../src/components/FeedbackAnimation';
import { GameSummary } from '../../src/components/GameSummary';
import { WordTile } from '../../src/components/WordTile';
import { ColorPalette, FontSizes, Radii, Spacing } from '../../src/constants/colors';
import { buttonGloss } from '../../src/constants/styles';
import { Sentence, getAvailableSentences } from '../../src/data/sentences';
import { useProfile } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useColors } from '../../src/hooks/useTheme';
import { useSpeech } from '../../src/hooks/useSpeech';
import { useT } from '../../src/hooks/useT';

const ROUNDS = 5;

// ─── Instructions modal ───────────────────────────────────────────────────────

function InstructionsModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeIStyles(colors), [colors]);
  const t = useT();
  const sb = t.games['sentence-builder'];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.header}>{sb.howToPlay}</Text>
          <Text style={styles.subEn}>{sb.howToPlaySub}</Text>

          {sb.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
              <View style={styles.stepText}>
                <Text style={styles.stepAlb}>{step.main}</Text>
                <Text style={styles.stepEn}>{step.hint}</Text>
              </View>
            </View>
          ))}

          <Pressable style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>{sb.letsGo}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeIStyles(colors: ColorPalette) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
    card: { backgroundColor: colors.surface, borderRadius: Radii.xl, padding: Spacing.xl, width: '100%', maxWidth: 420 },
    header: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 2 },
    subEn: { fontSize: FontSizes.sm, color: colors.textLight, textAlign: 'center', marginBottom: Spacing.lg },
    step: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    stepNum: {
      width: 28, height: 28, borderRadius: Radii.full,
      backgroundColor: colors.older, color: colors.textOnPrimary,
      textAlign: 'center', lineHeight: 28, fontWeight: '900', fontSize: FontSizes.sm,
      marginRight: Spacing.sm,
    },
    stepEmoji: { fontSize: 28, marginRight: Spacing.sm },
    stepText: { flex: 1 },
    stepAlb: { fontSize: FontSizes.md, fontWeight: '700', color: colors.text },
    stepEn: { fontSize: FontSizes.xs, color: colors.textLight },
    btn: {
      ...buttonGloss, backgroundColor: colors.older, borderRadius: Radii.full,
      paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
    },
    btnText: { color: colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.lg },
  });
}

// ─── Answer tray ──────────────────────────────────────────────────────────────

type TrayProps = {
  placed: string[];
  totalSlots: number;
  onRemove: (index: number) => void;
  flashColor?: string | null;
};

function AnswerTray({ placed, totalSlots, onRemove, flashColor }: TrayProps) {
  const colors = useColors();
  const trayStyles = useMemo(() => makeTrayStyles(colors), [colors]);
  const [trayBorderColor, setTrayBorderColor] = useState(colors.border);

  useEffect(() => {
    if (!flashColor) return;
    setTrayBorderColor(flashColor);
    const t = setTimeout(() => setTrayBorderColor(colors.border), 700);
    return () => clearTimeout(t);
  }, [flashColor, colors.border]);

  return (
    <View style={[trayStyles.tray, { borderColor: trayBorderColor }]}>
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
    </View>
  );
}

function makeTrayStyles(colors: ColorPalette) {
  return StyleSheet.create({
    tray: {
      borderWidth: 2,
      borderRadius: Radii.lg,
      minHeight: 56,
      paddingVertical: Spacing.xs,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      backgroundColor: colors.surface,
    },
    scroll: { paddingHorizontal: Spacing.sm, alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SentenceBuilder() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const { speak, praise, stop, mistake } = useSpeech();
  const { recordStars, daysUsed, loaded: progressLoaded } = useProgress();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useT();

  const didProgressInit = useRef(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [sentences, setSentences] = useState<Sentence[]>(() => getAvailableSentences(0, ROUNDS));
  const [roundIdx, setRoundIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [showFail, setShowFail] = useState(false);
  const [score, setScore] = useState(0);
  const [firstAttemptCount, setFirstAttemptCount] = useState(0);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);

  const sentence = sentences[roundIdx];

  function initRound(s: Sentence) {
    setPlaced([]);
    setPool([...s.albanian.split(' ')].sort(() => Math.random() - 0.5));
    setIsFirstAttempt(true);
    setFlashColor(null);
    locked.current = false;
  }

  useEffect(() => {
    if (didProgressInit.current || !progressLoaded) return;
    didProgressInit.current = true;
    setSentences(getAvailableSentences(daysUsed, ROUNDS));
  }, [progressLoaded]);

  useEffect(() => {
    if (sentence) initRound(sentence);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (failTimer.current) clearTimeout(failTimer.current);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [roundIdx, sentences]);

  useEffect(() => {
    if (!done) return;
    praise();
    const stars = (firstAttemptCount >= ROUNDS ? 3 : firstAttemptCount >= ROUNDS * 0.6 ? 2 : 1) as 1 | 2 | 3;
    recordStars('sentence-builder', stars);
  }, [done]);

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
    if (locked.current) return;
    const isCorrect = placed.join(' ') === sentence.albanian;
    if (isCorrect) {
      locked.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFlashColor(colors.success);
      setScore((s) => s + 1);
      if (isFirstAttempt) setFirstAttemptCount((c) => c + 1);
      speak(sentence.albanian, 0.8);
      showToast(t.games['sentence-builder'].toastCorrect);
      advanceTimer.current = setTimeout(() => {
        if (roundIdx + 1 >= ROUNDS) setDone(true);
        else setRoundIdx((r) => r + 1);
      }, 800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      mistake();
      setFlashColor(colors.error);
      setShowFail(true);
      failTimer.current = setTimeout(() => setShowFail(false), 1400);
      setIsFirstAttempt(false);
      showToast(t.games['sentence-builder'].toastRetry);
      setTimeout(() => {
        setPlaced([]);
        setPool([...sentence.albanian.split(' ')].sort(() => Math.random() - 0.5));
        setFlashColor(null);
      }, 800);
    }
  }, [placed, sentence, roundIdx, isFirstAttempt, colors]);

  function handleReplay() {
    setSentences(getAvailableSentences(daysUsed, ROUNDS));
    setRoundIdx(0);
    setScore(0);
    setFirstAttemptCount(0);
    setDone(false);
  }

  if (done) {
    const stars = (firstAttemptCount >= ROUNDS ? 3 : firstAttemptCount >= ROUNDS * 0.6 ? 2 : 1) as 1 | 2 | 3;
    return (
      <SafeAreaView style={styles.safe}>
        <GameSummary
          stars={stars}
          scoreText={`${score}/${ROUNDS} herë saktë!`}
          onReplay={handleReplay}
          onHome={() => router.replace('/home')}
          name={activeProfile?.name}
        />
      </SafeAreaView>
    );
  }

  const allPlaced = placed.length === sentence.albanian.split(' ').length;

  return (
    <SafeAreaView style={styles.safe}>
      <InstructionsModal visible={showInstructions} onDismiss={() => setShowInstructions(false)} />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backText}>{t.back}</Text>
        </Pressable>
        <Pressable onPress={() => setShowInstructions(true)} style={styles.helpBtn} accessibilityLabel="Show instructions">
          <Text style={styles.helpText}>❓</Text>
        </Pressable>
        <Text style={styles.progress}>{roundIdx + 1} / {ROUNDS}</Text>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View key={i} style={[styles.dot, i <= roundIdx && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sceneWrap}>
          <SceneIllustration illustration={sentence.illustration} sentenceId={sentence.albanian} size="large" />
        </View>

        <Text style={styles.instruction}>{t.games['sentence-builder'].instruction}</Text>
        <Text style={styles.instructionEn}>{t.games['sentence-builder'].hint}</Text>

        <AnswerTray
          placed={placed}
          totalSlots={sentence.albanian.split(' ').length}
          onRemove={removeFromPlaced}
          flashColor={flashColor}
        />

        <View style={styles.pool}>
          {pool.map((word, i) => (
            <WordTile key={`${word}-${i}`} word={word} onPress={() => tapFromPool(word, i)} variant="pool" />
          ))}
        </View>

        <View style={styles.checkWrap}>
          <Pressable
            style={[styles.checkBtn, !allPlaced && styles.checkBtnDisabled]}
            onPress={handleCheck}
            disabled={!allPlaced}
            accessibilityRole="button"
            accessibilityLabel="Check my answer"
          >
            <Text style={styles.checkBtnText}>{t.games['sentence-builder'].checkBtn}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      <FeedbackAnimation type="fail" visible={showFail} />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
    },
    backBtn: { padding: Spacing.sm },
    backText: { fontSize: FontSizes.md, color: colors.textLight, fontWeight: '600' },
    helpBtn: { padding: Spacing.sm },
    helpText: { fontSize: FontSizes.lg },
    progress: { fontSize: FontSizes.md, color: colors.textLight, fontWeight: '700' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginVertical: Spacing.sm },
    dot: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.older },
    scroll: { paddingBottom: Spacing.xxl },
    sceneWrap: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
    instruction: { textAlign: 'center', fontSize: FontSizes.lg, fontWeight: '700', color: colors.text, marginBottom: 2 },
    instructionEn: { textAlign: 'center', fontSize: FontSizes.sm, color: colors.textLight, marginBottom: Spacing.md },
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
      backgroundColor: colors.older,
      borderRadius: Radii.full,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      shadowColor: colors.older,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    checkBtnDisabled: { opacity: 0.35 },
    checkBtnText: { color: colors.textOnPrimary, fontWeight: '900', fontSize: FontSizes.lg },
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
}
