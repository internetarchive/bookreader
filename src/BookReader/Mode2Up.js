// @ts-check
import { Mode2UpLit } from './Mode2UpLit.js';
import { DragScrollable } from './DragScrollable.js';
import { ModeAbstract } from './ModeAbstract.js';
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

export class Mode2Up extends ModeAbstract {
  name = '2up';

  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    super();
    this.br = br;
    this.book = bookModel;
    this.mode2UpLit = new Mode2UpLit(bookModel, br);
    this.mode2UpLit.flipSpeed = br.flipSpeed;

    /** @private */
    this.$el = $(this.mode2UpLit)
      .attr('autoFit', this.br.options.twoPage.autofit)
      // We CANNOT use `br-mode-2up` as a class, because it's the same
      // as the name of the web component, and the webcomponents polyfill
      // uses the name of component as a class for style scoping 😒
      .addClass('br-mode-2up__root BRmode2up');

    /** Has mode2up ever been rendered before? */
    this.everShown = false;
  }

  /**
   * This is called when we switch into this mode
   */
  prepare() {
    const startLeaf = this.br.currentIndex();
    this.br.refs.$brContainer
      .empty()
      .css({ overflow: 'hidden' })
      .append(this.$el);
    this.mode2UpLit.style.opacity = '0';

    // Need this in a setTimeout so that it happens after the browser has _actually_
    // appended the element to the DOM
    setTimeout(async () => {
      if (!this.everShown) {
        this.mode2UpLit.initFirstRender(startLeaf);
        this.everShown = true;
        this.mode2UpLit.requestUpdate();
        await this.mode2UpLit.updateComplete;

        new DragScrollable(this.mode2UpLit, {
          preventDefault: true,
          dragSelector: '.br-mode-2up__book',
          // Only handle mouse events; let browser/HammerJS handle touch
          dragstart: 'mousedown',
          dragcontinue: 'mousemove',
          dragend: 'mouseup',
        });
      } else {
        await this.mode2UpLit.jumpToIndex(startLeaf, { smooth: false });
        this.resizePageView();
      }
      this.mode2UpLit.style.opacity = '1';
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
    this.mode2UpLit.jumpToIndex(index);
  }

  /**
   * @override
   * @param {PageIndex | 'left' | 'right' | 'next' | 'prev'} indexOrDirection
   * @return {import('./BookModel.js').PageModel}
   */
  parsePageSpecifier(indexOrDirection) {
    const nextSpread = this.mode2UpLit.parseNextSpread(indexOrDirection);
    const isRTL = this.book.pageProgression == 'rl';
    const nextLeftIndex = nextSpread.left?.index ?? (isRTL ? -1 : this.book.getNumLeafs());
    return this.book.getPage(nextLeftIndex);
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    switch (direction) {
    case 'in':
      this.mode2UpLit.zoomIn();
      break;
    case 'out':
      this.mode2UpLit.zoomOut();
      break;
    default:
      console.error(`Unsupported direction: ${direction}`);
    }
  }

  resizePageView() {
    this.mode2UpLit.htmlDimensionsCacher.updateClientSizes();
    if (this.mode2UpLit.scale < this.mode2UpLit.initialScale && this.mode2UpLit.autoFit == 'none') {
      this.mode2UpLit.autoFit = 'auto';
    }
    if (this.mode2UpLit.autoFit != 'none') {
      this.mode2UpLit.resizeViaAutofit();
    }
    this.mode2UpLit.recenter();
  }
}
