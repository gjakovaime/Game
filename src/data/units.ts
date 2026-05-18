export type GameDef = {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  emoji: string;
  route: string;
};

export type Unit = {
  id: string;
  num: number;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  emoji: string;
  color: string;
  colorLight: string;
  unlockStars: number; // min stars from PREVIOUS unit to unlock this one
  games: GameDef[];
};

export const UNITS: Unit[] = [
  {
    id: 'unit1',
    num: 1,
    title: 'Fillimi',         titleEn: 'Beginnings',
    subtitle: 'Mëso fjalët e para!', subtitleEn: 'Learn your first words!',
    emoji: '🌱',
    color: '#FF9F43',
    colorLight: '#3A2010',
    unlockStars: 0,
    games: [
      { id: 'picture-match', title: 'Gjej Foton',  titleEn: 'Picture Match',  subtitle: 'Dëgjo fjalën shqip dhe gjej foton e saktë.',   subtitleEn: 'Hear the Albanian word and find the right picture.',  emoji: '🖼️', route: '/games/picture-match' },
      { id: 'memory-match',  title: 'Gjej Çiftet', titleEn: 'Memory Match',   subtitle: 'Ktheji kartat dhe përputh fjalën me foton.',   subtitleEn: 'Flip cards to match words with pictures.',           emoji: '🎴', route: '/games/memory-match' },
      { id: 'name-it',       title: 'Emërtoje',    titleEn: 'Name It',        subtitle: 'Shiko foton dhe zgjidh emrin e saktë shqip.', subtitleEn: 'Look at the picture and pick the Albanian name.',    emoji: '🏷️', route: '/games/name-it' },
      { id: 'count-match',   title: 'Numëro',      titleEn: 'Count Match',    subtitle: 'Numëro sa janë dhe gjej numrin e saktë.',     subtitleEn: 'Count how many and find the right number.',          emoji: '🔢', route: '/games/count-match' },
    ],
  },
  {
    id: 'unit2',
    num: 2,
    title: 'Fjalori',   titleEn: 'Vocabulary',
    subtitle: 'Ndërtoje fjalorin!', subtitleEn: 'Build your vocabulary!',
    emoji: '📖',
    color: '#4ECDC4',
    colorLight: '#0B2825',
    unlockStars: 8, // out of 12 max from unit1 (4 games × 3 stars)
    games: [
      { id: 'category-sort', title: 'Kategorizoji',    titleEn: 'Sort It',         subtitle: 'Vendos çdo fjalë në kategorinë e duhur.', subtitleEn: 'Place each word in the right category.',     emoji: '🗂️', route: '/games/category-sort' },
      { id: 'fill-blank',    title: 'Plotëso Fjalinë', titleEn: 'Fill the Blank',  subtitle: 'Gjej fjalën që mungon në fjali.',         subtitleEn: 'Find the missing word in the sentence.',    emoji: '✍️', route: '/games/fill-blank' },
      { id: 'word-scramble', title: 'Shkruaj Fjalën',  titleEn: 'Word Scramble',   subtitle: 'Vendos shkronjat në rend të saktë.',      subtitleEn: 'Put the letters in the right order.',        emoji: '🔤', route: '/games/word-scramble' },
    ],
  },
  {
    id: 'unit3',
    num: 3,
    title: 'Fjali',   titleEn: 'Sentences',
    subtitle: 'Formulo fjali të plota!', subtitleEn: 'Build full sentences!',
    emoji: '💬',
    color: '#7B7FD4',
    colorLight: '#1A1B3A',
    unlockStars: 6, // out of 9 max from unit2 (3 games × 3 stars)
    games: [
      { id: 'sentence-builder', title: 'Formulo Fjalinë', titleEn: 'Sentence Builder', subtitle: 'Rirregulloji fjalët për të bërë fjali.',   subtitleEn: 'Rearrange words to make a sentence.',           emoji: '🧩', route: '/games/sentence-builder' },
      { id: 'translate',        title: 'Përkthe',         titleEn: 'Translate',        subtitle: 'Përkthe fjalën nga shqipja në anglisht.', subtitleEn: 'Translate words between Albanian and English.', emoji: '💬', route: '/games/translate' },
    ],
  },
  {
    id: 'unit4',
    num: 4,
    title: 'Ekspert',  titleEn: 'Expert',
    subtitle: 'Zotëro gjuhën!', subtitleEn: 'Master the language!',
    emoji: '🏆',
    color: '#FFD93D',
    colorLight: '#2A2208',
    unlockStars: 4, // out of 6 max from unit3 (2 games × 3 stars)
    games: [
      { id: 'math-challenge', title: 'Matematikë', titleEn: 'Math Challenge', subtitle: 'Zgjidh mbledhjet dhe zbatimet shqip.', subtitleEn: 'Solve maths problems using Albanian numbers.', emoji: '🧮', route: '/games/math-challenge' },
      { id: 'flashcard',      title: 'Flasha',     titleEn: 'Flashcards',     subtitle: 'Rishiko fjalët me kartela të shpejta.', subtitleEn: 'Review words with quick flashcards.',       emoji: '⚡', route: '/games/flashcard' },
    ],
  },
];

export const TOTAL_GAMES = UNITS.reduce((s, u) => s + u.games.length, 0);
