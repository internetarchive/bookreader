import '../BookReader/jquery-1.10.1.js';
import '../BookReader/jquery-ui-1.12.0.min.js';
import '../BookReader/jquery.browser.min.js';
import '../BookReader/dragscrollable-br.js';
import '../BookReader/jquery.colorbox-min.js';
import '../BookReader/jquery.bt.min.js';

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

test('overrides cookie if page fragment when InitParams called', () => {
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
