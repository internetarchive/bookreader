export const DEFAULT_OPTIONS = {
    // A string, such as "mode/1up". See
    // http://openlibrary.org/dev/docs/bookurls for valid syntax
    defaults: null,
  
    // Padding in 1up
    padding: 10,
    // UI mode
    ui: 'full', // full, embed, responsive
  
    // Controls whether nav/toolbar will autohide
    uiAutoHide: false,
  
    // thumbnail mode
    // number of rows to pre-cache out a view
    thumbRowBuffer: 2,
    thumbColumns: 6,
    // number of thumbnails to load at once
    thumbMaxLoading: 4,
    // spacing between thumbnails
    thumbPadding: 10,
    // speed for flip animation
    flipSpeed: 'fast',
  
    showToolbar: true,
    showNavbar: true,
    navBarTitle: '',
  
    showLogo: true,
    // Where the logo links to
    logoURL: 'https://archive.org',
  
    // Base URL for UI images - should be overriden (before init) by
    // custom implementations.
    // $$$ This is the same directory as the images referenced by relative
    //     path in the CSS.  Would be better to automagically find that path.
    imagesBaseURL: '/BookReader/images/',
  
    // Zoom levels
    // $$$ provide finer grained zooming, {reduce: 8, autofit: null}, {reduce: 16, autofit: null}
    /* The autofit code ensures that fit to width and fit to height will be available */
    reductionFactors: [
      {reduce: 0.5, autofit: null},
      {reduce: 1, autofit: null},
      {reduce: 2, autofit: null},
      {reduce: 3, autofit: null},
      {reduce: 4, autofit: null},
      {reduce: 6, autofit: null}
    ],
  
    // Object to hold parameters related to 1up mode
    onePage: {
      autofit: 'auto', // valid values are height, width, auto, none
    },
  
    // Object to hold parameters related to 2up mode
    twoPage: {
      coverInternalPadding: 0, // Width of cover
      coverExternalPadding: 0, // Padding outside of cover
      bookSpineDivWidth: 64,    // Width of book spine  $$$ consider sizing based on book length
      autofit: 'auto'
    },
  
    onePageMinBreakpoint: 800,
  
    bookTitle: '',
    bookUrl: null,
    bookUrlText: null,
    bookUrlTitle: null,
    enableBookTitleLink: true,
    /**
       * @type {string} language in ISO 639-1 (PRIVATE: Will also
       * handle language name in English, native name, 639-2/T, or 639-2/B . (archive.org books
       * appear to use 639-2/B ? But I don't think that's a guarantee). See
       * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes ) */
    bookLanguage: null,
  
    // Fields used to populate the info window
    metadata: [],
    thumbnail: null,
    bookUrlMoreInfo: null,
  
    // Experimental Controls (eg b/w)
    enableExperimentalControls: false,
  
    // CSS selectors
    // Where BookReader mounts to
    el: '#BookReader',
  
    // Page progression. Choices: 'lr', 'rl'
    pageProgression: 'lr',
  
    // Should image downloads be blocked
    protected: false,
  
    // Data is a simple way to populate the bookreader
    // Example:
    // [
    //    // Each child is a spread
    //   [
    //     {
    //       width: 123,
    //       height: 123,
    //       // Optional: If not provided, include a getPageURI
    //       uri: 'https://archive.org/image.jpg',
    //       // Optional: Shown instead of leaf number if present.
    //       pageNum: 1
    //     },
    //     {width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: 2},
    //   ]
    // ],
    //
    // Note if URI is omitted, a custom getPageURI can be provided. This allows the page
    // URI to the result of a function, which allows for thigns such as dynamic
    // page scaling.
    data: [],
  
    // Advanced methods for page rendering
    getNumLeafs: null,
    getPageWidth: null,
    getPageHeight: null,
    getPageURI: null,
  
    // Return which side, left or right, that a given page should be displayed on
    getPageSide: null,
  
    // This function returns the left and right indices for the user-visible
    // spread that contains the given index.  The return values may be
    // null if there is no facing page or the index is invalid.
    getSpreadIndices: null,
  
    getPageNum: null,
    getPageProp: null,
    leafNumToIndex: null,
  
    // Optional: if present, and embed code will be shown in the share dialog
    getEmbedCode: null,
};
