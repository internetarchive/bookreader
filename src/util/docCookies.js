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
 * Get current page number value
 *
 * @param {string} sKey
 * @returns {number}
 */
export function getItem(sKey) {
  if (!sKey) return null;

  return decodeURIComponent(
    // eslint-disable-next-line no-useless-escape
    document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
}

/**
 * Get current page value from cookie
 *
 * @export
 * @param {string} sKey cookie name
 * @param {number} sValue page number value
 * @param {string} vEnd expire|max-age
 * @param {string} sPath path of current item
 * @param {string} sDomain domain name
 * @param {boolean} bSecure true|false
 *
 * @returns {boolean} true
 */
export function setItem(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
  let sExpires = "";
  if (vEnd) sExpires = `; expires=` + vEnd.toUTCString();

  document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue) + sExpires + (sDomain ? `; domain=` + sDomain : '') + (sPath ? `; path=` + sPath : '') + (bSecure ? `; secure` : '');

  return true;
}

/**
 * Set cookie as expired
 *
 * @param {string} sKey cookie name
 * @param {string} sPath path of current item
 * @param {string} sDomain
 *
 * @returns {boolean} true
 */
export function removeItem(sKey, sPath, sDomain) {
  if (!this.hasItem(sKey)) return false;

  document.cookie = encodeURIComponent(sKey) + `=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + (sDomain ? `; domain=` + sDomain : '') + (sPath ? `; path=` + sPath : '');

  return true;
}
