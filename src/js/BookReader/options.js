/** @typedef {import('./BookModel.js').PageNumString} PageNumString */
/** @typedef {import('./BookModel.js').LeafNum} LeafNum */

export const DEFAULT_OPTIONS = {
  /**
   * @type {string} A string, such as "mode/1up". See
   * http://openlibrary.org/dev/docs/bookurls for valid syntax
   */
  defaults: null,

  /** Padding in 1up */
  padding: 10,

  /** @type {'full' | 'embed' | 'responsive'} UI mode */
  ui: 'full',

  /** Controls whether nav/toolbar will autohide */
  uiAutoHide: false,

  /** thumbnail mode */
  /** number of rows to pre-cache out a view */
  thumbRowBuffer: 2,
  thumbColumns: 6,
  /** number of thumbnails to load at once */
  thumbMaxLoading: 4,
  /** spacing between thumbnails */
  thumbPadding: 10,

  /** @type {number | 'fast' | 'slow'} speed for flip animation */
  flipSpeed: 'fast',

  showToolbar: true,
  showNavbar: true,
  navBarTitle: '',

  showLogo: true,
  /** Where the logo links to */
  logoURL: 'https://archive.org',

  /**
   * Base URL for UI images - should be overriden (before init) by
   * custom implementations.
   * $$$ This is the same directory as the images referenced by relative
   *     path in the CSS.  Would be better to automagically find that path.
   */
  imagesBaseURL: '/BookReader/images/',

  /**
   * Zoom levels
   * @type {Array<{reduce: number, autofit: AutoFitValues}}
   * $$$ provide finer grained zooming, {reduce: 8, autofit: null}, {reduce: 16, autofit: null}
   * The autofit code ensures that fit to width and fit to height will be available
   */
  reductionFactors: [
    {reduce: 0.5, autofit: null},
    {reduce: 1, autofit: null},
    {reduce: 2, autofit: null},
    {reduce: 3, autofit: null},
    {reduce: 4, autofit: null},
    {reduce: 6, autofit: null}
  ],

  /** Object to hold parameters related to 1up mode */
  onePage: {
    /** @type {AutoFitValues} */
    autofit: 'auto',
  },

  /** Object to hold parameters related to 2up mode */
  twoPage: {
    /** Width of cover */
    coverInternalPadding: 0,
    /** Padding outside of cover */
    coverExternalPadding: 0,
    /** Width of book spine  $$$ consider sizing based on book length */
    bookSpineDivWidth: 64,
    /** @type {AutoFitValues} */
    autofit: 'auto'
  },

  onePageMinBreakpoint: 800,

  bookTitle: '',
  /** @type {string} */
  bookUrl: null,
  /** @type {string} */
  bookUrlText: null,
  /** @type {string} */
  bookUrlTitle: null,
  enableBookTitleLink: true,
  /**
   * @type {string} language in ISO 639-1 (PRIVATE: Will also
   * handle language name in English, native name, 639-2/T, or 639-2/B . (archive.org books
   * appear to use 639-2/B ? But I don't think that's a guarantee). See
   * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes ) */
  bookLanguage: null,

  /**
   * @type {Array<{label: string, value: *, extraValueClass: string?}>}
   * Fields used to populate the info window
   * @example [
   *   {label: 'Title', value: 'Open Library BookReader Presentation'},
   *   {label: 'Author', value: 'Internet Archive'},
   *   {label: 'Demo Info', value: 'This demo shows how one could use BookReader with their own content.'},
   * ]
   **/
  metadata: [],
  /** @type {string} */
  thumbnail: null,
  /** @type {string} */
  bookUrlMoreInfo: null,

  /** Experimental Controls (eg b/w) */
  enableExperimentalControls: false,

  /** CSS selectors */
  /** Where BookReader mounts to */
  el: '#BookReader',

  /** @type {'lr' | 'rl'} Page progression */
  pageProgression: 'lr',

  /** Should image downloads be blocked */
  protected: false,

  /**
   * @type {Array<[PageData, PageData]|[PageData]>}
   * Data is a simple way to populate the bookreader
   *
   * Example:
   * ```
   * [
   *   // Each child is a spread
   *   [
   *     {
   *       width: 123,
   *       height: 123,
   *       // Optional: If not provided, include a getPageURI
   *       uri: 'https://archive.org/image.jpg',
   *       // Optional: Shown instead of leaf number if present.
   *       pageNum: '1'
   *     },
   *     {width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: '2'},
   *   ]
   * ],
   * ```
   *
   * Note if URI is omitted, a custom getPageURI can be provided. This allows the page
   * URI to the result of a function, which allows for things such as dynamic
   * page scaling.
   */
  data: [],

  /** Advanced methods for page rendering */
  /** @type {() => number} */
  getNumLeafs: null,
  /** @type {(index: number) => number} */
  getPageWidth: null,
  /** @type {(index: number) => number} */
  getPageHeight: null,
  /** @type {(index: number, reduce: number, rotate: number) => *} */
  getPageURI: null,

  /**
   * @type {(index: number) => 'L' | 'R'}
   * Return which side, left or right, that a given page should be displayed on
   */
  getPageSide: null,

  /**
   * @type {(pindex: number) => [number, number]}
   * This function returns the left and right indices for the user-visible
   * spread that contains the given index.  The return values may be
   * null if there is no facing page or the index is invalid.
   */
  getSpreadIndices: null,

  /** @type {(index: number) => string} */
  getPageNum: null,
  /** @type {(index: number) => *} */
  getPageProp: null,
  /** @type {(index: number) => number} */
  leafNumToIndex: null,

  /**
   * @type {(frameWidth: number|string, frameHeight: number|string, viewParams) => *}
   * Optional: if present, and embed code will be shown in the share dialog
   */
  getEmbedCode: null,

  controls: {
    onePage: {
      visible: true,
      className: 'onepg',
    },
    twoPage: {
      visible: true,
      className: 'twopg',
    },
    thumbnail: {
      visible: true,
      className: 'thumb',
    },
  },
};

/** @typedef {'width' | 'height' | 'auto' | 'none'} AutoFitValues */

/**
 * @typedef {Object} PageData
 * @property {number} width
 * @property {number} height
 * @property {string} [uri] If not provided, include a getPageURI
 * @property {PageNumString} [pageNum] Shown instead of leaf number if present
 * @property {LeafNum} [leafNum] Sometimes specified in Internet Archive books
 * @property {'L' | 'R'} [pageSide] PRIVATE; computed automatically
 * @property {boolean} [preview]
 * @property {number} [previewStart] PRIVATE; index where the preview chunk started
 * Note if URI is omitted, a custom getPageURI can be provided. This allows the page
 * URI to the result of a function, which allows for things such as dynamic
 * page scaling.
 */

/** @typedef {typeof DEFAULT_OPTIONS} BookReaderOptions */

