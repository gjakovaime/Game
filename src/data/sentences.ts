import { ImageSourcePropType } from 'react-native';

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
  albanian: string;
  illustration: Illustration;
};

export const SENTENCES: Sentence[] = [
  { albanian: 'Macja pi qumësht',          illustration: { type: 'emoji', emojis: ['🐱', '🥛'], bgColor: '#FFF3E0' } },
  { albanian: 'Djali luan futboll',         illustration: { type: 'emoji', emojis: ['👦', '⚽', '🏃'], bgColor: '#E8F5E9' } },
  { albanian: 'Vajza lexon librin',         illustration: { type: 'emoji', emojis: ['👧', '📖', '✨'], bgColor: '#E3F2FD' } },
  { albanian: 'Qeni ha mishin',             illustration: { type: 'emoji', emojis: ['🐶', '🍖', '😋'], bgColor: '#FFF8E1' } },
  { albanian: 'Nëna gatuan darkën',         illustration: { type: 'emoji', emojis: ['👩‍🍳', '🍲', '🔥'], bgColor: '#FCE4EC' } },
  { albanian: 'Babi shikon televizorin',    illustration: { type: 'emoji', emojis: ['👨', '📺', '🛋️'], bgColor: '#EDE7F6' } },
  { albanian: 'Fëmijët luajnë në park',    illustration: { type: 'emoji', emojis: ['👧', '👦', '🌳', '🎉'], bgColor: '#E0F7FA' } },
  { albanian: 'Unë dua mollë',             illustration: { type: 'emoji', emojis: ['😊', '🍎', '❤️'], bgColor: '#FFF9C4' } },
  { albanian: 'Ti je i mirë',              illustration: { type: 'emoji', emojis: ['😊', '🌟', '💛'], bgColor: '#F3E5F5' } },
  { albanian: 'Ne shkojmë në shkollë',     illustration: { type: 'emoji', emojis: ['🎒', '🏫', '☀️'], bgColor: '#E8EAF6' } },
];

export function getRandomSentences(count: number): Sentence[] {
  const shuffled = [...SENTENCES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
