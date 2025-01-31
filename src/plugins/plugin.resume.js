import { EVENTS } from '../BookReader/events.js';
import { BookReaderPlugin } from '../BookReaderPlugin.js';
import * as docCookies from '../util/docCookies.js';

/* global BookReader */

/** @deprecated Exposed for backward compatibility */
BookReader.docCookies = docCookies;

/**
 * Plugin to remember the current page number in a cookie
 */
export class ResumePlugin extends BookReaderPlugin {
  options = {
    enablePageResume: true,
    /** @type {string|null} eg '/', '/details/id' */
    resumeCookiePath: null,
  }

  /** @override */
  init() {
    if (this.options.enablePageResume) {
      this.br.bind(EVENTS.fragmentChange, () => {
        const params = this.br.paramsFromCurrent();
        this.updateResumeValue(params.index);
      });
    }
  }

  /**
   * Gets page resume value, for remembering reader's page
   * Can be overridden for different implementation
   *
   * @return {number|null}
   */
  getResumeValue() {
    const val = BookReader.docCookies.getItem('br-resume');
    if (val !== null) return parseInt(val);
    else return null;
  }

  /**
   * Return cookie path using pathname up to /page/... or /mode/...
   * using window.location.pathname for urlPathPart:
   * - matches encoding
   * - ignores querystring part
   * - ignores fragment part (after #)
   * @param {string} urlPathPart - window.location.pathname
   */
  getCookiePath(urlPathPart) {
    return urlPathPart.match('.+?(?=/page/|/mode/|$)')[0];
  }

  /**
   * Sets page resume value, for remembering reader's page
   * Can be overridden for different implementation
   *
   * @param {Number} index leaf index
   * @param {string} [cookieName]
   */
  updateResumeValue(index, cookieName) {
    const ttl = new Date(+new Date + 12096e5); // 2 weeks
    // For multiple files in item, leave resumeCookiePath blank
    // It's likely we can remove resumeCookiePath using getCookiePath()
    const path = this.options.resumeCookiePath
      || this.getCookiePath(window.location.pathname);
    BookReader.docCookies.setItem(cookieName || 'br-resume', index, ttl, path, null, false);
  }
}

BookReader?.registerPlugin('resume', ResumePlugin);
