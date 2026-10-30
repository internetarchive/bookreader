import sinon from 'sinon';
import { afterEventLoop, eventTargetMixin } from '../utils.js';
import {
  arrChanged,
  arrEquals,
  calcScreenDPI,
  clamp,
  cssPercentage,
  debounce,
  decodeURIComponentPlus,
  disableSelect,
  encodeURIComponentPlus,
  escapeHTML,
  escapeRegExp,
  genToArray,
  getActiveElement,
  getIFrameDocument,
  isInputActive,
  notInArray,
  parseAnimationSpeed,
  poll,
  polyfillCustomEvent,
  PolyfilledCustomEvent,
  promisifyEvent,
  sleep,
  sortBy,
  sum,
  throttle,
} from '@/src/BookReader/utils.js';

test('clamp function returns Math.min(Math.max(value, min), max)', () => {
  expect(clamp(2,1,3)).toEqual(2);
});

test('calculate a percentage suitable for CSS', () => {
  expect(cssPercentage(2,1)).toEqual('200%');
});

describe('`disableSelect(jObject)`', () => {
  let fakeObject;
  let fakeElement;

  beforeEach(() => {
    fakeElement = {
      onselectstart: null,
    };

    fakeObject = {
      bind: sinon.fake(),
      0: fakeElement,
    };
  });

  test('should bind on `mousedown()`, and the event returns `false`', () => {
    disableSelect(fakeObject);

    expect(fakeObject.bind.calledOnce).toBe(true);
    expect(fakeObject.bind.calledWith('mousedown')).toBe(true);

    const callback = fakeObject.bind.getCall(0).args[1];
    expect(callback()).toBe(false);
  });

  test('`onselectstart()` should return `false`', () => {
    disableSelect(fakeObject);

    expect(fakeElement.onselectstart()).toBe(false);
  });
});

test('`notInArray(value, array)` returns a boolean', () => {
  const array = ['cat', 'dog', 10, 42];

  expect(notInArray('fish', array)).toBe(true);
  expect(notInArray('catdog', array)).toBe(true);
  expect(notInArray('cat', array)).toBe(false);
  expect(notInArray(10, array)).toBe(false);
  expect(notInArray(42, array)).toBe(false);
});

describe('`genToArray(gen)`', () => {
  test('should convert a generator into an array', () => {
    function* testGenerator() {
      yield 1;
      yield 'fish';
      yield 3;
    }

    const generator = testGenerator();
    expect(genToArray(generator)).toEqual([1, 'fish', 3]);
  });

  test('should convert generator with nested arrays', () => {
    function* testGenerator() {
      yield [1, 'cat', 3];
      yield [7, 'dog', 9];
    }

    const generator = testGenerator();
    expect(genToArray(generator)).toEqual([[1, 'cat', 3], [7, 'dog', 9]]);
  });

  test('should convert an array to an array', () => {
    const array = [1, 'cat', 3, 'fish'];

    expect(genToArray(array)).toEqual(array);
  });
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

describe('`getIFrameDocument()`', () => {
  test('returns contentWindow.document', () => {
    const outer = { contentWindow: { document: {} } };

    expect(getIFrameDocument(outer)).toBe(outer.contentWindow.document);
  });

  test('returns contentWindow', () => {
    const outer = { contentWindow: {} };

    expect(getIFrameDocument(outer)).toBe(outer.contentWindow);
  });

  test('returns contentDocument.document', () => {
    const outer = { contentDocument: { document: {} } };

    expect(getIFrameDocument(outer)).toBe(outer.contentDocument.document);
  });

  test('returns contentDocument', () => {
    const outer = { contentDocument: {} };

    expect(getIFrameDocument(outer)).toBe(outer.contentDocument);
  });
});

describe('isInputActive', () => {
  test('Handles no activeElement', () => {
    expect(isInputActive({activeElement: null})).toBe(false);
  });

  test('Handles deep input activeElement', () => {
    const doc = {activeElement: { shadowRoot: {activeElement: document.createElement('input') }}};
    expect(isInputActive(doc)).toBe(true);
  });

  test('Handles deep non-input activeElement', () => {
    const doc = {activeElement: { shadowRoot: {activeElement: document.createElement('a') }}};
    expect(isInputActive(doc)).toBe(false);
  });

  test('Handles textarea activeElement', () => {
    const doc = {activeElement: document.createElement('textarea')};
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

describe('poll', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  test('polls until condition is true', async () => {
    const fakeSleep = sinon.spy((ms) => jest.advanceTimersByTime(ms));

    const returns = [null, null, 'foo'];
    const check = sinon.spy(() => returns.shift());
    const result = await poll(check, {_sleep: fakeSleep});
    expect(fakeSleep.callCount).toBe(2);
    expect(result).toBe('foo');
    expect(check.callCount).toBe(3);
  });

  test('times out eventually', async () => {
    const fakeSleep = sinon.spy((ms) => jest.advanceTimersByTime(ms));

    const check = sinon.stub().returns(null);
    const result = await poll(check, {_sleep: fakeSleep});
    expect(result).toBeUndefined();
    expect(check.callCount).toBe(10);
  });
});

describe('sleep', () => {
  test('Sleep 0 doest not called immediately', async () => {
    const spy = sinon.spy();
    sleep(0).then(spy);
    expect(spy.callCount).toBe(0);
    await afterEventLoop();
    expect(spy.callCount).toBe(1);
  });

  test('Waits the appropriate ms', async () => {
    const clock = sinon.useFakeTimers();
    const spy = sinon.spy();
    sleep(10).then(spy);
    expect(spy.callCount).toBe(0);
    clock.tick(10);
    expect(spy.callCount).toBe(0);
    clock.restore();

    await afterEventLoop();
    expect(spy.callCount).toBe(1);
  });
});

describe('promisifyEvent', () => {
  test('Resolves once event fires', async () => {
    const fakeTarget = eventTargetMixin();
    const resolveSpy = sinon.spy();
    promisifyEvent(fakeTarget, 'pause').then(resolveSpy);

    await afterEventLoop();
    expect(resolveSpy.callCount).toBe(0);
    fakeTarget.dispatchEvent('pause', {});
    await afterEventLoop();
    expect(resolveSpy.callCount).toBe(1);
  });

  test('Only resolves once', async () => {
    const fakeTarget = eventTargetMixin();
    const resolveSpy = sinon.spy();
    promisifyEvent(fakeTarget, 'pause').then(resolveSpy);

    await afterEventLoop();
    expect(resolveSpy.callCount).toBe(0);
    fakeTarget.dispatchEvent('pause', {});
    fakeTarget.dispatchEvent('pause', {});
    fakeTarget.dispatchEvent('pause', {});
    fakeTarget.dispatchEvent('pause', {});

    await afterEventLoop();
    expect(resolveSpy.callCount).toBe(1);
  });
});

describe('escapeRegex', () => {
  test('Escapes regex', () => {
    expect(escapeRegExp('.*')).toBe('\\.\\*');
    expect(escapeRegExp('foo')).toBe('foo');
    expect(escapeRegExp('foo.bar')).toBe('foo\\.bar');
    expect(escapeRegExp('{{{')).toBe('\\{\\{\\{');
    expect(escapeRegExp('')).toBe('');
    expect(escapeRegExp('https://example.com')).toBe('https://example\\.com');
  });
});

describe('parseAnimationSpeed', () => {
  test('Parses numbers', () => {
    expect(parseAnimationSpeed(100)).toBe(100);
    expect(parseAnimationSpeed(0)).toBe(0);
    expect(parseAnimationSpeed(1000)).toBe(1000);
  });

  test('Parses strings', () => {
    expect(parseAnimationSpeed('slow')).toBe(600);
    expect(parseAnimationSpeed('fast')).toBe(200);
    expect(parseAnimationSpeed('100')).toBe(100);
  });

  test('Handles invalid input', () => {
    expect(parseAnimationSpeed('foo')).toBeFalsy();
    expect(parseAnimationSpeed('')).toBeFalsy();
    expect(parseAnimationSpeed(null)).toBeFalsy();
  });
});

test("`sum(array)` calculates the total sum for values within an array", () => {
  const ten = [1, 9];
  const fourteen = [1, 0, 0, 10, 2, 1];
  const twentyOne = [1, 2, 3, 4, 11];
  const negativeTen = [-1, -7, -2];
  const two = [2];

  expect(sum(ten)).toBe(10);
  expect(sum(fourteen)).toBe(14);
  expect(sum(twentyOne)).toBe(21);
  expect(sum(negativeTen)).toBe(-10);
  expect(sum(two)).toBe(2);
});

describe('`arrEquals(arr1, arr2)`', () => {
  test('returns `true` if the arrays contain the same elements', () => {
    const arrayOne = [1, 'fish', 'cat', 10];
    const arrayTwo = [1, 'fish', 'cat', 10];

    expect(arrEquals(arrayOne, arrayOne)).toBe(true);
    expect(arrEquals(arrayOne, arrayTwo)).toBe(true);
  });

  test('returns `false` if the arrays have different number of elements', () => {
    const arrayOne = [1, 'fish', 'cat', 10];
    const arrayTwo = ['dog', 2];

    expect(arrEquals(arrayOne, arrayTwo)).toBe(false);
  });

  test('returns `false` if the arrays contain the same elements in different with differing indices', () => {
    const arrayOne = [1, 'fish', 'cat', 10];
    const arrayTwo = ['fish', 'cat', 10, 1];

    expect(arrEquals(arrayOne, arrayTwo)).toBe(false);
  });

  test('returns `true` when both arrays are empty', () =>{
    expect(arrEquals([], [])).toBe(true);
  });
});

describe('`arrChanged(arr1, arr2)`', () => {
  test('returns `true` when the arrays have different elements', () => {
    const arrayOne = [1, 'fish', 'cat', 10];
    const arrayTwo = ['fish', 'cat', 10, 1];

    expect(arrChanged(arrayOne, arrayTwo)).toBe(true);
  });

  test('returns `true` when an first array is empty', () => {
    const arrayOne = [];
    const arrayTwo = ['fish', 'cat', 10, 1];

    expect(arrChanged(arrayOne, arrayTwo)).toBe(true);
  });

  test('returns `true` when an second array is empty', () => {
    const arrayOne = [10, 21];
    const arrayTwo = [];

    expect(arrChanged(arrayOne, arrayTwo)).toBe(true);
  });

  test('returns `false` when the arrays are the same', () => {
    const arrayOne = [10, 21];
    const arrayTwo = [10, 21];

    expect(arrChanged(arrayOne, arrayTwo)).toBe(false);
  });

  test('returns `false` when the both arrays are empty', () => {
    expect(arrChanged([], [])).toBe(false);
  });
});

describe('`sortBy(array, valueFn)`', () => {
  test('sorts an array in ascending order without a `valueFn` parameter', () => {
    const array = [10, 8, 10, 5, 2, 5, 0];
    const expected = [0, 2, 5, 5, 8, 10, 10];

    expect(sortBy(array)).toEqual(expected);
  });

  test('sorts an array in ascending order with a given `valueFn` parameter', () => {
    const array = [
      { pet: 'dog', age: 5 },
      { pet: 'cat', age: 13 },
      { pet: 'fish', age: 1 },
    ];

    const expected = [
      { pet: 'fish', age: 1 },
      { pet: 'dog', age: 5 },
      { pet: 'cat', age: 13 },
    ];

    expect(sortBy(array, (pet) => pet.age)).toEqual(expected);
  });

  test('sorts an array in descending order with a given `valueFn` parameter', () => {
    const array = [
      { pet: 'dog', age: 5 },
      { pet: 'cat', age: 13 },
      { pet: 'fish', age: 1 },
    ];

    const expected = [
      { pet: 'cat', age: 13 },
      { pet: 'dog', age: 5 },
      { pet: 'fish', age: 1 },
    ];

    expect(sortBy(array, (pet) => -pet.age)).toEqual(expected);
  });

  test('sorts an array with string values', () => {
    const animalArray = ['cow', 'fish', 'dog', 'cat'];
    const animalExpected = ['cat', 'cow', 'dog', 'fish'];
    const numberArray = ['3', '6', '1', '5'];
    const numberExpected = ['1', '3', '5', '6'];

    expect(sortBy(animalArray)).toEqual(animalExpected);
    expect(sortBy(numberArray)).toEqual(numberExpected);
  });
});

describe('`throttle(fn, threshold, delay)`', () => {
  let fakeFunction;
  let clock;

  beforeEach(() => {
    fakeFunction = sinon.fake();
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  test('fires the given function immediately when invoked', () => {
    const throttledFunction = throttle(fakeFunction, 100);
    throttledFunction();

    expect(fakeFunction.calledOnce).toBe(true);
  });

  test('fires the given function immediately when invoked, and delay is true', () => {
    const throttledFunction = throttle(fakeFunction, 100, true);
    throttledFunction();

    expect(fakeFunction.calledOnce).toBe(true);
  });

  test('should throttle function calls correctly', () => {
    const throttledFunction = throttle(fakeFunction, 100);
    clock.tick(1);

    throttledFunction('first');
    expect(fakeFunction.calledOnce).toBe(true);
    expect(fakeFunction.calledWith('first')).toBe(true);

    clock.tick(1);

    // Second call should be throttled, and not have executed
    throttledFunction('second');
    expect(fakeFunction.calledOnce).toBe(true);

    clock.tick(100);
    expect(fakeFunction.calledTwice).toBe(true);
    expect(fakeFunction.getCall(1).calledWith('second')).toBe(true);
  });

  test('uses default threshold of 250ms', () => {
    const throttledFunction = throttle(fakeFunction);
    clock.tick(1);

    throttledFunction('first');
    expect(fakeFunction.calledOnce).toBe(true);
    expect(fakeFunction.calledWith('first')).toBe(true);

    clock.tick(1);

    // Second call should be throttled, and not have executed
    throttledFunction('second');
    expect(fakeFunction.calledOnce).toBe(true);

    clock.tick(250);
    expect(fakeFunction.calledTwice).toBe(true);
    expect(fakeFunction.getCall(1).calledWith('second')).toBe(true);
  });
});

describe('`calcScreenDPI()`', () => {
  let originalOffsetWidth;

  beforeEach(() => {
    originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    );
  });

  afterEach(() => {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetWidth',
      originalOffsetWidth,
    );
    document.body.innerHTML = '';
  });

  it('returns the measured DPI multiplied by 1.25', () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 96;
      },
    });

    expect(calcScreenDPI()).toBe(120);
  });

  it('returns 100 when the measured DPI is 0', () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });

    expect(calcScreenDPI()).toBe(100);
  });

  it('creates and removes the measurement element', () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 96;
      },
    });

    expect(document.body.children).toHaveLength(0);

    calcScreenDPI();

    expect(document.body.children).toHaveLength(0);
  });
});
