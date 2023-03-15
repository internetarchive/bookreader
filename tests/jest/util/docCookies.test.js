import * as docCookies from '@/src/util/docCookies.js';

afterEach(() => {
  jest.clearAllMocks();
});

describe('Helper function: set and get cookie item', () => {
  test('set cookie item value', () => {
    expect(docCookies.setItem('test-cookie', 'jack-sparow')).toBeTruthy();
  });

  test('get cookie item value', () => {
    expect(docCookies.getItem('test-cookie')).toEqual('jack-sparow');
  });
});

describe('isCookiesBlocked', () => {
  test('return true if cookies are blocked', () => {
    expect(docCookies.areCookiesBlocked({ get cookie() { throw new Error(); }})).toBeTruthy();
  });
  test('return false if cookies are not blocked', () => {
    expect(docCookies.areCookiesBlocked({ cookie: 'blah' })).toBeFalsy();
  });
});
