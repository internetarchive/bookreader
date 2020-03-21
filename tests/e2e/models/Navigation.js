import { Selector } from 'testcafe';

class DesktopNav {
  constructor(bottomToolbar) {
    this.goPrevious = bottomToolbar.find('.BRicon.book_left');
    this.goNext = bottomToolbar.find('.BRicon.book_right');
    this.mode1Up = bottomToolbar.find('.BRicon.onepg');
    this.mode2Up = bottomToolbar.find('.BRicon.twopg');
    this.modeThumb = bottomToolbar.find('.BRicon.thumb');
    this.zoomIn = bottomToolbar.find('.BRicon.desktop-only.zoom_in');
    this.zoomOut = bottomToolbar.find('.BRicon.desktop-only.zoom_out');
    this.fullScreen = bottomToolbar.find('.BRicon.full');
  }
}


class Navigation {
  constructor () {
    this.topNavShell = new Selector('.BRtoolbar');
    this.bottomNavShell = new Selector('.BRfooter');
    this.desktop = new DesktopNav(this.bottomNavShell);
  }
}

export default new Navigation();