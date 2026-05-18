# Albanian Adventures — Docker Commands

## Quick Start

Build the image and start the web app:

```bash
docker compose up --build -d
```

Open **http://localhost:8081** in your browser.

---

## Day-to-Day Commands

| Task | Command |
|------|---------|
| Start (after first build) | `docker compose up -d` |
| Stop | `docker compose down` |
| Rebuild & start | `docker compose up --build -d` |
| View live logs | `docker compose logs -f game` |
| Open shell in container | `docker compose exec game sh` |
| Remove everything incl. volumes | `docker compose down -v` |

---

## Adding npm Packages

Packages installed with `docker compose exec` only live in the running container and are lost on rebuild. The correct workflow:

```bash
# 1. Install into the running container
docker compose exec game npx expo install <package-name>

# 2. Copy the updated lock file back to the host
docker compose cp game:/app/package-lock.json ./package-lock.json

# 3. Rebuild the image so the package is baked in permanently
docker compose up --build -d
```

---

## Rebuilding the Web Bundle

The static web bundle is baked into the Docker image at build time.

**When to just refresh the browser** — edits to files in `src/`, `app/`, or
`assets/` are mounted into the running container, so a browser refresh picks
them up for most changes.

**When to rebuild the bundle** — any change that affects bundled output (new
dependencies, new `require()` calls for images or audio, new game screens):

```bash
# Option A — full image rebuild (slowest, cleanest)
docker compose up --build -d

# Option B — rebuild bundle inside the running container (faster)
docker compose exec game npm run build:web
# then refresh the browser
```

---

## How Audio Works

The app has two audio modes that switch automatically:

| Mode | When | What you hear |
|------|------|---------------|
| **Browser TTS** | No MP3s generated yet | expo-speech reads Albanian words aloud |
| **Pre-generated MP3** | After running the generator | High-quality Meta MMS-TTS voice |

### The wiring (how a word goes from game → speaker)

```
Game calls:  speak('mollë')
                 ↓
useSpeech.ts looks up:  AUDIO_FILES['mollë']
                 ↓
    ┌─ found ──────────────────────────────────────────────┐
    │  expo-av plays:  assets/audio/words/molle.mp3        │
    └──────────────────────────────────────────────────────┘
    ┌─ not found (empty map) ──────────────────────────────┐
    │  expo-speech speaks 'mollë' in Albanian via browser  │
    └──────────────────────────────────────────────────────┘
```

### The three files involved

| File | Role | Edit it? |
|------|------|----------|
| `scripts/generate-audio.py` | Lists every word/sentence to synthesise | Yes — add words here |
| `src/data/audioFiles.ts` | Maps Albanian text → MP3 require() | **Never** — auto-generated |
| `assets/audio/words/*.mp3` | The actual audio files | Replace with native recordings |

### Key rule — text must match exactly

The lookup key in `audioFiles.ts` is the **Albanian text string** the game
passes to `speak()`, which comes from `vocabulary.ts`. For example:

```
vocabulary.ts:    { albanian: 'mollë', ... }
game calls:       speak('mollë')
audioFiles.ts:    'mollë': require('../../assets/audio/words/molle.mp3')
```

The Python script uses `molle` as the filename (no diacritics, safe for
filesystems) but the TS key is the full Albanian text with diacritics. The
generator handles this mapping — you just need to keep the text values in
`WORDS` aligned with the `albanian` fields in `vocabulary.ts`.

---

## Generating Audio (requires NVIDIA GPU)

### Prerequisites
- NVIDIA GPU with drivers installed on the host (no host CUDA needed)
- Docker Desktop with GPU support enabled (Settings → Resources → GPU)

### Step 1 — Generate the MP3s

```bash
docker compose --profile audio run --rm generate-audio
```

This:
1. Downloads `facebook/mms-tts-sqi` (~400 MB, cached after first run)
2. Synthesises every word, sentence, and phrase
3. Saves MP3s into `assets/audio/words/`, `sentences/`, `praises/`
4. **Auto-writes `src/data/audioFiles.ts`** with the correct require() map

### Step 2 — Rebuild the web bundle

```bash
docker compose up --build -d
```

Or without restarting:

```bash
docker compose exec game npm run build:web
```

Then refresh the browser — words are now spoken by the pre-generated voice.

### Step 3 (optional) — Replace with native speaker recordings

Drop any `.mp3` replacement into the same folder with the same filename, then
rebuild. The filename list is in `assets/audio/words/` after generation. The
`audioFiles.ts` map will already point to the right file — no code changes
needed.

### Adding new words

See [Adding New Vocabulary](#adding-new-vocabulary) below for full details.
Quick version: add to `vocabulary.ts`, add to `WORDS` in `generate-audio.py`, re-run the generator, rebuild.

---

## Adding New Vocabulary

All vocabulary lives in one file: **`src/data/vocabulary.ts`**. Everything else
(games, spaced repetition, mastery tracking, audio, images) reads from it
automatically.

### The data shape

```ts
type VocabItem = {
  id:       string;      // unique key — used for progress storage, image filenames
  albanian: string;      // the Albanian word, shown in games and used as TTS key
  english:  string;      // English translation
  emoji:    string;      // fallback display when no image file exists
  category: string;      // 'animals' | 'fruit' | 'colors' | 'family' (or new — see below)
  tier:     1 | 2 | 3;  // controls when the word unlocks (see tier table below)
};
```

### Tier unlock schedule

| Tier | Unlocks after | Use for |
|------|--------------|---------|
| `1`  | Day 0 (always) | Core beginner words |
| `2`  | 3 days of app use | Intermediate words |
| `3`  | 7 days of app use | Advanced / less common words |

Games only show words the player has unlocked, so tier controls pacing without
any extra code. To add a new tier, add an entry to `TIER_UNLOCK_DAYS` in
`vocabulary.ts` and use the new tier number on your words.

### Minimum required change — just the word

Add one object to the `VOCABULARY` array in `src/data/vocabulary.ts`:

```ts
{ id: 'rabbit', albanian: 'lepuri', english: 'rabbit', emoji: '🐇', category: 'animals', tier: 2 },
```

Rules for `id`:
- lowercase, no spaces, ASCII only (e.g. `orange_color` not `ngjyra-portokalli`)
- must be unique across all items
- used as the filename stem for images (`assets/images/vocabulary/rabbit.png`)

That's it. The word appears in all games immediately, using the emoji as its
picture. Spaced repetition, mastery tracking, and progress saving work
automatically.

### Optional: add an image

Drop a square PNG into `assets/images/vocabulary/` named after the word's `id`,
then uncomment (or add) one line in `src/data/vocabImages.ts`:

```ts
rabbit: require('../../assets/images/vocabulary/rabbit.png'),
```

The games (picture-match, name-it, memory-match) will use the image instead of
the emoji automatically. No other files need editing.

### Optional: add audio

1. Add an entry to `WORDS` in `scripts/generate-audio.py`:
   ```python
   "rabbit": "lepuri",          # "filename_stem": "Albanian text"
   ```
   The stem is ASCII (no diacritics). The value must match `albanian` in
   `vocabulary.ts` exactly.

2. Re-run the audio generator (skips files that already exist):
   ```bash
   docker compose --profile audio run --rm generate-audio
   ```

3. Rebuild the bundle:
   ```bash
   docker compose up --build -d
   ```

### Adding a new category

1. Add words to `vocabulary.ts` with the new `category` string.
2. Add the string to the `CATEGORIES` constant at the bottom of `vocabulary.ts`:
   ```ts
   export const CATEGORIES = ['animals', 'fruit', 'colors', 'family', 'your_new_category'] as const;
   ```
3. Add one entry to `CAT_META` in `app/games/category-sort.tsx` so the sort
   game knows what label, emoji, and color to display:
   ```ts
   your_new_category: { label: 'Shqip Label', emoji: '🏷️', color: '#FF5722' },
   ```

No other game files need touching — distractor selection and filtering are
driven by the `category` field automatically.

---

## Port

The app runs on **port 8081** by default. To change it, edit `docker-compose.yml`:

```yaml
ports:
  - "3000:8081"   # host:container — change the left side only
```
