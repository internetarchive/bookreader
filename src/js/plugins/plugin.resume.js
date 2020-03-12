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
 * @param {String} cookieName
 */
BookReader.prototype.updateResumeValue = function(index, cookieName='br-resume') {
  const ttl = new Date(+new Date + 12096e5); // 2 weeks
  const path = this.options.rsumeCookiePath || window.location.pathname;
  BookReader.docCookies.setItem(cookieName, index, ttl, path, null, false);
}
