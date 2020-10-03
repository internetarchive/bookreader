// @ts-check
import { clamp } from './utils.js';
import { EVENTS } from './events.js';

/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */
/** @typedef {import('./options.js').BookReaderOptions} BookReaderOptions */

export class Mode2Up {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;

    /** @type {HTMLDivElement} */
    this.leafEdgeL = null;
    /** @type {HTMLDivElement} */
    this.leafEdgeR = null;
  }

  /**
   * @template T
   * @param {HTMLElement} element
   * @param {T} data
   * @param {function(HTMLElement, { data: T }): void} handler
   */
  setClickHandler(element, data, handler) {
    $(element).unbind('mouseup').bind('mouseup', data, function(e) {
      handler(this, e);
    });
  }

  drawLeafs() {
    const $twoPageViewEl = this.br.refs.$brTwoPageView;

    // $$$ we should use calculated values in this.twoPage (recalc if necessary)
    const indexL = this.br.twoPage.currentIndexL;
    const top = this.top();

    this.br.twoPage.scaledWL = this.getPageWidth(indexL);
    this.br.twoPage.gutter = this.gutter();

    this.br.prefetchImg(indexL);
    $(this.br.prefetchedImgs[indexL]).css({
      position: 'absolute',
      left: `${this.br.twoPage.gutter - this.br.twoPage.scaledWL}px`,
      right: '',
      top: `${top}px`,
      height: `${this.br.twoPage.height}px`, // $$$ height forced the same for both pages
      width: `${this.br.twoPage.scaledWL}px`,
      zIndex: 2
    }).appendTo($twoPageViewEl);

    const indexR = this.br.twoPage.currentIndexR;

    // $$$ should use getwidth2up?
    this.br.twoPage.scaledWR = this.getPageWidth(indexR);
    this.br.prefetchImg(indexR);
    $(this.br.prefetchedImgs[indexR]).css({
      position: 'absolute',
      left: `${this.br.twoPage.gutter}px`,
      right: '',
      top: `${top}px`,
      height: `${this.br.twoPage.height}px`, // $$$ height forced the same for both pages
      width: `${this.br.twoPage.scaledWR}px`,
      zIndex: 2
    }).appendTo($twoPageViewEl);

    this.displayedIndices = [this.br.twoPage.currentIndexL, this.br.twoPage.currentIndexR];
    this.setMouseHandlers();
    this.br.displayedIndices = this.displayedIndices;
    this.br.updateToolbarZoom(this.br.reduce);
    this.br.trigger('pageChanged');
  }

  /**
   * @param {1} direction
   */
  zoom(direction) {
    this.br.stopFlipAnimations();

    // Recalculate autofit factors
    this.calculateReductionFactors();

    // Get new zoom state
    const reductionFactor = this.br.nextReduce(this.br.reduce, direction, this.br.twoPage.reductionFactors);
    if ((this.br.reduce == reductionFactor.reduce) && (this.br.twoPage.autofit == reductionFactor.autofit)) {
      // Same zoom
      return;
    }
    this.br.twoPage.autofit = reductionFactor.autofit;
    this.br.reduce = reductionFactor.reduce;
    this.br.pageScale = this.br.reduce; // preserve current reduce

    // Preserve view center position
    const oldCenter = this.getViewCenter();

    // If zooming in, reload imgs.  DOM elements will be removed by prepareTwoPageView
    // $$$ An improvement would be to use the low res image until the larger one is loaded.
    if (1 == direction) {
      for (const img in this.br.prefetchedImgs) {
        delete this.br.prefetchedImgs[img];
      }
    }

    // Prepare view with new center to minimize visual glitches
    this.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);
  }

  /**
   * @param {number} centerPercentageX
   * @param {number} centerPercentageY
   */
  prepareTwoPageView(centerPercentageX, centerPercentageY) {
    // Some decisions about two page view:
    //
    // Both pages will be displayed at the same height, even if they were different physical/scanned
    // sizes.  This simplifies the animation (from a design as well as technical standpoint).  We
    // examine the page aspect ratios (in calculateSpreadSize) and use the page with the most "normal"
    // aspect ratio to determine the height.
    //
    // The two page view div is resized to keep the middle of the book in the middle of the div
    // even as the page sizes change.  To e.g. keep the middle of the book in the middle of the BRcontent
    // div requires adjusting the offset of BRtwpageview and/or scrolling in BRcontent.
    this.br.refs.$brContainer.empty();
    this.br.refs.$brContainer.css('overflow', 'auto');

    // We want to display two facing pages.  We may be missing
    // one side of the spread because it is the first/last leaf,
    // foldouts, missing pages, etc

    const targetLeaf = clamp(this.br.firstIndex, this.br.firstDisplayableIndex(), this.br.lastDisplayableIndex());
    const currentSpreadIndices = this.book.getSpreadIndices(targetLeaf);
    this.br.twoPage.currentIndexL = currentSpreadIndices[0];
    this.br.twoPage.currentIndexR = currentSpreadIndices[1];

    this.calculateSpreadSize(); //sets twoPage.width, twoPage.height and others

    this.br.pruneUnusedImgs();
    this.br.prefetch(); // Preload images or reload if scaling has changed

    // Add the two page view
    // $$$ Can we get everything set up and then append?
    const $twoPageViewEl = $('<div class="BRtwopageview"></div>');
    this.br.refs.$brTwoPageView = $twoPageViewEl;
    this.br.refs.$brContainer.append($twoPageViewEl);

    // Attaches to first child, so must come after we add the page view
    this.br.refs.$brContainer.dragscrollable({preventDefault:true});
    this.br.bindGestures(this.br.refs.$brContainer);

    // $$$ calculate first then set
    this.br.refs.$brTwoPageView.css({
      height: `${this.br.twoPage.totalHeight}px`,
      width: `${this.br.twoPage.totalWidth}px`,
      position: 'absolute'
    });

    // If there will not be scrollbars (e.g. when zooming out) we center the book
    // since otherwise the book will be stuck off-center
    if (this.br.twoPage.totalWidth < this.br.refs.$brContainer.prop('clientWidth')) {
      centerPercentageX = 0.5;
    }
    if (this.br.twoPage.totalHeight < this.br.refs.$brContainer.prop('clientHeight')) {
      centerPercentageY = 0.5;
    }

    this.centerView(centerPercentageX, centerPercentageY);

    this.br.twoPage.coverDiv = document.createElement('div');
    $(this.br.twoPage.coverDiv).attr('class', 'BRbookcover').css({
      width: `${this.br.twoPage.bookCoverDivWidth}px`,
      height: `${this.br.twoPage.bookCoverDivHeight}px`,
      visibility: 'visible'
    }).appendTo(this.br.refs.$brTwoPageView);

    this.leafEdgeR = document.createElement('div');
    this.leafEdgeR.className = 'BRleafEdgeR';

    $(this.leafEdgeR).css({
      width: `${this.br.twoPage.leafEdgeWidthR}px`,
      height: `${this.br.twoPage.height}px`,
      left: `${this.br.twoPage.gutter + this.br.twoPage.scaledWR}px`,
      top: `${this.br.twoPage.bookCoverDivTop + this.br.twoPage.coverInternalPadding}px`,
      border: this.br.twoPage.leafEdgeWidthR === 0 ? 'none' : null
    }).appendTo(this.br.refs.$brTwoPageView);

    this.leafEdgeL = document.createElement('div');
    this.leafEdgeL.className = 'BRleafEdgeL';
    $(this.leafEdgeL).css({
      width: `${this.br.twoPage.leafEdgeWidthL}px`,
      height: `${this.br.twoPage.height}px`,
      left: `${this.br.twoPage.bookCoverDivLeft + this.br.twoPage.coverInternalPadding}px`,
      top: `${this.br.twoPage.bookCoverDivTop + this.br.twoPage.coverInternalPadding}px`,
      border: this.br.twoPage.leafEdgeWidthL === 0 ? 'none' : null
    }).appendTo(this.br.refs.$brTwoPageView);

    const div = document.createElement('div');
    $(div).attr('class', 'BRgutter').css({
      width: `${this.br.twoPage.bookSpineDivWidth}px`,
      height: `${this.br.twoPage.bookSpineDivHeight}px`,
      left: `${this.br.twoPage.gutter - this.br.twoPage.bookSpineDivWidth * 0.5}px`,
      top: `${this.br.twoPage.bookSpineDivTop}px`
    }).appendTo(this.br.refs.$brTwoPageView);

    this.preparePopUp();

    this.br.displayedIndices = [];

    this.drawLeafs();
    this.br.updateToolbarZoom(this.br.reduce);

    this.br.prefetch();

    if (this.br.enableSearch) {
      this.br.removeSearchHilites();
      this.br.updateSearchHilites();
    }

    this.br.updateBrClasses();
  }

  /**
   * This function prepares the "View Page n" popup that shows while the mouse is
   * over the left/right "stack of sheets" edges.  It also binds the mouse
   * events for these divs.
   */
  preparePopUp() {
    this.br.twoPagePopUp = document.createElement('div');
    this.br.twoPagePopUp.className = 'BRtwoPagePopUp';
    $(this.br.twoPagePopUp).css({
      zIndex: '1000'
    }).appendTo(this.br.refs.$brContainer);
    $(this.br.twoPagePopUp).hide();

    const leafEdges = [
      {
        $leafEdge: $(this.leafEdgeL),
        /** @type {function(number): PageIndex} */
        jumpIndexForPageX: this.jumpIndexForLeftEdgePageX.bind(this),
        leftOffset: () => -$(this.br.twoPagePopUp).width() + 120,
      },
      {
        $leafEdge: $(this.leafEdgeR),
        /** @type {function(number): PageIndex} */
        jumpIndexForPageX: this.jumpIndexForRightEdgePageX.bind(this),
        leftOffset: () => -120,
      },
    ];

    for (const { $leafEdge, jumpIndexForPageX, leftOffset } of leafEdges) {
      $leafEdge.on('mouseenter', () => $(this.br.twoPagePopUp).show());
      $leafEdge.on('mouseleave', () => $(this.br.twoPagePopUp).hide());

      $leafEdge.on('click', e => {
        this.br.trigger(EVENTS.stop);
        this.br.jumpToIndex(jumpIndexForPageX(e.pageX));
      });

      $leafEdge.on('mousemove', e => {
        const jumpIndex = clamp(jumpIndexForPageX(e.pageX), 0, this.book.getNumLeafs() - 1);
        $(this.br.twoPagePopUp).text(`View ${this.book.getPageName(jumpIndex)}`);

        // $$$ TODO: Make sure popup is positioned so that it is in view
        // (https://bugs.edge.launchpad.net/gnubook/+bug/327456)
        $(this.br.twoPagePopUp).css({
          left: `${e.pageX - this.br.refs.$brContainer.offset().left + this.br.refs.$brContainer.scrollLeft() + leftOffset()}px`,
          top: `${e.pageY - this.br.refs.$brContainer.offset().top + this.br.refs.$brContainer.scrollTop()}px`
        });
      });
    }
  }

  /**
   * Calculates 2-page spread dimensions based on this.br.twoPage.currentIndexL and
   * this.br.twoPage.currentIndexR
   * This function sets this.br.twoPage.height, twoPage.width
   */
  calculateSpreadSize() {
    const firstIndex  = this.br.twoPage.currentIndexL;
    const secondIndex = this.br.twoPage.currentIndexR;

    // Calculate page sizes and total leaf width
    let spreadSize;
    if ( this.br.twoPage.autofit) {
      spreadSize = this.getIdealSpreadSize(firstIndex, secondIndex);
    } else {
      // set based on reduction factor
      spreadSize = this.getSpreadSizeFromReduce(firstIndex, secondIndex, this.br.reduce);
    }

    // Both pages together
    this.br.twoPage.height = spreadSize.height;
    this.br.twoPage.width = spreadSize.width;

    // Individual pages
    this.br.twoPage.scaledWL = this.getPageWidth(firstIndex);
    this.br.twoPage.scaledWR = this.getPageWidth(secondIndex);

    // Leaf edges
    this.br.twoPage.edgeWidth = spreadSize.totalLeafEdgeWidth; // The combined width of both edges
    this.br.twoPage.leafEdgeWidthL = this.br.leafEdgeWidth(this.br.twoPage.currentIndexL);
    this.br.twoPage.leafEdgeWidthR = this.br.twoPage.edgeWidth - this.br.twoPage.leafEdgeWidthL;


    // Book cover
    // The width of the book cover div.  The combined width of both pages, twice the width
    // of the book cover internal padding (2*10) and the page edges
    this.br.twoPage.bookCoverDivWidth = this.coverWidth(this.br.twoPage.scaledWL + this.br.twoPage.scaledWR);
    // The height of the book cover div
    this.br.twoPage.bookCoverDivHeight = this.br.twoPage.height + 2 * this.br.twoPage.coverInternalPadding;


    // We calculate the total width and height for the div so that we can make the book
    // spine centered
    const leftGutterOffset = this.gutterOffsetForIndex(firstIndex);
    const leftWidthFromCenter = this.br.twoPage.scaledWL - leftGutterOffset + this.br.twoPage.leafEdgeWidthL;
    const rightWidthFromCenter = this.br.twoPage.scaledWR + leftGutterOffset + this.br.twoPage.leafEdgeWidthR;
    const largestWidthFromCenter = Math.max( leftWidthFromCenter, rightWidthFromCenter );
    this.br.twoPage.totalWidth = 2 * (largestWidthFromCenter + this.br.twoPage.coverInternalPadding + this.br.twoPage.coverExternalPadding);
    this.br.twoPage.totalHeight = this.br.twoPage.height + 2 * (this.br.twoPage.coverInternalPadding + this.br.twoPage.coverExternalPadding);

    // We want to minimize the unused space in two-up mode (maximize the amount of page
    // shown).  We give width to the leaf edges and these widths change (though the sum
    // of the two remains constant) as we flip through the book.  With the book
    // cover centered and fixed in the BRcontainer div the page images will meet
    // at the "gutter" which is generally offset from the center.
    this.br.twoPage.middle = this.br.twoPage.totalWidth >> 1;
    this.br.twoPage.gutter = this.br.twoPage.middle + this.gutterOffsetForIndex(firstIndex);

    // The left edge of the book cover moves depending on the width of the pages
    // $$$ change to getter
    this.br.twoPage.bookCoverDivLeft = this.br.twoPage.gutter - this.br.twoPage.scaledWL - this.br.twoPage.leafEdgeWidthL - this.br.twoPage.coverInternalPadding;
    // The top edge of the book cover stays a fixed distance from the top
    this.br.twoPage.bookCoverDivTop = this.br.twoPage.coverExternalPadding;

    // Book spine
    this.br.twoPage.bookSpineDivHeight = this.br.twoPage.height + 2 * this.br.twoPage.coverInternalPadding;
    this.br.twoPage.bookSpineDivLeft = this.br.twoPage.middle - (this.br.twoPage.bookSpineDivWidth >> 1);
    this.br.twoPage.bookSpineDivTop = this.br.twoPage.bookCoverDivTop;


    this.br.reduce = spreadSize.reduce; // $$$ really set this here?
  }

  /**
   *
   * @param {number} firstIndex
   * @param {number} secondIndex
   * @return {{ width: number, height: number, totalLeafEdgeWidth: number, reduce: number}}
   */
  getIdealSpreadSize(firstIndex, secondIndex) {
    const ideal = {};

    // We check which page is closest to a "normal" page and use that to set the height
    // for both pages.  This means that foldouts and other odd size pages will be displayed
    // smaller than the nominal zoom amount.
    const canon5Dratio = 1.5;

    const first = {
      height: this.book._getPageHeight(firstIndex),
      width: this.book._getPageWidth(firstIndex)
    };

    const second = {
      height: this.book._getPageHeight(secondIndex),
      width: this.book._getPageWidth(secondIndex)
    };

    const firstIndexRatio  = first.height / first.width;
    const secondIndexRatio = second.height / second.width;

    let ratio;
    if (Math.abs(firstIndexRatio - canon5Dratio) < Math.abs(secondIndexRatio - canon5Dratio)) {
      ratio = firstIndexRatio;
    } else {
      ratio = secondIndexRatio;
    }

    const totalLeafEdgeWidth = Math.floor(this.book.getNumLeafs() * 0.1);
    const maxLeafEdgeWidth = Math.floor(this.br.refs.$brContainer.prop('clientWidth') * 0.1);
    ideal.totalLeafEdgeWidth = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);

    const widthOutsidePages = 2 * (this.br.twoPage.coverInternalPadding + this.br.twoPage.coverExternalPadding) + ideal.totalLeafEdgeWidth;
    const heightOutsidePages = 2 * (this.br.twoPage.coverInternalPadding + this.br.twoPage.coverExternalPadding);

    ideal.width = (this.br.refs.$brContainer.width() - widthOutsidePages) >> 1;
    ideal.width -= 10; // $$$ fudge factor
    ideal.height = this.br.refs.$brContainer.height() - heightOutsidePages;

    ideal.height -= 15; // fudge factor

    if (ideal.height / ratio <= ideal.width) {
      //use height
      ideal.width = Math.floor(ideal.height / ratio);
    } else {
      //use width
      ideal.height = Math.floor(ideal.width * ratio);
    }

    // $$$ check this logic with large spreads
    ideal.reduce = ((first.height + second.height) / 2) / ideal.height;

    return ideal;
  }

  /**
   * Returns the spread size calculated from the reduction factor for the given pages
   * @param {number} firstIndex
   * @param {number} secondIndex
   * @return {Object}
   */
  getSpreadSizeFromReduce(firstIndex, secondIndex, reduce) {
    const spreadSize = {};
    // $$$ Scale this based on reduce?
    const totalLeafEdgeWidth = Math.floor(this.book.getNumLeafs() * 0.1);
    // $$$ Assumes leaf edge width constant at all zoom levels
    const maxLeafEdgeWidth = Math.floor(this.br.refs.$brContainer.prop('clientWidth') * 0.1);
    spreadSize.totalLeafEdgeWidth = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);

    // $$$ Possibly incorrect -- we should make height "dominant"
    const nativeWidth = this.book._getPageWidth(firstIndex) + this.book._getPageWidth(secondIndex);
    const nativeHeight = this.book._getPageHeight(firstIndex) + this.book._getPageHeight(secondIndex);
    spreadSize.height = Math.floor( (nativeHeight / 2) / this.br.reduce );
    spreadSize.width = Math.floor( (nativeWidth / 2) / this.br.reduce );
    spreadSize.reduce = reduce;

    return spreadSize;
  }

  /**
   * Returns the current ideal reduction factor
   * @return {number}
   */
  getAutofitReduce() {
    const spreadSize = this.getIdealSpreadSize(this.br.twoPage.currentIndexL, this.br.twoPage.currentIndexR);
    return spreadSize.reduce;
  }

  /**
   * Returns true if the pages extend past the edge of the view
   * @deprecated slated for deprecation by v5.0.0
   * @return {boolean}
   */
  isZoomedIn() {
    let isZoomedIn = false;
    if (this.br.twoPage.autofit != 'auto') {
      if (this.br.reduce < this.getAutofitReduce()) {
        isZoomedIn = true;
      }
    }
    return isZoomedIn;
  }

  calculateReductionFactors() {
    this.br.twoPage.reductionFactors = this.br.reductionFactors.concat([
      {
        reduce: this.getIdealSpreadSize( this.br.twoPage.currentIndexL, this.br.twoPage.currentIndexR ).reduce,
        autofit: 'auto'
      }
    ]);
    this.br.twoPage.reductionFactors.sort(this.br._reduceSort);
  }

  /**
   * Set the cursor for two page view
   * @deprecated Since version 4.3.3. Will be deleted in version 5.0
   */
  setCursor() {
    const $twoPageViewEl = this.br.refs.$brTwoPageView;
    if ( ($twoPageViewEl.width() > this.br.refs.$brContainer.prop('clientWidth')) ||
           ($twoPageViewEl.height() > this.br.refs.$brContainer.prop('clientHeight')) ) {
      if (this.br.prefetchedImgs[this.br.twoPage.currentIndexL])
        this.br.prefetchedImgs[this.br.twoPage.currentIndexL].style.cursor = 'move';
      if (this.br.prefetchedImgs[this.br.twoPage.currentIndexR])
        this.br.prefetchedImgs[this.br.twoPage.currentIndexR].style.cursor = 'move';
    } else {
      if (this.br.prefetchedImgs[this.br.twoPage.currentIndexL])
        this.br.prefetchedImgs[this.br.twoPage.currentIndexL].style.cursor = '';
      if (this.br.prefetchedImgs[this.br.twoPage.currentIndexR])
        this.br.prefetchedImgs[this.br.twoPage.currentIndexR].style.cursor = '';
    }
  }

  /**
   * @param {Number|null} index to flip back one spread, pass index=null
   */
  flipBackToIndex(index) {
    if (this.br.constMode1up == this.br.mode) return;
    if (this.br.animating) return;

    if (null != this.br.leafEdgeTmp) {
      alert('error: leafEdgeTmp should be null!');
      return;
    }

    if (null == index) {
      const {currentIndexL, currentIndexR} = this.br.twoPage;
      const minDisplayedIndex = Math.min(currentIndexL, currentIndexR);
      const prev = this.book.getPage(minDisplayedIndex).findPrev({ combineConsecutiveUnviewables: true });
      if (!prev) return;
      index = prev.index;
      // Can only flip to a left page
      // (downstream code handles index = -1, so this is ok I guess)
      if (prev.pageSide == 'R') index--;
    }

    this.br.updateNavIndexThrottled(index);

    const previousIndices = this.book.getSpreadIndices(index);

    if (previousIndices[0] < this.br.firstDisplayableIndex() || previousIndices[1] < this.br.firstDisplayableIndex()) {
      return;
    }

    this.br.animating = true;

    if ('rl' != this.br.pageProgression) {
      // Assume LTR and we are going backward
      this.prepareFlipLeftToRight(previousIndices[0], previousIndices[1]);
      this.flipLeftToRight(previousIndices[0], previousIndices[1]);
    } else {
      // RTL and going backward
      this.prepareFlipRightToLeft(previousIndices[0], previousIndices[1]);
      this.flipRightToLeft(previousIndices[0], previousIndices[1]);
    }
  }

  /**
   * Flips the page on the left towards the page on the right
   * @param {number} newIndexL
   * @param {number} newIndexR
   */
  flipLeftToRight(newIndexL, newIndexR) {
    this.br.refs.$brContainer.addClass("BRpageFlipping");
    const leftLeaf = this.br.twoPage.currentIndexL;

    const oldLeafEdgeWidthL = this.br.leafEdgeWidth(this.br.twoPage.currentIndexL);
    const newLeafEdgeWidthL = this.br.leafEdgeWidth(newIndexL);
    const leafEdgeTmpW = oldLeafEdgeWidthL - newLeafEdgeWidthL;

    const currWidthL   = this.getPageWidth(leftLeaf);
    const newWidthL    = this.getPageWidth(newIndexL);
    const newWidthR    = this.getPageWidth(newIndexR);

    const top  = this.top();
    const gutter = this.br.twoPage.middle + this.gutterOffsetForIndex(newIndexL);

    //animation strategy:
    // 0. remove search highlight, if any.
    // 1. create a new div, called leafEdgeTmp to represent the leaf edge between the leftmost edge
    //    of the left leaf and where the user clicked in the leaf edge.
    //    Note that if this function was triggered by left() and not a
    //    mouse click, the width of leafEdgeTmp is very small (zero px).
    // 2. animate both leafEdgeTmp to the gutter (without changing its width) and animate
    //    leftLeaf to width=0.
    // 3. When step 2 is finished, animate leafEdgeTmp to right-hand side of new right leaf
    //    (left=gutter+newWidthR) while also animating the new right leaf from width=0 to
    //    its new full width.
    // 4. After step 3 is finished, do the following:
    //      - remove leafEdgeTmp from the dom.
    //      - resize and move the right leaf edge (leafEdgeR) to left=gutter+newWidthR
    //          and width=twoPage.edgeWidth-newLeafEdgeWidthL.
    //      - resize and move the left leaf edge (leafEdgeL) to left=gutter-newWidthL-newLeafEdgeWidthL
    //          and width=newLeafEdgeWidthL.
    //      - resize the back cover (twoPage.coverDiv) to left=gutter-newWidthL-newLeafEdgeWidthL-10
    //          and width=newWidthL+newWidthR+twoPage.edgeWidth+20
    //      - move new left leaf (newIndexL) forward to zindex=2 so it can receive clicks.
    //      - remove old left and right leafs from the dom [pruneUnusedImgs()].
    //      - prefetch new adjacent leafs.
    //      - set up click handlers for both new left and right leafs.
    //      - redraw the search highlight.
    //      - update the pagenum box and the url.

    const $twoPageViewEl = this.br.refs.$brTwoPageView;
    const leftEdgeTmpLeft = gutter - currWidthL - leafEdgeTmpW;

    this.br.leafEdgeTmp = document.createElement('div');
    this.br.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.br.leafEdgeTmp).css({
      width: `${leafEdgeTmpW}px`,
      height: `${this.br.twoPage.height}px`,
      left: `${leftEdgeTmpLeft}px`,
      top: `${top}px`,
      zIndex: 1000,
    }).appendTo($twoPageViewEl);

    $(this.leafEdgeL).css({
      width: `${newLeafEdgeWidthL}px`,
      left: `${gutter - currWidthL - newLeafEdgeWidthL}px`
    });

    // Left gets the offset of the current left leaf from the document
    const left = $(this.br.prefetchedImgs[leftLeaf]).offset().left;
    // $$$ This seems very similar to the gutter.  May be able to consolidate the logic.
    const right = `${$twoPageViewEl.prop('clientWidth') - left - $(this.br.prefetchedImgs[leftLeaf]).width() + $twoPageViewEl.offset().left - 2}px`;

    // We change the left leaf to right positioning
    // $$$ This causes animation glitches during resize.  See https://bugs.edge.launchpad.net/gnubook/+bug/328327
    $(this.br.prefetchedImgs[leftLeaf]).css({
      right: right,
      left: ''
    });

    $(this.br.leafEdgeTmp).animate({left: gutter}, this.br.flipSpeed, 'easeInSine');

    if (this.br.enableSearch) this.br.removeSearchHilites();

    $(this.br.prefetchedImgs[leftLeaf]).animate({width: '0px'}, this.br.flipSpeed, 'easeInSine', () => {

      $(this.br.leafEdgeTmp).animate({left: `${gutter + newWidthR}px`}, this.br.flipSpeed, 'easeOutSine');

      this.br.$('.BRgutter').css({left: `${gutter - this.br.twoPage.bookSpineDivWidth * 0.5}px`});

      $(this.br.prefetchedImgs[newIndexR]).animate({width: `${newWidthR}px`}, this.br.flipSpeed, 'easeOutSine', () => {
        $(this.br.prefetchedImgs[newIndexL]).css('zIndex', 2);

        //jquery adds display:block to the element style, which interferes with our print css
        $(this.br.prefetchedImgs[newIndexL]).css('display', '');
        $(this.br.prefetchedImgs[newIndexR]).css('display', '');

        $(this.leafEdgeR).css({
          // Moves the right leaf edge
          width: `${this.br.twoPage.edgeWidth - newLeafEdgeWidthL}px`,
          left:  `${gutter + newWidthR}px`
        });

        $(this.leafEdgeL).css({
          // Moves and resizes the left leaf edge
          width: `${newLeafEdgeWidthL}px`,
          left:  `${gutter - newWidthL - newLeafEdgeWidthL}px`
        });

        // Resizes the brown border div
        $(this.br.twoPage.coverDiv).css({
          width: `${this.coverWidth(newWidthL + newWidthR)}px`,
          left: `${gutter - newWidthL - newLeafEdgeWidthL - this.br.twoPage.coverInternalPadding}px`
        });

        $(this.br.leafEdgeTmp).remove();
        this.br.leafEdgeTmp = null;

        // $$$ TODO refactor with opposite direction flip

        this.br.twoPage.currentIndexL = newIndexL;
        this.br.twoPage.currentIndexR = newIndexR;
        this.br.twoPage.scaledWL = newWidthL;
        this.br.twoPage.scaledWR = newWidthR;
        this.br.twoPage.gutter = gutter;

        this.br.updateFirstIndex(this.br.twoPage.currentIndexL);
        this.br.displayedIndices = [newIndexL, newIndexR];
        this.br.pruneUnusedImgs();
        this.br.prefetch();
        this.br.animating = false;

        if (this.br.enableSearch) this.br.updateSearchHilites();

        this.setMouseHandlers();

        if (this.br.animationFinishedCallback) {
          this.br.animationFinishedCallback();
          this.br.animationFinishedCallback = null;
        }

        this.br.refs.$brContainer.removeClass("BRpageFlipping");

        this.br.textSelectionPlugin?.stopPageFlip(this.br.refs.$brContainer);
        this.br.trigger('pageChanged');
      });
    });
  }

  /**
   * Whether we flip left or right is dependent on the page progression
   * to flip forward one spread, pass index=null
   * @param {number} index
   */
  flipFwdToIndex(index) {
    if (this.br.animating) return;

    if (null != this.br.leafEdgeTmp) {
      alert('error: leafEdgeTmp should be null!');
      return;
    }

    if (null == index) {
      // Need to use the max here, since it could be a right to left book
      const {currentIndexL, currentIndexR} = this.br.twoPage;
      const maxDisplayedIndex = Math.max(currentIndexL, currentIndexR);
      const nextPage = this.book.getPage(maxDisplayedIndex).findNext({ combineConsecutiveUnviewables: true });
      if (!nextPage) return;
      index = nextPage.index;
    }
    if (index > this.br.lastDisplayableIndex()) return;

    this.br.updateNavIndexThrottled(index);

    this.br.animating = true;

    const nextIndices = this.book.getSpreadIndices(index);

    if ('rl' != this.br.pageProgression) {
      // We did not specify RTL
      this.prepareFlipRightToLeft(nextIndices[0], nextIndices[1]);
      this.flipRightToLeft(nextIndices[0], nextIndices[1]);
    } else {
      // RTL
      this.prepareFlipLeftToRight(nextIndices[0], nextIndices[1]);
      this.flipLeftToRight(nextIndices[0], nextIndices[1]);
    }
  }

  /**
   * Flip from left to right and show the nextL and nextR indices on those sides
   * $$$ better not to have to pass gutter in
   * @param {number} newIndexL
   * @param {number} newIndexR
   */
  flipRightToLeft(newIndexL, newIndexR) {
    this.br.refs.$brContainer.addClass("BRpageFlipping");

    const oldLeafEdgeWidthL = this.br.leafEdgeWidth(this.br.twoPage.currentIndexL);
    const oldLeafEdgeWidthR = this.br.twoPage.edgeWidth - oldLeafEdgeWidthL;
    const newLeafEdgeWidthL = this.br.leafEdgeWidth(newIndexL);
    const newLeafEdgeWidthR = this.br.twoPage.edgeWidth - newLeafEdgeWidthL;

    const leafEdgeTmpW = oldLeafEdgeWidthR - newLeafEdgeWidthR;

    const top = this.top();
    const scaledW = this.getPageWidth(this.br.twoPage.currentIndexR);

    const middle = this.br.twoPage.middle;
    const gutter = middle + this.gutterOffsetForIndex(newIndexL);

    const $twoPageViewEl = this.br.refs.$brTwoPageView;

    this.br.leafEdgeTmp = document.createElement('div');
    this.br.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.br.leafEdgeTmp).css({
      width: `${leafEdgeTmpW}px`,
      height: `${this.br.twoPage.height}px`,
      left: `${gutter + scaledW}px`,
      top: `${top}px`,
      zIndex:1000
    }).appendTo($twoPageViewEl);

    const newWidthL = this.getPageWidth(newIndexL);
    const newWidthR = this.getPageWidth(newIndexR);

    $(this.leafEdgeR).css({width: `${newLeafEdgeWidthR}px`, left: `${gutter + newWidthR}px` });
    const speed = this.br.flipSpeed;

    if (this.br.enableSearch) this.br.removeSearchHilites();

    $(this.br.leafEdgeTmp).animate({left: gutter}, speed, 'easeInSine');
    $(this.br.prefetchedImgs[this.br.twoPage.currentIndexR]).animate({width: '0px'}, speed, 'easeInSine', () => {
      this.br.$('BRgutter').css({left: `${gutter - this.br.twoPage.bookSpineDivWidth * 0.5}px`});
      $(this.br.leafEdgeTmp).animate({left: `${gutter - newWidthL - leafEdgeTmpW}px`}, speed, 'easeOutSine');
      $(this.br.prefetchedImgs[newIndexL]).animate({width: `${newWidthL}px`}, speed, 'easeOutSine', () => {
        $(this.br.prefetchedImgs[newIndexR]).css('zIndex', 2);

        //jquery adds display:block to the element style, which interferes with our print css
        $(this.br.prefetchedImgs[newIndexL]).css('display', '');
        $(this.br.prefetchedImgs[newIndexR]).css('display', '');

        $(this.leafEdgeL).css({
          width: `${newLeafEdgeWidthL}px`,
          left: `${gutter - newWidthL - newLeafEdgeWidthL}px`
        });

        // Resizes the book cover
        $(this.br.twoPage.coverDiv).css({
          width: `${this.coverWidth(newWidthL + newWidthR)}px`,
          left: `${gutter - newWidthL - newLeafEdgeWidthL - this.br.twoPage.coverInternalPadding}px`
        });

        $(this.br.leafEdgeTmp).remove();
        this.br.leafEdgeTmp = null;

        this.br.twoPage.currentIndexL = newIndexL;
        this.br.twoPage.currentIndexR = newIndexR;
        this.br.twoPage.scaledWL = newWidthL;
        this.br.twoPage.scaledWR = newWidthR;
        this.br.twoPage.gutter = gutter;

        this.br.updateFirstIndex(this.br.twoPage.currentIndexL);
        this.br.displayedIndices = [newIndexL, newIndexR];
        this.br.pruneUnusedImgs();
        this.br.prefetch();
        this.br.animating = false;


        if (this.br.enableSearch) this.br.updateSearchHilites();

        this.setMouseHandlers();

        if (this.br.animationFinishedCallback) {
          this.br.animationFinishedCallback();
          this.br.animationFinishedCallback = null;
        }

        this.br.refs.$brContainer.removeClass("BRpageFlipping");

        this.br.textSelectionPlugin?.stopPageFlip(this.br.refs.$brContainer);
        this.br.trigger('pageChanged');
      });
    });
  }

  setMouseHandlers() {
    /**
     * @param {HTMLElement} element
     * @param {JQuery.MouseDownEvent<HTMLElement, { self: Mode2Up, direction: 'R' | 'L'}>} e
     */
    const handler = function(element, e) {
      if (e.which == 3) {
        // right click
        return !e.data.self.br.protected;
      }
      e.data.self.br.trigger(EVENTS.stop);
      e.data.self.br[e.data.direction === 'L' ? 'left' : 'right']();

      // Removed event handler for mouse movement, seems not to be needed
      /*
      // Changes per WEBDEV-2737
      BookReader: zoomed-in 2 page view, clicking page should change the page
      $(element)
        .mousemove(function() {
          e.preventDefault();
        })
      */
    };

    this.setClickHandler(
      this.br.prefetchedImgs[this.br.twoPage.currentIndexR],
      { self: this, direction: 'R' },
      handler
    );
    this.setClickHandler(
      this.br.prefetchedImgs[this.br.twoPage.currentIndexL],
      { self: this, direction: 'L' },
      handler
    );
  }

  /**
   * Prepare to flip the left page towards the right.  This corresponds to moving
   * backward when the page progression is left to right.
   * @param {number} prevL
   * @param {number} prevR
   */
  prepareFlipLeftToRight(prevL, prevR) {
    this.br.prefetchImg(prevL);
    this.br.prefetchImg(prevR);

    const height  = this.book._getPageHeight(prevL);
    const width   = this.book._getPageWidth(prevL);
    const middle = this.br.twoPage.middle;
    const top  = this.top();
    const scaledW = this.br.twoPage.height * width / height; // $$$ assumes height of page is dominant

    // The gutter is the dividing line between the left and right pages.
    // It is offset from the middle to create the illusion of thickness to the pages
    const gutter = middle + this.gutterOffsetForIndex(prevL);

    const leftCSS = {
      position: 'absolute',
      left: `${gutter - scaledW}px`,
      right: '', // clear right property
      top:    `${top}px`,
      height: this.br.twoPage.height,
      width:  `${scaledW}px`,
      zIndex: 1
    };

    $(this.br.prefetchedImgs[prevL]).css(leftCSS);

    const $twoPageViewEl = this.br.refs.$brTwoPageView;
    $twoPageViewEl.append(this.br.prefetchedImgs[prevL]);

    const rightCSS = {
      position: 'absolute',
      left:   `${gutter}px`,
      right: '',
      top:    `${top}px`,
      height: this.br.twoPage.height,
      width:  '0',
      zIndex: 2
    };

    $(this.br.prefetchedImgs[prevR]).css(rightCSS);

    $twoPageViewEl.append(this.br.prefetchedImgs[prevR]);
  }

  /**
   * // $$$ mang we're adding an extra pixel in the middle.  See https://bugs.edge.launchpad.net/gnubook/+bug/411667
   */
  prepareFlipRightToLeft(nextL, nextR) {
    // Prefetch images
    this.br.prefetchImg(nextL);
    this.br.prefetchImg(nextR);

    let height = this.book._getPageHeight(nextR);
    let width = this.book._getPageWidth(nextR);
    const middle = this.br.twoPage.middle;
    const top = this.top();
    let scaledW = this.br.twoPage.height * width / height;

    const gutter = middle + this.gutterOffsetForIndex(nextL);

    $(this.br.prefetchedImgs[nextR]).css({
      position: 'absolute',
      left:   `${gutter}px`,
      top:    `${top}px`,
      height: this.br.twoPage.height,
      width:  `${scaledW}px`,
      zIndex: 1,
    });

    const $twoPageViewEl = this.br.refs.$brTwoPageView;
    $twoPageViewEl.append(this.br.prefetchedImgs[nextR]);

    height = this.book._getPageHeight(nextL);
    width = this.book._getPageWidth(nextL);
    scaledW = this.br.twoPage.height * width / height;

    $(this.br.prefetchedImgs[nextL]).css({
      position: 'absolute',
      right: `${$twoPageViewEl.prop('clientWidth') - gutter}px`,
      top: `${top}px`,
      height: this.br.twoPage.height,
      width: '0px', // Start at 0 width, then grow to the left
      zIndex: 2,
    });

    $twoPageViewEl.append(this.br.prefetchedImgs[nextL]);
  }

  getPageWidth(index) {
    // We return the width based on the dominant height
    const height = this.book._getPageHeight(index);
    const width = this.book._getPageWidth(index);
    // $$$ we assume width is relative to current spread
    return Math.floor(this.br.twoPage.height * width / height);
  }

  /**
   * Returns the position of the gutter (line between the page images)
   */
  gutter() {
    return this.br.twoPage.middle + this.gutterOffsetForIndex(this.br.twoPage.currentIndexL);
  }

  /**
   * Returns the offset for the top of the page images
   */
  top() {
    return this.br.twoPage.coverExternalPadding + this.br.twoPage.coverInternalPadding; // $$$ + border?
  }

  /**
  * Returns the width of the cover div given the total page width
  * @param {number} totalPageWidth
  * @return {number}
  */
  coverWidth(totalPageWidth) {
    return totalPageWidth + this.br.twoPage.edgeWidth + 2 * this.br.twoPage.coverInternalPadding;
  }

  /**
   * Returns the percentage offset into twopageview div at the center of container div
   */
  getViewCenter() {
    const { $brContainer, $brTwoPageView } = this.br.refs;
    const center = {};

    const containerOffset = $brContainer.offset();
    const viewOffset = $brTwoPageView.offset();
    center.percentageX = (containerOffset.left - viewOffset.left + ($brContainer.prop('clientWidth') >> 1)) / this.br.twoPage.totalWidth;
    center.percentageY = (containerOffset.top - viewOffset.top + ($brContainer.prop('clientHeight') >> 1)) / this.br.twoPage.totalHeight;

    return center;
  }

  /**
   * Centers the point given by percentage from left,top of twopageview
   * @param {number} percentageX
   * @param {number} percentageY
   */
  centerView(percentageX, percentageY) {
    if ('undefined' == typeof(percentageX)) {
      percentageX = 0.5;
    }
    if ('undefined' == typeof(percentageY)) {
      percentageY = 0.5;
    }

    const viewWidth = this.br.refs.$brTwoPageView.width();
    const containerClientWidth = this.br.refs.$brContainer.prop('clientWidth');
    const intoViewX = percentageX * viewWidth;

    const viewHeight = this.br.refs.$brTwoPageView.height();
    const containerClientHeight = this.br.refs.$brContainer.prop('clientHeight');
    const intoViewY = percentageY * viewHeight;

    if (viewWidth < containerClientWidth) {
      // Can fit width without scrollbars - center by adjusting offset
      this.br.refs.$brTwoPageView.css('left', `${(containerClientWidth >> 1) - intoViewX}px`);
    } else {
      // Need to scroll to center
      this.br.refs.$brTwoPageView.css('left', 0);
      this.br.refs.$brContainer.scrollLeft(intoViewX - (containerClientWidth >> 1));
    }

    if (viewHeight < containerClientHeight) {
      // Fits with scrollbars - add offset
      this.br.refs.$brTwoPageView.css('top', `${(containerClientHeight >> 1) - intoViewY}px`);
    } else {
      this.br.refs.$brTwoPageView.css('top', 0);
      this.br.refs.$brContainer.scrollTop(intoViewY - (containerClientHeight >> 1));
    }
  }

  /**
   * Returns the integer height of the click-to-flip areas at the edges of the book
   * @return {number}
   */
  flipAreaHeight() {
    return Math.floor(this.br.twoPage.height);
  }

  /**
   * Returns the the integer width of the flip areas
   * @return {number}
   */
  flipAreaWidth() {
    const max = 100; // $$$ TODO base on view width?
    const min = 10;

    const width = this.br.twoPage.width * 0.15;
    return Math.floor(clamp(width, min, max));
  }

  /**
   * Returns integer top offset for flip areas
   * @return {number}
   */
  flipAreaTop() {
    return Math.floor(this.br.twoPage.bookCoverDivTop + this.br.twoPage.coverInternalPadding);
  }

  /**
   * Left offset for left flip area
   * @return {number}
   */
  leftFlipAreaLeft() {
    return Math.floor(this.br.twoPage.gutter - this.br.twoPage.scaledWL);
  }

  /**
   * Left offset for right flip area
   * @return {number}
   */
  rightFlipAreaLeft() {
    return Math.floor(this.br.twoPage.gutter + this.br.twoPage.scaledWR - this.flipAreaWidth());
  }

  /**
   * Position calculation shared between search and text-to-speech functions
   */
  setHilightCss(div, index, left, right, top, bottom) {
    // We calculate the reduction factor for the specific page because it can be different
    // for each page in the spread
    const height = this.book._getPageHeight(index);
    const width  = this.book._getPageWidth(index);
    const reduce = this.br.twoPage.height / height;
    const scaledW = Math.floor(width * reduce);

    const gutter = this.gutter();
    let pageL;
    if ('L' == this.book.getPageSide(index)) {
      pageL = gutter - scaledW;
    } else {
      pageL = gutter;
    }
    const pageT = this.top();

    $(div).css({
      width:  `${(right - left) * reduce}px`,
      height: `${(bottom - top) * reduce}px`,
      left:   `${pageL + left * reduce}px`,
      top:    `${pageT + top * reduce}px`
    });
  }

  /**
   * Returns the gutter offset for the spread containing the given index.
   * This function supports RTL
   * @param {number} pindex
   * @return {number}
   */
  gutterOffsetForIndex(pindex) {
    // To find the offset of the gutter from the middle we calculate our percentage distance
    // through the book (0..1), remap to (-0.5..0.5) and multiply by the total page edge width
    let offset = Math.floor(((pindex / this.book.getNumLeafs()) - 0.5) * this.br.twoPage.edgeWidth);

    // But then again for RTL it's the opposite
    if ('rl' == this.br.pageProgression) {
      offset *= -1;
    }

    return offset;
  }

  /**
   * Returns the width of the leaf edge div for the page with index given
   * @param {number} pindex
   * @return {number}
   */
  leafEdgeWidth(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.book.getPageSide(pindex) == 'L') && (this.br.pageProgression != 'rl')) {
      return Math.floor( (pindex / this.book.getNumLeafs()) * this.br.twoPage.edgeWidth + 0.5);
    } else {
      return Math.floor( (1 - pindex / this.book.getNumLeafs()) * this.br.twoPage.edgeWidth + 0.5);
    }
  }

  /**
   * Returns the target jump leaf given a page coordinate (inside the left page edge div)
   * @param {number} pageX
   * @return {PageIndex}
   */
  jumpIndexForLeftEdgePageX(pageX) {
    let jumpIndex;
    if ('rl' != this.br.pageProgression) {
      // LTR - flipping backward
      jumpIndex = this.br.twoPage.currentIndexL - ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;

      // browser may have resized the div due to font size change -- see https://bugs.launchpad.net/gnubook/+bug/333570
      jumpIndex = clamp(Math.round(jumpIndex), this.br.firstDisplayableIndex(), this.br.twoPage.currentIndexL - 2);
      return jumpIndex;

    } else {
      jumpIndex = this.br.twoPage.currentIndexL + ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;
      jumpIndex = clamp(Math.round(jumpIndex), this.br.twoPage.currentIndexL + 2, this.br.lastDisplayableIndex());
      return jumpIndex;
    }
  }

  /**
   * Returns the target jump leaf given a page coordinate (inside the right page edge div)
   * @param {number} pageX
   * @return {PageIndex}
   */
  jumpIndexForRightEdgePageX(pageX) {
    let jumpIndex;
    if ('rl' != this.br.pageProgression) {
      // LTR
      jumpIndex = this.br.twoPage.currentIndexL + (pageX - $(this.leafEdgeR).offset().left) * 10;
      jumpIndex = clamp(Math.round(jumpIndex), this.br.twoPage.currentIndexL + 2, this.br.lastDisplayableIndex());
      return jumpIndex;
    } else {
      jumpIndex = this.br.twoPage.currentIndexL - (pageX - $(this.leafEdgeR).offset().left) * 10;
      jumpIndex = clamp(Math.round(jumpIndex), this.br.firstDisplayableIndex(), this.br.twoPage.currentIndexL - 2);
      return jumpIndex;
    }
  }

  /**
   * Fetches the currently displayed images (if not already fetching)
   * as wells as any nearby pages.
   */
  prefetch() {
    // $$$ We should check here if the current indices have finished
    //     loading (with some timeout) before loading more page images
    //     See https://bugs.edge.launchpad.net/bookreader/+bug/511391
    const { max, min } = Math;
    const { book } = this;
    const { currentIndexL, currentIndexR } = this.br.twoPage;
    const ADJACENT_PAGES_TO_LOAD = 3;

    // currentIndexL can be -1; getPage returns the last page of the book
    // when given -1, so need to prevent that.
    let lowPage = book.getPage(max(0, min(currentIndexL, currentIndexR)));
    let highPage = book.getPage(max(currentIndexL, currentIndexR));
    for (let i = 0; i < ADJACENT_PAGES_TO_LOAD + 1; i++) {
      if (lowPage) {
        this.br.prefetchImg(lowPage.index);
        lowPage = lowPage.findPrev({ combineConsecutiveUnviewables: true });
      }

      if (highPage) {
        this.br.prefetchImg(highPage.index);
        highPage = highPage.findNext({ combineConsecutiveUnviewables: true });
      }
    }
  }
}

/**
 * @implements {BookReaderOptions["twoPage"]}
 * @typedef {object} TwoPageState
 * @property {number} coverInternalPadding
 * @property {number} coverExternalPadding
 *
 * @property {import('./options.js').AutoFitValues} autofit
 * @property {number} width
 * @property {number} height
 * @property {number} currentIndexL
 * @property {number} currentIndexR
 * @property {number} scaledWL
 * @property {number} scaledWR
 * @property {number} gutter
 * @property {Array<{reduce: number, autofit: import('./options.js').AutoFitValues}>} reductionFactors
 * @property {number} totalHeight
 * @property {number} totalWidth
 *
 * @property {HTMLDivElement} coverDiv
 * @property {number} bookCoverDivTop
 * @property {number} bookCoverDivLeft
 * @property {number} bookCoverDivWidth
 * @property {number} bookCoverDivHeight
 *
 * @property {number} leafEdgeWidthL
 * @property {number} leafEdgeWidthR
 *
 * @property {number} bookSpineDivTop
 * @property {number} bookSpineDivLeft
 * @property {number} bookSpineDivWidth
 * @property {number} bookSpineDivHeight
 *
 * @property {number} edgeWidth
 * @property {number} middle
 */
