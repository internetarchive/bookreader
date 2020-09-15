import {
  isChrome,
} from '../../src/util/browserSniffing.js';

describe('isChrome', () => {
  const tests = [
    {
      name: 'Firefox on Windows 10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
      vendor: '',
      expected: false
    },
    {
      name: 'Chrome on Windows 10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
      vendor: 'Google Inc.',
      expected: true
    },
    {
      name: 'Edge on Windows 10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ServiceUI 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362',
      vendor: '',
      expected: false
    },
    {
      name: 'IE11 on Windows 10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; Touch; .NET4.0C; .NET4.0E; Tablet PC 2.0; Zoom 3.6.0; rv:11.0) like Gecko',
      vendor: '',
      expected: false
    },
    {
      name: 'Chromium on Windows 10',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3923.0 Safari/537.36',
      vendor: 'Google Inc.',
      expected: true
    },
  ];

  for (const { name, userAgent, vendor, expected } of tests) {
    test(name, () => expect(isChrome(userAgent, vendor)).toBe(expected));
  }
});
