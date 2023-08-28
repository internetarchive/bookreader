import { Selector } from 'testcafe';

/** Model defining BookReader's Navigation base elements */
export default class Navigation {
  constructor() {
    this.topNavShell = new Selector('.BRtoolbar');
    this.bottomNavShell = new Selector('.BRfooter');
    this.itemNav = Selector('ia-bookreader').shadowRoot().find('ia-item-navigator').shadowRoot();
    this.desktop = new DesktopNav(this.bottomNavShell, this.itemNav);
  }
}

/**
 * DesktopNav Model
 * @class
 * @classdesc defines DesktopNav base elements
 */
export class DesktopNav {
  /**
   * @param {Selector} bottomToolbar
   * @param {Selector} itemNav
   */
  constructor(bottomToolbar, itemNav) {
    // flipping
    this.goLeft = bottomToolbar.find('.BRicon.book_left');
    this.goRight = bottomToolbar.find('.BRicon.book_right');
    this.goNext = bottomToolbar.find('.BRicon.book_flip_next');
    this.goPrev = bottomToolbar.find('.BRicon.book_flip_prev');

    // mode switching
    this.mode1Up = bottomToolbar.find('.BRicon.onepg');
    this.mode2Up = bottomToolbar.find('.BRicon.twopg');
    this.modeThumb = bottomToolbar.find('.BRicon.thumb');
    this.viewmode = bottomToolbar.find('.BRicon.viewmode');

    // zoom
    this.zoomIn = bottomToolbar.find('.BRicon.zoom_in');
    this.zoomOut = bottomToolbar.find('.BRicon.zoom_out');

    // search
    this.searchIcon = itemNav.find('button.shortcut.search');
    this.searchBox = itemNav
      .find('ia-menu-slider').shadowRoot()
      .find('ia-book-search-results').shadowRoot()
      .find('input[name=query]');
    this.searchPin = bottomToolbar.find('.BRsearch');
    this.searchNavigation = bottomToolbar.find('.BRsearch-navigation');

    // other
    this.fullScreen = bottomToolbar.find('.BRicon.full');
    this.sliderRange = bottomToolbar.find('.ui-slider-range');
  }
}
