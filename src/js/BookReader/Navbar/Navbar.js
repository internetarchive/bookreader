/** @typedef {import("../../BookReader.js").default} BookReader */

export class Navbar {
  /**
   * @param {BookReader} br 
   */
  constructor(br) {
    this.br = br;

    /** @type {JQuery} */
    this.$root = null;
    /** @type {JQuery} */
    this.$nav = null;
    /** @type {number} */
    this.maxPageNum = null;
  }

  /**
   * Initialize the navigation bar (bottom)
   * @param {Object} options
   * @param {string} [options.navTitle]
   * @return {JQuery}
   */
  init({ navTitle }) {
    const { br } = this;

    br.refs.$BRfooter = this.$root = $(`<div class="BRfooter"></div>`);
    br.refs.$BRnav = this.$nav = $(
      `<div class="BRnav BRnavDesktop">
          <div class="BRnavCntl BRnavCntlBtm BRdn js-tooltip" title="Toggle toolbars"></div>
          ${navTitle ? `<div class="BRnavTitle">${navTitle}</div>` : ''}
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
  
    this.$root.append(this.$nav);
    br.refs.$br.append(this.$root);

    const $slider = this.$root.find('.BRpager').slider({
      animate: true,
      min: 0,
      max: br.getNumLeafs() - 1,
      value: br.currentIndex(),
      range: "min"
    });

    $slider.on('slide', (event, ui) => {
      this.updateNavPageNum(ui.value);
      return true;
    });

    $slider.on('slidechange', (event, ui) => {
      this.updateNavPageNum(ui.value);
      // recursion prevention for jumpToIndex
      if ( $slider.data('swallowchange') ) {
        $slider.data('swallowchange', false);
      } else {
        br.jumpToIndex(ui.value);
      }
      return true;
    });

    this.updateNavPageNum(br.currentIndex());

    return this.$nav;
  }

  /**
   * Initialize the navigation bar when embedded
   */
  initEmbed() {
    const { br } = this;
    // IA-specific
    let thisLink = (window.location + '')
      .replace('?ui=embed','')
      .replace('/stream/', '/details/')
      .replace('#', '/');
    const logoHtml = br.showLogo ? `<a class="logo" href="${br.logoURL}" target="_blank"></a>` : '';

    br.refs.$BRfooter = this.$root = $('<div class="BRfooter"></div>');
    br.refs.$BRnav = this.$nav = $(
      `<div class="BRnav BRnavEmbed">
          ${logoHtml}
          <span class="BRembedreturn">
             <a href="${thisLink}" target="_blank">${br.bookTitle}</a>
          </span>
          <span class="BRtoolbarbuttons">
            <button class="BRicon book_left"></button>
            <button class="BRicon book_right"></button>
            <button class="BRicon full"></button>
          </span>
      </div>`);
    this.$root.append(this.$nav);
    br.refs.$br.append(this.$root);
  }

  /**
  * Returns the textual representation of the current page for the navbar
  * @param {number} index
  * @return {string}
  */
  getNavPageNumString(index) {
    const { br } = this;
    // Accessible index starts at 0 (alas) so we add 1 to make human
    const pageNum = br.getPageNum(index);
    const pageType = br.getPageProp(index, 'pageType');
    const numLeafs = br.getNumLeafs();

    if (!this.maxPageNum) {
      // Calculate Max page num (used for pagination display)
      let maxPageNum = 0;
      let pageNumVal;
      for (let i = 0; i < numLeafs; i++) {
        pageNumVal = br.getPageNum(i);
        if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
          maxPageNum = pageNumVal;
        }
      }
      this.maxPageNum = maxPageNum;
    }

    return getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.maxPageNum);
  }

  /**
   * Renders the navbar string to the DOM
   * @param {number} index
   */
  updateNavPageNum(index) {
    this.$root.find('.BRcurrentpage').html(this.getNavPageNumString(index));
  }

  /**
   * Update the nav bar display - does not cause navigation.
   * @param {number} index
   */
  updateNavIndex(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.br.currentIndex();
    this.$root.find('.BRpager').data('swallowchange', true).slider('value', index);
  }
}

/**
 * Renders the html for the page string
 * @param {number} index
 * @param {number} numLeafs
 * @param {number|string} pageNum
 * @param {*} pageType @deprecated
 * @param {number} maxPageNum
 * @return {string}
 */
export function getNavPageNumHtml(index, numLeafs, pageNum, pageType, maxPageNum) {
  if (pageNum[0] != 'n') {
    let pageStr = `Page ${pageNum}`;
    if (maxPageNum) {
      pageStr += ` of ${maxPageNum}`;
    }
    return pageStr;
  } else {
    return `${index + 1}&nbsp;/&nbsp;${numLeafs}`;
  }
}