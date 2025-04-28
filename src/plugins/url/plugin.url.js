/* global BookReader */

import { UrlPlugin } from "./UrlPlugin.js";

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
          document.title = this.shortTitle(this.bookTitle, 50);
        }
        if (urlMode === 'hash') {
          this.urlStartLocationPolling();
        }
      });

      this.bind(BookReader.eventNames.fragmentChange,
        this.urlUpdateFragment.bind(this),
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
    clearInterval(this.locationPollId);
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
      this.plugins.autoplay?.stop();
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
  const { urlTrackIndex0, urlTrackedParams } = this.options;

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

  const newFragment = this.fragmentFromParams(params, this.options.urlMode);
  const currFragment = this.urlReadFragment();
  const currQueryString = this.getLocationSearch();
  const newQueryString = this.queryStringFromParams(params, currQueryString, this.options.urlMode);
  if (currFragment === newFragment && currQueryString === newQueryString) {
    return;
  }

  if (this.options.urlMode === 'history') {
    if (!window.history || !window.history.replaceState) {
      this.options.urlMode = 'hash';
    } else {
      const baseWithoutSlash = this.options.urlHistoryBasePath.replace(/\/+$/, '');
      const newFragmentWithSlash = newFragment === '' ? '' : `/${newFragment}`;

      const newUrlPath = `${baseWithoutSlash}${newFragmentWithSlash}${newQueryString}`;
      try {
        window.history.replaceState({}, null, newUrlPath);
        this.oldLocationHash = newFragment + newQueryString;
      } catch (e) {
        // DOMException on Chrome when in sandboxed iframe
        this.options.urlMode = 'hash';
      }
    }
  }

  if (this.options.urlMode === 'hash')  {
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
