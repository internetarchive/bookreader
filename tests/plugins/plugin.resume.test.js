import '../../BookReader/jquery-1.10.1.js';
import '../../BookReader/jquery-ui-1.12.0.min.js';
import '../../BookReader/jquery.browser.min.js';
import '../../BookReader/dragscrollable-br.js';
import '../../BookReader/jquery.colorbox-min.js';
import '../../BookReader/jquery.bt.min.js';

import BookReader from '../../src/js/BookReader.js';
import '../../src/js/plugins/plugin.resume.js';

import sinon from 'sinon';
import * as docCookies from '../../src/util/docCookies.js';

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
  br.init();
});

afterEach(() => {
  jest.clearAllMocks();
  sinon.restore();
});

describe('Plugin: Remember Current Page in Cookies', () => {
  test('has default option flag', () => {
    expect(BookReader.defaultOptions.enablePageResume).toEqual(true);
    expect(BookReader.defaultOptions.resumeCookiePath).toEqual(null);
  });

  test('has added BR property: getResumeValue', () => {
    expect(br).toHaveProperty('getResumeValue');
  });

  test('has added BR property: updateResumeValue', () => {
    expect(br).toHaveProperty('updateResumeValue');
  });
});

describe('updateResumeValue', () => {
  /* Mark 2020-05-02
    Commenting this out while confirming with Neeraj
    I'm not sure:
    - What this test really does
    - If the instantiation of the prototype counts as a call
    - If so, why would there be a second call
    Can't find in production
    In this branch .toHaveBeenCalledTimes() === 1
  test('starts when BookReaderInit is called', () => {
    br.updateResumeValue = jest.fn();
    br.init();
    expect(br.updateResumeValue).toHaveBeenCalledTimes(2);
  });
  */

  test('handles cookieName=null', () => {
    const { updateResumeValue } = BookReader.prototype;
    const setItemSpy = sinon.spy(docCookies, 'setItem');
    const fakeBr = { options: { resumeCookiePath: '/details/goody' } };

    updateResumeValue.call(fakeBr, 16);
    expect(setItemSpy.callCount).toBe(1);
    expect(setItemSpy.args[0].slice(0, 2)).toEqual(['br-resume', 16]);
    expect(setItemSpy.args[0][3]).toEqual('/details/goody');
  });

  test('handles resumeCookiePath not set', () => {
    const { updateResumeValue } = BookReader.prototype;
    const setItemSpy = sinon.spy(docCookies, 'setItem');
    const fakeBr = { options: { } };

    updateResumeValue.call(fakeBr, 16);
    expect(setItemSpy.args[0][3]).toEqual('/');
  });
});
