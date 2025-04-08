// @ts-check
import { BookReaderPlugin } from "../../BookReaderPlugin.js";
import { UrlPluginV2 } from "./UrlPlugin";

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

/**
 * Plugin for URL management in BookReader
 * Note read more about the url "fragment" here:
 * https://openlibrary.org/dev/docs/bookurls
 */
export class UrlPlugin extends BookReaderPlugin {
  options = {
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
  }

  /** @override */
  setup(options) {
    super.setup(options);

    this.bookId = options.bookId;
    this.defaults = options.defaults;

    this.locationPollId = null;
    this.oldLocationHash = null;
    this.oldUserHash = null;
  }

  /** @override */
  init() {
    if (this.options.enableUrlPlugin) {
      // TODO: Merge with UrlPluginV2
      this.urlPlugin = new UrlPluginV2(this.options);
      this.br.bind(BookReader.eventNames.PostInit, () => {
        const { urlMode } = this.options;

        if (urlMode === 'hash') {
          this.urlPlugin.listenForHashChanges();
        }
      });

      this.br.bind(BookReader.eventNames.PostInit, () => {
        const { updateWindowTitle, urlMode } = this.options;
        if (updateWindowTitle) {
          document.title = this.shortTitle(this.br.bookTitle, 50);
        }
        if (urlMode === 'hash') {
          this.urlStartLocationPolling();
        }
      });

      this.br.bind(BookReader.eventNames.fragmentChange,
        this.urlUpdateFragment.bind(this),
      );
    }
  }

  /**
   * Returns a shortened version of the title with the maximum number of characters
   * @param {string} bookTitle
   * @param {number} maximumCharacters
   * @return {string}
   */
  shortTitle(bookTitle, maximumCharacters) {
    if (bookTitle.length < maximumCharacters) {
      return bookTitle;
    }

    const title = `${bookTitle.substr(0, maximumCharacters - 3)}...`;
    return title;
  }

  /**
   * Starts polling of window.location to see hash fragment changes
   */
  urlStartLocationPolling() {
    this.oldLocationHash = this.urlReadFragment();

    if (this.locationPollId) {
      clearInterval(this.locationPollId);
      this.locationPollId = null;
    }

    const updateHash = () => {
      const newFragment = this.urlReadFragment();
      const hasFragmentChange = (newFragment != this.oldLocationHash) && (newFragment != this.oldUserHash);

      if (!hasFragmentChange) { return; }

      const params = this.br.paramsFromFragment(newFragment);

      const updateParams = () => this.br.updateFromParams(params);

      this.br.trigger(BookReader.eventNames.stop);
      if (this.br.animating) {
        // Queue change if animating
        this.br._plugins.autoplay?.stop();
        this.animationFinishedCallback = updateParams;
      } else {
        // update immediately
        updateParams();
      }
      this.oldUserHash = newFragment;
    };

    this.locationPollId = setInterval(updateHash, 500);
  }

  /**
   * Update URL from the current parameters.
   * Call this instead of manually using window.location.replace
   */
  urlUpdateFragment() {
    const allParams = this.br.paramsFromCurrent();
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

    const newFragment = this.br.fragmentFromParams(params, this.options.urlMode);
    const currFragment = this.urlReadFragment();
    const currQueryString = this.br.getLocationSearch();
    const newQueryString = this.br.queryStringFromParams(params, currQueryString, this.options.urlMode);
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
      const newQueryStringSearch = this.urlParamsFiltersOnlySearch(this.br.readQueryString());
      window.location.replace('#' + newFragment + newQueryStringSearch);
      this.oldLocationHash = newFragment + newQueryStringSearch;
    }
  }

  /**
   * @private
   * Filtering query parameters to select only book search param (?q=foo)
     This needs to be updated/URL system modified if future query params are to be added
  * @param {string} url
  * @return {string}
  * */
  urlParamsFiltersOnlySearch(url) {
    const params = new URLSearchParams(url);
    return params.has('q') ? `?${new URLSearchParams({ q: params.get('q') })}` : '';
  }


  /**
   * Will read either the hash or URL and return the bookreader fragment
   * @return {string}
   */
  urlReadFragment() {
    const { urlMode, urlHistoryBasePath } = this.options;
    if (urlMode === 'history') {
      return window.location.pathname.substr(urlHistoryBasePath.length);
    } else {
      return window.location.hash.substr(1);
    }
  }

  /**
   * Will read the hash return the bookreader fragment
   * @return {string}
   */
  urlReadHashFragment() {
    return window.location.hash.substr(1);
  }
}

BookReader?.registerPlugin('url', UrlPlugin);
