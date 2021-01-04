// @ts-check
import { notInArray } from '../BookReader/utils.js';
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
  }

  /**
   * This is called when we switch to one page view
   */
  prepare() {
    const startLeaf = this.br.currentIndex();

    this.br.refs.$brContainer.empty();
    this.br.refs.$brContainer.css({
      overflowY: 'scroll',
      overflowX: 'auto'
    });

    this.br.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.br.refs.$brContainer.append(this.br.refs.$brPageViewEl);

    // Attaches to first child - child must be present
    this.br.refs.$brContainer.dragscrollable();
    this.br.bindGestures(this.br.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // utils.disableSelect(this.$('#BRpageview'));

    this.resizePageView();
    this.br.jumpToIndex(startLeaf);
    this.br.updateBrClasses();
  }

  drawLeafs() {
    const { book } = this;
    const containerHeight = this.br.refs.$brContainer.height();
    const containerWidth = this.br.refs.$brPageViewEl.width();
    const scrollTop = this.br.refs.$brContainer.prop('scrollTop');
    const scrollBottom = scrollTop + containerHeight;

    const indicesToDisplay = [];
    let leafTop = 0;
    let leafBottom = 0;

    for (const page of book.pagesIterator({ combineConsecutiveUnviewables: true })) {
      const height = Math.floor(page.height / this.br.reduce);
      leafBottom += height;
      const topInView = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
      const bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
      const middleInView = (leafTop <= scrollTop) && (leafBottom >= scrollBottom);
      if (topInView || bottomInView || middleInView) {
        indicesToDisplay.push(page.index);
      }
      leafTop += height + 10;
      leafBottom += 10;
    }

    // Based of the pages displayed in the view we set the current index
    // $$$ we should consider the page in the center of the view to be the current one
    let firstIndexToDraw = indicesToDisplay[0];
    this.br.updateFirstIndex(firstIndexToDraw);

    // if zoomed out, also draw prev/next pages
    if (this.br.reduce > 1) {
      const prev = book.getPage(firstIndexToDraw).findPrev({ combineConsecutiveUnviewables: true });
      if (prev) indicesToDisplay.unshift(firstIndexToDraw = prev.index);

      const lastIndexToDraw = indicesToDisplay[indicesToDisplay.length - 1];
      const next = book.getPage(lastIndexToDraw).findNext({ combineConsecutiveUnviewables: true });
      if (next) indicesToDisplay.push(next.index);
    }

    const BRpageViewEl = this.br.refs.$brPageViewEl.get(0);
    leafTop = 0;

    for (const page of book.pagesIterator({ end: firstIndexToDraw, combineConsecutiveUnviewables: true })) {
      leafTop += Math.floor(page.height / this.br.reduce) + 10;
    }

    for (const index of indicesToDisplay) {
      const page = book.getPage(index);
      const height = Math.floor(page.height / this.br.reduce);

      if (!this.br.displayedIndices.includes(index)) {
        const width = Math.floor(page.width / this.br.reduce);
        const leftMargin = Math.floor((containerWidth - width) / 2);

        const pageContainer = this.br._createPageContainer(index, {
          width,
          height,
          top: leafTop,
          left: leftMargin,
        });

        const img = $('<img />', {
          src: page.getURI(this.br.reduce, 0),
          srcset: this.br._getPageURISrcset(index, this.br.reduce, 0)
        });
        pageContainer.append(img);

        BRpageViewEl.appendChild(pageContainer[0]);
      }

      leafTop += height + 10;
    }

    for (const index of this.br.displayedIndices) {
      if (notInArray(index, indicesToDisplay)) {
        this.br.$(`.pagediv${index}`).remove();
      }
    }

    this.br.displayedIndices = indicesToDisplay.slice();
    if (this.br.enableSearch) this.br.updateSearchHilites();

    this.br.updateToolbarZoom(this.br.reduce);

    // Update the slider
    this.br.updateNavIndexThrottled();
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    const reduceFactor = this.br.nextReduce(this.br.reduce, direction, this.br.onePage.reductionFactors);

    if (this.br.reduce == reduceFactor.reduce) {
      // Already at this level
      return;
    }

    this.br.reduce = reduceFactor.reduce; // $$$ incorporate into function
    this.br.onePage.autofit = reduceFactor.autofit;

    this.br.pageScale = this.br.reduce; // preserve current reduce

    this.resizePageView();
    this.br.updateToolbarZoom(this.br.reduce);

    // Recalculate search hilites
    if (this.br.enableSearch) {
      this.br.removeSearchHilites();
      this.br.updateSearchHilites();
    }
  }

  getAutofitWidth() {
    const medianPageWidth = this.book.getMedianPageSize().width;
    const availableWidth = this.br.refs.$brContainer.prop('clientWidth');
    const widthPadding = 20;
    return medianPageWidth / (availableWidth - 2 * widthPadding);
  }

  getAutofitHeight() {
    const medianPageHeight = this.book.getMedianPageSize().height;
    const availableHeight = this.br.refs.$brContainer.innerHeight();
    // make sure a little of adjacent pages show
    return medianPageHeight / (availableHeight - 2 * this.br.padding);
  }

  /**
   * Returns where the top of the page with given index should be in one page view
   * @param {PageIndex} index
   * @return {number}
   */
  getPageTop(index) {
    const { floor } = Math;
    const { book } = this;
    let leafTop = 0;
    for (const page of book.pagesIterator({ end: index, combineConsecutiveUnviewables: true })) {
      leafTop += floor(page.height / this.br.reduce) + this.br.padding;
    }
    return leafTop;
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
    const viewWidth  = this.br.refs.$brContainer.prop('clientWidth');
    const oldScrollTop  = this.br.refs.$brContainer.prop('scrollTop');
    const oldPageViewHeight = this.br.refs.$brPageViewEl.height();
    const oldPageViewWidth = this.br.refs.$brPageViewEl.width();

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
      const fudgeFactor = (this.book.getPageHeight(this.br.currentIndex()) / this.br.reduce) * 0.6;
      const oldLeafTop = this.getPageTop(this.br.currentIndex()) + fudgeFactor;
      const oldViewDimensions = this.calculateViewDimensions(this.br.reduce, this.br.padding);
      scrollRatio = oldLeafTop / oldViewDimensions.height;
    }

    // Recalculate 1up reduction factors
    this.calculateReductionFactors();
    // Update current reduce (if in autofit)
    if (this.br.onePage.autofit) {
      const reductionFactor = this.br.nextReduce(this.br.reduce, this.br.onePage.autofit, this.br.onePage.reductionFactors);
      this.br.reduce = reductionFactor.reduce;
    }

    const viewDimensions = this.calculateViewDimensions(this.br.reduce, this.br.padding);

    this.br.refs.$brPageViewEl.height(viewDimensions.height);
    this.br.refs.$brPageViewEl.width(viewDimensions.width);


    const newCenterY = scrollRatio * viewDimensions.height;
    const newTop = Math.max(0, Math.floor( newCenterY - this.br.refs.$brContainer.height() / 2 ));
    this.br.refs.$brContainer.prop('scrollTop', newTop);

    // We use clientWidth here to avoid miscalculating due to scroll bar
    const newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    let newLeft = newCenterX - this.br.refs.$brContainer.prop('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    this.br.refs.$brContainer.prop('scrollLeft', newLeft);

    this.br.refs.$brPageViewEl.empty();
    this.br.displayedIndices = [];
    this.drawLeafs();

    if (this.br.enableSearch) {
      this.br.removeSearchHilites();
      this.br.updateSearchHilites();
    }
  }

  /**
   * Calculate the dimensions for a one page view with images at the given reduce and padding
   * @param {number} reduce
   * @param {number} padding
   */
  calculateViewDimensions(reduce, padding) {
    const { floor } = Math;
    const { book } = this;
    let viewWidth = 0;
    let viewHeight = 0;
    for (const page of book.pagesIterator({ combineConsecutiveUnviewables: true })) {
      viewHeight += floor(page.height / reduce) + padding;
      const width = floor(page.width / reduce);
      if (width > viewWidth) viewWidth = width;
    }
    return { width: viewWidth, height: viewHeight };
  }

  /**
   * Returns the current offset of the viewport center in scaled document coordinates.
   */
  centerX($brContainer = this.br.refs.$brContainer, $pagesContainer = this.br.refs.$brPageViewEl) {
    let centerX;
    if ($pagesContainer.width() < $brContainer.prop('clientWidth')) { // fully shown
      centerX = $pagesContainer.width();
    } else {
      centerX = $brContainer.scrollLeft() + $brContainer.prop('clientWidth') / 2;
    }
    return Math.floor(centerX);
  }

  /**
   * Returns the current offset of the viewport center in scaled document coordinates.
   */
  centerY($brContainer = this.br.refs.$brContainer) {
    const centerY = $brContainer.scrollTop() + $brContainer.height() / 2;
    return Math.floor(centerY);
  }
}
