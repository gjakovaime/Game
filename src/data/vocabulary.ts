export type VocabItem = {
  id: string;
  albanian: string;
  english: string;
  emoji: string;
  category: string;
};

export const VOCABULARY: VocabItem[] = [
  // Kafshë (Animals)
  { id: 'cat', albanian: 'macja', english: 'cat', emoji: '🐱', category: 'animals' },
  { id: 'dog', albanian: 'qeni', english: 'dog', emoji: '🐶', category: 'animals' },
  { id: 'cow', albanian: 'lopa', english: 'cow', emoji: '🐮', category: 'animals' },
  { id: 'fish', albanian: 'peshku', english: 'fish', emoji: '🐟', category: 'animals' },
  { id: 'bird', albanian: 'zogu', english: 'bird', emoji: '🐦', category: 'animals' },
  { id: 'bear', albanian: 'ariu', english: 'bear', emoji: '🐻', category: 'animals' },
  { id: 'horse', albanian: 'kali', english: 'horse', emoji: '🐴', category: 'animals' },
  { id: 'frog', albanian: 'bretkosa', english: 'frog', emoji: '🐸', category: 'animals' },

  // Fruta (Fruit)
  { id: 'apple', albanian: 'molla', english: 'apple', emoji: '🍎', category: 'fruit' },
  { id: 'orange', albanian: 'portokalli', english: 'orange', emoji: '🍊', category: 'fruit' },
  { id: 'banana', albanian: 'bananja', english: 'banana', emoji: '🍌', category: 'fruit' },
  { id: 'grapes', albanian: 'rrushi', english: 'grapes', emoji: '🍇', category: 'fruit' },
  { id: 'strawberry', albanian: 'dredhëza', english: 'strawberry', emoji: '🍓', category: 'fruit' },
  { id: 'watermelon', albanian: 'shalqiu', english: 'watermelon', emoji: '🍉', category: 'fruit' },
  { id: 'cherry', albanian: 'qershia', english: 'cherry', emoji: '🍒', category: 'fruit' },
//  new entries
  { id: 'akullore', albanian: 'akullore', english: 'ice cream', emoji: '', category: 'fruit' },
  { id: 'speca', albanian: 'speca', english: 'peppers', emoji: '🍒', category: 'fruit' },
  { id: 'pilaf', albanian: 'pilaf', english: 'cherry', emoji: '🍒', category: 'fruit' },
  { id: 'cherry', albanian: 'qershia', english: 'cherry', emoji: '🍒', category: 'fruit' },
  

  // Ngjyra (Colors)
  { id: 'red', albanian: 'e kuqe', english: 'red', emoji: '🔴', category: 'colors' },
  { id: 'green', albanian: 'e gjelbër', english: 'green', emoji: '🟢', category: 'colors' },
  { id: 'blue', albanian: 'e kaltër', english: 'blue', emoji: '🔵', category: 'colors' },
  { id: 'yellow', albanian: 'e verdhë', english: 'yellow', emoji: '🟡', category: 'colors' },
  { id: 'purple', albanian: 'e vjollcë', english: 'purple', emoji: '🟣', category: 'colors' },
  { id: 'orange_c', albanian: 'e portokall', english: 'orange', emoji: '🟠', category: 'colors' },

  // Familja (Family)
  { id: 'mom', albanian: 'nëna', english: 'mom', emoji: '👩', category: 'family' },
  { id: 'dad', albanian: 'babi', english: 'dad', emoji: '👨', category: 'family' },
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
