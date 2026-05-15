// Sentence illustration registry — one require() per scene image.
//
// To replace an emoji scene with a real image:
//   1. Drop your file into: assets/illustrations/sentences/<sentence-id>.png
//   2. Uncomment (or add) the matching line below.
//   3. Rebuild: docker compose exec game npm run build:web
//
// Keys must match the `id` field in src/data/sentences.ts.
// When an entry exists here it overrides the emoji illustration automatically —
// no changes to sentences.ts needed.

export const SENTENCE_IMAGES: Record<string, any> = {
  // 'cat-milk':     require('../../assets/illustrations/sentences/cat-milk.png'),
  // 'boy-football': require('../../assets/illustrations/sentences/boy-football.png'),
  // 'girl-reads':   require('../../assets/illustrations/sentences/girl-reads.png'),
  // 'dog-meat':     require('../../assets/illustrations/sentences/dog-meat.png'),
  // 'mom-cooks':    require('../../assets/illustrations/sentences/mom-cooks.png'),
  // 'dad-tv':       require('../../assets/illustrations/sentences/dad-tv.png'),
  // 'kids-park':    require('../../assets/illustrations/sentences/kids-park.png'),
  // 'i-want-apple': require('../../assets/illustrations/sentences/i-want-apple.png'),
  // 'you-are-kind': require('../../assets/illustrations/sentences/you-are-kind.png'),
  // 'we-go-school': require('../../assets/illustrations/sentences/we-go-school.png'),
};
