import { ANIMATED_STEP } from './AnimatedConstants';

const LETTER_HALF_TIME = 30;

export default class AnimatedSign {

  letter: string;
  ticks: number = 0;
  limit: number = 0;

  constructor(letter: string) {
    this.letter = letter;
    this.reset();
  }

  reset() {
    this.ticks = 0;
    this.limit =
      LETTER_HALF_TIME + Math.floor(Math.random() * LETTER_HALF_TIME);
  }

  getLetter() {
    return this.isTicking() ? '' : this.letter;
  }

  isTicking() {
    return this.ticks < this.limit;
  }

  tick() {
    this.ticks += ANIMATED_STEP;
  }
}
