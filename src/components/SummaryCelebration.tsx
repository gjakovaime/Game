import LottieView from 'lottie-react-native';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

// Use .json (classic Lottie) — bundler parses these inline, no async URL fetch needed.
const SOURCES = [
  require('../../assets/animation/avocado-success.json'),
  require('../../assets/animation/baloon-success.json'),
  require('../../assets/animation/trampoline-success.json'),
];

export function SummaryCelebration() {
  const source = useRef(SOURCES[Math.floor(Math.random() * SOURCES.length)]).current;
  return (
    <View style={styles.wrap}>
      <LottieView
        source={source}
        autoPlay
        loop
        style={styles.anim}
        webStyle={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 200, height: 200 },
  anim: { width: 200, height: 200 },
});
