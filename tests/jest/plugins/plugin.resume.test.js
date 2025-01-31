import BookReader from '@/src/BookReader.js';
import '@/src/plugins/plugin.resume.js';

import sinon from 'sinon';
import * as docCookies from '@/src/util/docCookies.js';
import { ResumePlugin } from '@/src/plugins/plugin.resume.js';

/** @type {import('@/src/BookReader.js').default} */
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
    br._plugins.resume.updateResumeValue = jest.fn();
    br.init();
    expect(br._plugins.resume.updateResumeValue).toHaveBeenCalledTimes(2);
  });

  test('handles cookieName=null', () => {
    const p = new ResumePlugin(null);
    p.setup({ cookiePath: '/details/goody' });
    const setItemSpy = sinon.spy(docCookies, 'setItem');

    p.updateResumeValue(16);
    expect(setItemSpy.callCount).toBe(1);
    expect(setItemSpy.args[0].slice(0, 2)).toEqual(['br-resume', 16]);
    expect(setItemSpy.args[0][3]).toEqual('/details/goody');
  });

  test('handles cookiePath not set', () => {
    const setItemSpy = sinon.spy(docCookies, 'setItem');
    // Save function
    const saveFn = br._plugins.resume.getCookiePath;
    br._plugins.resume.getCookiePath = jest.fn(() => '/details/foo');
    br._plugins.resume.updateResumeValue(16);
    expect(setItemSpy.args[0][3]).toEqual('/details/foo');
    // Restore function
    br._plugins.resume.getCookiePath = saveFn;
  });

  test('handles cookie path from URL with decoration', () => {
    const complexPathWithPage = '/details/2008ELMValidityStudyFinalReportRevised/Executive%20Summary%20for%20the%20EPT%26ELM%20Validity%20Studie_20100603%20-%20Copy/page/n1/mode/2up';
    const complexPath = '/details/2008ELMValidityStudyFinalReportRevised/Executive%20Summary%20for%20the%20EPT%26ELM%20Validity%20Studie_20100603%20-%20Copy';
    expect(br._plugins.resume.getCookiePath(complexPathWithPage))
      .toEqual(complexPath);

    expect(br._plugins.resume.getCookiePath('/details/item/mode/1up'))
      .toEqual('/details/item');

    expect(br._plugins.resume.getCookiePath('/details/item/inside/a/long/path/model/is/used'))
      .toEqual('/details/item/inside/a/long/path/model/is/used');

    expect(br._plugins.resume.getCookiePath('/details/item/inside/a/long/path/mode/is/used'))
      .toEqual('/details/item/inside/a/long/path');
  });

  test('handles cookie path from URL with no decoration', () => {
    expect(br._plugins.resume.getCookiePath('/details/item'))
      .toEqual('/details/item');

    expect(br._plugins.resume.getCookiePath('/details/item/'))
      .toEqual('/details/item/');

    expect(br._plugins.resume.getCookiePath('/details/item/almost/any/kind/of/long/path'))
      .toEqual('/details/item/almost/any/kind/of/long/path');
  });
});
