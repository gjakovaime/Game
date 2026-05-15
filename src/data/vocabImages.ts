// Vocabulary image registry — one require() per word image.
//
// To add an image for a vocabulary word:
//   1. Drop your file into: assets/images/vocabulary/<item-id>.png
//   2. Add one line below:  <item-id>: require('../../assets/images/vocabulary/<item-id>.png'),
//   3. Rebuild:             docker compose exec game npm run build:web
//
// Keys must match the `id` field in src/data/vocabulary.ts.
// If no entry exists for an item, the game falls back to the emoji.

export const VOCAB_IMAGES: Record<string, any> = {
  // animals
  // cat:     require('../../assets/images/vocabulary/cat.png'),
  // dog:     require('../../assets/images/vocabulary/dog.png'),
  // cow:     require('../../assets/images/vocabulary/cow.png'),
  // fish:    require('../../assets/images/vocabulary/fish.png'),
  // bird:    require('../../assets/images/vocabulary/bird.png'),
  // bear:    require('../../assets/images/vocabulary/bear.png'),
  // horse:   require('../../assets/images/vocabulary/horse.png'),
  // frog:    require('../../assets/images/vocabulary/frog.png'),
  // fruit
  // apple:        require('../../assets/images/vocabulary/apple.png'),
  // orange:       require('../../assets/images/vocabulary/orange.png'),
  // banana:       require('../../assets/images/vocabulary/banana.png'),
  // grapes:       require('../../assets/images/vocabulary/grapes.png'),
  // strawberry:   require('../../assets/images/vocabulary/strawberry.png'),
  // watermelon:   require('../../assets/images/vocabulary/watermelon.png'),
  // cherry:       require('../../assets/images/vocabulary/cherry.png'),
  // colors
  // red:          require('../../assets/images/vocabulary/red.png'),
  // green:        require('../../assets/images/vocabulary/green.png'),
  // blue:         require('../../assets/images/vocabulary/blue.png'),
  // yellow:       require('../../assets/images/vocabulary/yellow.png'),
  // purple:       require('../../assets/images/vocabulary/purple.png'),
  // orange_c:     require('../../assets/images/vocabulary/orange_c.png'),
  // family
  // mom:      require('../../assets/images/vocabulary/mom.png'),
  // dad:      require('../../assets/images/vocabulary/dad.png'),
  // brother:  require('../../assets/images/vocabulary/brother.png'),
  // sister:   require('../../assets/images/vocabulary/sister.png'),
  // grandma:  require('../../assets/images/vocabulary/grandma.png'),
  // grandpa:  require('../../assets/images/vocabulary/grandpa.png'),
};
