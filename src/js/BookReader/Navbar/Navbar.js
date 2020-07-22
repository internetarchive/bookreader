/** @typedef {import("../../BookReader.js").default} BookReader */

import { EVENTS } from '../events.js';

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

  controlFor(controlName) {
    const option = this.br.options.controls[controlName];
    if (!option.visible) { return ''; }
    if (option.template) {
      return option.template(this.br);
    }
    return `<button class="BRicon ${option.className} desktop-only js-tooltip"></button>`;
  }

  /** @private */
  _viewModeControls() {
    if (this.br.options.controls.viewmode.visible) {
      return this.controlFor('viewmode');
    }
    return ['onePage', 'twoPage', 'thumbnail'].map((mode) => (
      this.controlFor(mode)
    )).join('');
  }

  /** @private */
  _bindViewModeButton() {
    const { br } = this;
    const viewModeOptions = br.options.controls.viewmode;
    const viewModes = [{
      mode: br.constMode1up,
      className: 'onepg',
      title: 'One-page view',
    }, {
      mode: br.constMode2up,
      className: 'twopg',
      title: 'Two-page view',
    }, {
      mode: br.constModeThumb,
      className: 'thumb',
      title: 'Thumbnail view',
    }].filter((mode) => (
      !viewModeOptions.excludedModes.includes(mode.mode)
    ));
    const viewModeOrder = viewModes.map((m) => m.mode);
    const modeClasses = viewModes.map((m) => m.className).join(' ');

    if (viewModeOptions.excludedModes.includes(br.mode)) {
      br.switchMode(viewModeOrder[0]);
    }

    // Reorder the viewModeOrder so the current view mode is at the end
    const currentModeIndex = viewModeOrder.indexOf(br.mode);
    for (let i = 0; i <= currentModeIndex; i++) {
      viewModeOrder.push(viewModeOrder.shift());
    }

    if (viewModes.length < 2) {
      this.$nav.find(`.${viewModeOptions.className}`).remove();
    }

    this.br.bind(EVENTS.PostInit, () => {
      this.$nav.find(`.${viewModeOptions.className}`)
        .off('.bindNavigationHandlers')
        .on('click', (e) => {
          const nextModeID = viewModeOrder.shift();
          const newViewMode = viewModes.find((m) => m.mode === nextModeID);
          const nextViewMode = viewModes.find((m) => m.mode === viewModeOrder[0]);

          viewModeOrder.push(nextModeID);
          $(e.target)
            .removeClass(modeClasses)
            .addClass(nextViewMode.className)
            .attr('bt-xtitle', nextViewMode.title);
          br.switchMode(newViewMode.mode);
        })
        .addClass(viewModes.find((m) => m.mode === viewModeOrder[0]).className);
    });
  }

  /**
   * Initialize the navigation bar (bottom)
   * @return {JQuery}
   */
  init() {
    const { br } = this;
    const { navbarTitle: title } = br.options;

    br.refs.$BRfooter = this.$root = $(`<div class="BRfooter"></div>`);
    br.refs.$BRnav = this.$nav = $(
      `<div class="BRnav BRnavDesktop">
          <div class="BRnavCntl BRnavCntlBtm BRdn js-tooltip" title="Toggle toolbars"></div>
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <div class="BRnavpos">
            <div class="BRpager"></div>
            <div class="BRnavline"></div>
          </div>
          <div class="BRpage">`

        // Note, it's important for there to not be whitespace
        + `<span class='BRcurrentpage'></span>`
        + `<button class="BRicon book_left js-tooltip"></button>`
        + `<button class="BRicon book_right js-tooltip"></button>`
        + this._viewModeControls()
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
      if ($slider.data('swallowchange')) {
        $slider.data('swallowchange', false);
      } else {
        br.jumpToIndex(ui.value);
      }
      return true;
    });

    br.options.controls.viewmode.visible && this._bindViewModeButton();
    this.updateNavPageNum(br.currentIndex());

    return this.$nav;
  }

  /**
   * Initialize the navigation bar when embedded
   */
  initEmbed() {
    const { br } = this;
    // IA-specific
    const thisLink = (window.location + '')
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
