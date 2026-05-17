import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { Colors, FontSizes, Radii, Spacing } from '../src/constants/colors';
import { buttonGloss } from '../src/constants/styles';
import { useProfile } from '../src/hooks/useProfile';

type Step = 'name' | 'age' | 'avatar';
const STEPS: Step[] = ['name', 'age', 'avatar'];
const AGES = Array.from({ length: 10 }, (_, i) => i + 3); // 3–12

export default function Onboarding() {
  const router = useRouter();
  const { createProfile, activeProfile } = useProfile();
  const canGoBack = !!activeProfile;

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [creating, setCreating] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  function next() {
    if (step === 'name') setStep('age');
    else if (step === 'age') setStep('avatar');
    else finish();
  }

  async function finish() {
    if (creating) return;
    setCreating(true);
    await createProfile(name, age, avatar);
    router.replace('/home');
  }

  const canNext =
    (step === 'name' && name.trim().length >= 1) ||
    (step === 'age' && age > 0) ||
    step === 'avatar';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Top bar — back button shown when adding to existing profiles */}
        <View style={styles.topBar}>
          {canGoBack ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
              <Text style={styles.backText}>← Kthehu</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>

        {/* Progress dots */}
        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'name' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>👋</Text>
              <Text style={styles.heading}>Përshëndetje!</Text>
              <Text style={styles.subheading}>Si të quajnë ty?</Text>
              <Text style={styles.subheadingEn}>(What is your name?)</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Emri yt..."
                placeholderTextColor={Colors.border}
                maxLength={20}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => name.trim().length >= 1 && next()}
              />
            </View>
          )}

          {step === 'age' && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepEmoji}>🎂</Text>
              <Text style={styles.heading}>Sa vjeç je, {name}?</Text>
              <Text style={styles.subheadingEn}>(How old are you?)</Text>
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
              <Text style={styles.stepEmoji}>🪄</Text>
              <Text style={styles.heading}>Zgjidh karakterin!</Text>
              <Text style={styles.subheadingEn}>(Choose your character!)</Text>
              <AvatarPicker selected={avatar} onSelect={setAvatar} />
            </View>
          )}
        </ScrollView>

        {step !== 'age' && (
          <View style={styles.footer}>
            <Pressable
              style={[styles.btn, !canNext && styles.btnDisabled]}
              onPress={next}
              disabled={!canNext || creating}
              accessibilityRole="button"
              accessibilityLabel={step === 'avatar' ? 'Start playing' : 'Next'}
            >
              <Text style={styles.btnText}>
                {step === 'avatar' ? `Nisja, ${name}! 🚀` : 'Vazhdo →'}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    minHeight: 44,
  },
  backBtn: { padding: Spacing.sm },
  backText: { fontSize: FontSizes.md, color: Colors.textLight, fontWeight: '600' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
    backgroundColor: Colors.border,
  },
  dotActive: { backgroundColor: Colors.primary },
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subheadingEn: {
    fontSize: FontSizes.md,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.primary,
    textAlign: 'center',
  },
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
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ageBubbleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  ageText: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text },
  ageTextActive: { color: Colors.textOnPrimary },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  btn: {
    ...buttonGloss,
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: {
    color: Colors.textOnPrimary,
    fontSize: FontSizes.lg,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
