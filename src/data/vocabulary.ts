export type VocabItem = {
  id: string;
  albanian: string;
  english: string;
  emoji: string;
  category: string;
};

export const VOCABULARY: VocabItem[] = [
  // Kafshë (Animals)
  { id: 'cat', albanian: 'mace', english: 'cat', emoji: '🐱', category: 'animals' },
  { id: 'dog', albanian: 'qen', english: 'dog', emoji: '🐶', category: 'animals' },
  { id: 'cow', albanian: 'lopë', english: 'cow', emoji: '🐮', category: 'animals' },
  { id: 'fish', albanian: 'peshk', english: 'fish', emoji: '🐟', category: 'animals' },
  { id: 'bird', albanian: 'zog', english: 'bird', emoji: '🐦', category: 'animals' },
  { id: 'bear', albanian: 'ari', english: 'bear', emoji: '🐻', category: 'animals' },
  { id: 'horse', albanian: 'kalë', english: 'horse', emoji: '🐴', category: 'animals' },
  { id: 'frog', albanian: 'bretkosë', english: 'frog', emoji: '🐸', category: 'animals' },

  // Fruta (Fruit)
  { id: 'apple', albanian: 'mollë', english: 'apple', emoji: '🍎', category: 'fruit' },
  { id: 'orange', albanian: 'portokall', english: 'orange', emoji: '🍊', category: 'fruit' },
  { id: 'banana', albanian: 'banane', english: 'banana', emoji: '🍌', category: 'fruit' },
  { id: 'grapes', albanian: 'rrush', english: 'grapes', emoji: '🍇', category: 'fruit' },
  { id: 'strawberry', albanian: 'dredhëz', english: 'strawberry', emoji: '🍓', category: 'fruit' },
  { id: 'watermelon', albanian: 'shalqi', english: 'watermelon', emoji: '🍉', category: 'fruit' },
  { id: 'cherry', albanian: 'qershi', english: 'cherry', emoji: '🍒', category: 'fruit' },
  

  // Ngjyra (Colors)
  { id: 'red', albanian: 'e kuq', english: 'red', emoji: '🔴', category: 'colors' },
  { id: 'green', albanian: 'e gjelbër', english: 'green', emoji: '🟢', category: 'colors' },
  { id: 'blue', albanian: 'e kaltër', english: 'blue', emoji: '🔵', category: 'colors' },
  { id: 'yellow', albanian: 'e verdhë', english: 'yellow', emoji: '🟡', category: 'colors' },
  { id: 'purple', albanian: 'e vjollcë', english: 'purple', emoji: '🟣', category: 'colors' },
  { id: 'orange_c', albanian: 'e portokall', english: 'orange', emoji: '🟠', category: 'colors' },

  // Familja (Family)
  { id: 'mom', albanian: 'nëna', english: 'mom', emoji: '👩', category: 'family' },
  { id: 'dad', albanian: 'baba', english: 'dad', emoji: '👨', category: 'family' },
  { id: 'brother', albanian: 'vëllai', english: 'brother', emoji: '👦', category: 'family' },
  { id: 'sister', albanian: 'motra', english: 'sister', emoji: '👧', category: 'family' },
  { id: 'grandma', albanian: 'gjyshja', english: 'grandma', emoji: '👵', category: 'family' },
  { id: 'grandpa', albanian: 'gjyshi', english: 'grandpa', emoji: '👴', category: 'family' },
];

export const CATEGORIES = ['animals', 'fruit', 'colors', 'family'] as const;

export function getByCategory(category: string): VocabItem[] {
  return VOCABULARY.filter((v) => v.category === category);
}

export function getDistractors(correct: VocabItem, count = 3): VocabItem[] {
  const pool = getByCategory(correct.category).filter((v) => v.id !== correct.id);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomItems(count: number): VocabItem[] {
  const shuffled = [...VOCABULARY].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
