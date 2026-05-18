// Central UI string table. Edit values here to update all screens at once.
// 'sq' = Shqip (Albanian), 'en' = English

export const STRINGS = {
  sq: {
    back: '← Kthehu',

    home: {
      welcome: (name: string, avatar: string) => `Mirë se erdhe, ${name}! ${avatar}`,
      welcomeSub: 'Mëso shqipen duke luajtur!',
      locked: '🔒 E bllokuar',
      starsNeeded: (n: number) => `Nevojiten ${n} yje më shumë ⭐`,
      unitStars: (got: number, max: number) => `${got} / ${max} yje`,
      addPlayer: '+ Lojtar i ri',
      footer: 'Vazhdo të mësosh!',
    },

    vocab: {
      title: 'Fjalori im',
      words: 'fjalë',
      mastered: 'Zotëruar',
      familiar: 'Njohur',
      learning: 'Duke mësuar',
      unlockHint: (count: number, days: number) => `🔓 ${count} fjalë të reja shfaqen pas ${days} ditë`,
    },

    badges: {
      title: 'Arritjet e mia',
    },

    onboarding: {
      nameEmoji: '👋',
      nameTitle: 'Përshëndetje!',
      namePrompt: 'Si të quajnë ty?',
      nameHint: '(What is your name?)',
      namePlaceholder: 'Emri yt...',
      ageEmoji: '🎂',
      ageTitle: (name: string) => `Sa vjeç je, ${name}?`,
      ageHint: '(How old are you?)',
      avatarEmoji: '🪄',
      avatarTitle: 'Zgjidh karakterin!',
      avatarHint: '(Choose your character!)',
      next: 'Vazhdo →',
      start: (name: string) => `Nisja, ${name}!`,
    },

    games: {
      'picture-match': {
        instruction: 'Gjej foton e saktë! 👇',
        hint: '(Find the correct picture!)',
      },
      'memory-match': {
        instruction: 'Gjej çiftet! 🔍',
        hint: '(Match the word to its picture!)',
      },
      'name-it': {
        instruction: 'Çfarë është kjo? 👇',
        hint: '(What is this? Tap the Albanian word!)',
      },
      'count-match': {
        instruction: 'Sa ka? 🔢',
        hint: '(How many are there?)',
      },
      'category-sort': {
        instruction: 'Ku i takon? 👇',
        hint: '(Which category does it belong to?)',
      },
      'fill-blank': {
        instruction: 'Plotëso fjalinë! 👇',
        hint: '(Fill in the missing word!)',
      },
      'word-scramble': {
        instruction: 'Shkruaj fjalën! 👆',
        hint: '(Spell the word by tapping the letters!)',
        checkBtn: 'Kontrolloje!',
      },
      'sentence-builder': {
        instruction: 'Bëj fjalinë për foton! 👇',
        hint: '',
        checkBtn: 'Kontrollo! ✅',
        toastCorrect: 'Saktë! ⭐',
        toastRetry: 'Provo përsëri! 💪',
        howToPlay: 'Si luhet? 🤔',
        howToPlaySub: '(How do you play?)',
        letsGo: 'Hajde! 🚀',
        steps: [
          { emoji: '👀', main: 'Shiko foton!',         hint: 'Look at the picture!' },
          { emoji: '👆', main: 'Trokitni fjalët!',     hint: 'Tap the words!' },
          { emoji: '🧩', main: 'Bëni fjalinë!',        hint: 'Make the sentence!' },
          { emoji: '⭐', main: 'Kontrollo dhe shih!',  hint: 'Check and see!' },
        ],
      },
      'translate': {
        instruction: 'Përkthe! 💬',
        hint: '(Translate the word!)',
      },
      'flashcard': {
        instruction: 'Trokite kartën për ta kthyer! 👆',
        hint: '(Tap the card to flip it!)',
        frontLabel: '🇦🇱 Shqip',
        backLabel: '🇬🇧 English',
        tapHint: 'Trokite për anglisht →',
        noBtn: "S'di",
        yesBtn: 'Di!',
        tally: (known: number, wrong: number, left: number) => `${known} ✓  •  ${wrong} ✗  •  ${left} mbeten`,
      },
      'math-challenge': {
        instruction: 'Cila është përgjigjja? 🤔',
        hint: '(What is the answer?)',
      },
    },
  },

  en: {
    back: '← Back',

    home: {
      welcome: (name: string, avatar: string) => `Welcome, ${name}! ${avatar}`,
      welcomeSub: 'Learn Albanian by playing!',
      locked: '🔒 Locked',
      starsNeeded: (n: number) => `Need ${n} more stars ⭐`,
      unitStars: (got: number, max: number) => `${got} / ${max} stars`,
      addPlayer: '+ New player',
      footer: 'Keep learning!',
    },

    vocab: {
      title: 'My Vocabulary',
      words: 'words',
      mastered: 'Mastered',
      familiar: 'Familiar',
      learning: 'Learning',
      unlockHint: (count: number, days: number) => `🔓 ${count} new words unlock in ${days} days`,
    },

    badges: {
      title: 'My Achievements',
    },

    onboarding: {
      nameEmoji: '👋',
      nameTitle: 'Hello!',
      namePrompt: "What's your name?",
      nameHint: '(Përshëndetje!)',
      namePlaceholder: 'Your name...',
      ageEmoji: '🎂',
      ageTitle: (name: string) => `How old are you, ${name}?`,
      ageHint: '(Sa vjeç je?)',
      avatarEmoji: '🪄',
      avatarTitle: 'Choose your character!',
      avatarHint: '(Zgjidh karakterin!)',
      next: 'Continue →',
      start: (name: string) => `Let's go, ${name}!`,
    },

    games: {
      'picture-match': {
        instruction: 'Find the correct picture! 👇',
        hint: '',
      },
      'memory-match': {
        instruction: 'Find the pairs! 🔍',
        hint: '',
      },
      'name-it': {
        instruction: 'What is this? 👇',
        hint: '',
      },
      'count-match': {
        instruction: 'How many? 🔢',
        hint: '',
      },
      'category-sort': {
        instruction: 'Where does it belong? 👇',
        hint: '',
      },
      'fill-blank': {
        instruction: 'Fill in the missing word! 👇',
        hint: '',
      },
      'word-scramble': {
        instruction: 'Spell the word! 👆',
        hint: '',
        checkBtn: 'Check it!',
      },
      'sentence-builder': {
        instruction: 'Make the sentence for the picture! 👇',
        hint: '',
        checkBtn: 'Check! ✅',
        toastCorrect: 'Correct! ⭐',
        toastRetry: 'Try again! 💪',
        howToPlay: 'How to play? 🤔',
        howToPlaySub: '(Si luhet?)',
        letsGo: "Let's go! 🚀",
        steps: [
          { emoji: '👀', main: 'Look at the picture!',  hint: 'Shiko foton!' },
          { emoji: '👆', main: 'Tap the words!',        hint: 'Trokitni fjalët!' },
          { emoji: '🧩', main: 'Make the sentence!',    hint: 'Bëni fjalinë!' },
          { emoji: '⭐', main: 'Check and see!',        hint: 'Kontrollo dhe shih!' },
        ],
      },
      'translate': {
        instruction: 'Translate! 💬',
        hint: '',
      },
      'flashcard': {
        instruction: 'Tap the card to flip it! 👆',
        hint: '',
        frontLabel: '🇦🇱 Albanian',
        backLabel: '🇬🇧 English',
        tapHint: 'Tap for English →',
        noBtn: "Don't know",
        yesBtn: 'Know it!',
        tally: (known: number, wrong: number, left: number) => `${known} ✓  •  ${wrong} ✗  •  ${left} left`,
      },
      'math-challenge': {
        instruction: "What's the answer? 🤔",
        hint: '',
      },
    },
  },
} as const;

export type Lang = keyof typeof STRINGS;
export type Strings = typeof STRINGS['sq'];
