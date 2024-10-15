// @ts-check
import { ModeTextLit } from './ModeTextLit.js';
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

export class ModeText {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
    this.modeTextLit = new ModeTextLit(bookModel, br);

    /** @private */
    this.$el = $(this.modeTextLit)
      // We CANNOT use `br-mode-1up` as a class, because it's the same
      // as the name of the web component, and the webcomponents polyfill
      // uses the name of component as a class for style scoping 😒
      .addClass('br-mode-1up__root BRmode1up br-mode-text__root BRmodeTextLit');

    /** Has mode1up ever been rendered before? */
    this.everShown = false;
  }

  // TODO: Might not need this anymore? Might want to delete.
  /** @private */
  get $brContainer() { return this.br.refs.$brContainer; }

  /**
   * This is called when we switch to one page view
   */
  prepare() {
    const startLeaf = this.br.currentIndex();
    this.$brContainer
      .empty()
      .css({ overflow: 'hidden' })
      .append(this.$el);

    // Need this in a setTimeout so that it happens after the browser has _actually_
    // appended the element to the DOM
    setTimeout(async () => {
      if (!this.everShown) {
        this.modeTextLit.initFirstRender(startLeaf);
        this.everShown = true;
        this.modeTextLit.requestUpdate();
        await this.modeTextLit.updateComplete;
      }
      this.modeTextLit.jumpToIndex(startLeaf);
      setTimeout(() => {
        // Must explicitly call updateVisibleRegion, since no
        // scroll event seems to fire.
        this.modeTextLit.updateVisibleRegion();
      });
    });
    this.br.updateBrClasses();
  }

  /**
   * BREAKING CHANGE: No longer supports pageX/pageY
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

  /**
   * Resize the current one page view
   * Note this calls drawLeafs
   */
  resizePageView() {
    this.modeTextLit.htmlDimensionsCacher.updateClientSizes();
    this.modeTextLit.requestUpdate();
  }
}
