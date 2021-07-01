// @ts-check
import { calcScreenDPI } from '../BookReader/utils.js';
import { Mode1UpLit } from './Mode1UpLit.js';
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

export class Mode1Up {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
    this.mode1UpLit = new Mode1UpLit(bookModel, br);

    /** @private */
    this.$el = $(this.mode1UpLit).addClass('br-mode-1up BRmode1up');

    /** @private */
    this.screenDPI = calcScreenDPI();

    this.realWorldReduce = 1;
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

    // // Attaches to first child - child must be present
    // this.$brContainer.dragscrollable();
    // this.br.bindGestures(this.$);

    // FIXME Wait for it to render
    setTimeout(() => this.mode1UpLit.jumpToIndex(startLeaf));
    this.br.updateBrClasses();
  }

  /**
   * Get the number of pixels required to display the given inches with the given reduce
   * @param {number} inches
   * @param reduce Reduction factor currently at play
   * @param screenDPI The DPI of the screen
   **/
  physicalInchesToDisplayPixels(inches, reduce = this.realWorldReduce, screenDPI = this.screenDPI) {
    return inches * screenDPI / reduce;
  }

  drawLeafs() {
  }

  /**
   * BREAKING CHANGE: No longer supports pageX/pageY
   * TODO: Support animate for small distances
   * @param {PageIndex} index
   * @param {number} [pageX] x position on the page (in pixels) to center on
   * @param {number} [pageY] y position on the page (in pixels) to center on
   * @param {boolean} [noAnimate]
   */
  jumpToIndex(index, pageX, pageY, noAnimate) {
    this.mode1UpLit.jumpToIndex(index);
    // // Only animate for small distances
    // if (!noAnimate && abs(prevCurrentIndex - index) <= 4) {
    //   this.animating = true;
    //   this.$brContainer.stop(true).animate({
    //     scrollTop: leafTop,
    //     scrollLeft: leafLeft,
    //   }, 'fast', () => { this.animating = false; });
    // } else {
    //   this.$brContainer.stop(true).prop('scrollTop', leafTop);
    // }
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    const nextReductionFactor = this.br.nextReduce(1 / this.mode1UpLit.scale, direction, this.br.onePage.reductionFactors);
    this.mode1UpLit.scale = 1 / nextReductionFactor.reduce;
    this.br.onePage.autofit = nextReductionFactor.autofit;
  }

  /**
   * Returns the reduce factor which has the pages fill the width of the viewport.
   */
  getAutofitWidth() {
    const widthPadding = 20;
    const availableWidth = this.$brContainer.prop('clientWidth') - 2 * widthPadding;

    const medianWidthInches = this.book.getMedianPageSizeInches().width;
    const medianPageWidth = this.physicalInchesToDisplayPixels(medianWidthInches, 1);
    return medianPageWidth / availableWidth;
  }

  getAutofitHeight() {
    // make sure a little of adjacent pages show
    const availableHeight = this.$brContainer.innerHeight() - 2 * this.br.padding;
    const medianHeightInches = this.book.getMedianPageSizeInches().height;
    const medianPageHeight = this.physicalInchesToDisplayPixels(medianHeightInches, 1);

    return medianPageHeight / availableHeight;
  }

  /**
   * Update the reduction factors for 1up mode given the available width and height.
   * Recalculates the autofit reduction factors.
   */
  calculateReductionFactors() {
    const autoWidthReduce = this.getAutofitWidth();
    this.br.onePage.reductionFactors = this.br.reductionFactors
      .filter(r => r.reduce != 1)
      .concat([
        { reduce: 1, autofit: null },
        { reduce: autoWidthReduce, autofit: 'width' },
        { reduce: this.getAutofitHeight(), autofit: 'height' },
      ]);
    this.br.onePage.reductionFactors.sort(this.br._reduceSort);
    // Default to real size if it fits, otherwise default to full width
    if (autoWidthReduce < 1) {
      this.br.onePage.reductionFactors.find(r => r.reduce == 1).autofit = 'auto';
    } else {
      this.br.onePage.reductionFactors.find(r => r.autofit == 'width').autofit = 'auto';
    }
  }

  /**
   * Resize the current one page view
   * Note this calls drawLeafs
   */
  resizePageView() {
    this.mode1UpLit.updateClientSizes();
    this.mode1UpLit.requestUpdate();
  }
}
