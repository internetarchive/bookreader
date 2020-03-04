/* global BookReader */

/**
 * Plugin to remember the current page number in a cookie
 */
jQuery.extend(BookReader.defaultOptions, {
  enablePageResume: true,
  /**
   * @const null|string eg '/', '/details/id'
   */
  resumeCookiePath: null,
});

BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);
    if (this.options.enablePageResume) {
      this.bind(BookReader.eventNames.fragmentChange, function() {
        const params = this.paramsFromCurrent();
        this.updateResumeValue(params.index);
      }.bind(this));
    }
  };
})(BookReader.prototype.init);

/**
 * Get's the page resume value, for remembering reader's page
 * Can be overriden for different implementation
 * @return {Number|null}
 */
BookReader.prototype.getResumeValue = function() {
  const val = BookReader.docCookies.getItem('br-resume');
  if (val !== null) return parseInt(val);
  else return null;
}

/**
 * Set's the page resume value, for remembering reader's page
 * Can be overriden for different implementation
 *
 * @param {Number} index leaf index
 * @param {String} cookieName
 */
BookReader.prototype.updateResumeValue = function(index, cookieName) {
  const ttl = new Date(+new Date + 12096e5); // 2 weeks
  const path = this.options.rsumeCookiePath || window.location.pathname;
  cookieName = cookieName || 'br-resume';
  BookReader.docCookies.setItem(cookieName, index, ttl, path, null, false);
}

/**
 * Use to get, set and remove item from cookie
 *
 * See more:
 *  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
 *  https://developer.mozilla.org/User:fusionchess
 *  https://github.com/madmurphy/cookies.js
 *  This framework is released under the GNU Public License, version 3 or later.
 *  http://www.gnu.org/licenses/gpl-3.0-standalone.html
 */
BookReader.docCookies = {
  getItem: function (sKey) {
    if (!sKey) return null;

    return decodeURIComponent(
      // eslint-disable-next-line no-useless-escape
      document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    let sExpires = "";
    if (vEnd) sExpires = `; expires=` + vEnd.toUTCString();

    document.cookie = encodeURIComponent(sKey) + '=' + encodeURIComponent(sValue) + sExpires + (sDomain ? `; domain=` + sDomain : '') + (sPath ? `; path=` + sPath : '') + (bSecure ? `; secure` : '');

    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!this.hasItem(sKey)) return false;

    document.cookie = encodeURIComponent(sKey) + `=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + (sDomain ? `; domain=` + sDomain : '') + (sPath ? `; path=` + sPath : '');

    return true;
  },
};
