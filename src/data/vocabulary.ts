export type VocabItem = {
  id: string;
  albanian: string;
  english: string;
  emoji: string;
  category: string;
  tier: 1 | 2 | 3;
};

// Days of app use required to unlock each content tier
export const TIER_UNLOCK_DAYS: Record<number, number> = { 1: 0, 2: 3, 3: 7 };

export const VOCABULARY: VocabItem[] = [
  // ── Kafshë (Animals) — tier 1 ──────────────────────────────────────
  { id: 'cat',        albanian: 'macja',      english: 'cat',         emoji: '🐱', category: 'animals', tier: 1 },
  { id: 'dog',        albanian: 'qeni',       english: 'dog',         emoji: '🐶', category: 'animals', tier: 1 },
  { id: 'cow',        albanian: 'lopa',       english: 'cow',         emoji: '🐮', category: 'animals', tier: 1 },
  { id: 'fish',       albanian: 'peshku',     english: 'fish',        emoji: '🐟', category: 'animals', tier: 1 },
  { id: 'bird',       albanian: 'zogu',       english: 'bird',        emoji: '🐦', category: 'animals', tier: 1 },
  { id: 'bear',       albanian: 'ariu',       english: 'bear',        emoji: '🐻', category: 'animals', tier: 1 },
  { id: 'horse',      albanian: 'kali',       english: 'horse',       emoji: '🐴', category: 'animals', tier: 1 },
  { id: 'frog',       albanian: 'bretkosa',   english: 'frog',        emoji: '🐸', category: 'animals', tier: 1 },

  // ── Fruta (Fruit/Food) — tier 1 ────────────────────────────────────
  { id: 'apple',      albanian: 'molla',      english: 'apple',       emoji: '🍎', category: 'fruit', tier: 1 },
  { id: 'orange',     albanian: 'portokalli', english: 'orange',      emoji: '🍊', category: 'fruit', tier: 1 },
  { id: 'banana',     albanian: 'bananja',    english: 'banana',      emoji: '🍌', category: 'fruit', tier: 1 },
  { id: 'grapes',     albanian: 'rrushi',     english: 'grapes',      emoji: '🍇', category: 'fruit', tier: 1 },
  { id: 'strawberry', albanian: 'dredhëza',   english: 'strawberry',  emoji: '🍓', category: 'fruit', tier: 1 },
  { id: 'watermelon', albanian: 'shalqiu',    english: 'watermelon',  emoji: '🍉', category: 'fruit', tier: 1 },

  // ── Ngjyra (Colors) — tier 1 ───────────────────────────────────────
  { id: 'red',        albanian: 'e kuqe',     english: 'red',         emoji: '🔴', category: 'colors', tier: 1 },
  { id: 'green',      albanian: 'e gjelbër',  english: 'green',       emoji: '🟢', category: 'colors', tier: 1 },
  { id: 'blue',       albanian: 'e kaltër',   english: 'blue',        emoji: '🔵', category: 'colors', tier: 1 },
  { id: 'yellow',     albanian: 'e verdhë',   english: 'yellow',      emoji: '🟡', category: 'colors', tier: 1 },

  // ── Familja (Family) — tier 1 ──────────────────────────────────────
  { id: 'mom',        albanian: 'nëna',       english: 'mom',         emoji: '👩', category: 'family', tier: 1 },
  { id: 'dad',        albanian: 'babi',       english: 'dad',         emoji: '👨', category: 'family', tier: 1 },

  // ── Tier 2 — unlocks after 3 days ──────────────────────────────────
  { id: 'cherry',     albanian: 'qershia',    english: 'cherry',      emoji: '🍒', category: 'fruit',   tier: 2 },
  { id: 'akullore',   albanian: 'akullore',   english: 'ice cream',   emoji: '🍦', category: 'fruit',   tier: 2 },
  { id: 'speca',      albanian: 'speci',      english: 'peppers',     emoji: '🫑', category: 'fruit',   tier: 2 },
  { id: 'purple',     albanian: 'e vjollcë',  english: 'purple',      emoji: '🟣', category: 'colors',  tier: 2 },
  { id: 'orange_c',   albanian: 'e portokall',english: 'orange',      emoji: '🟠', category: 'colors',  tier: 2 },
  { id: 'brother',    albanian: 'vëllai',     english: 'brother',     emoji: '👦', category: 'family',  tier: 2 },
  { id: 'sister',     albanian: 'motra',      english: 'sister',      emoji: '👧', category: 'family',  tier: 2 },

  // ── Tier 3 — unlocks after 7 days ──────────────────────────────────
  { id: 'pilaf',      albanian: 'pilaf',      english: 'rice',        emoji: '🍚', category: 'fruit',   tier: 3 },
  { id: 'grandma',    albanian: 'gjyshja',    english: 'grandma',     emoji: '👵', category: 'family',  tier: 3 },
  { id: 'grandpa',    albanian: 'gjyshi',     english: 'grandpa',     emoji: '👴', category: 'family',  tier: 3 },
];

export const CATEGORIES = ['animals', 'fruit', 'colors', 'family'] as const;

export function getAvailableVocab(daysUsed: number): VocabItem[] {
  return VOCABULARY.filter(v => TIER_UNLOCK_DAYS[v.tier] <= daysUsed);
}

export function getByCategory(category: string, vocab = VOCABULARY): VocabItem[] {
  return vocab.filter((v) => v.category === category);
}

export function getDistractors(correct: VocabItem, count = 3, vocab = VOCABULARY): VocabItem[] {
  const pool = getByCategory(correct.category, vocab).filter((v) => v.id !== correct.id);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // Fill with cross-category items if same-category pool is too small
  if (shuffled.length < count) {
    const extras = vocab.filter(v => v.id !== correct.id && !shuffled.find(s => s.id === v.id));
    shuffled.push(...extras.sort(() => Math.random() - 0.5));
  }
  return shuffled.slice(0, count);
}

export function getRandomItems(count: number, vocab = VOCABULARY): VocabItem[] {
  const shuffled = [...vocab].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
