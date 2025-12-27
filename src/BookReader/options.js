// @ts-check
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
  thumbRowBuffer: 1,
  thumbColumns: 6,
  /** number of thumbnails to load at once */
  thumbMaxLoading: 4,
  /** spacing between thumbnails */
  thumbPadding: 10,
  /** min zoom in columns */
  thumbMinZoomColumns: 2,
  /** max zoom out columns */
  thumbMaxZoomColumns: 8,

  /** @type {number | 'fast' | 'slow'} speed for flip animation */
  flipSpeed: 400,

  showToolbar: true,
  showNavbar: true,
  navBarTitle: '',

  showLogo: true,
  /** Where the logo links to */
  logoURL: 'https://archive.org',

  /**
   * Base URL for UI images - should be overridden (before init) by
   * custom implementations.
   * $$$ This is the same directory as the images referenced by relative
   *     path in the CSS.  Would be better to automagically find that path.
   */
  imagesBaseURL: '/BookReader/images/',

  /** @type {'pow2' | 'integer'} What reduces are valid for getURI. */
  reduceSet: 'pow2',

  /**
   * Zoom levels
   * @type {ReductionFactor[]}
   * $$$ provide finer grained zooming, {reduce: 8, autofit: null}, {reduce: 16, autofit: null}
   * The autofit code ensures that fit to width and fit to height will be available
   */
  reductionFactors: [
    {reduce: 0.25, autofit: null},
    {reduce: 0.5, autofit: null},
    {reduce: 1, autofit: null},
    {reduce: 2, autofit: null},
    {reduce: 3, autofit: null},
    {reduce: 4, autofit: null},
    {reduce: 6, autofit: null},
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
    autofit: 'auto',
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
   * @type {string} A globally unique URI for the book. This is used to
   * save data like annotations the user makes to the book.
   */
  bookUri: null,
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

  /** @type {string} CSS selector identifying where BookReader mounts to */
  el: '#BookReader',

  /** @type {'lr' | 'rl'} Page progression */
  pageProgression: 'lr',

  /** The PPI the book is scanned at **/
  ppi: 500,

  /** Should image downloads be blocked */
  protected: false,

  /**
   * Settings for individual plugins. Note they have to be imported first.
   * WIP: Most plugins just put their options anywhere in this global options file,
   * but going forward we'll keep them here.
   **/
  plugins: {
    /** @type {Partial<import('../plugins/plugin.archive_analytics.js').ArchiveAnalyticsPlugin['options'>]}*/
    archiveAnalytics: {},
    /** @type {Partial<import('../plugins/plugin.autoplay.js').AutoplayPlugin['options'>]}*/
    autoplay: {},
    /** @type {Partial<import('../plugins/plugin.chapters.js').ChaptersPlugin['options']>} */
    chapters: {},
    /** @type {Partial<import('../plugins/plugin.experiments.js').ExperimentsPlugin['options']>} */
    experiments: {},
    /** @type {Partial<import('../plugins/plugin.iiif.js').IiifPlugin['options']>} */
    iiif: {},
    /** @type {Partial<import('../plugins/plugin.resume.js').ResumePlugin['options']>} */
    resume: {},
    /** @type {Partial<import('../plugins/search/plugin.search.js').SearchPlugin['options']>} */
    search: {},
    /** @type {Partial<import('../plugins/plugin.text_selection.js').TextSelectionPlugin['options']>} */
    textSelection: {},
    /** @type {Partial<import('../plugins/translate/plugin.translate.js').TranslatePlugin['options']>} */
    translate: {},
    /** @type {Partial<import('../plugins/tts/plugin.tts.js').TtsPlugin['options']>} */
    tts: {},
  },

  /**
   * Any variables you want to define. If an option has a StringWithVars type, or
   * has something like `{{server}}/foo.com` in its value, these variables replace
   * the `{{foo}}`.
   * @type { {[var_name: string]: any } }
   */
  vars: {},

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

  /** @type {import('../plugins/plugin.chapters.js').TocEntry[]} */
  table_of_contents: null,

  /**
   * Advanced methods for page rendering.
   * All option functions have their `this` object set to the BookReader instance.
   **/

  /** @type {() => number} */
  getNumLeafs: null,
  /** @type {(index: number) => number} */
  getPageWidth: null,
  /** @type {(index: number) => number} */
  getPageHeight: null,
  /** @type {(index: number, reduce: number, rotate: number) => string} */
  getPageURI: null,

  /**
   * @type {(img: HTMLImageElement, uri: string) => Promise<void>}
   * Render the page URI into the image element. Perform any necessary preloading,
   * authentication, etc.
   */
  renderPageURI(img, uri) {
    img.src = uri;
  },

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
    toggleSlider: {
      visible: true,
      label: 'Toggle page controls',
      className: 'toggle_slider',
      iconClassName: 'toggle-slider',
    },
    bookLeft: {
      visible: true,
      label: 'Flip left',
      className: 'book_left',
      iconClassName: 'left-arrow',
    },
    bookRight: {
      visible: true,
      label: 'Flip right',
      className: 'book_right',
      iconClassName: 'left-arrow hflip',
    },
    onePage: {
      visible: true,
      label: 'One-page view',
      className: 'onepg',
      iconClassName: 'onepg',
    },
    twoPage: {
      visible: true,
      label: 'Two-page view',
      className: 'twopg',
      iconClassName: 'twopg',
    },
    thumbnail: {
      visible: true,
      label: 'Thumbnail view',
      className: 'thumb',
      iconClassName: 'thumb',
    },
    viewmode: {
      visible: true,
      className: 'viewmode',
      excludedModes: [],
    },
    zoomOut: {
      visible: true,
      label: 'Zoom out',
      className: 'zoom_out',
      iconClassName: 'magnify',
    },
    zoomIn: {
      visible: true,
      label: 'Zoom in',
      className: 'zoom_in',
      iconClassName: 'magnify plus',
    },
    fullScreen: {
      visible: true,
      label: 'Toggle fullscreen',
      className: 'full',
      iconClassName: 'fullscreen',
    },
  },

  /**
   * @type {Boolean}
   * Optional: if true, starts in fullscreen mode
   */
  startFullscreen: false,

  /**
   * @type {Boolean}
   * will show logo at fullscreen mode
  */
  enableFSLogoShortcut: false,

  /**
   * @type {Boolean}
   * On init, by default, we want to handle resizing bookreader
   * when browser window changes size (inc. `orientationchange` event)
   * toggle off if you want to handle this outside of bookreader
   */
  autoResize: true,

  /**
   * @type {Boolean}
   * On init, by default, we want to use srcSet for images
   */
  useSrcSet: false,

  /**
   * @type {string}
   * Path to the image to display when a page is unviewable (i.e. when
   * displaying a preview of a book).
   *
   * Relative to the imagesBaseURL if a relative path is specified.
   */
  unviewablePageURI: './unviewable_page.png',
};

/**
 * @typedef {'width' | 'height' | 'auto' | 'none'} AutoFitValues
 * - width: fill the width of the container
 * - height: fill the height of the container
 * - auto: fill the width or height of the container, whichever is smaller
 * - none: do not autofit
 **/

/**
 * @typedef {object} ReductionFactor
 * @property {number} reduce
 * @property {AutoFitValues} [autofit] If set, the corresponding reduction factors
 * are what will be used when the user tries to autofit by width/height.
 */

/**
 * @typedef {Object} PageData
 * @property {number} width
 * @property {number} height
 * @property {string} [uri] If not provided, include a getPageURI
 * @property {PageNumString} [pageNum] Shown instead of leaf number if present
 * @property {LeafNum} [leafNum] Sometimes specified in Internet Archive books
 * @property {number} [ppi] The resolution of the page if different from {@see BookReaderOptions.ppi}
 * @property {'L' | 'R'} [pageSide] PRIVATE; computed automatically
 * @property {boolean} [viewable=true] Set false if page is not viewable. Displays a dummy preview image.
 * @property {number} [unviewablesStart] PRIVATE; index where the chunk of unviewable pages started
 *
 * Note if URI is omitted, a custom getPageURI can be provided. This allows the page
 * URI to the result of a function, which allows for things such as dynamic
 * page scaling.
 */

/** @typedef {typeof DEFAULT_OPTIONS} BookReaderOptions */

/**
 * Thrown when an error occurs while parsing options.
 * Potentially recoverable and non-halting.
 */
export class OptionsParseError extends Error {
}
