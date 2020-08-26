import { Selector } from 'testcafe';

/** Model defining BookReader's Navigation base elements */
export default class Navigation {
  constructor() {
    this.topNavShell = new Selector('.BRtoolbar');
    this.bottomNavShell = new Selector('.BRfooter');
    this.mobileMenu = new Selector('.BRmobileMenu');
    this.desktop = new DesktopNav(this.bottomNavShell, this.topNavShell);
    this.mobile = new MobileNav(this.mobileMenu, this.topNavShell);
  }
}

/**
 * DesktopNav Model
 * @class
 * @classdesc defines DesktopNav base elements
 */
class DesktopNav {
  constructor(bottomToolbar, topToolbar) {
    this.goLeft = bottomToolbar.find('.BRicon.book_left');
    this.goRight = bottomToolbar.find('.BRicon.book_right');
    this.mode1Up = bottomToolbar.find('.BRicon.onepg');
    this.mode2Up = bottomToolbar.find('.BRicon.twopg');
    this.modeThumb = bottomToolbar.find('.BRicon.thumb');
    this.viewmode = bottomToolbar.find('.BRicon.viewmode');
    this.zoomIn = bottomToolbar.find('.BRicon.zoom_in');
    this.zoomOut = bottomToolbar.find('.BRicon.zoom_out');
    this.fullScreen = bottomToolbar.find('.BRicon.full');
    this.searchBox = topToolbar.find('.BRbooksearch.desktop');
    this.searchPin = bottomToolbar.find('.BRsearch');
    this.sliderRange = bottomToolbar.find('.ui-slider-range');
  }
}

class MobileNav {
  constructor(mobileMenu, topToolbar) {
    this.hamburgerButton = topToolbar.find('.BRmobileHamburger');
    this.menuSearchButton = mobileMenu.find('.BRmobileMenu__search');
    this.searchBox = mobileMenu.find('#BRsearch_tray');
    this.searchResults = mobileMenu.find('[data-id="results"]');
    this.searchResultText = this.searchResults.child(0).find('p');
  }
}
