import sinon from 'sinon';
import {
  clamp,
  cssPercentage,
  debounce,
  decodeURIComponentPlus,
  encodeURIComponentPlus,
  escapeHTML,
  getActiveElement,
  isInputActive,
  polyfillCustomEvent,
  PolyfilledCustomEvent,
} from '@/src/BookReader/utils.js';

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

describe('getActiveElement', () => {
  test('Can ignore shadow DOM', () => {
    const doc = {activeElement: { shadowRoot: {activeElement: {}}}};
    expect(getActiveElement(doc, false)).toBe(doc.activeElement);
  });

  test('Can traverse shadow DOM', () => {
    const doc = {activeElement: { shadowRoot: {activeElement: {}}}};
    expect(getActiveElement(doc, true)).toBe(doc.activeElement.shadowRoot.activeElement);
  });

  test('Handles non-shadow elements', () => {
    const doc = {activeElement: {}};
    expect(getActiveElement(doc, true)).toBe(doc.activeElement);
  });

  test('Handles no active element', () => {
    const doc = {activeElement: null};
    expect(getActiveElement(doc, true)).toBe(null);
  });
});

describe('isInputActive', () => {
  test('Handles no activeElement', () => {
    expect(isInputActive({activeElement: null})).toBe(false);
  });

  test('Handles deep input activeElement', () => {
    const doc = {activeElement: { shadowRoot: {activeElement: { tagName: 'INPUT' }}}};
    expect(isInputActive(doc)).toBe(true);
  });

  test('Handles deep non-input activeElement', () => {
    const doc = {activeElement: { shadowRoot: {activeElement: { tagName: 'A' }}}};
    expect(isInputActive(doc)).toBe(false);
  });

  test('Handles textarea activeElement', () => {
    const doc = {activeElement: { tagName: 'TEXTAREA' }};
    expect(isInputActive(doc)).toBe(true);
  });
});

describe('debounce', () => {
  /** @type {sinon.SinonFakeTimers} */
  let clock;
  beforeEach(() => clock = sinon.useFakeTimers());
  afterEach(() => clock.restore());

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
