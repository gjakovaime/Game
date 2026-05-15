import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SENTENCE_IMAGES } from '../data/sentenceImages';
import { Illustration } from '../data/sentences';
import { Radii } from '../constants/colors';

type Props = {
  illustration: Illustration;
  // Sentence id — when SENTENCE_IMAGES[sentenceId] exists it overrides the emoji.
  sentenceId?: string;
  size?: 'large' | 'medium';
};

export function SceneIllustration({ illustration, sentenceId, size = 'large' }: Props) {
  const cardHeight = size === 'large' ? 200 : 140;
  const registryImage = sentenceId ? SENTENCE_IMAGES[sentenceId] : undefined;

  return (
    <View style={[styles.card, { backgroundColor: illustration.bgColor, height: cardHeight }]}>
      {registryImage ? (
        <Image
          source={registryImage}
          style={styles.image}
          resizeMode="contain"
          accessibilityRole="image"
        />
      ) : illustration.type === 'emoji' ? (
        <View style={styles.emojiRow}>
          {illustration.emojis.map((e, i) => (
            <Text key={i} style={[styles.emoji, size === 'medium' && styles.emojiMedium]}>
              {e}
            </Text>
          ))}
        </View>
      ) : (
        <Image
          source={illustration.source}
          style={styles.image}
          resizeMode="contain"
          accessibilityRole="image"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: Radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  emoji: { fontSize: 64, lineHeight: 76 },
  emojiMedium: { fontSize: 44, lineHeight: 52 },
  image: { width: '90%', height: '90%' },
});
