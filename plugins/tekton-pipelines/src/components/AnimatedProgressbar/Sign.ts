export const WAIT_LETTER: string = '_';
const LETTER_HALF_TIME = 100;
const WAITING_HALF_TIME = 1200;

export const ANIMATED_STEP = 10;

export default class Sign {
  letter: string;
  ticks: number = 0;
  limit: number = 0;

  constructor(letter: string) {
    this.letter = letter;
    this.reset();
  }

  reset() {
    this.ticks = 0;
    const halfTime = this.isWaitingSign()
      ? WAITING_HALF_TIME
      : LETTER_HALF_TIME;
    this.limit = halfTime + Math.floor(Math.random() * halfTime);
  }

  getLetter() {
    if (this.isWaitingSign()) {
      this.isTicking() || (this.ticks / 400) % 2 === 1 ? '' : WAIT_LETTER;
    }

    return this.isTicking() ? "" : this.letter;
  }

  isWaitingSign() {
    return this.letter === WAIT_LETTER;
  }

  isTicking() {
    return this.ticks < this.limit;
  }

  tick() {
    this.ticks += ANIMATED_STEP;
  }
}
