/**
 * Returns true if fullscreen mode is allowed on this device and document.
 *
 * @returns {boolean}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenEnabled
 */
export function fullscreenAllowed() {
  return document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullScreenEnabled;
}

/**
 * Requests fullscreen mode for the given element
 *
 * @param {HTMLElement} element
 * @param {FullscreenOptions} options
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
 */
export function requestFullscreen(element, options = {}) {
  if (element.requestFullscreen) {
    element.requestFullscreen(options);
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen(options);
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen(options);
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen(options);
  }
}

/**
 * Exits fullscreen mode.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen
 */
export function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

/** Returns true if the document is in fullscreen mode. */
export function isFullscreenActive() {
  const fullscreenElement = getFullscreenElement();
  return fullscreenElement !== null && fullscreenElement !== undefined;
}

/**
 * Returns the DOM element being used for fullscreen.
 *
 * @returns {HTMLElement}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/fullscreenElement
 */
export function getFullscreenElement() {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
}
