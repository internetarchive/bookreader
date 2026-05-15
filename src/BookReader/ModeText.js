// @ts-check
import { ModeAbstract } from './ModeAbstract.js';
import { ModeTextLit } from './ModeTextLit.js';
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

export class ModeText extends ModeAbstract {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    super();
    this.br = br;
    this.book = bookModel;
    this.modeTextLit = new ModeTextLit(bookModel, br);

    /** @private */
    this.$el = $(this.modeTextLit)
      // We CANNOT use the tag name as a class, because it's the same
      // as the name of the web component, and the webcomponents polyfill
      // uses the name of component as a class for style scoping 😒
      .addClass('br-mode-text__root BRmodeText');

    /** Has this mode ever been rendered before? */
    this.everShown = false;
  }

  /**
   * This is called when we switch to this mode
   */
  prepare() {
    const startLeaf = this.br.currentIndex();
    this.br.refs.$brContainer
      .empty()
      .css({ overflow: 'hidden' })
      .append(this.$el);

    // Need this in a setTimeout so that it happens after the browser has _actually_
    // appended the element to the DOM
    setTimeout(async () => {
      if (!this.everShown) {
        this.everShown = true;
        this.modeTextLit.requestUpdate();
        await this.modeTextLit.updateComplete;
      }
      this.modeTextLit.jumpToIndex(startLeaf);
      console.log('Jumping to index', startLeaf);
    // Not sure why we need this fudge-factor here ; without it, it fails to jumpToIndex
    // on first render
    }, 200);
    this.br.updateBrClasses();
  }

  /**
   * @param {PageIndex} index
   * @param {number} [pageX] x position on the page (in pixels) to center on
   * @param {number} [pageY] y position on the page (in pixels) to center on
   * @param {boolean} [noAnimate]
   */
  jumpToIndex(index, pageX, pageY, noAnimate) {
    // Only smooth for small distances
    const distance = Math.abs(this.br.currentIndex() - index);
    const smooth = !noAnimate && distance > 0 && distance <= 4;
    this.modeTextLit.jumpToIndex(index, { smooth });
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    throw new Error('Not implemented');
    switch (direction) {
    case 'in':
      this.modeTextLit.zoomIn();
      break;
    case 'out':
      this.modeTextLit.zoomOut();
      break;
    default:
      console.error(`Unsupported direction: ${direction}`);
    }
  }
}
