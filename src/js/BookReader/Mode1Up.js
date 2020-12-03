import * as utils from '../BookReader/utils.js';

export function extendBookReaderMode1Up(BookReader) {
  /**
   * This is called when we switch to one page view
   */
  BookReader.prototype.prepareOnePageView = function() {
    const startLeaf = this.currentIndex();

    this.refs.$brContainer.empty();
    this.refs.$brContainer.css({
      overflowY: 'scroll',
      overflowX: 'auto'
    });

    this.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.refs.$brContainer.append(this.refs.$brPageViewEl);

    // Attaches to first child - child must be present
    this.refs.$brContainer.dragscrollable();
    this.bindGestures(this.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // utils.disableSelect(this.$('#BRpageview'));

    this.resizePageView1up();
    this.jumpToIndex(startLeaf);
    this.updateBrClasses();
  };

  /**
   * @param {object} [options]
   */
  BookReader.prototype.drawLeafsOnePage = function() {
    const { book } = this._models;
    const containerHeight = this.refs.$brContainer.height();
    const containerWidth = this.refs.$brPageViewEl.width();
    const scrollTop = this.refs.$brContainer.prop('scrollTop');
    const scrollBottom = scrollTop + containerHeight;

    const indicesToDisplay = [];
    let leafTop = 0;
    let leafBottom = 0;

    for (const page of book.pagesIterator({ combineConsecutiveUnviewables: true })) {
      const height = Math.floor(page.height / this.reduce);
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
    this.updateFirstIndex(firstIndexToDraw);

    // if zoomed out, also draw prev/next pages
    if (this.reduce > 1) {
      const prev = book.getPage(firstIndexToDraw).findPrev({ combineConsecutiveUnviewables: true });
      if (prev) indicesToDisplay.unshift(firstIndexToDraw = prev.index);

      const lastIndexToDraw = indicesToDisplay[indicesToDisplay.length - 1];
      const next = book.getPage(lastIndexToDraw).findNext({ combineConsecutiveUnviewables: true });
      if (next) indicesToDisplay.push(next.index);
    }

    const BRpageViewEl = this.refs.$brPageViewEl.get(0);
    leafTop = 0;

    for (const page of book.pagesIterator({ end: firstIndexToDraw, combineConsecutiveUnviewables: true })) {
      leafTop += Math.floor(page.height / this.reduce) + 10;
    }

    for (const index of indicesToDisplay) {
      const page = book.getPage(index);
      const height = Math.floor(page.height / this.reduce);

      if (utils.notInArray(index, this.displayedIndices)) {
        const width = Math.floor(page.width / this.reduce);
        const leftMargin = Math.floor((containerWidth - width) / 2);

        const pageContainer = this._createPageContainer(index, {
          width:`${width}px`,
          height: `${height}px`,
          top: `${leafTop}px`,
          left: `${leftMargin}px`,
        });

        const img = $('<img />', {
          src: this._getPageURI(index, this.reduce, 0),
          srcset: this._getPageURISrcset(index, this.reduce, 0)
        });
        pageContainer.append(img);

        BRpageViewEl.appendChild(pageContainer[0]);
      }

      leafTop += height + 10;
    }

    for (const index of this.displayedIndices) {
      if (utils.notInArray(index, indicesToDisplay)) {
        this.$(`.pagediv${index}`).remove();
      }
    }

    this.displayedIndices = indicesToDisplay.slice();
    if (this.enableSearch) this.updateSearchHilites();

    this.updateToolbarZoom(this.reduce);

    // Update the slider
    this.updateNavIndexThrottled();
  };

  BookReader.prototype.zoom1up = function(direction) {
    if (this.constMode2up == this.mode) {     //can only zoom in 1-page mode
      this.switchMode(this.constMode1up);
      return;
    }

    const reduceFactor = this.nextReduce(this.reduce, direction, this.onePage.reductionFactors);

    if (this.reduce == reduceFactor.reduce) {
      // Already at this level
      return;
    }

    this.reduce = reduceFactor.reduce; // $$$ incorporate into function
    this.onePage.autofit = reduceFactor.autofit;

    this.pageScale = this.reduce; // preserve current reduce

    this.resizePageView1up();
    this.updateToolbarZoom(this.reduce);

    // Recalculate search hilites
    if (this.enableSearch) {
      this.removeSearchHilites();
      this.updateSearchHilites();
    }
  };

  BookReader.prototype.onePageGetAutofitWidth = function() {
    const widthPadding = 20;
    return (this._models.book.getMedianPageSize().width + 0.0) / (this.refs.$brContainer.prop('clientWidth') - widthPadding * 2);
  };

  BookReader.prototype.onePageGetAutofitHeight = function() {
    const availableHeight = this.refs.$brContainer.innerHeight();
    return (this._models.book.getMedianPageSize().height + 0.0) / (availableHeight - this.padding * 2); // make sure a little of adjacent pages show
  };

  /**
   * Returns where the top of the page with given index should be in one page view
   * @param {PageIndex} index
   * @return {number}
   */
  BookReader.prototype.onePageGetPageTop = function(index) {
    const { floor } = Math;
    const { book } = this._models;
    let leafTop = 0;
    for (const page of book.pagesIterator({ end: index, combineConsecutiveUnviewables: true })) {
      leafTop += floor(page.height / this.reduce) + this.padding;
    }
    return leafTop;
  };

  /**
   * Update the reduction factors for 1up mode given the available width and height.
   * Recalculates the autofit reduction factors.
   */
  BookReader.prototype.onePageCalculateReductionFactors = function() {
    this.onePage.reductionFactors = this.reductionFactors.concat(
      [
        { reduce: this.onePageGetAutofitWidth(), autofit: 'width' },
        { reduce: this.onePageGetAutofitHeight(), autofit: 'height'}
      ]);
    this.onePage.reductionFactors.sort(this._reduceSort);
  };

  /**
   * Resize the current one page view
   * Note this calls drawLeafs
   */
  BookReader.prototype.resizePageView1up = function() {
    const viewWidth  = this.refs.$brContainer.prop('clientWidth');
    const oldScrollTop  = this.refs.$brContainer.prop('scrollTop');
    const oldPageViewHeight = this.refs.$brPageViewEl.height();
    const oldPageViewWidth = this.refs.$brPageViewEl.width();

    // May have come here after preparing the view, in which case the scrollTop and view height are not set

    let scrollRatio = 0;
    let oldCenterX;
    if (oldScrollTop > 0) {
      // We have scrolled - implies view has been set up
      const oldCenterY = this.centerY1up();
      oldCenterX = this.centerX1up();
      scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
      // Have not scrolled, e.g. because in new container

      // We set the scroll ratio so that the current index will still be considered the
      // current index in drawLeafsOnePage after we create the new view container

      // Make sure this will count as current page after resize
      const fudgeFactor = (this._models.book.getPageHeight(this.currentIndex()) / this.reduce) * 0.6;
      const oldLeafTop = this.onePageGetPageTop(this.currentIndex()) + fudgeFactor;
      const oldViewDimensions = this.onePageCalculateViewDimensions(this.reduce, this.padding);
      scrollRatio = oldLeafTop / oldViewDimensions.height;
    }

    // Recalculate 1up reduction factors
    this.onePageCalculateReductionFactors();
    // Update current reduce (if in autofit)
    if (this.onePage.autofit) {
      const reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
      this.reduce = reductionFactor.reduce;
    }

    const viewDimensions = this.onePageCalculateViewDimensions(this.reduce, this.padding);

    this.refs.$brPageViewEl.height(viewDimensions.height);
    this.refs.$brPageViewEl.width(viewDimensions.width);


    const newCenterY = scrollRatio * viewDimensions.height;
    const newTop = Math.max(0, Math.floor( newCenterY - this.refs.$brContainer.height() / 2 ));
    this.refs.$brContainer.prop('scrollTop', newTop);

    // We use clientWidth here to avoid miscalculating due to scroll bar
    const newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    let newLeft = newCenterX - this.refs.$brContainer.prop('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    this.refs.$brContainer.prop('scrollLeft', newLeft);

    this.refs.$brPageViewEl.empty();
    this.displayedIndices = [];
    this.drawLeafs();

    if (this.enableSearch) {
      this.removeSearchHilites();
      this.updateSearchHilites();
    }
  };

  /**
   * Calculate the dimensions for a one page view with images at the given reduce and padding
   * @param {number} reduce
   * @param {number} padding
   */
  BookReader.prototype.onePageCalculateViewDimensions = function(reduce, padding) {
    const { floor } = Math;
    const { book } = this._models;
    let viewWidth = 0;
    let viewHeight = 0;
    for (const page of book.pagesIterator({ combineConsecutiveUnviewables: true })) {
      viewHeight += floor(page.height / reduce) + padding;
      const width = floor(page.width / reduce);
      if (width > viewWidth) viewWidth = width;
    }
    return { width: viewWidth, height: viewHeight };
  };

  /**
   * Returns the current offset of the viewport center in scaled document coordinates.
   * @return {number}
   */
  BookReader.prototype.centerX1up = function() {
    let centerX;
    if (this.refs.$brPageViewEl.width() < this.refs.$brContainer.prop('clientWidth')) { // fully shown
      centerX = this.refs.$brPageViewEl.width();
    } else {
      centerX = this.refs.$brContainer.prop('scrollLeft') + this.refs.$brContainer.prop('clientWidth') / 2;
    }
    centerX = Math.floor(centerX);
    return centerX;
  };

  /**
   * Returns the current offset of the viewport center in scaled document coordinates.
   * @return {number}
   */
  BookReader.prototype.centerY1up = function() {
    const centerY = this.refs.$brContainer.prop('scrollTop') + this.refs.$brContainer.height() / 2;
    return Math.floor(centerY);
  };
}
