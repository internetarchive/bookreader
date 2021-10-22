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
      this.bind(BookReader.eventNames.PostInit, () => {
        const { updateWindowTitle, urlMode } = this.options;
        if (updateWindowTitle) {
          document.title = this.shortTitle(50);
        }
        if (urlMode === 'hash') {
          this.urlStartLocationPolling();
        }
      });

      this.bind(BookReader.eventNames.fragmentChange,
        this.urlUpdateFragment.bind(this)
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
BookReader.prototype.shortTitle = function(maximumCharacters) {
  if (this.bookTitle.length < maximumCharacters) {
    return this.bookTitle;
  }

  const title = `${this.bookTitle.substr(0, maximumCharacters - 3)}...`;
  return title;
};

/**
 * Starts polling of window.location to see hash fragment changes
 */
BookReader.prototype.urlStartLocationPolling = function() {
  this.oldLocationHash = this.urlReadFragment();

  if (this.locationPollId) {
    clearInterval(this.locationPollID);
    this.locationPollId = null;
  }

  const updateHash = () => {
    const newFragment = this.urlReadFragment();
    const hasFragmentChange = (newFragment != this.oldLocationHash) && (newFragment != this.oldUserHash);

    if (!hasFragmentChange) { return; }

    const params = this.paramsFromFragment(newFragment);

    const updateParams = () => this.updateFromParams(params);

    this.trigger(BookReader.eventNames.stop);
    if (this.animating) {
      // Queue change if animating
      if (this.autoStop) this.autoStop();
      this.animationFinishedCallback = updateParams;
    } else {
      // update immediately
      updateParams();
    }
    this.oldUserHash = newFragment;
  };

  this.locationPollId = setInterval(updateHash, 500);
};

/**
 * Update URL from the current parameters.
 * Call this instead of manually using window.location.replace
 */
BookReader.prototype.urlUpdateFragment = function() {
  const allParams = this.paramsFromCurrent();
  const { urlMode, urlTrackIndex0, urlTrackedParams } = this.options;

  if (!urlTrackIndex0
      && (typeof(allParams.index) !== 'undefined')
      && allParams.index === 0) {
    delete allParams.index;
    delete allParams.page;
  }

  const params = urlTrackedParams.reduce((validParams, paramName) => {
    if (paramName in allParams) {
      validParams[paramName] = allParams[paramName];
    }
    return validParams;
  }, {});

  const newFragment = this.fragmentFromParams(params, urlMode);
  const currFragment = this.urlReadFragment();
  const currQueryString = this.getLocationSearch();
  const newQueryString = this.queryStringFromParams(params, currQueryString, urlMode);
  if (currFragment === newFragment && currQueryString === newQueryString) {
    return;
  }

  if (urlMode === 'history') {
    if (window.history && window.history.replaceState) {
      const baseWithoutSlash = this.options.urlHistoryBasePath.replace(/\/+$/, '');
      const newFragmentWithSlash = newFragment === '' ? '' : `/${newFragment}`;

      const newUrlPath = `${baseWithoutSlash}${newFragmentWithSlash}${newQueryString}`;
      window.history.replaceState({}, null, newUrlPath);
      this.oldLocationHash = newFragment + newQueryString;

    }
  } else {
    const newQueryStringSearch = this.urlParamsFiltersOnlySearch(this.readQueryString());
    window.location.replace('#' + newFragment + newQueryStringSearch);
    this.oldLocationHash = newFragment + newQueryStringSearch;

  }
};

/**
 * @private
 * Filtering query parameters to select only book search param (?q=foo)
   This needs to be updated/URL system modified if future query params are to be added
 * @param {string} url
 * @return {string}
 * */
BookReader.prototype.urlParamsFiltersOnlySearch = function(url) {
  const params = new URLSearchParams(url);
  return params.has('q') ? `?${new URLSearchParams({ q: params.get('q') })}` : '';
};


/**
 * Will read either the hash or URL and return the bookreader fragment
 * @return {string}
 */
BookReader.prototype.urlReadFragment = function() {
  const { urlMode, urlHistoryBasePath } = this.options;
  if (urlMode === 'history') {
    return window.location.pathname.substr(urlHistoryBasePath.length);
  } else {
    return window.location.hash.substr(1);
  }
};

/**
 * Will read the hash return the bookreader fragment
 * @return {string}
 */
BookReader.prototype.urlReadHashFragment = function() {
  return window.location.hash.substr(1);
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

    this.urlState = {};
    this.urlMode = 'hash';
    this.urlHistoryBasePath = '/';
    this.locationPollId = null;
    this.oldLocationHash = null;
    this.oldUserHash = null;

    this.pullFromAddressBar();
  }

  /**
   * Parse JSON object URL state to string format
   * @param {object} urlState
   * @returns {string}
   */
  urlStateToUrlString(urlSchema, urlState) {
    let strPathParams = '';
    let hasAppendQueryParams = false;
    const searchParams = new URLSearchParams();

    const addToSearchParams = (key, value) => {
      searchParams.append(key, value);
      hasAppendQueryParams = true;
    }

    const addToPathParams = (key, value) => {
      strPathParams = `${strPathParams}/${key}/${value}`;
    }

    Object.keys(urlState).forEach(key => {
      const schema = urlSchema.filter(schema => schema.name === key)[0];
      if (schema) {
        if (schema.position == 'path') {
          if (schema.deprecated_for) {
            addToSearchParams(schema.deprecated_for, urlState[key]);
          } else {
            addToPathParams(key, urlState[key]);
          }
        } else {
          addToSearchParams(key, urlState[key]);
        }
      } else {
        addToSearchParams(key, urlState[key]);
      }
    });

    const concatenatedPath = `${strPathParams}?${searchParams.toString()}`;
    return hasAppendQueryParams ? concatenatedPath : strPathParams;
  }

  /**
   * Parse string URL add it in the current urlState
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
    const urlStrSplitSlash = urlPath.pathname.split('/');
    
    urlSchema.forEach(schema => {
      const pKey = urlStrSplitSlash.filter(item => item === schema.name);
      if (pKey.length === 1) {
        const indexOf = urlStrSplitSlash.indexOf(schema.name) + 1;
        if (schema.deprecated_for) {
          urlState[schema.deprecated_for] = urlStrSplitSlash[indexOf];
        } else {
          urlState[pKey] = urlStrSplitSlash[indexOf];
        }
      }
    });
    Object.keys(urlSearchParamsObj).forEach(params => {
      urlState[params] = urlSearchParamsObj[params];
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
   * Put URL params to addressbar
   */
  pushToAddressBar() {
    const urlStrPath = this.urlStateToUrlString(this.urlSchema, this.urlSchema);
    if (this.urlMode == 'history') {
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, null, urlStrPath);
      }
    } else {
      window.location.replace('#' + urlStrPath);
    }
    this.oldLocationHash = urlStrPath;
  }

  /**
   * @param {string} urlFragment
   */
  pullFromAddressBar(urlFragment) {
    this.urlState = this.urlStringToUrlState(this.urlSchema, urlFragment);
  }

  listenForHashChanges() {
    this.oldLocationHash = this.urlReadFragment();
    if (this.locationPollId) {
      clearInterval(this.locationPollID);
      this.locationPollId = null;
    }

    // check if the URL changes
    const updateHash = () => {
      const newFragment = this.urlReadFragment();
      const hasFragmentChange = (newFragment != this.oldLocationHash) && (newFragment != this.oldUserHash);

      if (!hasFragmentChange) { return; }

      this.pullFromAddressBar();
      this.oldUserHash = newFragment;
    };
    this.locationPollId = setInterval(updateHash, 500);
  }

  /**
   * Will read either the hash or URL and return the bookreader fragment
   * @return {string}
   */
  urlReadFragment () {
    if (this.urlMode === 'history') {
      return window.location.pathname.substr(this.urlHistoryBasePath.length);
    } else {
      return window.location.hash.substr(1);
    }
  }

  /**
 * Returns a shortened version of the title with the maximum number of characters
 * @param {string} bookTitle
 * @param {number} maximumCharacters
 * @return {string}
 */
  shortTitle (bookTitle, maximumCharacters) {
    if (bookTitle.length < maximumCharacters) {
      return bookTitle;
    }

    const title = `${bookTitle.substr(0, maximumCharacters - 3)}...`;
    return title;
  }

}

export class BookreaderUrlPlugin extends BookReader {

  init() {
    if (this.options.enableUrlPlugin) {
      this.urlPlugin = new UrlPlugin(this.options);
      this.bind(BookReader.eventNames.PostInit, () => {
        const { updateWindowTitle, urlMode } = this.options;
        if (updateWindowTitle) {
          document.title = this.urlPlugin.shortTitle(50);
        }
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
