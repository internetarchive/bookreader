/** @typedef {import("../../BookReader.js").default} BookReader */

import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/widgets/mouse.js';
import 'jquery-ui/ui/widgets/slider.js';
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
      return `<li>${option.template(this.br)}</li>`;
    }
    return `<li>
      <button class="BRicon ${option.className}" title="${option.label}">
        <div class="icon icon-${option.className}"></div>
        <span class="tooltip">${option.label}</span>
      </button>
    </li>`;
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
      const $button = this.$nav.find(`.${viewModeOptions.className}`)
        .off('.bindNavigationHandlers')
        .on('click', (e) => {
          const nextModeID = viewModeOrder.shift();
          const newViewMode = viewModes.find((m) => m.mode === nextModeID);
          const nextViewMode = viewModes.find((m) => m.mode === viewModeOrder[0]);

          viewModeOrder.push(nextModeID);
          this._updateViewModeButton($(e.currentTarget), nextViewMode.className, nextViewMode.title);
          br.switchMode(newViewMode.mode);
        });
      const currentViewModeButton = viewModes.find((m) => m.mode === viewModeOrder[0]);
      this._updateViewModeButton(
        $button,
        currentViewModeButton.className,
        currentViewModeButton.title
      );
    });
  }

  /** @private */
  _updateViewModeButton($button, iconClass, tooltipText) {
    $button
      .attr('title', tooltipText)
      .find('.icon')
      .removeClass()
      .addClass(`icon icon-${iconClass}`)
      .end()
      .find('.tooltip')
      .text(tooltipText);
  }

  /**
   * Initialize the navigation bar (bottom)
   * @return {JQuery}
   */
  init() {
    const { br } = this;
    const { navbarTitle: title } = br.options;
    const isRTL = br.pageProgression === 'rl';

    br.refs.$BRfooter = this.$root = $(`<div class="BRfooter"></div>`);
    br.refs.$BRnav = this.$nav = $(
      `<div class="BRnav BRnavDesktop">
          <div class="BRnavCntl BRnavCntlBtm BRdn js-tooltip" title="Toggle toolbars"></div>
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="scrubber">
                <div class="BRnavpos">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
                <p><span class='BRcurrentpage'></span></p>
              </li>
              <li>
                <button class="BRicon book_left hide-mobile ${isRTL ? 'book_flip_next' : 'book_flip_prev'}" title="Flip left">
                  <div class="icon icon-left-arrow"></div>
                  <span class="tooltip">Flip left</span>
                </button>
              </li>
              <li>
                <button class="BRicon book_right hide-mobile ${isRTL ? 'book_flip_prev' : 'book_flip_next'}" title="Flip right">
                  <div class="icon icon-left-arrow hflip"></div>
                  <span class="tooltip">Flip right</span>
                </button>
              </li>
              ${this._viewModeControls()}
              <li>
                <button class="BRicon zoom_out hide-mobile" title="Zoom out">
                  <div class="icon icon-magnify"></div>
                  <span class="tooltip">Zoom out</span>
                </button>
              </li>
              <li>
                <button class="BRicon zoom_in hide-mobile" title="Zoom in">
                  <div class="icon icon-magnify plus"></div>
                  <span class="tooltip">Zoom in</span>
                </button>
              </li>
              <li>
                <button class="BRicon full" title="Toggle fullscreen">
                  <div class="icon icon-fullscreen"></div>
                  <span class="tooltip">Toggle fullscreen</span>
                </button>
              </li>
            </ul>
          </nav>
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
