import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const SUCCESS = [
  require('../../assets/animation/avocado-success.json'),
  require('../../assets/animation/baloon-success.json'),
  require('../../assets/animation/trampoline-success.json'),
];

const FAIL = [
  require('../../assets/animation/bear-fail.json'),
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Props = {
  type: 'success' | 'fail';
  visible: boolean;
};

export function FeedbackAnimation({ type, visible }: Props) {
  const pool = type === 'success' ? SUCCESS : FAIL;
  const [source, setSource] = useState(() => pick(pool));
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setSource(pick(pool));
      setKey(k => k + 1);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View
      style={type === 'success' ? styles.successOverlay : styles.failOverlay}
      pointerEvents="none"
    >
      <LottieView
        key={key}
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
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  failOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    top: '25%',
    width: 220,
    height: 220,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});
