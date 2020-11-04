
import BookReader from '../src/js/BookReader.js';
import '../src/js/plugins/plugin.resume.js';
import '../src/js/plugins/plugin.url.js';

let br;
beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
  br = new BookReader();
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
  br.getResumeValue = jest.fn(() => 15);
  br.urlReadFragment = jest.fn(() => '');

  const params = br.initParams();
  expect(br.getResumeValue).toHaveBeenCalledTimes(1);
  expect(params.init).toBe(true);
  expect(params.index).toBe(15);
  expect(params.fragmentChange).toBe(true);
});

test('does not check cookie when initParams called', () => {
  br.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => '');
  br.options.enablePageResume = false;

  const params = br.initParams();
  expect(br.getResumeValue).toHaveBeenCalledTimes(0);
  expect(params.init).toBe(true);
  expect(params.index).toBe(0);
  expect(params.fragmentChange).toBe(false);
});

test('gets index from fragment when both fragment and cookie when InitParams called', () => {
  br.getResumeValue = jest.fn(() => 15);
  br.urlReadFragment = jest.fn(() => 'page/n4');
  br.options.enablePageResume = true;

  const params = br.initParams();
  expect(br.getResumeValue).toHaveBeenCalledTimes(1);
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

test('has suppressFragmentChange true when init with no input', () => {
  br.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => '');
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', true);
});

test('has suppressFragmentChange false when init with cookie', () => {
  br.getResumeValue = jest.fn(() => 5);
  br.urlReadFragment = jest.fn(() => '');
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', false);
});

test('has suppressFragmentChange false when init with fragment', () => {
  br.getResumeValue = jest.fn(() => null);
  br.urlReadFragment = jest.fn(() => 'mode/1up');
  br.switchMode = jest.fn();

  br.init();
  expect(br.switchMode.mock.calls[0][1])
    .toHaveProperty('suppressFragmentChange', false);
});

test('adds q= term to urlMode=history query string', () => {
  expect(br.queryStringFromParams(
    { search: 'test value' },
    'name=value',
    'history'
  )).toBe('?name=value&q=test+value');
});

test('replaces q= term in urlMode=history query string', () => {
  expect(br.queryStringFromParams(
    { search: 'test+value' },
    'q=foo&a=1&b=2&c=3',
    'history'
  )).toBe('?q=test%2Bvalue&a=1&b=2&c=3');
});

test('does not add q= term to urlMode=hash query string', () => {
  expect(br.queryStringFromParams(
    { search: 'test value' },
    'name=value',
    'hash'
  )).toBe('?name=value');
});

test('_getPageURISrcset with 0 page book', () => {
  br._models.book.getNumLeafs = jest.fn(() => 0);
  br._models.book.getPageURI = jest.fn((index, scale, rotate) => "correctURL.png&scale=" + scale);
  br.init();
  expect(br._getPageURISrcset(5, undefined, undefined)).toBe("");
});

test('_getPageURISrcset with negative index', () => {
  br._models.book.getNumLeafs = jest.fn(() => 0);
  br._models.book.getPageURI = jest.fn((index, scale, rotate) => "correctURL.png&scale=" + scale);
  br.init();
  expect(br._getPageURISrcset(-7, undefined, undefined)).toBe("");
});

test('_getPageURISrcset with 0 elements in srcset', () => {
  br._models.book.getNumLeafs = jest.fn(() => 30);
  br._models.book.getPageURI = jest.fn((index, scale, rotate) => "correctURL.png&scale=" + scale);
  br.init();
  expect(br._getPageURISrcset(5, 1, undefined)).toBe("");
});

test('_getPageURISrcset with 2 elements in srcset', () => {
  br._models.book.getNumLeafs = jest.fn(() => 30);
  br._models.book.getPageURI = jest.fn((index, scale, rotate) => "correctURL.png&scale=" + scale);
  br.init();
  expect(br._getPageURISrcset(5, 5, undefined)).toBe("correctURL.png&scale=2 2x, correctURL.png&scale=1 4x");
});

test('_getPageURISrcset with the most elements in srcset', () => {
  br._models.book.getNumLeafs = jest.fn(() => 30);
  br._models.book.getPageURI = jest.fn((index, scale, rotate) => "correctURL.png&scale=" + scale);
  br.init();
  expect(br._getPageURISrcset(5, 35, undefined)).toBe("correctURL.png&scale=16 2x, correctURL.png&scale=8 4x, correctURL.png&scale=4 8x, correctURL.png&scale=2 16x, correctURL.png&scale=1 32x");
});

test('_getPageURISrcset with undefined reduce param', () => {
  br._models.book.getNumLeafs = jest.fn(() => 30);
  br._models.book.getPageURI = jest.fn((index, scale, rotate) => "correctURL.png&scale=" + scale);
  br.init();
  expect(br._getPageURISrcset(5, undefined, undefined)).toBe("correctURL.png&scale=16 2x, correctURL.png&scale=8 4x, correctURL.png&scale=4 8x, correctURL.png&scale=2 16x, correctURL.png&scale=1 32x");
});
