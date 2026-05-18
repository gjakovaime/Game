# Game Developer Notes

## Adding new vocabulary (quick reference)

### 1. Required — add to `src/data/vocabulary.ts`

```ts
{ id: 'rabbit', albanian: 'lepuri', english: 'rabbit', emoji: '🐇', category: 'animals', tier: 2 },
```

| Field | Notes |
|-------|-------|
| `id` | Unique, ASCII, lowercase. Used as AsyncStorage key and image filename stem. |
| `albanian` | Exact text passed to `speak()` and matched in `audioFiles.ts`. Must align perfectly. |
| `tier` | `1` = always unlocked · `2` = after 3 days of use · `3` = after 7 days of use |
| `category` | Must exist in `CATEGORIES` and `CAT_META` (see below) |

### 2. Optional — add a word image

Drop `<id>.png` into `assets/images/vocabulary/`, then add one line to
`src/data/vocabImages.ts`:

```ts
rabbit: require('../../assets/images/vocabulary/rabbit.png'),
```

Games fall back to the emoji if no image is found — nothing breaks without this.

### 3. Optional — add audio

Add to `WORDS` in `scripts/generate-audio.py`:

```python
"rabbit": "lepuri",   # ASCII stem → exact Albanian text
```

Then re-run the generator and rebuild. The generator rewrites `src/data/audioFiles.ts`
automatically — never edit that file by hand.

### 4. New category

- Add the string to `CATEGORIES` in `vocabulary.ts`
- Add one `CAT_META` entry in `app/games/category-sort.tsx`:

```ts
my_category: { label: 'Shqip emri', emoji: '🏷️', color: '#FF5722' },
```

---

## Content progression system

### Tier unlocks (day-based)

`TIER_UNLOCK_DAYS` in `vocabulary.ts` maps tier → days of app use required.
`recordAppOpen()` in `useProgress` records each calendar day the app is opened.
`getAvailableVocab(daysUsed)` returns only the words the player has unlocked.

Every game calls `getAvailableVocab(daysUsed)` before building a round, so new
words appear automatically once the player reaches the unlock threshold.

### Spaced repetition (SR)

`useWordProgress` tracks per-word `strength` (0–5), `lastSeen`, `timesCorrect`,
and `timesWrong` in AsyncStorage.

`getSmartItems(count, vocab)` scores each word by SR priority (overdue/unseen
first) and returns `count` items. Games call this on first load and on replay.

`recordWordResult(wordId, correct)` updates the SR state after each answer.

### Mastery tiers

| Tier | Condition |
|------|-----------|
| `new` | Never answered correctly |
| `learning` | 1–2 correct answers |
| `familiar` | 3–9 correct, or strength < 4 |
| `mastered` | ≥ 10 correct and strength ≥ 4 |

`masteryStats` from `useWordProgress` counts words in each tier and is
displayed as a segmented bar on the home screen.

---

## Adding a new game screen

1. Create `app/games/my-game.tsx`
2. Add a route entry in `src/data/units.ts` (route, id, title, emoji, unitIndex)
3. Wire SR in the component:

```ts
const { recordStars, daysUsed, loaded: progressLoaded } = useProgress();
const { recordWordResult, getSmartItems } = useWordProgress();

const [rounds, setRounds] = useState(() => buildFallback());
const didSmartInit = useRef(false);

useEffect(() => {
  if (didSmartInit.current || !progressLoaded) return;
  didSmartInit.current = true;
  const vocab = getAvailableVocab(daysUsed);
  setRounds(getSmartItems(ROUNDS, vocab).map(buildRound));
}, [progressLoaded]);

// in answer handler:
recordWordResult(round.correct.id, isCorrect);

// in handleReplay:
const vocab = getAvailableVocab(daysUsed);
setRounds(getSmartItems(ROUNDS, vocab).map(buildRound));
```

4. Call `recordStars('my-game-id', stars)` when the game ends.
