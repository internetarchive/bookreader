import '../../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';
import '../../../src/js/dragscrollable-br.js';

import BookReader from '../../../src/js/BookReader.js';
import '../../../src/js/plugins/menu_toggle/plugin.menu_toggle.js';


let br;
let hideFlag;
beforeAll(() => {
  $.fx.off = true;
  const OGSpeed = $.speed;
  $.speed = function(_speed, easing, callback) {
    return OGSpeed(0, easing, callback);
  };
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();
});

afterEach(() => {
  $.fx.off = false;
  jest.clearAllMocks();
});

describe('Plugin: Menu Toggle', () => {
  test('has option flag', () => {
    expect(BookReader.defaultOptions.enableMenuToggle).toEqual(true);
  });

  test('core code has animation consts', () => {
    expect(BookReader.constNavAnimationDuration).toEqual(300);
    expect(BookReader.constResizeAnimationDuration).toEqual(100);
  })

  test('core code has registered event: `navToggled`', () => {
    expect(BookReader.eventNames.navToggled).toBeTruthy();
  })

  test('when bookreader loads, the menu shows', () => {
    expect($('.BRfooter').hasClass('js-menu-hide')).toEqual(false);
    expect($('.BRtoolbar').hasClass('js-menu-hide')).toEqual(false);
  })

  test('clicking on background hides the menu', () => {
    expect($('.BRfooter').hasClass('js-menu-hide')).toEqual(false);
    expect($('.BRtoolbar').hasClass('js-menu-hide')).toEqual(false);
    $('.BRcontainer').click();
    expect($('.BRfooter').hasClass('js-menu-hide')).toEqual(true);
    expect($('.BRtoolbar').hasClass('js-menu-hide')).toEqual(true);
  });

  test('core function `setNavigationView` is called `hideNavigation` is called', () => {
    br.setNavigationView = jest.fn((arg) => hideFlag = arg);

    br.hideNavigation();
    expect(br.setNavigationView).toHaveBeenCalled();
    expect(hideFlag).toEqual(true);
  });

  test('core function `setNavigationView` is called `showNavigation` is called', () => {
    br.setNavigationView = jest.fn((arg) => hideFlag = arg);
    br.navigationIsVisible = jest.fn(() => false);

    br.showNavigation();
    expect(br.setNavigationView).toHaveBeenCalled();
    expect(br.navigationIsVisible).toHaveBeenCalled();
    expect(hideFlag).toEqual(undefined);
  });
});
