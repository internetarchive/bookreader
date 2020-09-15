
/**
 * Checks whether the current browser is a Chrome/Chromium browser
 * Code from https://stackoverflow.com/a/4565120/2317712
 * @param {string} [userAgent]
 * @param {string} [vendor]
 * @return {boolean}
 */
export function isChrome(userAgent = navigator.userAgent, vendor = navigator.vendor) {
  return /chrome/i.test(userAgent) && /google inc/i.test(vendor);
}

/**
 * Checks whether the current browser is firefox
 * @param {string} [userAgent]
 * @return {boolean}
 */
export function isFirefox(userAgent = navigator.userAgent) {
  return /firefox/i.test(userAgent);
}

/**
 * Checks whether the current browser is safari
 * @param {string} [userAgent]
 * @return {boolean}
 */
export function isSafari(userAgent = navigator.userAgent) {
  return /safari/i.test(userAgent);
}
