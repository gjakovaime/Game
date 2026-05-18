import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarPicker, AVATARS } from '../src/components/AvatarPicker';
import { ColorPalette, FontSizes, Radii, Spacing } from '../src/constants/colors';
import { buttonGloss } from '../src/constants/styles';
import { useProfile } from '../src/hooks/useProfile';
import { useColors } from '../src/hooks/useTheme';
import { STRINGS } from '../src/i18n/strings';

type Step = 'lang' | 'name' | 'age' | 'avatar';
const STEPS: Step[] = ['lang', 'name', 'age', 'avatar'];
const AGES = Array.from({ length: 10 }, (_, i) => i + 3);

export default function Onboarding() {
  const router = useRouter();
  const { createProfile, activeProfile } = useProfile();
  const canGoBack = !!activeProfile;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [step, setStep] = useState<Step>('lang');
  const [uiLang, setUiLang] = useState<'en' | 'sq'>('sq');
  const t = STRINGS[uiLang];
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [creating, setCreating] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  function next() {
    if (step === 'lang') setStep('name');
    else if (step === 'name') setStep('age');
    else if (step === 'age') setStep('avatar');
    else finish();
  }

  async function finish() {
    if (creating) return;
    setCreating(true);
    await createProfile(name, age, avatar, uiLang);
    router.replace('/home');
  }

  const canNext =
    step === 'lang' ||
    (step === 'name' && name.trim().length >= 1) ||
    (step === 'age' && age > 0) ||
    step === 'avatar';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          {canGoBack ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
              <Text style={styles.backText}>{t.back}</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'lang' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>🌍</Text>
              <Text style={styles.heading}>Language / Gjuha</Text>
              <Text style={styles.subheadingEn}>Choose your language</Text>
              <View style={styles.langRow}>
                <Pressable
                  style={[styles.langBtn, uiLang === 'sq' && styles.langBtnActive]}
                  onPress={() => { setUiLang('sq'); setTimeout(next, 250); }}
                  accessibilityRole="button"
                  accessibilityLabel="Shqip"
                >
                  <Text style={styles.langFlag}>🇦🇱</Text>
                  <Text style={[styles.langText, uiLang === 'sq' && styles.langTextActive]}>Shqip</Text>
                </Pressable>
                <Pressable
                  style={[styles.langBtn, uiLang === 'en' && styles.langBtnActive]}
                  onPress={() => { setUiLang('en'); setTimeout(next, 250); }}
                  accessibilityRole="button"
                  accessibilityLabel="English"
                >
                  <Text style={styles.langFlag}>🇬🇧</Text>
                  <Text style={[styles.langText, uiLang === 'en' && styles.langTextActive]}>English</Text>
                </Pressable>
              </View>
            </View>
          )}

          {step === 'name' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>{t.onboarding.nameEmoji}</Text>
              <Text style={styles.heading}>{t.onboarding.nameTitle}</Text>
              <Text style={styles.subheading}>{t.onboarding.namePrompt}</Text>
              <Text style={styles.subheadingEn}>{t.onboarding.nameHint}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t.onboarding.namePlaceholder}
                placeholderTextColor={colors.border}
                maxLength={20}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim().length >= 1 && next()}
              />
            </View>
          )}

          {step === 'age' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>{t.onboarding.ageEmoji}</Text>
              <Text style={styles.heading}>{t.onboarding.ageTitle(name)}</Text>
              <Text style={styles.subheadingEn}>{t.onboarding.ageHint}</Text>
              <View style={styles.ageGrid}>
                {AGES.map((a) => (
                  <Pressable
                    key={a}
                    style={[styles.ageBubble, age === a && styles.ageBubbleActive]}
                    onPress={() => { setAge(a); setTimeout(next, 300); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Age ${a}`}
                    accessibilityState={{ selected: age === a }}
                  >
                    <Text style={[styles.ageText, age === a && styles.ageTextActive]}>{a}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 'avatar' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>{t.onboarding.avatarEmoji}</Text>
              <Text style={styles.heading}>{t.onboarding.avatarTitle}</Text>
              <Text style={styles.subheadingEn}>{t.onboarding.avatarHint}</Text>
              <AvatarPicker selected={avatar} onSelect={setAvatar} />
            </View>
          )}
        </ScrollView>

        {step !== 'age' && step !== 'lang' && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.btn, !canNext && styles.btnDisabled]}
              onPress={next}
              disabled={!canNext || creating}
              accessibilityRole="button"
              accessibilityLabel={step === 'avatar' ? 'Start playing' : 'Next'}
            >
              <Text style={styles.btnText}>
                {step === 'avatar' ? t.onboarding.start(name) : t.onboarding.next}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      minHeight: 44,
    },
    backBtn: { padding: Spacing.sm },
    backText: { fontSize: FontSizes.md, color: colors.textLight, fontWeight: '600' },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingTop: Spacing.sm,
    },
    dot: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary },
    content: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
    stepContainer: { alignItems: 'center' },
    stepEmoji: { fontSize: 72, marginBottom: Spacing.md },
    heading: {
      fontSize: FontSizes.xxl,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subheading: {
      fontSize: FontSizes.lg,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subheadingEn: {
      fontSize: FontSizes.md,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    input: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: Radii.lg,
      padding: Spacing.lg,
      fontSize: FontSizes.xl,
      fontWeight: '700',
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.primary,
      textAlign: 'center',
    },
    langRow: {
      flexDirection: 'row',
      gap: Spacing.lg,
      marginTop: Spacing.lg,
    },
    langBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.xl,
      borderRadius: Radii.xl,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    langBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    langFlag: { fontSize: 48, marginBottom: Spacing.sm },
    langText: { fontSize: FontSizes.lg, fontWeight: '800', color: colors.text },
    langTextActive: { color: colors.textOnPrimary },
    ageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    ageBubble: {
      width: 72,
      height: 72,
      borderRadius: Radii.full,
      backgroundColor: colors.surface,
      borderWidth: 3,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    ageBubbleActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    ageText: { fontSize: FontSizes.xl, fontWeight: '800', color: colors.text },
    ageTextActive: { color: colors.textOnPrimary },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
    btn: {
      ...buttonGloss,
      backgroundColor: colors.primary,
      borderRadius: Radii.full,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    btnDisabled: { opacity: 0.4 },
    btnText: {
      color: colors.textOnPrimary,
      fontSize: FontSizes.lg,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });
}
