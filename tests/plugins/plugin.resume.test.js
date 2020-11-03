import '../../src/js/jquery-ui-wrapper.js';
import 'jquery.browser';

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
    Skipping while confirming with Neeraj
    I'm not sure:
    - What this test really does
    - If the instantiation of the prototype counts as a call
    - If so, why would there be a second call
    Can't find in production
    In this branch .toHaveBeenCalledTimes() === 1
  */
  test.skip('starts when BookReaderInit is called', () => {
    br.updateResumeValue = jest.fn();
    br.init();
    expect(br.updateResumeValue).toHaveBeenCalledTimes(2);
  });

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
    const setItemSpy = sinon.spy(docCookies, 'setItem');
    // Save function
    const saveFn = br.getCookiePath;
    br.getCookiePath = jest.fn(() => '/details/foo');
    br.updateResumeValue(16);
    expect(setItemSpy.args[0][3]).toEqual('/details/foo');
    // Restore function
    br.getCookiePath = saveFn;
  });

  test('handles cookie path from URL with decoration', () => {
    const complexPathWithPage = '/details/2008ELMValidityStudyFinalReportRevised/Executive%20Summary%20for%20the%20EPT%26ELM%20Validity%20Studie_20100603%20-%20Copy/page/n1/mode/2up';
    const complexPath = '/details/2008ELMValidityStudyFinalReportRevised/Executive%20Summary%20for%20the%20EPT%26ELM%20Validity%20Studie_20100603%20-%20Copy';
    expect(br.getCookiePath(complexPathWithPage))
      .toEqual(complexPath);

    expect(br.getCookiePath('/details/item/mode/1up'))
      .toEqual('/details/item');

    expect(br.getCookiePath('/details/item/inside/a/long/path/model/is/used'))
      .toEqual('/details/item/inside/a/long/path/model/is/used');

    expect(br.getCookiePath('/details/item/inside/a/long/path/mode/is/used'))
      .toEqual('/details/item/inside/a/long/path');
  });

  test('handles cookie path from URL with no decoration', () => {
    expect(br.getCookiePath('/details/item'))
      .toEqual('/details/item');

    expect(br.getCookiePath('/details/item/'))
      .toEqual('/details/item/');

    expect(br.getCookiePath('/details/item/almost/any/kind/of/long/path'))
      .toEqual('/details/item/almost/any/kind/of/long/path');
  });
});
