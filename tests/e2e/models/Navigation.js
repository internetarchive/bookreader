import { Selector } from 'testcafe';

/** Model defining BookReader's Navigation base elements */
export default class Navigation {
  constructor() {
    this.topNavShell = new Selector('.BRtoolbar');
    this.bottomNavShell = new Selector('.BRfooter');
    this.itemNav = Selector('ia-bookreader').shadowRoot().find('ia-item-navigator').shadowRoot();

    // flipping
    this.goLeft = this.bottomNavShell.find('.BRicon.book_left');
    this.goRight = this.bottomNavShell.find('.BRicon.book_right');
    this.goNext = this.bottomNavShell.find('.BRicon.book_flip_next');
    this.goPrev = this.bottomNavShell.find('.BRicon.book_flip_prev');

    // mode switching
    this.mode1Up = this.bottomNavShell.find('.BRicon.onepg');
    this.mode2Up = this.bottomNavShell.find('.BRicon.twopg');
    this.modeThumb = this.bottomNavShell.find('.BRicon.thumb');
    this.viewmode = this.bottomNavShell.find('.BRicon.viewmode');

    // zoom
    this.zoomIn = this.bottomNavShell.find('.BRicon.zoom_in');
    this.zoomOut = this.bottomNavShell.find('.BRicon.zoom_out');

    // search
    this.searchIcon = this.itemNav.find('button.shortcut.search');
    this.searchBox = this.itemNav
      .find('ia-menu-slider').shadowRoot()
      .find('ia-book-search-results').shadowRoot()
      .find('input[name=query]');
    this.searchPin = this.bottomNavShell.find('.BRsearch');
    this.searchNavigation = this.bottomNavShell.find('.BRsearch-navigation');

    // other
    this.fullScreen = this.bottomNavShell.find('.BRicon.full');
    this.sliderRange = this.bottomNavShell.find('.ui-slider-range');
  }
}
