// Sentence illustration registry — one require() per scene image.
//
// To replace an emoji scene with a real image:
//   1. Drop your file into: assets/illustrations/sentences/<filename>.png
//   2. Add a matching line below using the Albanian sentence as the key.
//   3. Rebuild: docker compose exec game npm run build:web
//
// Keys must match the `albanian` field in src/data/sentences.ts.
// When an entry exists here it overrides the emoji illustration automatically.

export const SENTENCE_IMAGES: Record<string, any> = {
  // 'Macja pi qumësht':       require('../../assets/illustrations/sentences/cat-drinks-milk.png'),
  // 'Djali luan futboll':     require('../../assets/illustrations/sentences/boy-plays-football.png'),
  // 'Vajza lexon librin':     require('../../assets/illustrations/sentences/girl-reads-book.png'),
  // 'Qeni ha mishin':         require('../../assets/illustrations/sentences/dog-eats-meat.png'),
  // 'Nëna gatuan darkën':     require('../../assets/illustrations/sentences/mom-cooks-dinner.png'),
  // 'Babi shikon televizorin':require('../../assets/illustrations/sentences/dad-watches-tv.png'),
  // 'Fëmijët luajnë në park': require('../../assets/illustrations/sentences/kids-play-park.png'),
  // 'Unë dua mollë':          require('../../assets/illustrations/sentences/i-want-apple.png'),
  // 'Ti je i mirë':           require('../../assets/illustrations/sentences/you-are-kind.png'),
  // 'Ne shkojmë në shkollë':  require('../../assets/illustrations/sentences/we-go-to-school.png'),
};
