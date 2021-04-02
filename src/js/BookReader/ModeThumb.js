// @ts-check
import * as utils from './utils.js';
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */

/** @typedef {JQuery} $lazyLoadImgPlaceholder * jQuery element with data attributes: leaf, reduce */

export function extendBookReader(BookReader) {
  /**
   * Draws the thumbnail view
   * @param {number} seekIndex If seekIndex is defined, the view will be drawn
   *    with that page visible (without any animated scrolling).
   *
   * Creates place holder for image to load after gallery has been drawn
   */
  BookReader.prototype.drawLeafsThumbnail = function(seekIndex) {
    const { floor } = Math;
    const { book } = this._models;
    const viewWidth = this.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer

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
      const leafWidth = this.thumbWidth;
      if (rightPos + (leafWidth + this.thumbPadding) > viewWidth) {
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

      leafHeight = floor((page.height * this.thumbWidth) / page.width);
      if (leafHeight > leafMap[currentRow].height) {
        leafMap[currentRow].height = leafHeight;
      }
      if (leafIndex === 0) { bottomPos += this.thumbPadding + leafMap[currentRow].height; }
      rightPos += leafWidth + this.thumbPadding;
      if (rightPos > maxRight) { maxRight = rightPos; }
      leafIndex++;

      if (page.index == seekIndex) {
        seekTop = bottomPos - this.thumbPadding - leafMap[currentRow].height;
      }
    }

    // reset the bottom position based on thumbnails
    this.refs.$brPageViewEl.height(bottomPos);

    const pageViewBuffer = floor((this.refs.$brContainer.prop('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof(seekTop) != 'undefined') {
      this.refs.$brContainer.scrollTop(seekTop);
    }

    const scrollTop = this.refs.$brContainer.prop('scrollTop');
    const scrollBottom = scrollTop + this.refs.$brContainer.height();

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
      leafBottom += this.thumbPadding + leafMap[i].height;
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
    for (let i = 1; i < this.thumbRowBuffer + 1; i++) {
      if (lastRow + i < leafMap.length) { rowsToDisplay.push(lastRow + i); }
    }
    for (let i = 1; i < this.thumbRowBuffer; i++) {
      if (firstRow - i >= 0) { rowsToDisplay.push(firstRow - i); }
    }
    rowsToDisplay.sort();

    // Create the thumbnail divs and images (lazy loaded)
    for (const row of rowsToDisplay) {
      if (utils.notInArray(row, this.displayedRows)) {
        if (!leafMap[row]) { continue; }
        for (const { num: leaf, left: leafLeft } of leafMap[row].leafs) {
          const leafWidth = this.thumbWidth;
          const leafHeight = floor((book.getPageHeight(leaf) * this.thumbWidth) / book.getPageWidth(leaf));
          const leafTop = leafMap[row].top;
          let left = leafLeft + pageViewBuffer;
          if ('rl' == this.pageProgression) {
            left = viewWidth - leafWidth - left;
          }

          left += this.thumbPadding;
          const $pageContainer = this._createPageContainer(leaf, {
            width: `${leafWidth}px`,
            height: `${leafHeight}px`,
            top: `${leafTop}px`,
            left: `${left}px`,
          });

          $pageContainer.data('leaf', leaf).on('mouseup', event => {
          // We want to suppress the fragmentChange triggers in `updateFirstIndex` and `switchMode`
          // because otherwise it repeatedly triggers listeners and we get in an infinite loop.
          // We manually trigger the `fragmentChange` once at the end.
            this.updateFirstIndex(leaf, { suppressFragmentChange: true });
            // as per request in webdev-4042, we want to switch 1-up mode while clicking on thumbnail leafs
            this.switchMode(this.constMode1up, { suppressFragmentChange: true });

            // shift viewModeOrder after clicking on thumbsnail leaf
            const nextModeID = this.viewModeOrder.shift();
            this.viewModeOrder.push(nextModeID);
            this.updateViewModeButton($('.viewmode'), 'twopg', 'Two-page view');

            this.trigger(BookReader.eventNames.fragmentChange);
            event.stopPropagation();
          });

          this.refs.$brPageViewEl.append($pageContainer);
          imagesToDisplay.push(leaf);

          /* get thumbnail's reducer */
          const idealReduce = floor(book.getPageWidth(leaf) / this.thumbWidth);
          const nearestFactor2 = 2 * Math.round(idealReduce / 2);
          const thumbReduce = nearestFactor2;

          const baseCSS = { width: `${leafWidth}px`, height: `${leafHeight}px` };
          if (this.imageCache.imageLoaded(leaf, thumbReduce)) {
          // send to page
            $pageContainer.append($(this.imageCache.image(leaf, thumbReduce)).css(baseCSS));
          } else {
          // lazy load
            const $lazyLoadImgPlaceholder = document.createElement('img');
            $($lazyLoadImgPlaceholder)
              .attr('src', `${this.imagesBaseURL}transparent.png`)
              .css(baseCSS)
              .addClass('BRlazyload')
            // Store the leaf/index number to reference on url swap:
              .attr('data-leaf', leaf)
              .attr('data-reduce', thumbReduce)
              .attr('data-row', row)
              .attr('alt', 'Loading book image');
            $pageContainer.append($lazyLoadImgPlaceholder);
          }
        }
      }
    }

    // Remove thumbnails that are not to be displayed
    for (const row of this.displayedRows) {
      if (utils.notInArray(row, rowsToDisplay)) {
        for (const { num: index } of leafMap[row]?.leafs) {
          if (!imagesToDisplay?.includes(index)) {
            this.$(`.pagediv${index}`)?.remove();
          }
        }
      }
    }

    // Update which page is considered current to make sure a visible page is the current one
    const currentIndex = this.currentIndex();
    if (currentIndex < leastVisible) {
      this.updateFirstIndex(leastVisible);
    } else if (currentIndex > mostVisible) {
      this.updateFirstIndex(mostVisible);
    }

    // remember what rows are displayed
    this.displayedRows = rowsToDisplay.slice();

    // remove previous highlights
    this.$('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

    // highlight current page
    this.$('.pagediv' + this.currentIndex()).addClass('BRpagedivthumb_highlight');

    this.lazyLoadThumbnails();

    this.updateToolbarZoom(this.reduce);
  };

  BookReader.prototype.lazyLoadThumbnails = function() {
    const batchImageRequestByRow = async ($images) => {
      await utils.sleep(300);
      $images.each((index, $imgPlaceholder) => this.lazyLoadImage($imgPlaceholder));
    };

    this.displayedRows.forEach((row) => {
      const $imagesInRow = this.refs.$brPageViewEl.find(`[data-row="${row}"]`);
      batchImageRequestByRow($imagesInRow);
    });
  };

  /**
   * Replaces placeholder image with real one
   *
   * @param {$lazyLoadImgPlaceholder} imgPlaceholder
   */
  BookReader.prototype.lazyLoadImage = function (imgPlaceholder) {
    const leaf =  $(imgPlaceholder).data('leaf');
    const reduce =  $(imgPlaceholder).data('reduce');
    const $img = this.imageCache.image(leaf, reduce);
    const $parent = $(imgPlaceholder).parent();
    /* March 16, 2021 (isa) - manually append & remove, `replaceWith` currently loses closure scope */
    $($parent).append($img);
    $(imgPlaceholder).remove();
  };

  BookReader.prototype.zoomThumb = function(direction) {
    const oldColumns = this.thumbColumns;
    switch (direction) {
    case -1:
      this.thumbColumns += 1;
      break;
    case 1:
      this.thumbColumns -= 1;
      break;
    }

    // clamp
    if (this.thumbColumns < 2) {
      this.thumbColumns = 2;
    } else if (this.thumbColumns > 8) {
      this.thumbColumns = 8;
    }

    if (this.thumbColumns != oldColumns) {
      this.displayedRows = [];  /* force a gallery redraw */
      this.prepareThumbnailView();
    }
  };

  /**
   * Returns the width per thumbnail to display the requested number of columns
   * Note: #BRpageview must already exist since its width is used to calculate the
   *       thumbnail width
   * @param {number} thumbnailColumns
   */
  BookReader.prototype.getThumbnailWidth = function(thumbnailColumns) {
    const DEFAULT_THUMBNAIL_WIDTH = 100;

    const padding = (thumbnailColumns + 1) * this.thumbPadding;
    const width = (this.refs.$brPageViewEl.width() - padding) / (thumbnailColumns + 0.5); // extra 0.5 is for some space at sides
    const idealThumbnailWidth = Math.floor(width);
    return idealThumbnailWidth > 0 ? idealThumbnailWidth : DEFAULT_THUMBNAIL_WIDTH;
  };

  BookReader.prototype.prepareThumbnailView = function() {
    this.refs.$brContainer.empty();
    this.refs.$brContainer.css({
      overflowY: 'scroll',
      overflowX: 'auto'
    });

    this.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.refs.$brContainer.append(this.refs.$brPageViewEl);
    this.refs.$brContainer.dragscrollable({preventDefault:true});

    this.bindGestures(this.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // utils.disableSelect(this.$('#BRpageview'));
    this.thumbWidth = this.getThumbnailWidth(this.thumbColumns);
    this.reduce = this._models.book.getPageWidth(0) / this.thumbWidth;
    this.displayedRows = [];
    // Draw leafs with current index directly in view (no animating to the index)
    this.drawLeafsThumbnail( this.currentIndex() );
    this.updateBrClasses();
  };
}
