// @ts-check
/** @typedef {import("../../BookReader.js").default} BookReader */

import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/widgets/mouse.js';
import 'jquery-ui/ui/widgets/slider.js';
import { EVENTS } from '../events.js';
import { throttle } from '../utils.js';

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
      'toggle_slider', 'viewmode',
    ];
    /** @type {Object} controls will be switch over "this.minimumControls" */
    this.maximumControls = [
      'BRnavpos', 'book_left', 'book_right', 'zoom_in', 'zoom_out', 'onepg', 'twopg', 'thumb',
    ];

    this.updateNavIndexThrottled = throttle(this.updateNavIndex.bind(this), 250, false);
  }

  /**
   * @param {string} controlName
   * @param {Object} optionOverrides
   */
  controlFor(controlName, optionOverrides = null) {
    const brOption = this.br.options.controls[controlName];
    const option = Object.assign({},brOption, optionOverrides);
    if (!option.visible) { return ''; }
    if (option.template) {
      return `<li>${option.template(this.br)}</li>`;
    }
    return `<li>
      <button class="BRicon ${option.className}" title="${option.label}">
        <div class="icon icon-${option.iconClassName}"></div>
        <span class="BRtooltip">${option.label}</span>
      </button>
    </li>`;
  }

  /** @private */
  _renderControls() {
    return [
      'toggleSlider',
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
      toggle_slider: () => {
        this.br.toggleSlider();
      },
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
    // we don't want navbar controls switching with liner-notes
    if (this.br.options.bookType !== 'linerNotes') {
      if (this.br.refs.$brContainer.prop('clientWidth') < 640) {
        this.showMobileControls();
      } else {
        this.showDesktopControls();
      }
    }
  }

  /**
   * Switch Book controls to mobile mode
   * NOTE: `this.minimumControls`, `this.maximumControls`, and .BRnavMobile switch on resize
   */
  showMobileControls() {
    this.minimumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.maximumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.add('hide');
    });
    const mobileNav = document.querySelector(`.BRnavMobile`);
    if (mobileNav) mobileNav.classList.remove('hide');
  }

  /**
   * Switch Book controls to desktop mode
   * NOTE: `this.minimumControls`, `this.maximumControls`, and .BRnavMobile switch on resize
   */
  showDesktopControls() {
    this.maximumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.remove('hide');
    });
    this.minimumControls.forEach((control) => {
      const element = document.querySelector(`.BRnavMain .controls .${control}`);
      if (element) element.classList.add('hide');
    });
    const mobileNav = document.querySelector(`.BRnavMobile`);
    if (mobileNav) mobileNav.classList.add('hide');
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
      `<div class="BRnav BRnavMobile docked">
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="scrubber">
                <div class="BRnavpos">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
              </li>
              ${this.controlFor('bookLeft', {visible: true})}
              ${this.controlFor('bookRight', {visible: true})}
            </ul>
          </nav>
        </div>
        <div class="BRnav BRnavMain">
          ${title ? `<div class="BRnavTitle">${title}</div>` : ''}
          <nav class="BRcontrols">
            <ul class="controls">
              <li class="scrubber">
                <p>
                  <span class="BRcurrentpage"></span>
                </p>
                <div class="BRnavpos hide">
                  <div class="BRpager"></div>
                  <div class="BRnavline"></div>
                </div>
              </li>
              ${this._renderControls()}
            </ul>
          </nav>
        </div>`);

    this.$root.append(this.$nav);
    br.refs.$br.append(this.$root);

    /** @type {JQuery} sliders */
    const $sliders = this.$root.find('.BRpager').slider({
      animate: true,
      min: 0,
      max: br.book.getNumLeafs() - 1,
      value: br.currentIndex(),
      range: "min",
    });

    $sliders.on('slide', (event, ui) => {
      this.updateNavPageNum(ui.value);
      return true;
    });

    $sliders.on('slidechange', (event, ui) => {
      this.updateNavPageNum(ui.value);
      // recursion prevention for jumpToIndex
      if ($(event.currentTarget).data('swallowchange')) {
        $(event.currentTarget).data('swallowchange', false);
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
  * @return {string}
  */
  getNavPageNumString(index) {
    const { br } = this;
    // Accessible index starts at 0 (alas) so we add 1 to make human
    const pageNum = br.book.getPageNum(index);
    const pageType = br.book.getPageProp(index, 'pageType');
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

    return getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.maxPageNum);

  }

  /**
   * Renders the navbar string to the DOM
   * @param {number} index
   */
  updateNavPageNum(index) {
    this.$root.find('.BRcurrentpage').html(this.getNavPageNumString(index, true));
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
 * @param {*} pageType - Deprecated
 * @param {number} maxPageNum
 * @return {string}
 */
export function getNavPageNumHtml(index, numLeafs, pageNum, pageType, maxPageNum) {
  const pageIsAsserted = pageNum[0] != 'n';
  const pageIndex = index + 1;

  if (!pageIsAsserted) {
    pageNum = '—';
  }
  return `Page ${pageNum} (${pageIndex}/${numLeafs})`;
}
