---
  Adding a new word:
  1. Add entry to src/data/vocabulary.ts
  2. Add the same word + file-id to scripts/generate-audio.py WORDS dict
  3. Run docker compose --profile audio run --rm generate-audio → generates MP3s and rewrites audioFiles.ts automatically
  4. Rebuild
  
  For any new audio files you add, the pattern is:
  1. Drop the .mp3 into assets/audio/words/
  2. Add one line to audioFiles.ts: 'albanianText': require('../../assets/audio/words/yourfile.mp3'),
  3. Run docker compose exec game npm run build:web and refresh
  That's it. useSpeech.ts is never touched again.

  ---
  Adding a real image for a sentence scene:
  1. Drop <sentence-id>.png into assets/illustrations/sentences/
  2. Uncomment the matching line in src/data/sentenceImages.ts
  3. Rebuild

  ---
  Adding a real image for a vocabulary word (picture-match / memory-match):
  1. Drop <item-id>.png into assets/images/vocabulary/
  2. Uncomment the matching line in src/data/vocabImages.ts
  3. Rebuild

  ---
  Adding a new category:
  1. Add words to vocabulary.ts with the new category string
  2. Add one CAT_META entry in app/games/category-sort.tsx (this is unavoidable — it needs a label, emoji, and color)

  The images are the main unlock here — both sentence scenes and word pictures now auto-connect just by adding a single require() line to a registry file. No touching of game logic, components, or data files.
