/* global BookReader */

require('../../BookReader/jquery-1.10.1.js');
require('../../BookReader/jquery-ui-1.12.0.min.js');
require('../../BookReader/jquery.browser.min.js');
require('../../BookReader/dragscrollable-br.js');
require('../../BookReader/jquery.colorbox-min.js');
require('../../BookReader/jquery.bt.min.js');

require('../../BookReader/BookReader.js');
require('../../src/js/plugins/plugin.resume.js');

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();  
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Plugin: Remember Current Page in Cookies', () => {
  test('has default option flag', () => {
    expect(BookReader.defaultOptions.enablePageResume).toEqual(true);
    expect(BookReader.defaultOptions.resumeCookiePath).toEqual(null);
  });

  test('has set cookie value', () => {
    expect(BookReader.docCookies.setItem('test-cookie', 'jack-sparow')).toBeTruthy();
  });

  test('has get cookie value', () => {
    expect(BookReader.docCookies.getItem('test-cookie')).toEqual('jack-sparow');
  });

  test('has added BR property: getResumeValue', () => {
    expect(br).toHaveProperty('getResumeValue');
    
  });

  test('has added BR property: updateResumeValue', () => {
    expect(br).toHaveProperty('updateResumeValue');
  });

  test('updateResumeValue does start when BookReaderInit is called', () => {
    br.updateResumeValue = jest.fn();
    br.init();
    expect(br.updateResumeValue).toHaveBeenCalledTimes(2);
  });
});
