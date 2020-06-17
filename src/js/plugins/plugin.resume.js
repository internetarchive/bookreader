import * as docCookies from '../../util/docCookies.js';

/* global BookReader */

/** @deprecated Exposed for backward compatibility */
BookReader.docCookies = docCookies;

/**
 * Plugin to remember the current page number in a cookie
 */
jQuery.extend(BookReader.defaultOptions, {
  enablePageResume: true,
  /** @type {string|null} eg '/', '/details/id' */
  resumeCookiePath: null,
});

/** @override */
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);
    if (this.options.enablePageResume) {
      this.bind(BookReader.eventNames.fragmentChange, () => {
        const params = this.paramsFromCurrent();
        this.updateResumeValue(params.index);
      });
    }
  };
})(BookReader.prototype.init);

/**
 * Get's the page resume value, for remembering reader's page
 * Can be overriden for different implementation
 *
 * @return {number|null}
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
 * @param {string} [cookieName]
 */
BookReader.prototype.updateResumeValue = function(index, cookieName) {
  const ttl = new Date(+new Date + 12096e5); // 2 weeks
  // For multiple files in item, leave resumeCookiePath blank
  // It's likely we can now remove resumeCookiePath by new .match()
  // below using pathname up to /page/... or /mode/...
  const path = this.options.resumeCookiePath
    || window.location.pathname.match('.+?(?=/page/|/mode/|$)')[0];
  BookReader.docCookies.setItem(cookieName || 'br-resume', index, ttl, path, null, false);
}
