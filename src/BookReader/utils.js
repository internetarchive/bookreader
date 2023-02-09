/**
 * Bind mouse handlers
 * Disable mouse click to avoid selected/highlighted page images
 * @param {JQuery} jObject
 */
export function disableSelect(jObject) {
  // $$$ check here for right-click and don't disable.  Also use jQuery style
  //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
  jObject.bind('mousedown', () => false);
  // Special hack for IE7
  jObject[0].onselectstart = () => false;
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Given value and maximum, calculate a percentage suitable for CSS
 * @param {number} value
 * @param {number} max
 * @return {string}
 */
export function cssPercentage(value, max) {
  return ((value / max) * 100) + '%';
}

/**
 * @param {*} value
 * @param {Array} array
 * @return {boolean}
 */
export function notInArray(value, array) {
  return !array.includes(value);
}

/**
 * Determines the active element, going into shadow doms.
 * @return {Element}
 */
export function getActiveElement(doc = document, recurseShadowDom = true) {
  const activeElement = doc.activeElement;
  if (recurseShadowDom && activeElement?.shadowRoot) {
    return getActiveElement(activeElement.shadowRoot, true);
  }
  return activeElement;
}

/** Check if an input field/textarea is active. Also checks shadow DOMs. */
export function isInputActive(doc = document) {
  const activeEl = getActiveElement(doc);
  return activeEl?.tagName == "INPUT" || activeEl?.tagName == "TEXTAREA";
}

/**
 * @param {HTMLIFrameElement} iframe
 * @return {Document}
 */
export function getIFrameDocument(iframe) {
// Adapted from http://xkr.us/articles/dom/iframe-document/
  const outer = iframe.contentWindow || iframe.contentDocument;
  return outer.document || outer;
}

/**
 * @param {string} str
 * @return {string}
 */
export function escapeHTML(str) {
  return str.replace(/&/g,'&amp;')
    .replace(/>/g,'&gt;')
    .replace(/</g,'&lt;')
    .replace(/"/g,'&quot;');
}

/**
 * Decodes a URI component and converts '+' to ' '
 * @param {string} value
 * @return {string}
 */
export function decodeURIComponentPlus(value) {
  return decodeURIComponent(value).replace(/\+/g, ' ');
}

/**
 * Encodes a URI component and converts ' ' to '+'
 * @param {string|number|boolean} value
 * @return {string};
 */
export function encodeURIComponentPlus(value) {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

/**
 * @template {Function} T
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 * @see https://davidwalsh.name/javascript-debounce-function
 *
 * @param {T} func
 * @param {number} wait
 * @param {boolean} immediate
 * @return {T}
 */
export function debounce(func, wait, immediate) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/**
 * @template T
 * Throttle function
 * @see https://remysharp.com/2010/07/21/throttling-function-calls
 * @param {T} fn
 * @param {number} threshold
 * @param {boolean} delay
 * @return {T}
 */
export function throttle(fn, threshold, delay) {
  threshold || (threshold = 250);
  let last;
  let deferTimer;
  if (delay) last = +new Date;
  return function () {
    const context = this;
    const now = +new Date;
    const args = arguments;
    if (last && now < last + threshold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(() => {
        last = now;
        fn.apply(context, args);
      }, threshold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

/**
 * FIXME we need a better way to do this :/ This is not automatically poly-filled by
 * core-js https://github.com/zloirock/core-js/issues/354
 * @param {Window} window
 */
export function polyfillCustomEvent(window) {
  if (typeof window.CustomEvent === "function") return false;
  window.CustomEvent = PolyfilledCustomEvent;
}

/**
 * https://caniuse.com/customevent has issues on older browsers where it can't be
 * called as a constructor, so we have to use older methods.
 * @param {String} eventName
 * @return {CustomEvent}
 */
export function PolyfilledCustomEvent(eventName, {bubbles = false, cancelable = false, detail = null} = {}) {
  const event = document.createEvent('CustomEvent');
  event.initCustomEvent(eventName, bubbles, cancelable, detail);
  return event;
}

/*
 * Returns the number pixels something should be rendered at to be ~1n on the users
 * screen when measured with a ruler.
 */
export function calcScreenDPI() {
  const el = document.createElement('div');
  el.style.width = '1in';
  document.body.appendChild(el);
  const dpi = el.offsetWidth;
  document.body.removeChild(el);

  // Do you believe in magic... numbers? We tested on some devices, and the displayed
  // size of `width: 1in` was less than desired. On @pezvi's mac, it was ~75% ; on
  // @cdrini's laptop it was ~85%. Since we want to avoid things appearing too small,
  // let's just use a multiplier of 1.25
  const screenDPI = dpi * 1.25;
  // This will return 0 in testing; never want it to be 0!
  return screenDPI == 0 ? 100 : screenDPI;
}

/**
 * @param {number[]} nums
 * @returns {number}
 */
export function sum(nums) {
  return nums.reduce((cur, acc) => cur + acc, 0);
}

/**
 * @template T
 * @param {Generator<T>} gen
 * @returns {T[]}
 */
export function genToArray(gen) {
  const result = [];
  for (const item of gen) {
    result.push(item);
  }
  return result;
}

/**
 * Check if arrays contain the same elements. Does reference comparison.
 * @param {Array} arr1
 * @param {Array} arr2
 */
export function arrEquals(arr1, arr2) {
  return arr1.length == arr2.length && arr1.every((x, i) => x == arr2[i]);
}

/**
 * Check if array has changed; namely to be used with lit's property.hasChanged
 * @param {Array} [arr1]
 * @param {Array} [arr2]
 */
export function arrChanged(arr1, arr2) {
  return arr1 && arr2 && !arrEquals(arr1, arr2);
}

/**
 * Waits the provided number of ms and then resolves with a promise
 * @param {number} ms
 **/
export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {function(): T} fn
 * @param {Object} options
 * @param {function(T): boolean} [options.until]
 * @return {T | undefined}
 */
export async function poll(fn, { step = 50, timeout = 500, until = val => Boolean(val), _sleep = sleep } = {}) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const result = fn();
    if (until(result)) return result;
    await _sleep(step);
  }
}

/**
 * Convert a EventTarget style event into a promise
 * @param {EventTarget} target
 * @param {string} eventType
 * @return {Promise<Event>}
 */
export function promisifyEvent(target, eventType) {
  return new Promise(res => {
    const resolver = ev => {
      target.removeEventListener(eventType, resolver);
      res(ev);
    };
    target.addEventListener(eventType, resolver);
  });
}
