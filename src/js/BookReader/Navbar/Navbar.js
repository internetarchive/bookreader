import { debounce, throttle } from '../utils.js';

/**
 * Extends BookReader with Navbar prototype
 * @param {typeof BookReader} BookReader 
 */
export function extendWithNavbar(BookReader) {
  /**
   * Initialize the navigation bar (bottom)
   * @return {JQuery<HTMLDivElement>}
   */
  BookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar
    const { navbarTitle } = this.options;
    const navbarTitleHtml = navbarTitle ? `<div class="BRnavTitle">${navbarTitle}</div>` : '';

    this.refs.$BRfooter = $(`<div class="BRfooter"></div>`);
    this.refs.$BRnav = $(
      `<div class="BRnav BRnavDesktop">
          <div class="BRnavCntl BRnavCntlBtm BRdn js-tooltip" title="Toggle toolbars"></div>
          ${navbarTitleHtml}
          <div class="BRnavpos">
            <div class="BRpager"></div>
            <div class="BRnavline"></div>
          </div>
          <div class="BRpage">`

        // Note, it's important for there to not be whitespace
        + `<span class='BRcurrentpage'></span>`
        + `<button class="BRicon book_left js-tooltip"></button>`
        + `<button class="BRicon book_right js-tooltip"></button>`
        + `<button class="BRicon onepg desktop-only js-tooltip"></button>`
        + `<button class="BRicon twopg desktop-only js-tooltip"></button>`
        + `<button class="BRicon thumb desktop-only js-tooltip"></button>`
        // zoomx
        + `<button class="BRicon zoom_out desktop-only js-tooltip"></button>`
        + `<button class="BRicon zoom_in desktop-only js-tooltip"></button>`
        + `<button class="BRicon full js-tooltip"></button>`
        + `</div>
        </div>`);
    this.refs.$BRfooter.append(this.refs.$BRnav);
    this.refs.$br.append(this.refs.$BRfooter);

    const $slider = this.$('.BRpager').slider({
      animate: true,
      min: 0,
      max: this.getNumLeafs() - 1,
      value: this.currentIndex(),
      range: "min"
    });
    $slider.on('slide', (event, ui) => {
      this.updateNavPageNum(ui.value);
      return true;
    })
    $slider.on('slidechange', (event, ui) => {
      this.updateNavPageNum(ui.value);
      // recursion prevention for jumpToIndex
      if ( $slider.data('swallowchange') ) {
        $slider.data('swallowchange', false);
      } else {
        this.jumpToIndex(ui.value);
      }
      return true;
    });

    this.updateNavPageNum(this.currentIndex());

    return this.refs.$BRnav;
  };

  /**
  * Initialize the navigation bar when embedded
  */
  BookReader.prototype.initEmbedNavbar = function() {
    // IA-specific
    let thisLink = (window.location + '')
      .replace('?ui=embed','')
      .replace('/stream/', '/details/')
      .replace('#', '/');
    const logoHtml = this.showLogo ? `<a class="logo" href="${this.logoURL}" target="_blank"></a>` : '';

    this.refs.$BRfooter = $('<div class="BRfooter"></div>');
    this.refs.$BRnav = $(
      `<div class="BRnav BRnavEmbed">
          ${logoHtml}
          <span class="BRembedreturn">
             <a href="${thisLink}" target="_blank">${this.bookTitle}</a>
          </span>
          <span class="BRtoolbarbuttons">
            <button class="BRicon book_left"></button>
            <button class="BRicon book_right"></button>
            <button class="BRicon full"></button>
          </span>
      </div>`);
    this.refs.$BRfooter.append(this.refs.$BRnav);
    this.refs.$br.append(this.refs.$BRfooter);
  };

  /**
  * Returns the textual representation of the current page for the navbar
  * @param {number}
  * @return {string}
  */
  BookReader.prototype.getNavPageNumString = function(index) {
    // Accessible index starts at 0 (alas) so we add 1 to make human
    const pageNum = this.getPageNum(index);
    const pageType = this.getPageProp(index, 'pageType');
    const numLeafs = this.getNumLeafs();

    if (!this.getNavPageNumString.maxPageNum) {
      // Calculate Max page num (used for pagination display)
      let maxPageNum = 0;
      let pageNumVal;
      for (let i = 0; i < numLeafs; i++) {
        pageNumVal = this.getPageNum(i);
        if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
          maxPageNum = pageNumVal;
        }
      }
      this.getNavPageNumString.maxPageNum = maxPageNum;
    }

    return this.getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.getNavPageNumString.maxPageNum);
  };

  /**
   * Renders the html for the page string
   * @param {number} index
   * @param {number} numLeafs
   * @param {number} pageNum
   * @param {string} pageType
   * @return {string}
   */
  BookReader.prototype.getNavPageNumHtml = function(index, numLeafs, pageNum, pageType, maxPageNum) {
    if (pageNum[0] != 'n') {
      let pageStr = ` Page ${pageNum}`;
      if (maxPageNum) {
        pageStr += ` of ${maxPageNum}`;
      }
      return pageStr;
    } else {
      return `${index + 1} &nbsp;/&nbsp; ${numLeafs}`;
    }
  };

  /**
   * Renders the navbar string to the DOM
   * @param {number}
   */
  BookReader.prototype.updateNavPageNum = function(index) {
    this.$('.BRcurrentpage').html(this.getNavPageNumString(index));
  };

  /**
  * Update the nav bar display - does not cause navigation.
  * @param {number}
  */
  BookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.currentIndex();
    this.$('.BRpager').data('swallowchange', true).slider('value', index);
  };

  BookReader.prototype.updateNavIndexDebounced = debounce(BookReader.prototype.updateNavIndex, 500);
  BookReader.prototype.updateNavIndexThrottled = throttle(BookReader.prototype.updateNavIndex, 250, false);
}
