
import BookReader, {_modeStringToNumber} from '@/src/BookReader.js';
import '@/src/plugins/plugin.resume.js';
import '@/src/plugins/url/plugin.url.js';
import {DEFAULT_OPTIONS} from '@/src/BookReader/options.js';
import { html } from 'lit';

/** @type {import('@/src/BookReader.js').default} */
let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader({
    server: '',
    bookId: '',
    subPrefix: '',
    bookPath: '',
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('has registered PostInit events', () => {
  expect(BookReader.eventNames.PostInit).toBeTruthy();
});

test('has registered zoom events', () => {
  expect(BookReader.eventNames.zoomIn).toBeTruthy();
  expect(BookReader.eventNames.zoomOut).toBeTruthy();
});

test('has registered view type selected events', () => {
  expect(BookReader.eventNames['1PageViewSelected']).toBeTruthy();
  expect(BookReader.eventNames['2PageViewSelected']).toBeTruthy();
  expect(BookReader.eventNames['3PageViewSelected']).toBeTruthy();
});

test('has registered fullscreen toggle event', () => {
  expect(BookReader.eventNames.fullscreenToggled).toBeTruthy();
});

test('checks cookie when initParams called', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => 15);
  br.urlReadFragment = jest.fn(() => '');

  const params = br.initParams();
  expect(br.plugins.resume.getResumeValue).toHaveBeenCalledTimes(1);
  expect(params.init).toBe(true);
  expect(params.index).toBe(15);
  expect(params.fragmentChange).toBe(true);
});

test('does not check cookie when initParams called', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => '');
  br.options.plugins.resume.enabled = false;

  const params = br.initParams();
  expect(br.plugins.resume.getResumeValue).toHaveBeenCalledTimes(0);
  expect(params.init).toBe(true);
  expect(params.index).toBe(0);
  expect(params.fragmentChange).toBe(false);
});

test('gets index from fragment when both fragment and cookie when InitParams called', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => 15);
  br.urlReadFragment = jest.fn(() => 'page/n4');
  br.options.plugins.resume.enabled = true;

  const params = br.initParams();
  expect(br.plugins.resume.getResumeValue).toHaveBeenCalledTimes(1);
  expect(params.init).toBe(true);
  expect(params.index).toBe(4);
  expect(params.fragmentChange).toBe(true);
});

test('sets prevReadMode when init called', () => {
  br.init();
  expect(br.prevReadMode).toBeTruthy();
});

// Default behavior same in
//   BookReader.prototype.drawLeafsThumbnail
//   BookReader.prototype.getPrevReadMode
test('sets prevPageMode if initial mode is thumb', () => {
  br.urlReadFragment = jest.fn(() => 'page/n4/mode/thumb');

  br.init();
  expect(br.prevReadMode).toBe(BookReader.constMode1up);
});

test('calls switchMode with init option when init called', () => {
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('init', true);
});

test('has added BR property: server', () => {
  expect(br).toHaveProperty('server');
  expect(br.server).toBeDefined();
});

test('has added BR property: bookId', () => {
  expect(br).toHaveProperty('bookId');
  expect(br.bookId).toBeDefined();
});

test('has added BR property: subPrefix', () => {
  expect(br).toHaveProperty('subPrefix');
  expect(br.subPrefix).toBeDefined();
});

test('has added BR property: bookPath', () => {
  expect(br).toHaveProperty('bookPath');
  expect(br.bookPath).toBeDefined();
});

test('has suppressFragmentChange true when init with no input', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => '');
  br.urlReadHashFragment = jest.fn(() => '');
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', true);
});

test('has suppressFragmentChange false when init with cookie', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => 5);
  br.urlReadFragment = jest.fn(() => '');
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', false);
});

test('has suppressFragmentChange false when init with fragment', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => 'mode/1up');
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', false);
});

test('has suppressFragmentChange false when init with hash fragment', () => {
  br.plugins.resume.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => '');
  br.urlReadHashFragment = jest.fn(() => 'mode/1up');
  br.switchMode = jest.fn();
  br.options.urlMode = 'history',

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', false);
});

test('adds q= term to urlMode=history query string', () => {
  expect(br.queryStringFromParams(
    { search: 'test value' },
    'name=value',
    'history',
  )).toBe('?name=value&q=test+value');
});

test('replaces q= term in urlMode=history query string', () => {
  expect(br.queryStringFromParams(
    { search: 'test+value' },
    'q=foo&a=1&b=2&c=3',
    'history',
  )).toBe('?q=test%2Bvalue&a=1&b=2&c=3');
});

test('does not add q= term to urlMode=hash query string', () => {
  expect(br.queryStringFromParams(
    { search: 'test value' },
    'name=value',
    'hash',
  )).toBe('?name=value');
});

describe('Navigation Bars', () => {
  test('Standard navigation is being used by default', () => {
    br.initNavbar = jest.fn();
    br.options.ui = '';
    br.init();
    expect(br.initNavbar).toHaveBeenCalledTimes(1);
  });
  test('Standard navigation is being used by default - when bookreader is embedded', () => {
    br.initNavbar = jest.fn();
    br.options.ui = 'embed';
    br.init();
    expect(br.initNavbar).toHaveBeenCalledTimes(1);
    expect(br.options.ui).toEqual('embed');
  });
});

describe('quantizeReduce', () => {
  const quantizeReduce = BookReader.prototype.quantizeReduce;
  const SAMPLE_FACTORS = [
    { reduce: 0.5 },
    { reduce: 1 },
    { reduce: 2 },
    { reduce: 3 },
    { reduce: 4 },
    { reduce: 6 },
  ];
  test('Number larger than max', () => {
    expect(quantizeReduce(10, SAMPLE_FACTORS)).toBe(6);
  });

  test('Number lower than max', () => {
    expect(quantizeReduce(0.25, SAMPLE_FACTORS)).toBe(0.5);
  });

  test('Number directly between two reduction factors chooses first factor', () => {
    expect(quantizeReduce(5, SAMPLE_FACTORS)).toBe(4);
  });

  test('Exact match', () => {
    expect(quantizeReduce(2, SAMPLE_FACTORS)).toBe(2);
  });

  test('Closer to a lower boundary', () => {
    expect(quantizeReduce(1.115, SAMPLE_FACTORS)).toBe(1);
  });

  test('Closer to an upper bound', () => {
    expect(quantizeReduce(1.95, SAMPLE_FACTORS)).toBe(2);
  });

  test('Only one reduction factor', () => {
    expect(quantizeReduce(17, [{reduce: 10}])).toBe(10);
  });
});


describe('nextReduce', () => {
  describe('Test matrix', () => {
    const nextReduce = BookReader.prototype.nextReduce;
    const SAMPLE_FACTORS = [
      { reduce: 0.5 },
      { reduce: 1 },
      { reduce: 2 },
      { reduce: 3 },
      { reduce: 3.3, autofit: "width" },
      { reduce: 4 },
      { reduce: 6 },
      { reduce: 6.1, autofit: "height" },
      // auto doesn't get read by nextReduce (bug)
      // It looks like width/height are set for 1up, and auto is set for 2up,
      // and neither is set for thumb
      { reduce: 6.2, autofit: "auto" },
    ];

    const currentReduces = [
      { name: 'Exact match', value: 2 },
      { name: 'In-between', value: 4.5 },
      { name: '< Min', value: 0.25 },
      { name: '> Max', value: 10 },

      { name: '= Min', value: 0.5 },
      { name: '= Max', value: 6.2 },
    ];

    const directions = [ 'in', 'out', 'width', 'height', 'auto' ];

    const expectations = [
      // currentReduces <->
      // v^ directions
      /*                2, 4.5, 0.25,  10,  0.5,  6.2   */
      /* in     */  [   1,   4,  0.5, 6.2,  0.5,  6.1  ],
      /* out    */  [   3,   6,  0.5, 6.2,    1,  6.2  ],
      /* width  */  [ 3.3, 3.3,  3.3, 3.3,  3.3,  3.3  ],
      /* height */  [ 6.1, 6.1,  6.1, 6.1,  6.1,  6.1  ],
      /* auto   */  [ 6.2, 6.2,  6.2, 6.2,  6.2,  6.2  ],
    ];

    for (const [y, row] of expectations.entries()) {
      for (const [x, expectedValue] of row.entries()) {
        test(`${currentReduces[x].name} ${directions[y]}`, () => {
          expect(nextReduce(currentReduces[x].value, directions[y], SAMPLE_FACTORS).reduce)
            .toBe(expectedValue);
        });
      }
    }
  });

  describe('No matching reduction', () => {
    const nextReduce = BookReader.prototype.nextReduce;
    const SAMPLE_FACTORS = [
      { reduce: 0.5 },
      { reduce: 1 },
      { reduce: 2 },
      { reduce: 3 },
    ];

    test('Returns first reduction when no match found', () => {
      expect(nextReduce(2, 'width', SAMPLE_FACTORS).reduce).toBe(0.5);
      expect(nextReduce(2, 'height', SAMPLE_FACTORS).reduce).toBe(0.5);
      expect(nextReduce(2, 'auto', SAMPLE_FACTORS).reduce).toBe(0.5);
    });
  });
});

describe('_modeStringToNumber', () => {
  test('Returns correct number', () => {
    expect(_modeStringToNumber('mode/1up')).toBe(1);
    expect(_modeStringToNumber('mode/2up')).toBe(2);
    expect(_modeStringToNumber('mode/thumb')).toBe(3);
  });
});

describe('extendOptions', () => {
  test('returns the single option when only one option is provided', () => {
    const singleOption = { foo: 'bar' };
    const result = BookReader.extendOptions(singleOption);
    expect(result).toBe(singleOption);
  });

  test('returns undefined when no options are provided', () => {
    const result = BookReader.extendOptions();
    expect(result).toBeUndefined();
  });

  test('performs shallow merge of non-plugin options', () => {
    const option1 = { foo: 'bar', shared: 'first' };
    const option2 = { baz: 'qux', shared: 'second' };
    const result = BookReader.extendOptions(option1, option2);

    expect(result).toEqual({
      foo: 'bar',
      baz: 'qux',
      shared: 'second',
    });
  });

  test('individually merges plugin options', () => {
    const option1 = {
      plugins: {
        search: { enabled: true, option1: 'value1' },
        tts: { enabled: false },
      },
    };
    const option2 = {
      plugins: {
        search: { option2: 'value2', option1: 'overridden' },
        resume: { enabled: true },
      },
    };

    const result = BookReader.extendOptions(option1, option2);

    expect(result.plugins.search).toEqual({
      enabled: true,
      option1: 'overridden',
      option2: 'value2',
    });
    expect(result.plugins.tts).toEqual({ enabled: false });
    expect(result.plugins.resume).toEqual({ enabled: true });
  });

  test('handles case where first option has no plugins but second does', () => {
    const option1 = { foo: 'bar' };
    const option2 = {
      plugins: {
        search: { enabled: true },
      },
    };

    const result = BookReader.extendOptions(option1, option2);

    expect(result.foo).toBe('bar');
    expect(result.plugins.search).toEqual({ enabled: true });
  });

  test('handles case where first option has plugins but second does not', () => {
    const option1 = {
      plugins: {
        search: { enabled: true },
      },
    };
    const option2 = { foo: 'bar' };

    const result = BookReader.extendOptions(option1, option2);

    expect(result.foo).toBe('bar');
    expect(result.plugins.search).toEqual({ enabled: true });
  });

  for (const [key, value] of Object.entries(DEFAULT_OPTIONS)) {
    if (isObject(value)) {
      const firstKey = Object.keys(value)[0];
      const isDeep = isObject(value[firstKey]);
      if (isDeep) {
        test(`shallow merges complex map option: ${key}`, () => {
          const result = BookReader.extendOptions({}, DEFAULT_OPTIONS, { [key]: { [firstKey]: { newProp: 'new' } } });
          expect(result[key][firstKey]).toHaveProperty('newProp', 'new');
        });
      } else {
        test(`shallow merges complex option: ${key}`, () => {
          const result = BookReader.extendOptions({}, DEFAULT_OPTIONS, { [key]: { newProp: 'new' } });
          expect(result[key]).toHaveProperty('newProp', 'new');
        });
      }
    }
  }

  test('Handles TemplateResult plugin options', () => {
    const templateResult = html`<span>Test</span>`;
    const options = {
      plugins: {
        translate: { panelDisclaimerText: templateResult },
      },
    };

    const result = BookReader.extendOptions({}, DEFAULT_OPTIONS, options);
    expect(result.plugins.translate.panelDisclaimerText).toBe(templateResult);
    // This is what caused it to break before
    expect(result.plugins.translate.panelDisclaimerText.strings).toHaveProperty('raw');
  });
});

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
