import {
  isChrome, isEdge, isFirefox, isSafari,
} from '@/src/util/browserSniffing.js';

const TESTS = [
  {
    name: 'Firefox on Windows 10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:69.0) Gecko/20100101 Firefox/69.0',
    vendor: '',
    machingFn: isFirefox,
  },
  {
    name: 'Chrome on Windows 10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
    vendor: 'Google Inc.',
    machingFn: isChrome,
  },
  {
    name: 'Edge on Windows 10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ServiceUI 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18362',
    vendor: '',
    machingFn: isEdge,
  },
  {
    name: 'Edge on Windows 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0',
    vendor: 'Google Inc.',
    machingFn: isEdge,
  },
  {
    name: 'IE11 on Windows 10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; Touch; .NET4.0C; .NET4.0E; Tablet PC 2.0; Zoom 3.6.0; rv:11.0) like Gecko',
    vendor: '',
    machingFn: null,
  },
  {
    name: 'Chromium on Windows 10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3923.0 Safari/537.36',
    vendor: 'Google Inc.',
    machingFn: isChrome,
  },
  {
    name: 'Safari 12 on Mojave',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Safari/605.1.15',
    vendor: 'Apple Computer, Inc.',
    machingFn: isSafari,
  },
  {
    name: 'Safari 10 on iPhone 7',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
    vendor: 'Apple Computer, Inc.',
    machingFn: isSafari,
  },
];

for (const fn of [isChrome, isEdge, isFirefox, isSafari]) {
  describe(fn.name, () => {
    for (const { name, userAgent, vendor, machingFn } of TESTS) {
      test(name, () => expect(fn(userAgent, vendor)).toBe(machingFn == fn));
    }
  });
}
