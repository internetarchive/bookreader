/**
 * Helper module use to get, set and remove item from cookie
 *
 * See more:
 *  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
 *  https://developer.mozilla.org/User:fusionchess
 *  https://github.com/madmurphy/cookies.js
 *  This framework is released under the GNU Public License, version 3 or later.
 *  http://www.gnu.org/licenses/gpl-3.0-standalone.html
 */

/**
 * Check to see if the browser has cookies enabled.
 * Accessing document.cookies errors if eg iframe with sandbox enabled.
 * @returns {boolean}
 */
export function areCookiesBlocked(doc = document) {
  try {
    doc.cookie;
    return false;
  } catch (e) {
    return true;
  }
}

const COOKIES_BLOCKED = areCookiesBlocked();

/**
 * Get specific key's value stored in cookie
 *
 * @param {string} sKey
 *
 * @returns {string|null}
 */
export function getItem(sKey) {
  if (COOKIES_BLOCKED || !sKey) return null;

  return decodeURIComponent(
    // eslint-disable-next-line no-useless-escape
    document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
}

/**
 * Set specific key's value in cookie
 *
 * @param {string} sKey cookie name
 * @param {string} sValue cookie value
 * @param {string} [vEnd] expire|max-age
 * @param {string} [sPath] path of current item
 * @param {string} [sDomain] domain name
 * @param {boolean} [bSecure]
 *
 * @returns {boolean}
 */
export function setItem(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
  if (COOKIES_BLOCKED) return false;

  document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue)
  + (vEnd ? `; expires=${vEnd.toUTCString()}` : '')
  + (sDomain ? `; domain=${sDomain}` : '')
  + (sPath ? `; path=${sPath}` : '')
  + (bSecure ? `; secure` : '');

  return true;
}

/**
 * BROKEN Remove specific key's value from cookie
 * @fixme hasItem isn't even implemented! This will always error.
 * @param {string} sKey cookie name
 * @param {string} [sPath] path of current item
 * @param {string} [sDomain]
 *
 * @returns {boolean}
 */
export function removeItem(sKey, sPath, sDomain) {
  if (COOKIES_BLOCKED) return false;
  // eslint-disable-next-line
  if (!hasItem(sKey)) return false;

  document.cookie = encodeURIComponent(sKey) + `=; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  + (sDomain ? `; domain=${sDomain}` : '')
  + (sPath ? `; path=${sPath}` : '');

  return true;
}
