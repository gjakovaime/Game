import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { TOTAL_GAMES, UNITS } from '../data/units';
import { useProfile } from './useProfile';

type GameProgress = Record<string, number>; // gameId → best star count (0 = not played)

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  description: string;
};

export const ALL_BADGES: Badge[] = [
  { id: 'first_play',   emoji: '🎮', title: 'Lojtari i Parë!',  description: 'Luajte lojën tuaj të parë!' },
  { id: 'first_star',   emoji: '⭐', title: 'Ylli i Parë!',     description: 'Fite yllin tuaj të parë!' },
  { id: 'first_3star',  emoji: '🌟', title: 'Perfekt!',          description: 'Morët 3 yje në një lojë!' },
  { id: 'unit1_done',   emoji: '🌱', title: 'Fillistar!',        description: 'Luajte të gjitha lojërat e Unit 1!' },
  { id: 'unit2_unlock', emoji: '🔓', title: 'Fjalori Hapet!',   description: 'Zhbllokuat Unit 2!' },
  { id: 'unit2_done',   emoji: '📖', title: 'Fjalorist!',        description: 'Luajte të gjitha lojërat e Unit 2!' },
  { id: 'unit3_unlock', emoji: '💬', title: 'Fjali Hapen!',     description: 'Zhbllokuat Unit 3!' },
  { id: 'unit3_done',   emoji: '🧩', title: 'Ndërtues Fjalish!', description: 'Luajte të gjitha lojërat e Unit 3!' },
  { id: 'unit4_unlock', emoji: '🏆', title: 'Ekspert Hapet!',   description: 'Zhbllokuat nivelin Ekspert!' },
  { id: 'unit4_done',   emoji: '👑', title: 'Kampion!',          description: 'Luajte të gjitha lojërat!' },
  { id: 'all_3stars',   emoji: '✨', title: 'Yllistari!',        description: 'Morët 3 yje në çdo lojë!' },
  { id: 'speedrun',     emoji: '🔥', title: 'Në Zjarr!',         description: 'Fituat 3 yje 3 herë radhazi!' },
];

export function useProgress() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile?.id;

  const progressKey = profileId ? `@albanian/progress/${profileId}` : null;
  const badgesKey   = profileId ? `@albanian/badges/${profileId}`   : null;
  const streakKey   = profileId ? `@albanian/streak/${profileId}`   : null;

  const [progress, setProgress] = useState<GameProgress>({});
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!progressKey || !badgesKey) return;
    setLoaded(false);
    Promise.all([
      AsyncStorage.getItem(progressKey),
      AsyncStorage.getItem(badgesKey),
    ]).then(([rawP, rawB]) => {
      setProgress(rawP ? JSON.parse(rawP) : {});
      setEarnedBadges(rawB ? JSON.parse(rawB) : []);
      setLoaded(true);
    });
  }, [progressKey, badgesKey]);

  const getStars = useCallback((gameId: string): number => {
    return progress[gameId] ?? 0;
  }, [progress]);

  const getUnitStars = useCallback((unitIndex: number): number => {
    const unit = UNITS[unitIndex];
    if (!unit) return 0;
    return unit.games.reduce((sum, g) => sum + (progress[g.id] ?? 0), 0);
  }, [progress]);

  const isUnitUnlocked = useCallback((unitIndex: number): boolean => {
    if (unitIndex === 0) return true;
    const prevUnit = UNITS[unitIndex - 1];
    if (!prevUnit) return false;
    const prevStars = prevUnit.games.reduce((sum, g) => sum + (progress[g.id] ?? 0), 0);
    return prevStars >= UNITS[unitIndex].unlockStars;
  }, [progress]);

  const starsNeededToUnlock = useCallback((unitIndex: number): number => {
    if (unitIndex === 0) return 0;
    const prevUnit = UNITS[unitIndex - 1];
    if (!prevUnit) return 0;
    const prevStars = prevUnit.games.reduce((sum, g) => sum + (progress[g.id] ?? 0), 0);
    return Math.max(0, UNITS[unitIndex].unlockStars - prevStars);
  }, [progress]);

  const reload = useCallback(async () => {
    if (!progressKey || !badgesKey) return;
    const [rawP, rawB] = await Promise.all([
      AsyncStorage.getItem(progressKey),
      AsyncStorage.getItem(badgesKey),
    ]);
    setProgress(rawP ? JSON.parse(rawP) : {});
    setEarnedBadges(rawB ? JSON.parse(rawB) : []);
  }, [progressKey, badgesKey]);

  const recordStars = useCallback(async (gameId: string, stars: number) => {
    if (!progressKey || !badgesKey || !streakKey) return;

    const currentBest = progress[gameId] ?? 0;
    const isNewPlay = currentBest === 0;
    const newProgress: GameProgress = stars > currentBest
      ? { ...progress, [gameId]: stars }
      : { ...progress };

    setProgress(newProgress);
    await AsyncStorage.setItem(progressKey, JSON.stringify(newProgress));

    // Streak tracking (consecutive 3-star plays)
    const rawStreak = await AsyncStorage.getItem(streakKey);
    let streak3 = rawStreak ? parseInt(rawStreak, 10) : 0;
    if (stars === 3) { streak3 += 1; } else { streak3 = 0; }
    await AsyncStorage.setItem(streakKey, String(streak3));

    // Badge detection
    const current = earnedBadges;
    const newBadges: string[] = [];

    const totalStars = Object.values(newProgress).reduce((a, b) => a + b, 0);
    const games3star = Object.values(newProgress).filter(s => s === 3).length;

    if (isNewPlay && !current.includes('first_play')) newBadges.push('first_play');
    if (totalStars >= 1 && !current.includes('first_star')) newBadges.push('first_star');
    if (games3star >= 1 && !current.includes('first_3star')) newBadges.push('first_3star');
    if (streak3 >= 3 && !current.includes('speedrun')) newBadges.push('speedrun');

    for (let i = 0; i < UNITS.length; i++) {
      const unit = UNITS[i];
      const allPlayed = unit.games.every(g => (newProgress[g.id] ?? 0) > 0);
      if (allPlayed && !current.includes(`unit${i + 1}_done`)) {
        newBadges.push(`unit${i + 1}_done`);
      }
      if (i > 0) {
        const prevUnit = UNITS[i - 1];
        const prevStars = prevUnit.games.reduce((sum, g) => sum + (newProgress[g.id] ?? 0), 0);
        if (prevStars >= unit.unlockStars && !current.includes(`unit${i + 1}_unlock`)) {
          newBadges.push(`unit${i + 1}_unlock`);
        }
      }
    }
    if (games3star >= TOTAL_GAMES && !current.includes('all_3stars')) newBadges.push('all_3stars');

    if (newBadges.length > 0) {
      const updated = [...current, ...newBadges];
      setEarnedBadges(updated);
      await AsyncStorage.setItem(badgesKey, JSON.stringify(updated));
      // Queue first new badge for display on home screen
      const pendingKey = `@albanian/pendingBadge/${profileId}`;
      await AsyncStorage.setItem(pendingKey, newBadges[0]);
    }
  }, [progress, earnedBadges, progressKey, badgesKey, streakKey, profileId]);

  return {
    progress,
    getStars,
    getUnitStars,
    isUnitUnlocked,
    starsNeededToUnlock,
    recordStars,
    reload,
    earnedBadges,
    loaded,
  };
}
