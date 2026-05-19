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
}

/**
 * An extension of the fields defined by the browser-native TextFragment;
 * See https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment/Text_fragments
 *
 * Text fragment string format: `pageNumber:prefix-,quote,-suffix`
 * Note the ':' and ',' separators must not be encoded, but
 * the pageNumber, prefix, quote, and suffix text can be encoded.
 */
export class BookReaderTextFragment {
  /**
   * @param {object} params
   * @param {string} [params.prefix]
   * @param {string} [params.quote]
   * @param {string} [params.suffix]
   * @param {string} [params.pageNumber] Page number; e.g. asserted page number or the n-prefixed page index
   * @param {number} [params.pageIndex] Page index; e.g. zero-based index of the page
   */
  constructor({ prefix, quote, suffix, pageNumber, pageIndex } = {}) {
    /** @type {string|undefined} */
    this.prefix = prefix;
    /** @type {string} */
    this.quote = quote;
    /** @type {string|undefined} */
    this.suffix = suffix;
    /** @type {string|undefined} Page number; e.g. asserted page number or the n-prefixed page index */
    this.pageNumber = pageNumber;
    /** @type {number} Page index; e.g. zero-based index of the page */
    this.pageIndex = pageIndex;
  }

  /**
   * Parse a text fragment from its string value (the part after `text=`).
   * Expected format: `pageNumber:prefix-,quote,-suffix`
   * @param {string} str
   * @param {import('@/src/BookReader/BookModel.js').BookModel} book
   * @param {number} fallbackPageIndex A fallback page index to use if the text
   * fragment does not specify a page number or page index.
   * @returns {BookReaderTextFragment}
   */
  static fromString(str, book, fallbackPageIndex) {
    let pageNumber;
    let textFragment;
    const separatorIdx = str.indexOf(':');
    if (separatorIdx !== -1) {
      pageNumber = decodeURIComponent(str.slice(0, separatorIdx)) || undefined;
      textFragment = str.slice(separatorIdx + 1);
    } else {
      textFragment = str;
    }

    const pageIndex = pageNumber ? book.getPageIndex(pageNumber) : fallbackPageIndex;

    let quote, prefix, suffix;
    const prefixMatch = textFragment.match(/^([\s\S]*?)-,/);
    const suffixMatch = textFragment.match(/,-([\s\S]*)$/);

    if (prefixMatch) prefix = decodeURIComponent(prefixMatch[1]);
    if (suffixMatch) suffix = decodeURIComponent(suffixMatch[1]);

    if (prefixMatch && suffixMatch) {
      quote = decodeURIComponent(textFragment.slice(prefixMatch[0].length, textFragment.length - suffixMatch[0].length));
    } else if (prefixMatch && !suffixMatch) { // Prefix only
      quote = decodeURIComponent(textFragment.slice(prefixMatch[0].length));
    } else if (!prefixMatch && suffixMatch) { // Suffix only
      quote = decodeURIComponent(textFragment.slice(0, textFragment.length - suffixMatch[0].length));
    } else { // No prefix or suffix
      quote = decodeURIComponent(textFragment);
    }

    return new BookReaderTextFragment({ prefix, quote, suffix, pageNumber, pageIndex });
  }

  /**
   * Extract and parse a text fragment from a URL string containing a `text=` parameter.
   * @param {string} urlString
   * @param {import('@/src/BookReader/BookModel.js').BookModel} book
   * @param {number} fallbackPageIndex A fallback page index to use if the text
   * fragment does not specify a page number or page index.
   * @returns {BookReaderTextFragment|null}
   */
  static fromUrl(urlString, book, fallbackPageIndex) {
    const textMatch = urlString.match(/(?<=[&?#]?text=)[^&]*/);
    if (!textMatch) return null;
    return BookReaderTextFragment.fromString(textMatch[0], book, fallbackPageIndex);
  }

  toString(includePageNumber = true) {
    let str = '';
    if (includePageNumber) {
      str += this.pageNumber ? `${encodeURIComponent(this.pageNumber)}:` : `n${this.pageIndex}:`;
    }

    if (this.prefix) {
      str += `${encodeURIComponent(this.prefix)}-,`;
    }
    str += encodeURIComponent(this.quote);
    if (this.suffix) {
      str += `,-${encodeURIComponent(this.suffix)}`;
    }
    return str;
  }
}

/**
 * @typedef {BookReaderTextFragment & { uuid: string }} BookReaderSavedHighlight
 */
