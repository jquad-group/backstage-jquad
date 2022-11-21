import { SignalCellular1Bar } from '@material-ui/icons';
import Sign, { WAIT_LETTER } from './Sign';

export class AnimatedText {
  
  signs: Sign[] = [];

  constructor(text: string) {
    for (const letter of text.split("")) {
      this.signs.push(new Sign(letter));
    }
    this.signs.push(new Sign(WAIT_LETTER));
   
  }

  tick() {
    for (const i in this.signs) {
      if (this.signs[i].isTicking()) {
        this.signs[i].tick();
        break;
      }
    }
  }

  isTicking() {
    for (const i in this.signs) {
      if (this.signs[i].isTicking()) {
        return true;
      }
    }
    return false;
  }

  getText() {
    let text = "";
    for (const s in this.signs){
      text = text.concat(this.signs[s].getLetter());
    }
   
    return text;
  }
}
