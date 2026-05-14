export class UrlPlugin {
  constructor(options = {}) {
    this.bookReaderOptions = options;

    // the canonical order of elements is important in the path and query string
    this.urlSchema = [
      { name: 'page', position: 'path', default: 'n0' },
      { name: 'mode', position: 'path', default: '2up' },
      { name: 'search', position: 'path', deprecated_for: 'q' },
      { name: 'q', position: 'query_param' },
      { name: 'sort', position: 'query_param' },
      { name: 'view', position: 'query_param' },
      { name: 'admin', position: 'query_param' },
    ];

    this.urlState = {};
    this.urlMode = this.bookReaderOptions.urlMode || 'hash';
    this.urlHistoryBasePath = this.bookReaderOptions.urlHistoryBasePath ||  '/';
    this.urlLocationPollId = null;
    this.oldLocationHash = null;
    this.oldUserHash = null;
  }

  /**
   * Parse JSON object URL state to string format
   * Arrange path names in an order that it is positioned on the urlSchema
   * @param {Object} urlState
   * @returns {string}
   */
  urlStateToUrlString(urlState) {
    const searchParams = new URLSearchParams();
    const pathParams = {};

    Object.keys(urlState).forEach(key => {
      let schema = this.urlSchema.find(schema => schema.name === key);
      if (schema?.deprecated_for) {
        schema = this.urlSchema.find(schemaKey => schemaKey.name === schema.deprecated_for);
      }
      if (schema?.position == 'path') {
        pathParams[schema?.name] = urlState[key];
      } else {
        searchParams.append(schema?.name || key, urlState[key]);
      }
    });

    const strPathParams = this.urlSchema
      .filter(s => s.position == 'path')
      .map(schema => pathParams[schema.name] ? `${schema.name}/${encodeURIComponent(pathParams[schema.name])}` : '')
      .join('/');

    // replace consecutive slashes with a single slash + remove trailing slashes
    const strStrippedTrailingSlash = `${strPathParams.replace(/\/+/g, '/').replace(/\/+$/, '')}`;
    const concatenatedPath = `${strStrippedTrailingSlash}?${searchParams.toString()}`;
    return searchParams.toString() ? concatenatedPath : `${strStrippedTrailingSlash}`;
  }

  /**
   * Parse string URL and add it in the current urlState
   * Example:
   *  /page/n7/mode/2up => {page: 'n7', mode: '2up'}
   *  /page/n7/mode/2up/search/hello => {page: 'n7', mode: '2up', q: 'hello'}
   * @param {string} urlString
   * @returns {object}
   */
  urlStringToUrlState(urlString) {
    const urlState = {};

    // Fetch searchParams from given {str}
    // Note: whole URL path is needed for URL parsing
    const urlPath = new URL(urlString, 'http://example.com');
    const urlSearchParamsObj = Object.fromEntries(urlPath.searchParams.entries());
    const splitUrlMatches = urlPath.pathname.match(/[^\\/]+\/[^\\/]+/g);
    const urlStrSplitSlashObj = splitUrlMatches ? Object.fromEntries(splitUrlMatches.map(x => x.split('/'))) : {};

    const doesKeyExists = (_object, _key) => {
      return Object.keys(_object).some(value => value == _key);
    };

    // Add path objects to urlState
    this.urlSchema
      .filter(schema => schema.position == 'path')
      .forEach(schema => {
        const hasPropertyKey = doesKeyExists(urlStrSplitSlashObj, schema.name);
        const hasDeprecatedKey = doesKeyExists(schema, 'deprecated_for') && hasPropertyKey;

        // Not in the URL
        if (!hasPropertyKey && !hasDeprecatedKey) {
          return;
        }

        const urlStateParam = hasDeprecatedKey ? schema.deprecated_for : schema.name;
        urlState[urlStateParam] = decodeURIComponent(urlStrSplitSlashObj[schema.name]);
      });

    // Add searchParams to urlState
    Object.entries(urlSearchParamsObj).forEach(([key, value]) => {
      urlState[key] = value;
    });

    return urlState;
  }

  /**
   * Add or update key-value to the urlState
   * @param {string} key
   * @param {string} val
   */
  setUrlParam(key, value) {
    this.urlState[key] = value;

    this.pushToAddressBar();
  }

  /**
   * Delete key-value to the urlState
   * @param {string} key
   */
  removeUrlParam(key) {
    delete this.urlState[key];

    this.pushToAddressBar();
  }

  /**
   * Get key-value from the urlState
   * @param {string} key
   * @return {string}
   */
  getUrlParam(key) {
    return this.urlState[key];
  }

  /**
   * Push URL params to addressbar
   */
  pushToAddressBar() {
    const urlStrPath = this.urlStateToUrlString(this.urlState);
    const concatenatedPath = urlStrPath !== '/' ? urlStrPath : '';
    if (this.urlMode == 'history') {
      if (!window.history || !window.history.replaceState) {
        this.options.urlMode = 'hash';
      } else {
        const newUrlPath = `${this.urlHistoryBasePath}${concatenatedPath}`.trim().replace(/(\/+)/g, '/');
        try {
          window.history.replaceState({}, null, newUrlPath);
        } catch (e) {
          // DOMException on Chrome when in sandboxed iframe
          this.urlMode = 'hash';
        }
      }
    }

    if (this.urlMode == 'hash') {
      window.location.replace('#' + concatenatedPath);
    }
    this.oldLocationHash = urlStrPath;
  }

  /**
   * Get the url and check if it has changed
   * If it was changeed, update the urlState
   */
  listenForHashChanges() {
    this.oldLocationHash = this.getHash();
    if (this.urlLocationPollId) {
      clearInterval(this.urlLocationPollId);
      this.urlLocationPollId = null;
    }

    // check if the URL changes
    const updateHash = () => {
      const newFragment = this.getHash();
      const hasFragmentChange = newFragment != this.oldLocationHash;

      if (!hasFragmentChange) { return; }

      this.urlState = this.urlStringToUrlState(newFragment);
    };
    this.urlLocationPollId = setInterval(updateHash, 500);
  }

  /**
   * Will read either the hash or URL and return the bookreader fragment
   */
  pullFromAddressBar(location = window.location) {
    const path = this.urlMode === 'history'
      ? (location.pathname.substr(this.urlHistoryBasePath.length) + location.search)
      : location.hash.substr(1);
    this.urlState = this.urlStringToUrlState(path);
  }

  /**
   * Get the hash out of the current URL
   */
  getHash() {
    return window.location.hash.slice(1);
  }

  /**
   * @param {string} urlString
   * @returns {string}
   */
  retrieveTextFragment(urlString) {
    return urlString.match(/(?<=[&?]?text=)[^&]*/);
  }

  retrieveDIndex(urlString) {
    return urlString.match(/(?<=[&?]?dIndex=)[^&]*/);
  }

  /**
   * @param {string} urlString
   * @param {string} type
   * @returns {string}
   */

  retrieveHighlightContext(urlString, type) {
    const regexString = new RegExp(String.raw`(?<=[&?]?${type}=)[^&]*`, "gis");
    return urlString.match(regexString);
  }

  parseToText(urlString) {
    const quoteMatch = urlString.match(/(?<=[&?]?text=)[^&]*/);
    let dIndex = urlString.match(/(?<=[&?]?dIndex=)[^&]*/);
    let quote, prefix, suffix;
    if (quoteMatch) {
      const prefixMatch = quoteMatch[0].match(/.*?(?=(-,))/);
      const suffixMatch = quoteMatch[0].match(/(?<=,-).*/);
      if (prefixMatch) prefix = decodeURIComponent(prefixMatch[0]);
      if (suffixMatch) suffix = decodeURIComponent(suffixMatch[0]);
      if (prefixMatch && suffixMatch) {
        quote = decodeURIComponent(quoteMatch[0].match(/(?<=(-,)).*(?=(,-))/)[0]);
      } else if (prefixMatch && !suffixMatch) { // Prefix only
        quote = decodeURIComponent(quoteMatch[0].match(/(?<=-,).*/)[0]);
      } else if (!prefixMatch && suffixMatch) { // Suffix only
        quote = decodeURIComponent(quoteMatch[0].match(/.*(?<=,-)/)[0]);
      } else { // Somehow no prefix or suffix
        quote = decodeURIComponent(quoteMatch[0]);
      }
    }
    if (dIndex) dIndex = decodeURIComponent(dIndex[0]);
    return {prefix, quote, suffix, dIndex};
  }
}

/**
 * @typedef {Object} BookReaderTextFragment
 * An extension of the fields defined by the browser-native TextFragment;
 * See https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
 *
 * @property {string} prefix
 * @property {string} quote
 * @property {string} suffix
 * @property {string} dIndex Page index
 * @property {string} dPageNum Page num ; eg. asserted page number or the n-prefixed page index
 */

/**
 * @typedef {BookReaderTextFragment} BookReaderSavedHighlight
 * @property {string} uuid
 */
