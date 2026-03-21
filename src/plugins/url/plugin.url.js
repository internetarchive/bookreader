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
  urlTrackedParams: ['page', 'search', 'mode', 'region', 'highlight', 'view', 'text'],

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
    // Should include the :~:text= prefix
    this.textFragment = null;
    // Tracks the original textFragment page num when first loaded
    this.textFragmentPage = null;
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

  // eg 'page/3/mode/2up'; no query params (in hash mode, it might have /search/term)
  // Does NOT have the :~:text fragment
  const newFragment = this.fragmentFromParams(params, this.options.urlMode);
  const newFragmentWithSlash = newFragment === '' ? '' : `/${newFragment}`;
  // eg 'page/3/mode/2up'; no query params
  // WILL CONTAIN the :~:text fragment in hash mode (!)
  const currFragment = this.urlReadFragment();
  // This should have both ?q=foo&text=bar (and any other params) as an encoded string
  const currQueryString = this.getLocationSearch();
  // Eg ?q=foo&text=bar; only query params, no fragment
  const newQueryString = this.queryStringFromParams(params, currQueryString, this.options.urlMode);

  // NOTE: If ?text is in the URL, we will fire fragment change events on every render; which is
  // not desireable, but currently don't have a way to handle re-writing ?text to the hash text
  // fragment form, :~:text=foo.
  const hasTextParam = this.urlPlugin.retrieveTextFragment(currQueryString);
  if (currFragment === newFragment && currQueryString === newQueryString && !hasTextParam) {
    return;
  }

  if (this.options.urlMode === 'history') {
    if (!window.history || !window.history.replaceState) {
      this.options.urlMode = 'hash';
    } else {
      const baseWithoutSlash = this.options.urlHistoryBasePath.replace(/\/+$/, '');
      const textFragment = this.urlPlugin.retrieveTextFragment(newQueryString);
      const newUrlPath = `${baseWithoutSlash}${newFragmentWithSlash}${newQueryString}`;
      const extractedPage = this.urlPlugin.urlStringToUrlState(newFragmentWithSlash)?.page;
      if (!this.textFragmentPage && textFragment) {
        this.textFragmentPage =  extractedPage ? extractedPage : null;
        this.textFragment = `:~:text=${textFragment}`;
      }
      try {
        window.history.replaceState({}, null, newUrlPath);
        this.oldLocationHash = newFragment + newQueryString;
        if (textFragment) {
          this.oldLocationHash += `:~:text=${textFragment[0]}`;
        }
      } catch (e) {
        // DOMException on Chrome when in sandboxed iframe
        this.options.urlMode = 'hash';
      }
    }
  }

  if (this.options.urlMode === 'hash')  {
    const newQueryStringSearch = this.urlParamsFiltersOnlySearch(this.readQueryString());
    let textFragment = this.urlPlugin.retrieveTextFragment(this.readQueryString());
    const extractedPage = this.urlPlugin.urlStringToUrlState(newFragmentWithSlash)?.page;

    if (textFragment) {
      textFragment = `:~:text=${textFragment[0]}`;
    } else {
      textFragment = '';
    }
    if (!this.textFragmentPage && textFragment) {
      this.textFragmentPage = extractedPage ? extractedPage : null;
      this.textFragment = textFragment;
    } else if (this.textFragmentPage && extractedPage != this.textFragmentPage) {
      textFragment = '';
    }
    window.location.replace('#' + newFragment + newQueryStringSearch + textFragment);
    this.oldLocationHash = newFragment + newQueryStringSearch + textFragment;
  }
};

/**
 * @private
 * Filtering query parameters to select only book search param (?q=foo)
   This needs to be updated/URL system modified if future query params are to be added
 * @param {string} url
 * @return {string}
 * */

// testing with this URL http://127.0.0.1:8000/BookReaderDemo/demo-internetarchive.html?ocaid=adventureofsherl0000unse&text=Well%2C I found my plans very seriously menaced.&q=breaking the law#page/18/mode/2up
BookReader.prototype.urlParamsFiltersOnlySearch = function(url) {
  const params = new URLSearchParams(url);
  let output = '';
  output += params.has('q') ? `?${new URLSearchParams({ q: params.get('q') })}` : '';
  return output;
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
    return this.urlPlugin.getHash();
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
      const location = this.getLocationSearch();
      if (location.includes("text=")) {
        this.on('textLayerVisible', async (_, {pageContainerEl}) => {
          const visiblePageNum = pageContainerEl.getAttribute('data-page-num');
          let renderPageDelay = 100;
          if (this.mode === 1) {
            // maybe add some more time to have the page "settle down" from user scrolling
            renderPageDelay = 900;
          }
          await new Promise(resolve => setTimeout(resolve, renderPageDelay));
          // No textFragment found or the textFragment stored doesn't match current visible page loaded
          if (!this.textFragment || this.textFragmentPage !== visiblePageNum) return;
          if (this.options.urlMode === 'history') {
            window.location.replace(`#${this.textFragment}`);
          } else {
            // for urlMode hash, textFragment is stored in oldLocationHash already
            window.location.replace(`#${this.oldLocationHash}`);
          }
        });
      }
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
