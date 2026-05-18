import { ImageSourcePropType } from 'react-native';
import { TIER_UNLOCK_DAYS } from './vocabulary';

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
  tier: 1 | 2 | 3;
};

export const SENTENCES: Sentence[] = [
  { albanian: 'Macja pi qumësht',          illustration: { type: 'emoji', emojis: ['🐱', '🥛'], bgColor: '#FFF3E0' },           tier: 1 },
  { albanian: 'Djali luan futboll',         illustration: { type: 'emoji', emojis: ['👦', '⚽', '🏃'], bgColor: '#E8F5E9' },      tier: 1 },
  { albanian: 'Vajza lexon librin',         illustration: { type: 'emoji', emojis: ['👧', '📖', '✨'], bgColor: '#E3F2FD' },      tier: 1 },
  { albanian: 'Qeni ha mishin',             illustration: { type: 'emoji', emojis: ['🐶', '🍖', '😋'], bgColor: '#FFF8E1' },      tier: 1 },
  { albanian: 'Nëna gatuan darkën',         illustration: { type: 'emoji', emojis: ['👩‍🍳', '🍲', '🔥'], bgColor: '#FCE4EC' },   tier: 1 },
  { albanian: 'Babi shikon televizorin',    illustration: { type: 'emoji', emojis: ['👨', '📺', '🛋️'], bgColor: '#EDE7F6' },     tier: 1 },
  { albanian: 'Unë dua mollë',             illustration: { type: 'emoji', emojis: ['😊', '🍎', '❤️'], bgColor: '#FFF9C4' },      tier: 1 },
  { albanian: 'Ti je i mirë',              illustration: { type: 'emoji', emojis: ['😊', '🌟', '💛'], bgColor: '#F3E5F5' },       tier: 1 },
  { albanian: 'Fëmijët luajnë në park',    illustration: { type: 'emoji', emojis: ['👧', '👦', '🌳', '🎉'], bgColor: '#E0F7FA' }, tier: 2 },
  { albanian: 'Ne shkojmë në shkollë',     illustration: { type: 'emoji', emojis: ['🎒', '🏫', '☀️'], bgColor: '#E8EAF6' },      tier: 2 },
];

export function getAvailableSentences(daysUsed: number, count: number): Sentence[] {
  const pool = SENTENCES.filter(s => TIER_UNLOCK_DAYS[s.tier] <= daysUsed);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export function getRandomSentences(count: number): Sentence[] {
  return getAvailableSentences(0, count);
}
