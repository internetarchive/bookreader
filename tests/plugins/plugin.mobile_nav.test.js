/* global BookReader */
import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';
import '../../BookReader/mmenu/dist/js/jquery.mmenu.min.js';
import '../../BookReader/mmenu/dist/addons/navbars/jquery.mmenu.navbars.min.js';

import '../../BookReader/BookReader.js';
import '../../src/js/plugins/plugin.mobile_nav.js';


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
    br = new BookReader();
    br.initToolbar = jest.fn();
    br.init();
    expect(br.initToolbar).toHaveBeenCalled();
  });
  test('sets a class on body to signal it has attached', () => {
    expect($(document.body).hasClass('BRbodyMobileNavEnabled')).toEqual(true);
  });
  test('loads the navbar on init', () => {
    expect($('#BRmobileMenu').length).toBeGreaterThan(0);
    expect($('#BRmobileMenu').length).toBeLessThan(2);
  });
  test('There is a Settings Section', () => {
    expect($('.BRmobileMenu__settings').length).toBeGreaterThan(0);
    expect($('.BRmobileMenu__settings').length).toBeLessThan(2);
  });
  test('There is a More Info Section', () => {
    expect($('.BRmobileMenu__moreInfoRow').length).toBeGreaterThan(0);
    expect($('.BRmobileMenu__moreInfoRow').length).toBeLessThan(2);
  });
  test('There is a Sharing Section', () => {
    expect($('.BRmobileMenu__share').length).toBeGreaterThan(0);
    expect($('.BRmobileMenu__share').length).toBeLessThan(2);
  });
  test('clicking on hamburger opens menu', () => {
    expect($('html').hasClass('mm-opened')).toEqual(false);
    $('.BRmobileHamburger').click();
    expect($('html').hasClass('mm-opened')).toEqual(true);
  });
});
