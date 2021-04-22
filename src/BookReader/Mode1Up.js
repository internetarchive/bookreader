// @ts-check
import { calcScreenDPI, notInArray } from '../BookReader/utils.js';
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

    /** @private */
    this.$documentContainer = $('<div class="BRpageview" />');
    /** @private */
    this.screenDPI = calcScreenDPI();
    /** @private */
    this.LEAF_SPACING_IN = 0.2;

    /**
     * How much smaller the picture on screen is than the real-world item
     *
     * Mode1Up doesn't use the br.reduce because it is DPI aware. The reduction factor
     * of a given leaf can change (since leaves can have different DPIs), but the real-world
     * reduction is constant throughout.
     */
    this.realWorldReduce = 1;
  }

  /** @private */
  get $scrollContainer() { return this.br.refs.$brContainer; }

  /**
   * This is called when we switch to one page view
   */
  prepare() {
    const startLeaf = this.br.currentIndex();

    this.$scrollContainer
      .empty()
      .css({ overflowX: 'auto', overflowY: 'scroll' })
      .append(this.$documentContainer);

    // Attaches to first child - child must be present
    this.$scrollContainer.dragscrollable();
    this.br.bindGestures(this.$scrollContainer);

    // This calls drawLeafs
    this.resizePageView();

    this.br.jumpToIndex(startLeaf);
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

  /**
   * Iterate over pages, augmented with their top/bottom bounds
   * @param reduce Reduction factor currently at play
   * @param pageSpacing Inches of space to place between pages
   **/
  * pagesWithBounds(reduce = this.realWorldReduce, pageSpacing = this.LEAF_SPACING_IN) {
    let leafTop = 0;
    let leafBottom = 0;

    for (const page of this.book.pagesIterator({ combineConsecutiveUnviewables: true })) {
      const height = this.physicalInchesToDisplayPixels(page.heightInches, reduce);
      leafBottom += height;
      yield { page, top: leafTop, bottom: leafBottom };
      leafTop += height + this.physicalInchesToDisplayPixels(pageSpacing, reduce);
      leafBottom += this.physicalInchesToDisplayPixels(pageSpacing, reduce);
    }
  }

  /**
   * How much do the two bounds intersection?
   * @param {{ top: number; bottom: number; }} bound1
   * @param {{ top: number; bottom: number; }} bound2
   * @returns {number}
   */
  static boundIntersection(bound1, bound2) {
    const intersect = (bound1.bottom >= bound2.top) && (bound1.top <= bound2.bottom);
    if (!intersect) return 0;

    const boundingBox = {
      top: Math.min(bound1.top, bound2.top),
      bottom: Math.max(bound1.bottom, bound2.bottom),
    };
    const intersection = {
      top: Math.max(bound1.top, bound2.top),
      bottom: Math.min(bound1.bottom, bound2.bottom),
    };
    return (intersection.bottom - intersection.top) / (boundingBox.bottom - boundingBox.top);
  }

  /**
   * Find the pages that intersect the current viewport, including 1 before/after
   **/
  * findIntersectingPages() {
    // Rectangle of interest
    const height = this.$scrollContainer.height();
    const scrollTop = this.$scrollContainer.scrollTop();
    const scrollBottom = scrollTop + height;
    const scrollRegion = { top: scrollTop, bottom: scrollBottom };

    let prev = null;
    for (const {page, top, bottom} of this.pagesWithBounds()) {
      const intersection = Mode1Up.boundIntersection({ top, bottom }, scrollRegion);
      const cur = {page, top, bottom, intersection: intersection};
      if (intersection) {
        // Also yield the page just before the visible page
        if (prev && !prev.intersection) yield prev;
        yield cur;
      }
      // Also yield the page just after the last visible page
      else if (!cur.intersection && prev?.intersection) {
        yield cur;
        break;
      }
      prev = cur;
    }
  }

  drawLeafs() {
    const pagesToDisplay = Array.from(this.findIntersectingPages());

    if (pagesToDisplay.length) {
      const documentContainerWidth = this.$documentContainer.width();

      // The first page that's reasonably in view we set to the current index
      const firstProperPage = (
        pagesToDisplay.find(({intersection}) => intersection > 0.33) ||
        pagesToDisplay[0]
      ).page;
      this.br.updateFirstIndex(firstProperPage.index);

      for (const {page, top, bottom} of pagesToDisplay) {
        if (!this.br.displayedIndices.includes(page.index)) {
          const height = bottom - top;
          const width = this.physicalInchesToDisplayPixels(page.widthInches);
          const reduce = page.width / width;

          const pageContainer = this.br._createPageContainer(page.index)
            .update({
              dimensions: {
                width,
                height,
                top,
                left: Math.floor((documentContainerWidth - width) / 2),
              },
              reduce,
            });
          pageContainer.$container.appendTo(this.$documentContainer);
        }
      }
    }

    // Remove any pages we no longer need
    const displayedIndices = pagesToDisplay.map(({page}) => page.index);
    for (const index of this.br.displayedIndices) {
      if (notInArray(index, displayedIndices)) {
        this.br.$(`.pagediv${index}`).remove();
      }
    }

    this.br.displayedIndices = displayedIndices;
    if (this.br.enableSearch) this.br.updateSearchHilites();

    this.br.updateToolbarZoom(this.realWorldReduce);

    // Update the slider
    this.br.updateNavIndexThrottled();
  }

  /**
   * @param {PageIndex} index
   * @param {number} [pageX] x position on the page (in pixels) to center on
   * @param {number} [pageY] y position on the page (in pixels) to center on
   * @param {boolean} [noAnimate]
   */
  jumpToIndex(index, pageX, pageY, noAnimate) {
    const prevCurrentIndex = this.br.currentIndex();
    const { abs } = Math;
    let offset = 0;
    let leafTop = this.getPageTop(index);
    let leafLeft = 0;

    if (pageY) {
      const page = this.book.getPage(index);
      const clientHeight = this.$scrollContainer.prop('clientHeight');
      offset = this.physicalInchesToDisplayPixels((pageY / page.height) * page.heightInches) - (clientHeight / 2);
      leafTop += offset;
    } else {
      // Show page just a little below the top
      leafTop -= this.br.padding / 2;
    }

    if (pageX) {
      const page = this.book.getPage(index);
      const clientWidth = this.$scrollContainer.prop('clientWidth');
      offset = this.physicalInchesToDisplayPixels((pageX / page.width) * page.widthInches) - (clientWidth / 2);
      leafLeft += offset;
    } else {
      // Preserve left position
      leafLeft = this.$scrollContainer.scrollLeft();
    }

    // Only animate for small distances
    if (!noAnimate && abs(prevCurrentIndex - index) <= 4) {
      this.animating = true;
      this.$scrollContainer.stop(true).animate({
        scrollTop: leafTop,
        scrollLeft: leafLeft,
      }, 'fast', () => { this.animating = false });
    } else {
      this.$scrollContainer.stop(true).prop('scrollTop', leafTop);
    }
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    const nextReductionFactor = this.br.nextReduce(this.realWorldReduce, direction, this.br.onePage.reductionFactors);

    if (this.realWorldReduce == nextReductionFactor.reduce) {
      // Already at this level
      return;
    }

    this.realWorldReduce = nextReductionFactor.reduce;
    this.br.onePage.autofit = nextReductionFactor.autofit;

    this.resizePageView();
    this.br.updateToolbarZoom(this.realWorldReduce);

    // Recalculate search hilites
    if (this.br.enableSearch) {
      this.br.removeSearchHilites();
      this.br.updateSearchHilites();
    }
  }

  /**
   * Returns the reduce factor which has the pages fill the width of the viewport.
   */
  getAutofitWidth() {
    const widthPadding = 20;
    const availableWidth = this.$scrollContainer.prop('clientWidth') - 2 * widthPadding;

    const medianWidthInches = this.book.getMedianPageSizeInches().width;
    const medianPageWidth = this.physicalInchesToDisplayPixels(medianWidthInches, 1);
    return medianPageWidth / availableWidth;
  }

  getAutofitHeight() {
    // make sure a little of adjacent pages show
    const availableHeight = this.$scrollContainer.innerHeight() - 2 * this.br.padding;
    const medianHeightInches = this.book.getMedianPageSizeInches().height;
    const medianPageHeight = this.physicalInchesToDisplayPixels(medianHeightInches, 1);

    return medianPageHeight / availableHeight;
  }

  /**
   * Returns where the top of the page with given index should be in one page view
   * @param {PageIndex} index
   * @return {number}
   */
  getPageTop(index) {
    for (const {page, top} of this.pagesWithBounds()) {
      if (page.index == index) return top;
    }
  }

  /**
   * Update the reduction factors for 1up mode given the available width and height.
   * Recalculates the autofit reduction factors.
   */
  calculateReductionFactors() {
    this.br.onePage.reductionFactors = this.br.reductionFactors.concat(
      [
        { reduce: this.getAutofitWidth(), autofit: 'width' },
        { reduce: this.getAutofitHeight(), autofit: 'height' },
      ]);
    this.br.onePage.reductionFactors.sort(this.br._reduceSort);
  }

  /**
   * Resize the current one page view
   * Note this calls drawLeafs
   */
  resizePageView() {
    const viewWidth  = this.$scrollContainer.prop('clientWidth');
    const oldScrollTop  = this.$scrollContainer.prop('scrollTop');
    const oldPageViewHeight = this.$documentContainer.height();
    const oldPageViewWidth = this.$documentContainer.width();

    // May have come here after preparing the view, in which case the scrollTop and view height are not set

    let scrollRatio = 0;
    let oldCenterX;
    if (oldScrollTop > 0) {
      // We have scrolled - implies view has been set up
      const oldCenterY = this.centerY();
      oldCenterX = this.centerX();
      scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
      // Have not scrolled, e.g. because in new container

      // We set the scroll ratio so that the current index will still be considered the
      // current index in drawLeafsOnePage after we create the new view container

      // Make sure this will count as current page after resize
      const fudgeFactor = 0.6 * this.physicalInchesToDisplayPixels(this.book.getPage(this.br.currentIndex()).heightInches);
      const oldLeafTop = this.getPageTop(this.br.currentIndex()) + fudgeFactor;
      const oldViewDimensions = this.calculateViewDimensions();
      scrollRatio = oldLeafTop / oldViewDimensions.height;
    }

    // Recalculate 1up reduction factors
    this.calculateReductionFactors();
    // Update current reduce (if in autofit)
    if (this.br.onePage.autofit) {
      const reductionFactor = this.br.nextReduce(this.realWorldReduce, this.br.onePage.autofit, this.br.onePage.reductionFactors);
      this.realWorldReduce = reductionFactor.reduce;
    }

    const viewDimensions = this.calculateViewDimensions();
    this.$documentContainer.height(viewDimensions.height);
    this.$documentContainer.width(viewDimensions.width);

    // Remove all pages
    this.$documentContainer.empty();
    this.br.displayedIndices = [];

    // Scroll to the right spot
    const newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    const newCenterY = scrollRatio * viewDimensions.height;
    const sizeX = this.$scrollContainer.prop('clientWidth'); // Use clientWidth because of scroll bar
    const sizeY = this.$scrollContainer.height();
    this.$scrollContainer.prop({
      scrollLeft: Math.max(0, newCenterX - sizeX / 2),
      scrollTop: Math.max(0, newCenterY - sizeY / 2),
    });

    // Draw all visible pages
    this.drawLeafs();

    if (this.br.enableSearch) {
      this.br.removeSearchHilites();
      this.br.updateSearchHilites();
    }
  }

  /**
   * Calculate the total width/height in pixels of the document container
   * @param {number} reduce
   * @param {number} leafSpacing spacing between pages in inches
   */
  calculateViewDimensions(reduce = this.realWorldReduce, leafSpacing = this.LEAF_SPACING_IN) {
    let width = 0;
    let height = 0;
    for (const {page, bottom} of this.pagesWithBounds(reduce, leafSpacing)) {
      const pageWidth = this.physicalInchesToDisplayPixels(page.widthInches, reduce);
      width = Math.max(width, pageWidth);
      height = bottom;
    }
    return { width, height };
  }

  /**
   * Returns the current offset of the viewport center in scaled document coordinates.
   */
  centerX($scrollContainer = this.$scrollContainer, $documentContainer = this.$documentContainer) {
    let centerX;
    if ($documentContainer.width() < $scrollContainer.prop('clientWidth')) { // fully shown
      centerX = $documentContainer.width();
    } else {
      centerX = $scrollContainer.scrollLeft() + $scrollContainer.prop('clientWidth') / 2;
    }
    return Math.floor(centerX);
  }

  /**
   * Returns the current offset of the viewport center in scaled document coordinates.
   */
  centerY($scrollContainer = this.$scrollContainer) {
    const centerY = $scrollContainer.scrollTop() + $scrollContainer.height() / 2;
    return Math.floor(centerY);
  }
}
