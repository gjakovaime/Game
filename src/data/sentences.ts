import { ImageSourcePropType } from 'react-native';

// ─── Illustration types ───────────────────────────────────────────────────────
// To swap a sentence from emoji to a real image:
//   1. Drop your PNG into: assets/illustrations/sentences/<filename>.png
//   2. Change `type: 'emoji'` to `type: 'image'`
//   3. Uncomment and set the `source` field with require(...)
//   4. Remove the `emojis` field (or keep it as fallback metadata)
//
// Example:
//   illustration: {
//     type: 'image',
//     source: require('../../assets/illustrations/sentences/cat-drinks-milk.png'),
//     bgColor: '#FFF3E0',
//   }

type EmojiScene = {
  type: 'emoji';
  emojis: string[];
  bgColor: string;
};

type ImageScene = {
  type: 'image';
  source: ImageSourcePropType;
  bgColor: string;
};

export type Illustration = EmojiScene | ImageScene;

export type Sentence = {
  id: string;
  albanian: string;
  words: string[];         // correct word order for validation
  illustration: Illustration;
  // Asset filename hint (for reference when swapping to images):
  // imageFile: string;
};

// ─── Sentence data ────────────────────────────────────────────────────────────

export const SENTENCES: Sentence[] = [
  {
    id: 'cat-milk',
    albanian: 'Macja pi qumësht',
    words: ['Macja', 'pi', 'qumësht'],
    // imageFile: 'cat-drinks-milk.png'
    // To use image: change type to 'image', add source: require('../../assets/illustrations/sentences/cat-drinks-milk.png')
    illustration: { type: 'emoji', emojis: ['🐱', '🥛'], bgColor: '#FFF3E0' },
  },
  {
    id: 'boy-football',
    albanian: 'Djali luan futboll',
    words: ['Djali', 'luan', 'futboll'],
    // imageFile: 'boy-plays-football.png'
    illustration: { type: 'emoji', emojis: ['👦', '⚽', '🏃'], bgColor: '#E8F5E9' },
  },
  {
    id: 'girl-reads',
    albanian: 'Vajza lexon librin',
    words: ['Vajza', 'lexon', 'librin'],
    // imageFile: 'girl-reads-book.png'
    illustration: { type: 'emoji', emojis: ['👧', '📖', '✨'], bgColor: '#E3F2FD' },
  },
  {
    id: 'dog-meat',
    albanian: 'Qeni ha mishin',
    words: ['Qeni', 'ha', 'mishin'],
    // imageFile: 'dog-eats-meat.png'
    illustration: { type: 'emoji', emojis: ['🐶', '🍖', '😋'], bgColor: '#FFF8E1' },
  },
  {
    id: 'mom-cooks',
    albanian: 'Nëna gatuan darkën',
    words: ['Nëna', 'gatuan', 'darkën'],
    // imageFile: 'mom-cooks-dinner.png'
    illustration: { type: 'emoji', emojis: ['👩‍🍳', '🍲', '🔥'], bgColor: '#FCE4EC' },
  },
  {
    id: 'dad-tv',
    albanian: 'Babi shikon televizorin',
    words: ['Babi', 'shikon', 'televizorin'],
    // imageFile: 'dad-watches-tv.png'
    illustration: { type: 'emoji', emojis: ['👨', '📺', '🛋️'], bgColor: '#EDE7F6' },
  },
  {
    id: 'kids-park',
    albanian: 'Fëmijët luajnë në park',
    words: ['Fëmijët', 'luajnë', 'në', 'park'],
    // imageFile: 'kids-play-in-park.png'
    illustration: { type: 'emoji', emojis: ['👧', '👦', '🌳', '🎉'], bgColor: '#E0F7FA' },
  },
  {
    id: 'i-want-apple',
    albanian: 'Unë dua mollë',
    words: ['Unë', 'dua', 'mollë'],
    // imageFile: 'i-want-apple.png'
    illustration: { type: 'emoji', emojis: ['😊', '🍎', '❤️'], bgColor: '#FFF9C4' },
  },
  {
    id: 'you-are-kind',
    albanian: 'Ti je i mirë',
    words: ['Ti', 'je', 'i', 'mirë'],
    // imageFile: 'you-are-kind.png'
    illustration: { type: 'emoji', emojis: ['😊', '🌟', '💛'], bgColor: '#F3E5F5' },
  },
  {
    id: 'we-go-school',
    albanian: 'Ne shkojmë në shkollë',
    words: ['Ne', 'shkojmë', 'në', 'shkollë'],
    // imageFile: 'we-go-to-school.png'
    illustration: { type: 'emoji', emojis: ['🎒', '🏫', '☀️'], bgColor: '#E8EAF6' },
  },
];

export function getRandomSentences(count: number): Sentence[] {
  const shuffled = [...SENTENCES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
