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

/**
 * Promise based sleep - resolves at default 500ms
 * @param {Number} wait time in milliseconds
 */
export function sleep(ms = 500) {
  return new Promise(res => setTimeout(res(true), ms));
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

  const screenDPI = dpi * devicePixelRatio;
  // This will return 0 in testing; never want it to be 0!
  return screenDPI == 0 ? 100 : screenDPI;
}
