import sinon from 'sinon';
import '../src/js/BookReader.js';

test('clamp function returns Math.min(Math.max(value, min), max)', () => {
    expect(BookReader.util.clamp(2,1,3)).toEqual(2);
});

test('calculate a percentage suitable for CSS', () => {
    expect(BookReader.util.cssPercentage(2,1)).toEqual(200+'%');
});

test('escapeHTML function which replaces the string', () => {
    expect(BookReader.util.escapeHTML('Me & You')).toEqual('Me &amp; You');
    expect(BookReader.util.escapeHTML('Me > You')).toEqual('Me &gt; You');
    expect(BookReader.util.escapeHTML('Me < You')).toEqual('Me &lt; You');
    expect(BookReader.util.escapeHTML('Me " You')).toEqual('Me &quot; You');
});

test('Decodes a URI component and converts + to emptyStr', () => {
    expect(BookReader.util.decodeURIComponentPlus("https%3A%2F%2Farchive.org%2Fskr+")).toEqual("https://archive.org/skr ");
    expect(BookReader.util.decodeURIComponentPlus("%3Fx%3D+test")).toEqual("?x= test");
});

test('Encodes a URI component and converts emptyStr to +', () => {
    expect(BookReader.util.encodeURIComponentPlus("?x=test ")).toEqual("%3Fx%3Dtest+");
    expect(BookReader.util.encodeURIComponentPlus("ABC abc 123")).toEqual("ABC+abc+123");
});

let clock;

beforeEach(() => {
  clock = sinon.useFakeTimers();
});

afterEach(() => {
  clock.restore();
});

test('testing debounce', () => {
  const func = jest.fn();
  const debouncedFunc = BookReader.util.debounce(func, 1000);
  // Call it immediately
  debouncedFunc();
  expect(func).toHaveBeenCalledTimes(0); // func not called

  // Call it several times with 500ms between each call
  for(let i = 0; i < 10; i++) {
    clock.tick(500);
    debouncedFunc();
  }
  expect(func).toHaveBeenCalledTimes(0); // func not called

  // wait 1000ms
  clock.tick(1000);
  expect(func).toHaveBeenCalledTimes(1);  // func called
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