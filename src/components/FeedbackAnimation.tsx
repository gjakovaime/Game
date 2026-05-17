import LottieView from 'lottie-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useProfile } from '../hooks/useProfile';

// Auto-discover animations by naming pattern.
// Drop any *-success.lottie or *-fail.lottie in assets/animation/ — no code changes needed.
const successCtx = (require as any).context('../../assets/animation', false, /-success\.lottie$/);
const failCtx    = (require as any).context('../../assets/animation', false, /-fail\.lottie$/);

const SUCCESS: any[] = successCtx.keys().map((k: string) => successCtx(k));
const FAIL: any[]    = failCtx.keys().map((k: string) => failCtx(k));

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

  // Called by onAnimationFinish (enabled path) or by the fallback timer (disabled / load failure)
  const fireComplete = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    onCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!visible) return;

    const anim = pool.length > 0 ? pick(pool) : null;
    setSource(anim);
    setAnimKey(k => k + 1);

    if (!enabled || !anim) {
      // Animations disabled — advance after a fixed delay
      const ms = type === 'success' ? 1800 : 1400;
      timerRef.current = setTimeout(() => onCompleteRef.current?.(), ms);
    } else {
      // Enabled — onAnimationFinish fires first; this is just a safety fallback
      timerRef.current = setTimeout(() => onCompleteRef.current?.(), 3000);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  // Dim renders on the very first frame visible=true (blocks touches + covers content immediately).
  // LottieView appears one frame later once source is picked by the effect above.
  if (!visible) return null;

  return (
    // pointerEvents="auto" blocks all touches — background is fully disabled during animation
    <View style={styles.overlay} pointerEvents="auto">
      {/* Dim layer — rendered first so it sits below in DOM/z order */}
      <View style={type === 'success' ? styles.dimDark : styles.dimMedium} />
      {/* Animation layer — sibling rendered after dim, so it sits on top */}
      {enabled && source && (
        <View style={styles.lottieLayer}>
          <LottieView
            key={animKey}
            source={source}
            autoPlay
            loop={false}
            style={styles.lottie}
            webStyle={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onAnimationFinish={fireComplete}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  dimDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  dimMedium: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lottieLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: '80%',
    height: '80%',
  },
});
