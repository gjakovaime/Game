import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { VOCABULARY, VocabItem } from '../data/vocabulary';
import { useProfile } from './useProfile';

export type WordProgress = {
  strength: number;      // 0–5 (spaced repetition grade)
  lastSeen: number;      // timestamp ms
  timesCorrect: number;
  timesWrong: number;
};

export type MasteryTier = 'new' | 'learning' | 'familiar' | 'mastered';

export type MasteryStats = {
  total: number;
  mastered: number;
  familiar: number;
  learning: number;
  unseen: number;
};

// Review intervals by strength level (in ms)
const SR_INTERVALS_MS = [0, 1, 3, 7, 14, 30].map(d => d * 24 * 60 * 60 * 1000);

function getMasteryTier(wp: WordProgress | undefined): MasteryTier {
  if (!wp || wp.timesCorrect === 0) return 'new';
  if (wp.timesCorrect < 3) return 'learning';
  if (wp.timesCorrect < 10 || wp.strength < 4) return 'familiar';
  return 'mastered';
}

export function useWordProgress() {
  const { activeProfile } = useProfile();
  const profileId = activeProfile?.id;
  const storageKey = profileId ? `@albanian/wordProgress/${profileId}` : null;

  const [wordProgress, setWordProgress] = useState<Record<string, WordProgress>>({});

  useEffect(() => {
    if (!storageKey) { setWordProgress({}); return; }
    AsyncStorage.getItem(storageKey).then(raw => {
      setWordProgress(raw ? JSON.parse(raw) : {});
    });
  }, [storageKey]);

  const reload = useCallback(async () => {
    if (!storageKey) return;
    const raw = await AsyncStorage.getItem(storageKey);
    setWordProgress(raw ? JSON.parse(raw) : {});
  }, [storageKey]);

  const recordWordResult = useCallback(async (wordId: string, correct: boolean) => {
    if (!storageKey) return;
    const prev = wordProgress[wordId] ?? { strength: 0, lastSeen: 0, timesCorrect: 0, timesWrong: 0 };
    const updated: WordProgress = {
      strength: correct ? Math.min(5, prev.strength + 1) : Math.max(0, prev.strength - 1),
      lastSeen: Date.now(),
      timesCorrect: prev.timesCorrect + (correct ? 1 : 0),
      timesWrong: prev.timesWrong + (correct ? 0 : 1),
    };
    const newProgress = { ...wordProgress, [wordId]: updated };
    setWordProgress(newProgress);
    await AsyncStorage.setItem(storageKey, JSON.stringify(newProgress));
  }, [wordProgress, storageKey]);

  // Pick `count` items from `vocab` using spaced-repetition priority.
  // Never-seen and overdue words are shown first; words not yet due are deprioritized.
  const getSmartItems = useCallback((count: number, vocab: VocabItem[]): VocabItem[] => {
    if (vocab.length <= count) return [...vocab].sort(() => Math.random() - 0.5);
    const now = Date.now();
    const scored = vocab.map(v => {
      const wp = wordProgress[v.id];
      if (!wp || wp.timesCorrect === 0) {
        // Never seen — highest priority (score = -Infinity-ish)
        return { item: v, score: -Number.MAX_SAFE_INTEGER + Math.random() };
      }
      const interval = SR_INTERVALS_MS[Math.min(wp.strength, 5)];
      const dueIn = (wp.lastSeen + interval) - now; // negative = overdue
      return { item: v, score: dueIn };
    });
    scored.sort((a, b) => a.score - b.score);
    // Take top 1.5× candidates for slight variety, then shuffle and slice
    const pool = scored.slice(0, Math.ceil(count * 1.5));
    pool.sort(() => Math.random() - 0.5);
    return pool.slice(0, count).map(x => x.item);
  }, [wordProgress]);

  const masteryStats = useMemo((): MasteryStats => {
    const total = VOCABULARY.length;
    let mastered = 0, familiar = 0, learning = 0, unseen = 0;
    for (const v of VOCABULARY) {
      const tier = getMasteryTier(wordProgress[v.id]);
      if (tier === 'mastered') mastered++;
      else if (tier === 'familiar') familiar++;
      else if (tier === 'learning') learning++;
      else unseen++;
    }
    return { total, mastered, familiar, learning, unseen };
  }, [wordProgress]);

  return { recordWordResult, getSmartItems, masteryStats, reload };
}
