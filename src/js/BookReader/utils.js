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

export function toQueryString(obj) {
  return Object
    .keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponentPlus(obj[key])}`)
    .join('&')
  ;
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 * @see https://davidwalsh.name/javascript-debounce-function
 *
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @return {Function}
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
 * Throttle function
 * @see https://remysharp.com/2010/07/21/throttling-function-calls
 * @param {Function} fn
 * @param {number} threshold
 * @param {boolean} delay
 * @return {Function}
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
