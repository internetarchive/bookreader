/* global BookReader */
/**
 * Plugin for URL management in BookReader
 * Note read more about the url "fragment" here:
 * https://openlibrary.org/dev/docs/bookurls
 */

 jQuery.extend(BookReader.defaultOptions, {
  enableUrlPlugin: true,
  bookId: '',
  /** @type {string} Defaults can be a urlFragment string */
  defaults: null,
  updateWindowTitle: false,

  /** @type {'history' | 'hash'} */
  urlMode: 'hash',

  /**
   * When using 'history' mode, this part of the URL is kept constant
   * @example /details/plato/
   */
  urlHistoryBasePath: '/',

  /** Only these params will be reflected onto the URL */
  urlTrackedParams: ['page', 'search', 'mode', 'region', 'highlight', 'view'],

  /** If true, don't update the URL when `page == n0 (eg "/page/n0")` */
  urlTrackIndex0: false,
});

/** @override */
BookReader.prototype.setup = (function(super_) {
  return function(options) {
    super_.call(this, options);

    this.bookId = options.bookId;
    this.defaults = options.defaults;

    this.locationPollId = null;
    this.oldLocationHash = null;
    this.oldUserHash = null;
  };
})(BookReader.prototype.setup);

/** @override */
BookReader.prototype.init = (function(super_) {
  return function() {

    if (this.options.enableUrlPlugin) {
      this.urlPlugin = new UrlPlugin(this.options);
      this.bind(BookReader.eventNames.PostInit, () => {
        const { updateWindowTitle, urlMode } = this.options;
        if (updateWindowTitle) {
          document.title = shortTitle(this.bookTitle, 50);
        }
        if (urlMode === 'hash') {
          this.urlPlugin.listenForHashChanges();
        }
      });

      this.bind(BookReader.eventNames.fragmentChange,
        () => this.urlPlugin.pushToAddressBar()
      );
    }
    super_.call(this);
  };
})(BookReader.prototype.init);

/**
 * Returns a shortened version of the title with the maximum number of characters
 * @param {number} maximumCharacters
 * @return {string}
 */
function shortTitle(maximumCharacters) {
  if (this.bookTitle.length < maximumCharacters) {
    return this.bookTitle;
  }

  const title = `${this.bookTitle.substr(0, maximumCharacters - 3)}...`;
  return title;
};



export class UrlPlugin {

  constructor(options = {}) {
    this.bookReaderOptions = options;

    this.urlSchema = [
      { name: 'page', position: 'path', default: 'n0' },
      { name: 'mode', position: 'path', default: '2up' },
      { name: 'search', position: 'path', deprecated_for: 'q' },
      { name: 'q', position: 'query_param' },
      { name: 'sort', position: 'query_param' },
      { name: 'view', position: 'query_param' },
      { name: 'admin', position: 'query_param' },
    ];

    this._urlState = {};
    this.urlMode = 'hash';
    this.urlHistoryBasePath = '/';
    this.locationPollId = null;
    this.oldLocationHash = null;
    this.oldUserHash = null;
  }

  get urlState() { return this._urlState; }
  set urlState(newVal) {
    this._urlState = newVal;

    // Trigger an event to notify that the urlState has changed
    this.br.trigger(BookReader.eventNames.urlStateChanged);
  }

  /**
   * Parse JSON object URL state to string format
   * Arrange path names in an order that it is positioned on the urlSchema
   * @param {object} urlState
   * @returns {string}
   */
  urlStateToUrlString(urlSchema, urlState) {
    const searchParams = new URLSearchParams();
    const pathParams = {};

    Object.keys(urlState).forEach(key => {
      let schema = urlSchema.find(schema => schema.name === key);
      if (schema?.deprecated_for) {
        schema = urlSchema.find(schemaKey => schemaKey.name === schema.deprecated_for);
      }
      if (schema?.position == 'path') {
        pathParams[schema?.name] = urlState[key];
      } else {
        searchParams.append(schema?.name || key, urlState[key]);
      }
    });

    const strPathParams = urlSchema
      .filter(s => s.position == 'path')
      .map(schema => pathParams[schema.name] ? `${schema.name}/${pathParams[schema.name]}` : '')
      .join('/');

    const strStrippedTrailingSlash = `${strPathParams.replace(/\/$/, '')}`;
    const concatenatedPath = `/${strStrippedTrailingSlash}?${searchParams.toString()}`;
    return searchParams.toString() ? concatenatedPath : `/${strStrippedTrailingSlash}`;
  }

  /**
   * Parse string URL and add it in the current urlState
   * Example:
   *  /page/n7/mode/2up => {page: 'n7', mode: '2up'}
   *  /page/n7/mode/2up/search/hello => {page: 'n7', mode: '2up', q: 'hello'}
   * @param {array} urlSchema
   * @param {string} str
   * @returns {object}
   */
  urlStringToUrlState(urlSchema, str) {
    const urlState = {};

    // Fetch searchParams from given {str}
    // Note: whole URL path is needed for URLSearchParams
    const urlPath = new URL(str, 'http://example.com');
    const urlSearchParamsObj = Object.fromEntries(urlPath.searchParams.entries());
    const urlStrSplitSlashObj = Object.fromEntries(urlPath.pathname
      .match(/[^\\/]+\/[^\\/]+/g)
      .map(x => x.split('/'))
    );
    const doesKeyExists = (_object, _key) => {
      return Object.keys(_object).some(value => value == _key);
    };

    urlSchema
      .filter(schema => schema.position == 'path')
      .forEach(schema => {
        if (!urlStrSplitSlashObj[schema.name] && schema.default) {
          return urlState[schema.name] = schema.default;
        }
        const hasPropertyKey = doesKeyExists(urlStrSplitSlashObj, schema.name);
        const hasDeprecatedKey = doesKeyExists(schema, 'deprecated_for') && hasPropertyKey;

        if (hasDeprecatedKey)
          return urlState[schema.deprecated_for] = urlStrSplitSlashObj[schema.name];

        if (hasPropertyKey)
          return urlState[schema.name] = urlStrSplitSlashObj[schema.name];
      });

    // Add searchParams to urlState
    // Check if Object value is a Boolean and convert value to Boolean
    // Otherwise, return Object value
    const isBoolean = value => value === 'true' || (value === 'false' ? false : value);
    Object.entries(urlSearchParamsObj).forEach(([key, value]) => {
      urlState[key] = isBoolean(value);
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
    const urlStrPath = this.urlStateToUrlString(this.urlSchema, this.urlState);
    if (this.urlMode == 'history') {
      if (window.history && window.history.replaceState) {
        const newUrlPath = `${this.urlHistoryBasePath}${urlStrPath}`;
        window.history.replaceState({}, null, newUrlPath);
      }
    } else {
      window.location.replace('#' + urlStrPath);
    }
    this.oldLocationHash = urlStrPath;
  }

  /**
   * Get the url and check if it has changed
   * If it was changeed, update the urlState
   */
  listenForHashChanges() {
    this.oldLocationHash = window.location.hash.substr(1);
    if (this.locationPollId) {
      clearInterval(this.locationPollID);
      this.locationPollId = null;
    }

    // check if the URL changes
    const updateHash = () => {
      const newFragment = window.location.hash.substr(1);
      const hasFragmentChange = newFragment != this.oldLocationHash;

      if (!hasFragmentChange) { return; }

      this.urlState = this.urlStringToUrlState(newFragment);
    };
    this.locationPollId = setInterval(updateHash, 500);
  }

  /**
   * Will read either the hash or URL and return the bookreader fragment
   * @param {string} location
   * @return {string}
   */
  pullFromAddressBar (location) {
    const path = this.urlMode === 'history'
      ? location.substr(this.urlHistoryBasePath.length)
      : location.substr(1);
    this.urlState = this.urlStringToUrlState(this.urlSchema, path);
  }

}

export class BookreaderUrlPlugin extends BookReader {

  init() {
    if (this.options.enableUrlPlugin) {
      this.urlPlugin = new UrlPlugin(this.options);
      this.bind(BookReader.eventNames.PostInit, () => {
        const { urlMode } = this.options;

        if (urlMode === 'hash') {
          this.urlPlugin.listenForHashChanges();
        }
      });
    }

    super.init();
  }

}

window.BookReader = BookreaderUrlPlugin;
export default BookreaderUrlPlugin;
