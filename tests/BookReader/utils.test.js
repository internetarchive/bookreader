import sinon from 'sinon';
import {
  clamp,
  cssPercentage,
  debounce,
  decodeURIComponentPlus,
  encodeURIComponentPlus,
  escapeHTML,
  polyfillCustomEvent,
  PolyfilledCustomEvent,
  sleep,
} from '../../src/js/BookReader/utils.js';

test('clamp function returns Math.min(Math.max(value, min), max)', () => {
  expect(clamp(2,1,3)).toEqual(2);
});

test('calculate a percentage suitable for CSS', () => {
  expect(cssPercentage(2,1)).toEqual('200%');
});

test('escapeHTML function which replaces the string', () => {
  expect(escapeHTML('Me & You')).toEqual('Me &amp; You');
  expect(escapeHTML('Me > You')).toEqual('Me &gt; You');
  expect(escapeHTML('Me < You')).toEqual('Me &lt; You');
  expect(escapeHTML('Me " You')).toEqual('Me &quot; You');
});

test('Decodes a URI component and converts + to emptyStr', () => {
  expect(decodeURIComponentPlus("https%3A%2F%2Farchive.org%2Fskr+")).toEqual("https://archive.org/skr ");
  expect(decodeURIComponentPlus("%3Fx%3D+test")).toEqual("?x= test");
});

test('Encodes a URI component and converts emptyStr to +', () => {
  expect(encodeURIComponentPlus("?x=test ")).toEqual("%3Fx%3Dtest+");
  expect(encodeURIComponentPlus("ABC abc 123")).toEqual("ABC+abc+123");
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
  const debouncedFunc = debounce(func, 1000);
  // Call it immediately
  debouncedFunc();
  expect(func).toHaveBeenCalledTimes(0); // func not called

  // Call it several times with 500ms between each call
  for (let i = 0; i < 10; i++) {
    clock.tick(500);
    debouncedFunc();
  }
  expect(func).toHaveBeenCalledTimes(0); // func not called

  // wait 1000ms
  clock.tick(1000);
  expect(func).toHaveBeenCalledTimes(1);  // func called
});


describe('polyfillCustomEvent', () => {
  test('Overrides when missing', () => {
    const win = {};
    polyfillCustomEvent(win);
    expect(win).toHaveProperty('CustomEvent');
  });

  test('Overrides when not a function', () => {
    const win = { CustomEvent: {} };
    polyfillCustomEvent(win);
    expect(typeof win.CustomEvent).toBe('function');
  });
});

describe('PolyfilledCustomEvent', () => {
  test('Can be called as a constructor', () => {
    new PolyfilledCustomEvent('foo');
  });

  test('Calls deprecated browser methods', () => {
    const createEventSpy = sinon.spy(document, 'createEvent');
    const initCustomEventSpy = sinon.spy(CustomEvent.prototype, 'initCustomEvent');
    new PolyfilledCustomEvent('foo');
    expect(createEventSpy.callCount).toBe(1);
    expect(initCustomEventSpy.callCount).toBe(1);
  });
});

describe('sleep', () => {
  test('can set sleep in ms', async () => {
    jest.useFakeTimers();

    const sleepTimeMS = 11;
    await sleep(sleepTimeMS);

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(undefined, sleepTimeMS);

    jest.clearAllTimers();
  });
});
