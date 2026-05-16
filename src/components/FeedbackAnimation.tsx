import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useProfile } from '../hooks/useProfile';

// Auto-discover animations by naming pattern.
// Drop any *-success.json or *-fail.json in assets/animation/ — no code changes needed.
const successCtx = (require as any).context('../../assets/animation', false, /-success\.json$/);
const failCtx    = (require as any).context('../../assets/animation', false, /-fail\.json$/);

const SUCCESS: any[] = successCtx.keys().map((k: string) => successCtx(k));
const FAIL: any[]    = failCtx.keys().map((k: string) => failCtx(k));

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Read exact play duration from Lottie JSON metadata
function animMs(anim: any): number {
  return Math.round((anim.op / anim.fr) * 1000) + 200; // +200ms settle buffer
}

type Props = {
  type: 'success' | 'fail';
  visible: boolean;
  onComplete?: () => void;
};

export function FeedbackAnimation({ type, visible, onComplete }: Props) {
  const { activeProfile } = useProfile();
  // Existing profiles (before this field was added) default to enabled
  const enabled = activeProfile?.animationsEnabled !== false;

  const pool = type === 'success' ? SUCCESS : FAIL;
  const [source, setSource] = useState<any>(null);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always use latest onComplete without making it a useEffect dependency
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!visible) return;

    const anim = pool.length > 0 ? pick(pool) : null;
    setSource(anim);
    setAnimKey(k => k + 1);

    // When animations disabled: call onComplete after a fixed delay so games still advance
    const ms = enabled && anim ? animMs(anim) : type === 'success' ? 1800 : 1400;
    timerRef.current = setTimeout(() => onCompleteRef.current?.(), ms);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  if (!visible || !enabled || !source) return null;

  return (
    // pointerEvents="auto" blocks all touches — background is fully disabled during animation
    <View style={styles.overlay} pointerEvents="auto">
      <View style={type === 'success' ? styles.dimDark : styles.dimMedium} />
      <LottieView
        key={animKey}
        source={source}
        autoPlay
        loop={false}
        style={styles.lottie}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  dimDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  dimMedium: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lottie: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
});
