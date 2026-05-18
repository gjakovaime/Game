export type GameDef = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  route: string;
};

export type Unit = {
  id: string;
  num: number;
  title: string;
  subtitle: string;
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
    title: 'Fillimi',
    subtitle: 'Mëso fjalët e para!',
    emoji: '🌱',
    color: '#FF9F43',
    colorLight: '#3A2010',
    unlockStars: 0,
    games: [
      { id: 'picture-match', title: 'Gjej Foton',   subtitle: 'Dëgjo fjalën shqip dhe gjej foton e saktë.',   emoji: '🖼️', route: '/games/picture-match' },
      { id: 'memory-match', title: 'Gjej Çiftet',  subtitle: 'Ktheji kartat dhe përputh fjalën me foton.',   emoji: '🎴', route: '/games/memory-match' },
      { id: 'name-it',      title: 'Emërtoje',     subtitle: 'Shiko foton dhe zgjidh emrin e saktë shqip.', emoji: '🏷️', route: '/games/name-it' },
      { id: 'count-match',  title: 'Numëro',       subtitle: 'Numëro sa janë dhe gjej numrin e saktë.',     emoji: '🔢', route: '/games/count-match' },
    ],
  },
  {
    id: 'unit2',
    num: 2,
    title: 'Fjalori',
    subtitle: 'Ndërtoje fjalorin!',
    emoji: '📖',
    color: '#4ECDC4',
    colorLight: '#0B2825',
    unlockStars: 8, // out of 12 max from unit1 (4 games × 3 stars)
    games: [
      { id: 'category-sort', title: 'Kategorizoji',    subtitle: 'Vendos çdo fjalë në kategorinë e duhur.', emoji: '🗂️', route: '/games/category-sort' },
      { id: 'fill-blank',    title: 'Plotëso Fjalinë', subtitle: 'Gjej fjalën që mungon në fjali.',         emoji: '✍️', route: '/games/fill-blank' },
      { id: 'word-scramble', title: 'Shkruaj Fjalën',  subtitle: 'Vendos shkronjat në rend të saktë.',     emoji: '🔤', route: '/games/word-scramble' },
    ],
  },
  {
    id: 'unit3',
    num: 3,
    title: 'Fjali',
    subtitle: 'Formulo fjali të plota!',
    emoji: '💬',
    color: '#7B7FD4',
    colorLight: '#1A1B3A',
    unlockStars: 6, // out of 9 max from unit2 (3 games × 3 stars)
    games: [
      { id: 'sentence-builder', title: 'Formulo Fjalinë', subtitle: 'Rirregulloji fjalët për të bërë fjali.', emoji: '🧩', route: '/games/sentence-builder' },
      { id: 'translate',        title: 'Përkthe',         subtitle: 'Përkthe fjalën nga shqipja në anglisht.', emoji: '💬', route: '/games/translate' },
    ],
  },
  {
    id: 'unit4',
    num: 4,
    title: 'Ekspert',
    subtitle: 'Zotëro gjuhën!',
    emoji: '🏆',
    color: '#FFD93D',
    colorLight: '#2A2208',
    unlockStars: 4, // out of 6 max from unit3 (2 games × 3 stars)
    games: [
      { id: 'math-challenge', title: 'Matematikë', subtitle: 'Zgjidh mbledhjet dhe zbatimet shqip.', emoji: '🧮', route: '/games/math-challenge' },
      { id: 'flashcard',      title: 'Flasha',     subtitle: 'Rishiko fjalët me kartela të shpejta.', emoji: '⚡', route: '/games/flashcard' },
    ],
  },
];

export const TOTAL_GAMES = UNITS.reduce((s, u) => s + u.games.length, 0);
