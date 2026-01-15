// @ts-check
import { Mode1UpLit } from './Mode1UpLit.js';
import { DragScrollable } from './DragScrollable.js';
import { ModeAbstract } from './ModeAbstract.js';
import { onScrollUp } from './utils.js';
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

export class Mode1Up extends ModeAbstract {
  name = '1up'

  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    super();
    this.br = br;
    this.book = bookModel;
    this.mode1UpLit = new Mode1UpLit(bookModel, br);

    /** @private */
    this.$el = $(this.mode1UpLit)
      // We CANNOT use `br-mode-1up` as a class, because it's the same
      // as the name of the web component, and the webcomponents polyfill
      // uses the name of component as a class for style scoping 😒
      .addClass('br-mode-1up__root BRmode1up')
      .on('scroll', onScrollUp(this.br.fader));

    /** Has mode1up ever been rendered before? */
    this.everShown = false;
  }

  // TODO: Might not need this anymore? Might want to delete.
  /** @private */
  get $brContainer() { return this.br.refs.$brContainer; }

  get scrollContainer() {
    return this.mode1UpLit;
  }

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
        this.mode1UpLit.initFirstRender(startLeaf);
        this.everShown = true;
        this.mode1UpLit.requestUpdate();
        await this.mode1UpLit.updateComplete;
        new DragScrollable(this.mode1UpLit, {
          preventDefault: true,
          dragSelector: '.br-mode-1up__visible-world',
          // Only handle mouse events; let browser/interact.js handle touch
          dragstart: 'mousedown',
          dragcontinue: 'mousemove',
          dragend: 'mouseup',
        });
      }
      this.mode1UpLit.jumpToIndex(startLeaf);
      setTimeout(() => {
        // Must explicitly call updateVisibleRegion, since no
        // scroll event seems to fire.
        this.mode1UpLit.updateVisibleRegion();
      });
    });
    this.br.updateBrClasses();
  }

  /**
   * BREAKING CHANGE: No longer supports pageX/pageY
   * @param {PageIndex} index
   * @param {object} options
   * @param {number} [options.pageX] x position on the page (in pixels) to center on
   * @param {number} [options.pageY] y position on the page (in pixels) to center on
   * @param {boolean} [options.noAnimate]
   */
  jumpToIndex(index, {pageX = 0, pageY = 0, noAnimate = false} = {}) {
    // Only smooth for small distances
    const distance = Math.abs(this.br.currentIndex() - index);
    const smooth = !noAnimate && distance > 0 && distance <= 4;
    this.mode1UpLit.jumpToIndex(index, { smooth });
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    switch (direction) {
    case 'in':
      this.mode1UpLit.zoomIn();
      break;
    case 'out':
      this.mode1UpLit.zoomOut();
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
    this.mode1UpLit.htmlDimensionsCacher.updateClientSizes();
    this.mode1UpLit.requestUpdate();
  }
}
