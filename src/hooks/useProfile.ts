import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';

const PROFILES_KEY = '@albanian/profiles';
const ACTIVE_ID_KEY = '@albanian/activeProfileId';

export type AgeGroup = 'young' | 'older';

export type Profile = {
  id: string;
  name: string;
  age: number;
  avatarEmoji: string;
  ageGroup: AgeGroup;
  animationsEnabled: boolean;
  uiLang: 'en' | 'sq';
};

export function useProfile() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rawProfiles, activeId] = await Promise.all([
        AsyncStorage.getItem(PROFILES_KEY),
        AsyncStorage.getItem(ACTIVE_ID_KEY),
      ]);
      const parsed: Profile[] = rawProfiles ? JSON.parse(rawProfiles) : [];
      setProfiles(parsed);
      if (activeId) {
        const found = parsed.find((p) => p.id === activeId) ?? parsed[0] ?? null;
        setActiveProfile(found);
      } else {
        setActiveProfile(parsed[0] ?? null);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = useCallback(async (profile: Profile) => {
    setProfiles((prev) => {
      const exists = prev.find((p) => p.id === profile.id);
      return exists ? prev.map((p) => (p.id === profile.id ? profile : p)) : [...prev, profile];
    });
    setActiveProfile(profile);
    const updated = profiles.find((p) => p.id === profile.id)
      ? profiles.map((p) => (p.id === profile.id ? profile : p))
      : [...profiles, profile];
    await Promise.all([
      AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updated)),
      AsyncStorage.setItem(ACTIVE_ID_KEY, profile.id),
    ]);
  }, [profiles]);

  const createProfile = useCallback(
    async (name: string, age: number, avatarEmoji: string, uiLang: 'en' | 'sq' = 'sq') => {
      const profile: Profile = {
        id: Date.now().toString(),
        name: name.trim(),
        age,
        avatarEmoji,
        ageGroup: age <= 6 ? 'young' : 'older',
        animationsEnabled: true,
        uiLang,
      };
      const updated = [...profiles, profile];
      setProfiles(updated);
      setActiveProfile(profile);
      await Promise.all([
        AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updated)),
        AsyncStorage.setItem(ACTIVE_ID_KEY, profile.id),
      ]);
      return profile;
    },
    [profiles]
  );

  const switchProfile = useCallback(async (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;
    setActiveProfile(profile);
    await AsyncStorage.setItem(ACTIVE_ID_KEY, id);
  }, [profiles]);

  const deleteProfile = useCallback(async (id: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
    if (activeProfile?.id === id) {
      const next = updated[0] ?? null;
      setActiveProfile(next);
      if (next) await AsyncStorage.setItem(ACTIVE_ID_KEY, next.id);
      else await AsyncStorage.removeItem(ACTIVE_ID_KEY);
    }
  }, [profiles, activeProfile]);

  return { profiles, activeProfile, loaded, createProfile, saveProfile, switchProfile, deleteProfile, reload: load };
}
