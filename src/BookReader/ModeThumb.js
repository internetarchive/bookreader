// @ts-check
import { notInArray, clamp } from './utils.js';
import { EVENTS } from './events.js';
import { DragScrollable } from './DragScrollable.js';
/** @typedef {import('../BookREader.js').default} BookReader */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */
/** @typedef {import('./BookModel.js').BookModel} BookModel */

/** @typedef {JQuery} $lazyLoadImgPlaceholder * jQuery element with data attributes: leaf, reduce */

export class ModeThumb {
  /**
   * @param {BookReader} br
   * @param {BookModel} bookModel
   */
  constructor(br, bookModel) {
    this.br = br;
    this.book = bookModel;
  }

  /**
   * Draws the thumbnail view
   * @param {number} [seekIndex] If seekIndex is defined, the view will be drawn
   *    with that page visible (without any animated scrolling).
   *
   * Creates place holder for image to load after gallery has been drawn
   */
  drawLeafs(seekIndex) {
    const { floor } = Math;
    const { book } = this;
    const viewWidth = this.br.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer

    let leafHeight;
    let rightPos = 0;
    let bottomPos = 0;
    let maxRight = 0;
    let currentRow = 0;
    let leafIndex = 0;
    /** @type {Array<{ leafs?: Array<{num: PageIndex, left: number}>, height?: number, top?: number }>} */
    const leafMap = [];

    // Will be set to top of requested seek index, if set
    let seekTop;

    // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
    // make `leafMap`
    for (const page of book.pagesIterator({ combineConsecutiveUnviewables: true })) {
      const leafWidth = this.br.thumbWidth;
      if (rightPos + (leafWidth + this.br.thumbPadding) > viewWidth) {
        currentRow++;
        rightPos = 0;
        leafIndex = 0;
      }

      // Init current row in leafMap
      if (!leafMap[currentRow]) {
        leafMap[currentRow] = {};
      }
      if (!leafMap[currentRow].leafs) {
        leafMap[currentRow].leafs = [];
        leafMap[currentRow].height = 0;
        leafMap[currentRow].top = 0;
      }
      leafMap[currentRow].leafs[leafIndex] = {
        num: page.index,
        left: rightPos,
      };

      leafHeight = floor((page.height * this.br.thumbWidth) / page.width);
      if (leafHeight > leafMap[currentRow].height) {
        leafMap[currentRow].height = leafHeight;
      }
      if (leafIndex === 0) { bottomPos += this.br.thumbPadding + leafMap[currentRow].height; }
      rightPos += leafWidth + this.br.thumbPadding;
      if (rightPos > maxRight) { maxRight = rightPos; }
      leafIndex++;

      if (page.index == seekIndex) {
        seekTop = bottomPos - this.br.thumbPadding - leafMap[currentRow].height;
      }
    }

    // reset the bottom position based on thumbnails
    this.br.refs.$brPageViewEl.height(bottomPos);

    const pageViewBuffer = floor((this.br.refs.$brContainer.prop('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof(seekTop) != 'undefined') {
      this.br.refs.$brContainer.scrollTop(seekTop);
    }

    const scrollTop = this.br.refs.$brContainer.prop('scrollTop');
    const scrollBottom = scrollTop + this.br.refs.$brContainer.height();

    let leafTop = 0;
    let leafBottom = 0;
    const rowsToDisplay = [];
    const imagesToDisplay = [];

    // Visible leafs with least/greatest index
    let leastVisible = book.getNumLeafs() - 1;
    let mostVisible = 0;

    // Determine the thumbnails in view
    for (let i = 0; i < leafMap.length; i++) {
      if (!leafMap[i]) { continue; }
      leafBottom += this.br.thumbPadding + leafMap[i].height;
      const topInView = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
      const bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
      const middleInView = (leafTop <= scrollTop) && (leafBottom >= scrollBottom);
      if (topInView || bottomInView || middleInView) {
        rowsToDisplay.push(i);
        if (leafMap[i].leafs[0].num < leastVisible) {
          leastVisible = leafMap[i].leafs[0].num;
        }
        if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
          mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
        }
      }
      if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
      leafTop = leafBottom;
    }
    // at this point, `rowsToDisplay` now has all the rows in view

    // create a buffer of preloaded rows before and after the visible rows
    const firstRow = rowsToDisplay[0];
    const lastRow = rowsToDisplay[rowsToDisplay.length - 1];
    for (let i = 1; i < this.br.thumbRowBuffer + 1; i++) {
      if (lastRow + i < leafMap.length) { rowsToDisplay.push(lastRow + i); }
    }
    for (let i = 1; i < this.br.thumbRowBuffer; i++) {
      if (firstRow - i >= 0) { rowsToDisplay.push(firstRow - i); }
    }
    rowsToDisplay.sort((a, b) => a - b);

    // Create the thumbnail divs and images (lazy loaded)
    for (const row of rowsToDisplay) {
      if (notInArray(row, this.br.displayedRows)) {
        if (!leafMap[row]) { continue; }
        for (const { num: leaf, left: leafLeft } of leafMap[row].leafs) {
          const leafWidth = this.br.thumbWidth;
          const leafHeight = floor((book.getPageHeight(leaf) * this.br.thumbWidth) / book.getPageWidth(leaf));
          const leafTop = leafMap[row].top;
          let left = leafLeft + pageViewBuffer;
          if ('rl' == this.br.pageProgression) {
            left = viewWidth - leafWidth - left;
          }

          left += this.br.thumbPadding;
          imagesToDisplay.push(leaf);

          /* get thumbnail's reducer */
          const idealReduce = floor(book.getPageWidth(leaf) / this.br.thumbWidth);
          const nearestFactor2 = 2 * Math.round(idealReduce / 2);
          const thumbReduce = nearestFactor2;

          const pageContainer = this.br._createPageContainer(leaf)
            .update({
              dimensions: {
                width: leafWidth,
                height: leafHeight,
                top: leafTop,
                left,
              },
              reduce: thumbReduce,
            });

          pageContainer.$container.data('leaf', leaf).on('mouseup', event => {
            // We want to suppress the fragmentChange triggers in `updateFirstIndex` and `switchMode`
            // because otherwise it repeatedly triggers listeners and we get in an infinite loop.
            // We manually trigger the `fragmentChange` once at the end.
            this.br.updateFirstIndex(leaf, { suppressFragmentChange: true });
            // as per request in webdev-4042, we want to switch 1-up mode while clicking on thumbnail leafs
            this.br.switchMode(this.br.constMode1up, { suppressFragmentChange: true });

            // shift viewModeOrder after clicking on thumbsnail leaf
            const nextModeID = this.br.viewModeOrder.shift();
            this.br.viewModeOrder.push(nextModeID);
            this.br._components.navbar.updateViewModeButton($('.viewmode'), 'twopg', 'Two-page view');

            this.br.trigger(EVENTS.fragmentChange);
            event.stopPropagation();
          });

          this.br.refs.$brPageViewEl.append(pageContainer.$container);
        }
      }
    }

    // Remove thumbnails that are not to be displayed
    for (const row of this.br.displayedRows) {
      if (notInArray(row, rowsToDisplay)) {
        for (const { num: index } of leafMap[row]?.leafs) {
          if (!imagesToDisplay?.includes(index)) {
            this.br.$(`.pagediv${index}`)?.remove();
          }
        }
      }
    }

    // Update which page is considered current to make sure a visible page is the current one
    const currentIndex = this.br.currentIndex();
    if (currentIndex < leastVisible) {
      this.br.updateFirstIndex(leastVisible);
    } else if (currentIndex > mostVisible) {
      this.br.updateFirstIndex(mostVisible);
    }

    // remember what rows are displayed
    this.br.displayedRows = rowsToDisplay.slice();

    // remove previous highlights
    this.br.$('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

    // highlight current page
    this.br.$('.pagediv' + this.br.currentIndex()).addClass('BRpagedivthumb_highlight');
  }

  /**
   * Replaces placeholder image with real one
   *
   * @param {$lazyLoadImgPlaceholder} imgPlaceholder
   */
  lazyLoadImage(imgPlaceholder) {
    const leaf =  $(imgPlaceholder).data('leaf');
    const reduce =  $(imgPlaceholder).data('reduce');
    const $img = this.br.imageCache.image(leaf, reduce);
    const $parent = $(imgPlaceholder).parent();
    /* March 16, 2021 (isa) - manually append & remove, `replaceWith` currently loses closure scope */
    $($parent).append($img);
    $(imgPlaceholder).remove();
  }

  /**
   * @param {'in' | 'out'} direction
   */
  zoom(direction) {
    const oldColumns = this.br.thumbColumns;
    switch (direction) {
    case 'in':
      this.br.thumbColumns -= 1;
      break;
    case 'out':
      this.br.thumbColumns += 1;
      break;
    default:
      console.error(`Unsupported direction: ${direction}`);
    }

    // Limit zoom in/out columns
    this.br.thumbColumns = clamp(
      this.br.thumbColumns,
      this.br.options.thumbMinZoomColumns,
      this.br.options.thumbMaxZoomColumns
    );

    if (this.br.thumbColumns != oldColumns) {
      this.br.displayedRows = [];  /* force a gallery redraw */
      this.prepare();
    }
  }

  /**
   * Returns the width per thumbnail to display the requested number of columns
   * Note: #BRpageview must already exist since its width is used to calculate the
   *       thumbnail width
   * @param {number} thumbnailColumns
   */
  getThumbnailWidth(thumbnailColumns) {
    const DEFAULT_THUMBNAIL_WIDTH = 100;

    const padding = (thumbnailColumns + 1) * this.br.thumbPadding;
    const width = (this.br.refs.$brPageViewEl.width() - padding) / (thumbnailColumns + 0.5); // extra 0.5 is for some space at sides
    const idealThumbnailWidth = Math.floor(width);
    return idealThumbnailWidth > 0 ? idealThumbnailWidth : DEFAULT_THUMBNAIL_WIDTH;
  }

  prepare() {
    this.br.refs.$brContainer.empty();
    this.br.refs.$brContainer.css({
      overflowY: 'scroll',
      overflowX: 'auto'
    });

    this.br.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.br.refs.$brContainer.append(this.br.refs.$brPageViewEl);
    this.dragScrollable = this.dragScrollable || new DragScrollable(this.br.refs.$brContainer[0], {preventDefault: true});

    this.br.bindGestures(this.br.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // disableSelect(this.br.$('#BRpageview'));
    this.br.thumbWidth = this.getThumbnailWidth(this.br.thumbColumns);
    this.br.reduce = this.book.getPageWidth(0) / this.br.thumbWidth;
    this.br.displayedRows = [];
    // Draw leafs with current index directly in view (no animating to the index)
    this.drawLeafs(this.br.currentIndex());
    this.br.updateBrClasses();
  }

  /**
   * @param {PageIndex} index
   */
  jumpToIndex(index) {
    const { floor } = Math;
    const { book } = this;
    const viewWidth = this.br.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer
    const leafWidth = this.br.thumbWidth;
    let leafTop = 0;
    let rightPos = 0;
    let bottomPos = 0;
    let rowHeight = 0;
    let leafIndex = 0;

    for (let i = 0; i <= index; i++) {
      if (rightPos + (leafWidth + this.br.thumbPadding) > viewWidth) {
        rightPos = 0;
        rowHeight = 0;
        leafIndex = 0;
      }

      const leafHeight = floor((book.getPageHeight(leafIndex) * this.br.thumbWidth) / book.getPageWidth(leafIndex));
      if (leafHeight > rowHeight) { rowHeight = leafHeight; }
      if (leafIndex == 0) {
        leafTop = bottomPos;
        bottomPos += this.br.thumbPadding + rowHeight;
      }
      rightPos += leafWidth + this.br.thumbPadding;
      leafIndex++;
    }
    this.br.updateFirstIndex(index);
    if (this.br.refs.$brContainer.prop('scrollTop') == leafTop) {
      this.br.drawLeafs();
    } else {
      this.br.animating = true;
      this.br.refs.$brContainer.stop(true)
        .animate({ scrollTop: leafTop }, 'fast', () => { this.br.animating = false; });
    }
  }
}
