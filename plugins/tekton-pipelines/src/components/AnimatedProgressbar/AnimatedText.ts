import AnimatedSign from './AnimatedSign';
import { ANIMATED_STEP } from './AnimatedConstants';

const BLINK_STEP = 300;

export default class AnimatedText {
  
  signs: AnimatedSign[] = [];
  blinkBefore: number;
  blinkAfter: number;

  constructor(text: string, blinkBefore: number, blinkAfter: number) {
    
    this.blinkBefore = blinkBefore;
    this.blinkAfter = blinkAfter;

    for (const letter of text.split("")) {
      this.signs.push(new AnimatedSign(letter));
    }

  }

  tick() {

    if(this.blinkBefore > 0){
      this.blinkBefore -= ANIMATED_STEP;
      return;
    }


    for (const sign of this.signs) {
      if (sign.isTicking()) {
        sign.tick();
        return;
      }
    }
    
    if(this.blinkAfter > 0){
      this.blinkAfter -= ANIMATED_STEP;
      return;
    }
  }

  isTicking() {
    for (const sign of this.signs) {
      if (sign.isTicking()) {
        return true;
      }
    }
    if(this.blinkBefore > 0 || this.blinkAfter > 0){
      return true
    }

    return false;
  }


  getText() {
    let text = "";
    for (const sign of this.signs) {
      text = text.concat(sign.getLetter());
    }

    if(this.blinkBefore > 0 && Math.floor(this.blinkBefore / BLINK_STEP) % 2 === 0 ){
      text = text.concat("_")
    } else if(this.blinkAfter > 0 && Math.floor(this.blinkAfter / BLINK_STEP) % 2 === 0 ){
      text = text.concat("_")
    }

    return text;
  }

}
