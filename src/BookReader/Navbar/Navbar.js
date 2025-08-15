// @ts-check
/** @typedef {import("../../BookReader.js").default} BookReader */

import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/widgets/mouse.js';
import 'jquery-ui/ui/widgets/slider.js';
import { EVENTS } from '../events.js';
import { throttle } from '../utils.js';
import { i18n } from '../../i18n/index.js';

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

    /** @type {Object} controls will be switch over "this.maximumControls" */
    this.minimumControls = [
      'viewmode',
    ];
    /** @type {Object} controls will be switch over "this.minimumControls" */
    this.maximumControls = [
      'book_left', 'book_right', 'zoom_in', 'zoom_out', 'onepg', 'twopg', 'thumb',
    ];

    this.updateNavIndexThrottled = throttle(this.updateNavIndex.bind(this), 250, false);
  }

  controlFor(controlName) {
    const option = this.br.options.controls[controlName];
    if (!option.visible) { return ''; }
    if (option.template) {
      return `<li>${option.template(this.br)}</li>`;
    }
    
    // Use i18n for labels if they are i18n keys
    const label = option.label.startsWith('nav.') ? i18n.t(option.label) : option.label;
    
    return `<li>
      <button class="BRicon ${option.className}" title="${label}">
        <div class="icon icon-${option.iconClassName}"></div>
        <span class="BRtooltip">${label}</span>
      </button>
    </li>`;
  }

  /** @private */
  _renderControls() {
    return [
      'bookLeft',
      'bookRight',
      'onePage',
      'twoPage',
      'thumbnail',
      'viewmode',
      'zoomOut',
      'zoomIn',
      'fullScreen',
    ].map((mode) => (
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
      title: i18n.t('viewmode.onePage'),
    }, {
      mode: br.constMode2up,
      className: 'twopg',
      title: i18n.t('viewmode.twoPage'),
    }, {
      mode: br.constModeThumb,
      className: 'thumb',
      title: i18n.t('viewmode.thumbnail'),
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
          br.viewModeOrder = viewModeOrder;
          this.updateViewModeButton($(e.currentTarget), nextViewMode.className, nextViewMode.title);
          br.switchMode(newViewMode.mode);
        });
      const currentViewModeButton = viewModes.find((m) => m.mode === viewModeOrder[0]);
      this.updateViewModeButton(
        $button,
        currentViewModeButton.className,
        currentViewModeButton.title,
      );
    });
  }

  bindControlClickHandlers() {
    const jIcons = this.$nav.find('.BRicon');

    // Map of jIcon class -> click handler
    const navigationControls = {
      book_left: () => {
        this.br.trigger(EVENTS.stop);
        this.br.left();
      },
      book_right: () => {
        this.br.trigger(EVENTS.stop);
        this.br.right();
      },
      book_top: this.br.first.bind(this.br),
      book_bottom: this.br.last.bind(this.br),
      book_leftmost: this.br.leftmost.bind(this.br),
      book_rightmost: this.br.rightmost.bind(this.br),
      onepg: () => {
        this.br.switchMode('1up');
      },
      thumb: () => {
        this.br.switchMode('thumb');
      },
      twopg: () => {
        this.br.switchMode('2up');
      },
      zoom_in: () => {
        this.br.trigger(EVENTS.stop);
        this.br.zoom(1);
        this.br.trigger(EVENTS.zoomIn);
      },
      zoom_out: () => {
        this.br.trigger(EVENTS.stop);
        this.br.zoom(-1);
        this.br.trigger(EVENTS.zoomOut);
      },
      full: () => {
        if (this.br.ui == 'embed') {
          const url = this.br.$('.BRembedreturn a').attr('href');
          window.open(url);
        } else {
          this.br.toggleFullscreen();
        }
      },
    };

    // custom event for auto-loan-renew in ia-book-actions
    // - to know if user is actively reading
    this.$nav.find('nav.BRcontrols li button').on('click', () => {
      this.br.trigger(EVENTS.userAction);
    });

    for (const control in navigationControls) {
      jIcons.filter(`.${control}`).on('click.bindNavigationHandlers', () => {
        navigationControls[control]();
        return false;
      });
    }
  }

  /**
   * Toggle viewmode button to change page view
   */
  updateViewModeButton($button, iconClass, tooltipText) {
    $button
      .attr('title', tooltipText)
      .find('.icon')
      .removeClass()
      .addClass(`icon icon-${iconClass}`)
      .end()
      .find('.BRtooltip')
      .text(tooltipText);
  }

  /**
   * Switch navbar controls on mobile and desktop
   */
  switchNavbarControls() {
    if (this.br.refs.$brContainer.prop('clientWidth') < 640) {
      this.showMinimumNavPageNum();
      // we don't want navbar controls switching with liner-notes
      if (this.br.options.bookType !== 'linerNotes') {
        this.showMinimumNavbarControls();
      }
    } else {
      this.showMaximumNavPageNum();
      // we don't want navbar controls switching with liner-notes
      if (this.br.options.bookType !== 'linerNotes') {
        this.showMaximumNavbarControls();
      }
    }
  }

  /**
   * Switch Book Nav page number display to minimum/mobile
   */
  showMinimumNavPageNum() {
    const minElement = document.querySelector('.BRcurrentpage.BRmin');
    const maxElement = document.querySelector('.BRcurrentpage.BRmax');

    if (minElement) minElement.classList.remove('hide');
    if (maxElement) maxElement.classList.add('hide');
  }

  /**
   * Switch Book Nav page number display to maximum/desktop
   */
  showMaximumNavPageNum() {
    const minElement = document.querySelector('.BRcurrentpage.BRmin');
    const maxElement = document.querySelector('.BRcurrentpage.BRmax');

    if (minElement) minElement.classList.add('hide');
    if (maxElement) maxElement.classList.remove('hide');
  }

  /**
   * Switch Book Navbar controls to minimised
   * NOTE: only `this.minimumControls` and `this.maximumControls` switch on resize
   */
  showMinimumNavbarControls() {
    this.minimumControls.forEach((control) => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.maximumControls.forEach((control) => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.add('hide');
    });
  }

  /**
   * Switch Book Navbar controls to maximized
   * NOTE: only `this.minimumControls` and `this.maximumControls` switch on resize
   */
  showMaximumNavbarControls() {
    this.maximumControls.forEach((control) => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.minimumControls.forEach((control) => {
      const element = document.querySelector(`.controls .${control}`);
      if (element) element.classList.add('hide');
    });
  }

  /**
   * Initialize the navigation bar (bottom)
   * @return {JQuery}
   */
  init() {
    const { br } = this;
    const { navbarTitle: title } = br.options;
    const isRTL = br.pageProgression === 'rl';
    const bookFlipLeft = isRTL ? 'book_flip_next' : 'book_flip_prev';
    const bookFlipRight = isRTL ? 'book_flip_prev' : 'book_flip_next';

    this.br.options.controls['bookLeft'].className = `book_left ${bookFlipLeft}`;
    this.br.options.controls['bookRight'].className = `book_right ${bookFlipRight}`;

    br.refs.$BRfooter = this.$root = $(`<div class="BRfooter"></div>`);
    br.refs.$BRnav = this.$nav = $(
      `<div class="BRnav BRnavDesktop">
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="scrubber">
                <div class="BRnavpos">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
                <p>
                  <span class="BRcurrentpage BRmax"></span>
                  <span class="BRcurrentpage BRmin"></span>
                </p>
              </li>
              ${this._renderControls()}
            </ul>
          </nav>
        </div>`);

    this.$root.append(this.$nav);
    br.refs.$br.append(this.$root);

    const $slider = /** @type {any} */ (this.$root.find('.BRpager')).slider({
      animate: true,
      min: 0,
      max: br.book.getNumLeafs() - 1,
      value: br.currentIndex(),
      range: "min",
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
  * Returns the textual representation of the current page for the navbar
  * @param {number} index
  * @param {boolean} [useMaxFormat = false]
  * @return {string}
  */
  getNavPageNumString(index, useMaxFormat = false) {
    const { br } = this;
    // Accessible index starts at 0 (alas) so we add 1 to make human
    const pageNum = br.book.getPageNum(index);
    const pageType = br.book.getPageProp(index, /** @type {any} */ ('pageType'));
    const numLeafs = br.book.getNumLeafs();

    if (!this.maxPageNum) {
      // Calculate Max page num (used for pagination display)
      let maxPageNum = 0;
      let pageNumVal;
      for (let i = 0; i < numLeafs; i++) {
        pageNumVal = parseFloat(br.book.getPageNum(i));
        if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
          maxPageNum = pageNumVal;
        }
      }
      this.maxPageNum = maxPageNum;
    }

    return getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.maxPageNum, useMaxFormat);

  }

  /**
   * Renders the navbar string to the DOM
   * @param {number} index
   */
  updateNavPageNum(index) {
    this.$root.find('.BRcurrentpage.BRmax').html(this.getNavPageNumString(index, true));
    this.$root.find('.BRcurrentpage.BRmin').html(this.getNavPageNumString(index));
  }

  /**
   * Update the nav bar display - does not cause navigation.
   * @param {number} index
   */
  updateNavIndex(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.br.currentIndex();
    /** @type {any} */ (this.$root.find('.BRpager')).data('swallowchange', true).slider('value', index);
  }
}

/**
 * Renders the html for the page string
 * @param {number} index
 * @param {number} numLeafs
 * @param {number|string} pageNum
 * @param {*} pageType - Deprecated
 * @param {number} maxPageNum
 * @param {boolean} [useMaxFormat = false]
 * @return {string}
 */
export function getNavPageNumHtml(index, numLeafs, pageNum, pageType, maxPageNum, useMaxFormat = false) {
  const pageNumStr = String(pageNum);
  const pageIsAsserted = pageNumStr[0] != 'n';
  const pageIndex = index + 1;

  if (!pageIsAsserted) {
    pageNum = '—';
  }

  if (useMaxFormat === true) {
    return `Page ${pageNum} (${pageIndex}/${numLeafs})`;
  }

  if (!pageIsAsserted) {
    return `(${pageIndex} of ${numLeafs})`;
  }

  const bookLengthLabel = (maxPageNum && parseFloat(String(pageNum))) ? ` of ${maxPageNum}` : '';
  return `${pageNum}${bookLengthLabel}`;
}
