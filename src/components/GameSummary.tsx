import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SummaryCelebration } from './SummaryCelebration';
import { ColorPalette, FontSizes, Radii, Spacing } from '../constants/colors';
import { buttonGloss } from '../constants/styles';
import { useColors } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';

interface Props {
  stars: 1 | 2 | 3;
  scoreText: string;
  onReplay: () => void;
  onHome: () => void;
  name?: string;
}

const STRINGS = {
  sq: { bravo: 'Bravo', replay: 'Luaj përsëri! 🔄', home: 'Shko në shtëpi 🏠' },
  en: { bravo: 'Great job', replay: 'Play again! 🔄', home: 'Go home 🏠' },
};

export function GameSummary({ stars, scoreText, onReplay, onHome, name }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { activeProfile } = useProfile();
  const t = STRINGS[activeProfile?.uiLang ?? 'sq'];

  return (
    <View style={styles.wrap}>
      <SummaryCelebration />
      <Text style={styles.title}>{t.bravo}{name ? `, ${name}` : ''}! 🎉</Text>
      <Text style={styles.stars}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={styles.score}>{scoreText}</Text>
      <Pressable style={[styles.btn, { backgroundColor: colors.secondary }]} onPress={onReplay}>
        <Text style={styles.btnText}>{t.replay}</Text>
      </Pressable>
      <Pressable style={[styles.btn, { backgroundColor: colors.primary, marginTop: Spacing.md }]} onPress={onHome}>
        <Text style={styles.btnText}>{t.home}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    title: { fontSize: FontSizes.xxl, fontWeight: '900', color: colors.text, marginBottom: Spacing.md, textAlign: 'center' },
    stars: { fontSize: 48, marginBottom: Spacing.md },
    score: { fontSize: FontSizes.xl, fontWeight: '700', color: colors.textLight, marginBottom: Spacing.xxl },
    btn: { ...buttonGloss, borderRadius: Radii.full, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl, alignItems: 'center' },
    btnText: { color: colors.textOnPrimary, fontSize: FontSizes.lg, fontWeight: '900' },
  });
}
