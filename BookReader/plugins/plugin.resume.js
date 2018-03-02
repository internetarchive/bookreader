/**
 * Plugin to remember the current page in a cookie
 */

jQuery.extend(true, BookReader.defaultOptions, {
    enablePageResume: false,
});

// Extend the constructor to add TTS properties
BookReader.prototype.setup = (function(super_) {
    return function (options) {
        super_.call(this, options);

        this.enablePageResume = options.enablePageResume;
    };
})(BookReader.prototype.setup);


/**
 * Get's the page resume value, for remembering reader's page
 * Can be overriden for different implementation
 * @return {Number|null}
 */
BookReader.prototype.getResumeValue = function() {
    var val = BookReader.docCookies.getItem('br-resume');
    if (val !== null) return parseInt(val);
    else return null;
}

/**
 * Set's the page resume value, for remembering reader's page
 * Can be overriden for different implementation
 * @param {Number} the leaf index
 */
BookReader.prototype.updateResumeValue = function(index) {
    var ttl = new Date(+new Date + 12096e5); // 2 weeks
    var path = window.location.pathname;
    BookReader.docCookies.setItem('br-resume', index, ttl, path, null, false);
}

/*\
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|  https://github.com/madmurphy/cookies.js
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
\*/
BookReader.docCookies = {
  getItem: function (sKey) {
    if (!sKey) { return null; }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    var sExpires = "";
    if (vEnd) {
      sExpires = "; expires=" + vEnd.toUTCString();
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
    return true;
  },
};
