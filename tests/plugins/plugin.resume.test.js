/* global BookReader */
import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import '../../BookReader/BookReader.js';
import '../../src/js/plugins/plugin.resume.js';

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

  test('set cookie item value', () => {
    expect(BookReader.docCookies.setItem('test-cookie', 'jack-sparow')).toBeTruthy();
  });

  test('get cookie item value', () => {
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
