import '../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';
import '../../src/js/dragscrollable-br.js';
import 'jquery-colorbox';

import BookReader from '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.mobile_nav.js';

/** @type {BookReader} */
let br;
beforeEach(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Mobile Nav', () => {
  test('has option flag', () => {
    expect(BookReader.defaultOptions.enableMobileNav).toEqual(true);
  });
  test('has added BR property: mobileNavTitle', () => {
    expect(br).toHaveProperty('mobileNavTitle');
    expect(br.mobileNavTitle).toBeTruthy();
  });
  test('has added BR property: mobileNavFullscreenOnly', () => {
    expect(br).toHaveProperty('mobileNavFullscreenOnly');
    expect(br.mobileNavFullscreenOnly).toEqual(false);
  });
  test('has a referenced copy of nav in BookReader', () => {
    expect(br.refs).toHaveProperty('$mmenu');
  });
  test('draws toolbar on init', () => {
    let callCount = 0;
    // Since we have a custom setter set in utils/classes.js, we can't
    // use regular spying; need to "override" the function with a watcher.
    BookReader.prototype.initToolbar = function(_super) {
      return function() {
        callCount++;
        _super.apply(this, arguments);
      }
    }(BookReader.prototype.initToolbar);
    const br = new BookReader();
    br.init();
    expect(callCount).toBe(1);
  });
  test('sets a class on body to signal it has attached', () => {
    expect($(document.body).hasClass('BRbodyMobileNavEnabled')).toEqual(true);
  });
  test('loads the navbar on init', () => {
    expect($('#BRmobileMenu')).toHaveLength(1)
  });
  test('There is a Settings Section', () => {
    expect($('.BRmobileMenu__settings')).toHaveLength(1);
  });
  test('There is a More Info Section', () => {
    expect($('.BRmobileMenu__moreInfoRow')).toHaveLength(1);
  });
  test('There is a Sharing Section', () => {
    expect($('.BRmobileMenu__share')).toHaveLength(1);
  });
  test('clicking on hamburger opens menu', () => {
    expect($('html').hasClass('mm-opened')).toEqual(false);
    $('.BRmobileHamburger').click();
    expect($('html').hasClass('mm-opened')).toEqual(true);
  });
});
