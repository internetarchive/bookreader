/*
Copyright(c)2008-2019 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.

    BookReader is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    BookReader is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with BookReader.  If not, see <http://www.gnu.org/licenses/>.

    The BookReader source is hosted at http://github.com/internetarchive/bookreader/

*/
// effect.js gives acces to extra easing function (e.g. easeInOutExpo)
import 'jquery-ui/ui/effect.js';

// Needed by touch-punch
import 'jquery-ui/ui/widget.js';
import 'jquery-ui/ui/widgets/mouse.js';
import 'jquery-ui-touch-punch';

import PACKAGE_JSON from '../package.json';
import * as utils from './BookReader/utils.js';
import { exposeOverrideable } from './BookReader/utils/classes.js';
import { Navbar, getNavPageNumHtml } from './BookReader/Navbar/Navbar.js';
import { DEFAULT_OPTIONS } from './BookReader/options.js';
/** @typedef {import('./BookReader/options.js').BookReaderOptions} BookReaderOptions */
/** @typedef {import('./BookReader/options.js').ReductionFactor} ReductionFactor */
/** @typedef {import('./BookReader/BookModel.js').PageIndex} PageIndex */
import { EVENTS } from './BookReader/events.js';
import { DebugConsole } from './BookReader/DebugConsole.js';
import {
  Toolbar,
  blankInfoDiv,
  blankShareDiv,
  createPopup,
} from './BookReader/Toolbar/Toolbar.js';
import { BookModel } from './BookReader/BookModel.js';
import { Mode1Up } from './BookReader/Mode1Up.js';
import { Mode2Up } from './BookReader/Mode2Up.js';
import { ModeThumb } from './BookReader/ModeThumb';
import { ImageCache } from './BookReader/ImageCache.js';
import { PageContainer } from './BookReader/PageContainer.js';
import { NAMED_REDUCE_SETS } from './BookReader/ReduceSet';

if (location.toString().indexOf('_debugShowConsole=true') != -1) {
  $(() => new DebugConsole().init());
}

/**
 * BookReader
 * @param {BookReaderOptions} options
 * TODO document all options properties
 * @constructor
 */
export default function BookReader(overrides = {}) {
  const options = jQuery.extend(true, {}, BookReader.defaultOptions, overrides, BookReader.optionOverrides);
  this.setup(options);
}

BookReader.version = PACKAGE_JSON.version;

// Mode constants
/** 1 page view */
BookReader.constMode1up = 1;
/** 2 pages view */
BookReader.constMode2up = 2;
/** thumbnails view */
BookReader.constModeThumb = 3;
/** image cache */
BookReader.imageCache = null;

// Animation constants
BookReader.constNavAnimationDuration = 300;
BookReader.constResizeAnimationDuration = 100;

// Names of events that can be triggered via BookReader.prototype.trigger()
BookReader.eventNames = EVENTS;

BookReader.defaultOptions = DEFAULT_OPTIONS;

/**
 * @type {BookReaderOptions}
 * This is here, just in case you need to absolutely override an option.
 */
BookReader.optionOverrides = {};

/**
 * Setup
 * It is separate from the constructor, so plugins can extend.
 * @param {BookReaderOptions} options
 */
BookReader.prototype.setup = function(options) {
  // Store the options used to setup bookreader
  this.options = options;

  /** @type {number} @deprecated some past iterations set this */
  this.numLeafs = undefined;

  /** Overridden by plugin.search.js */
  this.enableSearch = false;

  /**
   * Store viewModeOrder states
   * @var {boolean}
   */
  this.viewModeOrder = [];

  /**
   * Used to suppress fragment change for init with canonical URLs
   * @var {boolean}
   */
  this.suppressFragmentChange = false;

  /** @type {function(): void} */
  this.animationFinishedCallback = null;

  // @deprecated: Instance constants. Use Class constants instead
  /** 1 page view */
  this.constMode1up = BookReader.constMode1up;
  /** 2 pages view */
  this.constMode2up = BookReader.constMode2up;
  /** thumbnails view */
  this.constModeThumb = BookReader.constModeThumb;

  // Private properties below. Configuration should be done with options.
  /** @type {number} TODO: Make private */
  this.reduce = 8; /* start very small */
  this.defaults = options.defaults;
  this.padding = options.padding;

  this.reduceSet = NAMED_REDUCE_SETS[options.reduceSet];
  if (!this.reduceSet) {
    console.warn(`Invalid reduceSet ${options.reduceSet}. Ignoring.`);
    this.reduceSet = NAMED_REDUCE_SETS[DEFAULT_OPTIONS.reduceSet];
  }

  /** @type {number}
   * can be 1 or 2 or 3 based on the display mode const value
   */
  this.mode = null;
  this.prevReadMode = null;
  this.ui = options.ui;
  this.uiAutoHide = options.uiAutoHide;

  this.thumbWidth = 100; // will be overridden during prepareThumbnailView
  this.thumbRowBuffer = options.thumbRowBuffer;
  this.thumbColumns = options.thumbColumns;
  this.thumbMaxLoading = options.thumbMaxLoading;
  this.thumbPadding = options.thumbPadding;
  this.displayedRows = [];

  this.displayedIndices = [];
  /** @deprecated Unused; will be remove in v5 */
  this.imgs = {};
  /** @deprecated No longer used; will be remove in v5 */
  this.prefetchedImgs = {}; //an object with numeric keys corresponding to page index, reduce

  this.animating = false;
  this.flipSpeed = options.flipSpeed;
  this.flipDelay = options.flipDelay;
  this.twoPagePopUp = null;
  this.leafEdgeTmp  = null;

  /**
     * Represents the first displayed index
     * In 2up mode it will be the left page
     * In 1 up mode it is the highest page
     * @property {number|null} firstIndex
     */
  this.firstIndex = null;
  this.lastDisplayableIndex2up = null;
  this.isFullscreenActive = false;
  this.lastScroll = null;

  this.showLogo = options.showLogo;
  this.logoURL = options.logoURL;
  this.imagesBaseURL = options.imagesBaseURL;

  this.reductionFactors = options.reductionFactors;
  this.onePage = options.onePage;
  /** @type {import('./BookReader/Mode2Up').TwoPageState} */
  this.twoPage = options.twoPage;
  this.onePageMinBreakpoint = options.onePageMinBreakpoint;

  this.bookTitle = options.bookTitle;
  this.bookUrl = options.bookUrl;
  this.bookUrlText = options.bookUrlText;
  this.bookUrlTitle = options.bookUrlTitle;
  this.titleLeaf = options.titleLeaf;

  this.metadata = options.metadata;
  this.thumbnail = options.thumbnail;
  this.bookUrlMoreInfo = options.bookUrlMoreInfo;

  this.enableExperimentalControls = options.enableExperimentalControls;
  this.el = options.el;

  this.pageProgression = options.pageProgression;
  this.protected = options.protected;
  this.getEmbedCode = options.getEmbedCode;
  this.popup = null;

  // Assign the data methods
  this.data = options.data;
  if (options.getNumLeafs) BookReader.prototype.getNumLeafs = options.getNumLeafs;
  if (options.getPageWidth) BookReader.prototype.getPageWidth = options.getPageWidth;
  if (options.getPageHeight) BookReader.prototype.getPageHeight = options.getPageHeight;
  if (options.getPageURI) BookReader.prototype.getPageURI = options.getPageURI;
  if (options.getPageSide) BookReader.prototype.getPageSide = options.getPageSide;
  if (options.getPageNum) BookReader.prototype.getPageNum = options.getPageNum;
  if (options.getPageProp) BookReader.prototype.getPageProp = options.getPageProp;
  if (options.getSpreadIndices) BookReader.prototype.getSpreadIndices = options.getSpreadIndices;
  if (options.leafNumToIndex) BookReader.prototype.leafNumToIndex = options.leafNumToIndex;

  /** @type {{[name: string]: JQuery}} */
  this.refs = {};

  /**
   * @private (for now) Models are largely state storing classes. This might be too much
   * granularity, but time will tell!
   */
  this._models = {
    book: new BookModel(this),
  };

  /**
   * @private Components are 'subchunks' of bookreader functionality, usually UI related
   * They should be relatively decoupled from each other/bookreader.
   * Note there are no hooks right now; components just provide methods that bookreader
   * calls at the correct moments.
   **/
  this._components = {
    navbar: new Navbar(this),
    toolbar: new Toolbar(this),
  };

  this._modes = {
    mode1Up: new Mode1Up(this, this._models.book),
    mode2Up: new Mode2Up(this, this._models.book),
    modeThumb: new ModeThumb(this, this._models.book),
  };

  /** Stores classes which we want to expose (selectively) some methods as overridable */
  this._overrideable = {
    '_models.book': this._models.book,
    '_components.navbar': this._components.navbar,
    '_components.toolbar': this._components.toolbar,
    '_modes.mode1Up': this._modes.mode1Up,
    '_modes.mode2Up': this._modes.mode2Up,
    '_modes.modeThumb': this._modes.modeThumb,
  };

  /** Image cache for general image fetching */
  this.imageCache = new ImageCache(this._models.book, {
    useSrcSet: this.options.useSrcSet,
    reduceSet: this.reduceSet,
  });

  /**
   * Flag if BookReader has "focus" for keyboard shortcuts
   * Initially true, set to false when:
   * - BookReader scrolled out of view
   * Set to true when:
   * - BookReader scrolled into view
   */
  this.hasKeyFocus = true;
};

/**
 * Get all the HTML Elements that are being/can be rendered.
 * Includes cached elements which might be rendered again.
 */
BookReader.prototype.getActivePageContainerElements = function() {
  let containerEls = Object.values(this._modes.mode2Up.pageContainers).map(pc => pc.$container[0])
    .concat(Object.values(this._modes.mode1Up.mode1UpLit.pageContainerCache).map(pc => pc.$container[0]));
  if (this.mode == this.constModeThumb) {
    containerEls = containerEls.concat(this.$('.BRpagecontainer').toArray());
  }
  return containerEls;
};

/**
 * Get the HTML Elements for the rendered page. Note there can be more than one, since
 * (at least as of writing) different modes can maintain different caches.
 * @param {PageIndex} pageIndex
 */
BookReader.prototype.getActivePageContainerElementsForIndex = function(pageIndex) {
  return [
    this._modes.mode2Up.pageContainers[pageIndex]?.$container?.[0],
    this._modes.mode1Up.mode1UpLit.pageContainerCache[pageIndex]?.$container?.[0],
    ...(this.mode == this.constModeThumb ? this.$(`.pagediv${pageIndex}`).toArray() : [])
  ].filter(x => x);
};

Object.defineProperty(BookReader.prototype, 'activeMode', {
  /** @return {Mode1Up | Mode2Up | ModeThumb} */
  get() { return {
    1: this._modes.mode1Up,
    2: this._modes.mode2Up,
    3: this._modes.modeThumb,
  }[this.mode]; },
});

/** @deprecated unused outside Mode2Up */
Object.defineProperty(BookReader.prototype, 'leafEdgeL', {
  get() { return this._modes.mode2Up.leafEdgeL; },
  set(newVal) { this._modes.mode2Up.leafEdgeL = newVal; }
});
/** @deprecated unused outside Mode2Up */
Object.defineProperty(BookReader.prototype, 'leafEdgeR', {
  get() { return this._modes.mode2Up.leafEdgeR; },
  set(newVal) { this._modes.mode2Up.leafEdgeR = newVal; }
});

/**
 * BookReader.util are static library functions
 * At top of file so they can be used below
 */
BookReader.util = utils;

/**
 * Helper to merge in params in to a params object.
 * It normalizes "page" into the "index" field to disambiguate and prevent concflicts
 * @private
 */
BookReader.prototype.extendParams = function(params, newParams) {
  var modifiedNewParams = $.extend({}, newParams);
  if ('undefined' != typeof(modifiedNewParams.page)) {
    var pageIndex = this._models.book.parsePageString(modifiedNewParams.page);
    if (!isNaN(pageIndex))
      modifiedNewParams.index = pageIndex;
    delete modifiedNewParams.page;
  }
  $.extend(params, modifiedNewParams);
};

/**
 * Parses params from from various initialization contexts (url, cookie, options)
 * @private
 * @return {object} the parsed params
 */
BookReader.prototype.initParams = function() {
  var params = {};
  // Flag initializing for updateFromParams()
  params.init = true;

  // Flag if page given in defaults or URL (not cookie)
  // Used for overriding goToFirstResult in plugin.search.js
  // Note: extendParams() converts params.page to index and gets rid of page
  // so check and set before extendParams()
  params.pageFound = false;

  // True if changing the URL
  params.fragmentChange = false;

  // This is ordered from lowest to highest priority

  // If we have a title leaf, use that as the default instead of index 0,
  // but only use as default if book has a few pages
  if ('undefined' != typeof(this.titleLeaf) && this._models.book.getNumLeafs() > 2) {
    params.index = this._models.book.leafNumToIndex(this.titleLeaf);
  } else {
    params.index = 0;
  }

  // this.defaults is a string passed in the url format. eg "page/1/mode/1up"
  if (this.defaults) {
    const defaultParams = this.paramsFromFragment(this.defaults);
    if ('undefined' != typeof(defaultParams.page)) {
      params.pageFound = true;
    }
    this.extendParams(params, defaultParams);
  }

  // Check for Resume plugin
  if (this.options.enablePageResume) {
    // Check cookies
    const val = this.getResumeValue();
    if (val !== null) {
      // If page index different from default
      if (params.index !== val) {
        // Show in URL
        params.fragmentChange = true;
      }
      params.index = val;
    }
  }

  // Check for URL plugin
  if (this.options.enableUrlPlugin) {
    // Params explicitly set in URL take precedence over all other methods
    var urlParams = this.paramsFromFragment(this.urlReadFragment());

    // Get params if hash fragment available with 'history' urlMode
    const hasHashURL = !Object.keys(urlParams).length && this.urlReadHashFragment();
    if (hasHashURL && (this.options.urlMode === 'history')) {
      urlParams = this.paramsFromFragment(this.urlReadHashFragment());
    }

    // If there were any parameters
    if (Object.keys(urlParams).length) {
      if ('undefined' != typeof(urlParams.page)) {
        params.pageFound = true;
      }
      this.extendParams(params, urlParams);
      // Show in URL
      params.fragmentChange = true;
    }
  }

  // Check for Search plugin
  if (this.options.enableSearch) {
    // Go to first result only if no default or URL page
    this.options.goToFirstResult = !params.pageFound;

    // If initialSearchTerm not set
    if (!this.options.initialSearchTerm) {
      // Look for any term in URL
      if (params.search) {
        // Old style: /search/[term]
        this.options.initialSearchTerm = params.search;
        this.searchTerm = params.search;
      } else {
        // If we have a query string: q=[term]
        const searchParams = new URLSearchParams(this.readQueryString());
        const searchTerm = searchParams.get('q');
        if (searchTerm) {
          this.options.initialSearchTerm = utils.decodeURIComponentPlus(searchTerm);
        }
      }
    }
  }

  // Set for init process, return to false at end of init()
  this.suppressFragmentChange = !params.fragmentChange;

  return params;
};

/**
 * Allow mocking of window.location.search
 */
BookReader.prototype.getLocationSearch = function () {
  return window.location.search;
};

/**
 * Allow mocking of window.location.hash
 */
BookReader.prototype.getLocationHash = function () {
  return window.location.hash;
};

/**
 * Return URL or fragment querystring
 */
BookReader.prototype.readQueryString = function() {
  const queryString = this.getLocationSearch();
  if (queryString) {
    return queryString;
  }
  const hash = this.getLocationHash();
  const found = hash.search(/\?\w+=/);
  return found > -1 ? hash.slice(found) : '';
};

/**
 * Determines the initial mode for starting if a mode is not already
 * present in the params argument
 * @param {object} params
 * @return {number} the mode
 */
BookReader.prototype.getInitialMode = function(params) {
  // Use params or browser width to set view mode
  var windowWidth = $(window).width();
  var nextMode;
  if ('undefined' != typeof(params.mode)) {
    nextMode = params.mode;
  } else if (this.ui == 'full'
          && this.enableMobileNav
          && this.isFullscreenActive
          && windowWidth <= this.onePageMinBreakpoint
  ) {
    // In full mode, we set the default based on width
    nextMode = this.constMode1up;
  } else {
    nextMode = this.constMode2up;
  }

  if (!this.canSwitchToMode(nextMode)) {
    nextMode = this.constMode1up;
  }
  return nextMode;
};

/**
 * This is called by the client to initialize BookReader.
 * It renders onto the DOM. It should only be called once.
 */
BookReader.prototype.init = function() {
  this.init.initComplete = false;
  this.pageScale = this.reduce; // preserve current reduce

  var params = this.initParams();

  this.firstIndex = params.index ? params.index : 0;

  // Setup Navbars and other UI
  this.isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);

  this.refs.$br = $(this.el)
    .empty()
    .removeClass()
    .addClass("ui-" + this.ui)
    .addClass("br-ui-" + this.ui)
    .addClass('BookReader');

  // Add a class if this is a touch enabled device
  if (this.isTouchDevice) {
    this.refs.$br.addClass("touch");
  } else {
    this.refs.$br.addClass("no-touch");
  }

  this.refs.$brContainer = $("<div class='BRcontainer' dir='ltr'></div>");
  this.refs.$br.append(this.refs.$brContainer);

  // Explicitly ensure params.mode exists for updateFromParams() below
  params.mode = this.getInitialMode(params);

  // Explicitly ensure this.mode exists for initNavbar() below
  this.mode = params.mode;

  // Display Navigation
  if (this.options.showToolbar) {
    this.initToolbar(this.mode, this.ui); // Build inside of toolbar div
  }
  if (this.options.showNavbar) { // default navigation
    this.initNavbar();
  }

  // Switch navbar controls on mobile/desktop
  this.switchNavbarControls();

  this.resizeBRcontainer();
  this.updateFromParams(params);
  this.initUIStrings();

  // Bind to events

  this.bindNavigationHandlers();
  this.setupKeyListeners();

  this.lastScroll = (new Date().getTime());
  this.refs.$brContainer.on('scroll', this, function(e) {
    // Note, this scroll event fires for both user, and js generated calls
    // It is functioning in some cases as the primary triggerer for rendering
    e.data.lastScroll = (new Date().getTime());
    if (e.data.constModeThumb == e.data.mode) {
      e.data.drawLeafsThrottled();
    }
  });

  if (this.options.autoResize) {
    $(window).on('resize', this, function(e) {
      e.data.resize();
    });
    $(window).on("orientationchange", this, function(e) {
      e.data.resize();
    }.bind(this));
  }

  if (this.protected) {
    this.$('.BRicon.share').hide();
  }

  // If not searching, set to allow on-going fragment changes
  if (!this.options.initialSearchTerm) {
    this.suppressFragmentChange = false;
  }

  this.init.initComplete = true;
  this.trigger(BookReader.eventNames.PostInit);

  // Must be called after this.init.initComplete set to true to allow
  // BookReader.prototype.resize to run.
  if (this.options.startFullscreen) {
    this.toggleFullscreen();
  }
};

/**
 * @param {EVENTS} name
 * @param {array | object} [props]
 */
BookReader.prototype.trigger = function(name, props = this) {
  const eventName = 'BookReader:' + name;
  $(document).trigger(eventName, props);

  utils.polyfillCustomEvent(window);
  window.dispatchEvent(new CustomEvent(eventName, {
    bubbles: true,
    composed: true,
    detail: { props },
  }));
};

BookReader.prototype.bind = function(name, callback) {
  $(document).on('BookReader:' + name, callback);
};

BookReader.prototype.unbind = function(name, callback) {
  $(document).off('BookReader:' + name, callback);
};

/**
 * Resizes based on the container width and height
 */
BookReader.prototype.resize = function() {
  if (!this.init.initComplete) return;

  this.resizeBRcontainer();

  // Switch navbar controls on mobile/desktop
  this.switchNavbarControls();

  if (this.constMode1up == this.mode) {
    if (this.onePage.autofit != 'none') {
      this.resizePageView1up();
      this.centerPageView();
    } else {
      this.centerPageView();
      this.displayedIndices = [];
      this.drawLeafsThrottled();
    }
  } else if (this.constModeThumb == this.mode) {
    this.prepareThumbnailView();
  } else {
    // We only need to prepare again in autofit (size of spread changes)
    if (this.twoPage.autofit) {
      // most common path, esp. for archive.org books
      this.prepareTwoPageView();
    } else {
      // used when zoomed in
      // Re-center if the scrollbars have disappeared
      var center = this.twoPageGetViewCenter();
      var doRecenter = false;
      if (this.twoPage.totalWidth < this.refs.$brContainer.prop('clientWidth')) {
        center.percentageX = 0.5;
        doRecenter = true;
      }
      if (this.twoPage.totalHeight < this.refs.$brContainer.prop('clientHeight')) {
        center.percentageY = 0.5;
        doRecenter = true;
      }
      if (doRecenter) {
        this.twoPageCenterView(center.percentageX, center.percentageY);
      }
    }
  }
  this.trigger(BookReader.eventNames.resize);
};

/**
 * Binds keyboard and keyboard focus event listeners
 */
BookReader.prototype.setupKeyListeners = function () {

  // Keyboard focus by BookReader in viewport
  //
  // Intersection observer and callback sets BookReader keyboard
  // "focus" flag off when the BookReader is not in the viewport.
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.intersectionRatio === 0) {
          this.hasKeyFocus = false;
        } else {
          this.hasKeyFocus = true;
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.05, 1],
    });
    observer.observe(this.refs.$br[0]);
  }

  // Keyboard listeners
  document.addEventListener('keydown', (e) => {

    // Ignore if BookReader "focus" flag not set
    if (!this.hasKeyFocus) {
      return;
    }

    // Ignore if modifiers are active.
    if (e.getModifierState('Control') ||
      e.getModifierState('Alt') ||
      e.getModifierState('Meta') ||
      e.getModifierState('Win') /* hack for IE */) {
      return;
    }

    // Ignore in input elements
    if (utils.isInputActive()) {
      return;
    }

    // KeyboardEvent code values:
    //   https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
    switch (e.key) {

    // Page navigation
    case "Home":
      e.preventDefault();
      this.first();
      break;
    case "End":
      e.preventDefault();
      this.last();
      break;
    case "ArrowDown":
    case "PageDown":
    case "Down": // hack for IE and old Gecko
      // In 1up and thumb mode page scrolling handled by browser
      if (this.constMode2up === this.mode) {
        e.preventDefault();
        this.next();
      }
      break;
    case "ArrowUp":
    case "PageUp":
    case "Up": // hack for IE and old Gecko
      // In 1up and thumb mode page scrolling handled by browser
      if (this.constMode2up === this.mode) {
        e.preventDefault();
        this.prev();
      }
      break;
    case "ArrowLeft":
    case "Left": // hack for IE and old Gecko
      // No y-scrolling in thumb mode
      if (this.constModeThumb != this.mode) {
        e.preventDefault();
        this.left();
      }
      break;
    case "ArrowRight":
    case "Right": // hack for IE and old Gecko
      // No y-scrolling in thumb mode
      if (this.constModeThumb != this.mode) {
        e.preventDefault();
        this.right();
      }
      break;
    // Zoom
    case '-':
    case 'Subtract':
      e.preventDefault();
      this.zoom(-1);
      break;
    case '+':
    case '=':
    case 'Add':
      e.preventDefault();
      this.zoom(1);
      break;
    // Fullscreen
    case 'F':
    case 'f':
      e.preventDefault();
      this.toggleFullscreen();
      break;
    }
  });
};

BookReader.prototype.drawLeafs = function() {
  if (this.constMode1up == this.mode) {
    // Not needed for Mode1Up anymore
  } else if (this.constModeThumb == this.mode) {
    this.drawLeafsThumbnail();
  } else {
    this.drawLeafsTwoPage();
  }
};

/**
 * @protected
 * @param {PageIndex} index
 */
BookReader.prototype._createPageContainer = function(index) {
  return new PageContainer(this._models.book.getPage(index, false), {
    isProtected: this.protected,
    imageCache: this.imageCache,
    loadingImage: this.imagesBaseURL + 'loading.gif',
  });
};

BookReader.prototype.bindGestures = function(jElement) {
  // TODO support gesture change is only iOS. Support android.
  // HACK(2017-01-20) - Momentum scrolling is causing the scroll position
  // to jump after zooming in on mobile device. I am able to reproduce
  // when you move the book with one finger and then add another
  // finger to pinch. Gestures are aware of scroll state.

  var self = this;
  var numTouches = 1;

  jElement.unbind('touchmove').bind('touchmove', function(e) {
    if (e.originalEvent.cancelable) numTouches = e.originalEvent.touches.length;
    e.stopPropagation();
  });

  jElement.unbind('gesturechange').bind('gesturechange', function(e) {
    e.preventDefault();
    // These are two very important fixes to adjust for the scroll position
    // issues described below
    if (!(numTouches !== 2 || (new Date().getTime()) - self.lastScroll < 500)) {
      if (e.originalEvent.scale > 1.5) {
        self.zoom(1);
      } else if (e.originalEvent.scale < 0.6) {
        self.zoom(-1);
      }
    }
  });
};

/** @deprecated Not used outside ModeThumb */
BookReader.prototype.drawLeafsThumbnail = ModeThumb.prototype.drawLeafs;
exposeOverrideableMethod(ModeThumb, '_modes.modeThumb', 'drawLeafs', 'drawLeafsThumbnail');
/** @deprecated Not used outside ModeThumb */
BookReader.prototype.lazyLoadThumbnails = ModeThumb.prototype.lazyLoadThumbnails;
exposeOverrideableMethod(ModeThumb, '_modes.modeThumb', 'lazyLoadThumbnails', 'lazyLoadThumbnails');
BookReader.prototype.lazyLoadImage = ModeThumb.prototype.lazyLoadImage;
exposeOverrideableMethod(ModeThumb, '_modes.modeThumb', 'lazyLoadImage', 'lazyLoadImage');
/** @deprecated Internal use only */
BookReader.prototype.zoomThumb = ModeThumb.prototype.zoom;
exposeOverrideableMethod(ModeThumb, '_modes.modeThumb', 'zoom', 'zoomThumb');
/** @deprecated Not used outside ModeThumb */
BookReader.prototype.getThumbnailWidth = ModeThumb.prototype.getThumbnailWidth;
exposeOverrideableMethod(ModeThumb, '_modes.modeThumb', 'getThumbnailWidth', 'getThumbnailWidth');
/** @deprecated Not used outside ModeThumb */
BookReader.prototype.prepareThumbnailView = ModeThumb.prototype.prepare;
exposeOverrideableMethod(ModeThumb, '_modes.modeThumb', 'prepare', 'prepareThumbnailView');

/**
 * A throttled version of drawLeafs
 */
BookReader.prototype.drawLeafsThrottled = utils.throttle(
  BookReader.prototype.drawLeafs,
  250 // 250 ms gives quick feedback, but doesn't eat cpu
);

/**
 * @param {number} direction Pass 1 to zoom in, anything else to zoom out
 */
BookReader.prototype.zoom = function(direction) {
  if (direction == 1) {
    this.activeMode.zoom('in');
  } else {
    this.activeMode.zoom('out');
  }
  this.textSelectionPlugin?.stopPageFlip(this.refs.$brContainer);
  return;
};

/**
 * Resizes the inner container to fit within the visible space to prevent
 * the top toolbar and bottom navbar from clipping the visible book
 *
 * @param { boolean } animate - optional
 * When used, BookReader will fill the main container with the book's content.
 * This is primarily for 1up view - a follow up animation to the nav animation
 * So resize isn't perceived sharp/jerky
 */
BookReader.prototype.resizeBRcontainer = function(animate) {
  if (animate) {
    this.refs.$brContainer.animate({
      top: this.getToolBarHeight(),
      bottom: this.getFooterHeight()
    }, this.constResizeAnimationDuration, 'linear');
  } else {
    this.refs.$brContainer.css({
      top: this.getToolBarHeight(),
      bottom: this.getFooterHeight()
    });
  }
};

BookReader.prototype.centerPageView = function() {
  var scrollWidth  = this.refs.$brContainer.prop('scrollWidth');
  var clientWidth  =  this.refs.$brContainer.prop('clientWidth');
  if (scrollWidth > clientWidth) {
    this.refs.$brContainer.prop('scrollLeft', (scrollWidth - clientWidth) / 2);
  }
};

/**
 * Quantizes the given reduction factor to closest power of two from set from 12.5% to 200%
 * @param {number} reduce
 * @param {ReductionFactor[]} reductionFactors
 * @return {number}
 */
BookReader.prototype.quantizeReduce = function(reduce, reductionFactors) {
  let quantized = reductionFactors[0].reduce;
  let distance = Math.abs(reduce - quantized);

  for (let i = 1; i < reductionFactors.length; i++) {
    const newDistance = Math.abs(reduce - reductionFactors[i].reduce);
    if (newDistance < distance) {
      distance = newDistance;
      quantized = reductionFactors[i].reduce;
    }
  }
  return quantized;
};

/**
 * @param {number} currentReduce
 * @param {'in' | 'out' | 'auto' | 'height' | 'width'} direction
 * @param {ReductionFactor[]} reductionFactors Must be sorted
 * @returns {ReductionFactor}
 */
BookReader.prototype.nextReduce = function(currentReduce, direction, reductionFactors) {
  // XXX add 'closest', to replace quantize function

  if (direction === 'in') {
    let newReduceIndex = 0;
    for (let i = 1; i < reductionFactors.length; i++) {
      if (reductionFactors[i].reduce < currentReduce) {
        newReduceIndex = i;
      }
    }
    return reductionFactors[newReduceIndex];
  } else if (direction === 'out') {
    const lastIndex = reductionFactors.length - 1;
    let newReduceIndex = lastIndex;

    for (let i = lastIndex; i >= 0; i--) {
      if (reductionFactors[i].reduce > currentReduce) {
        newReduceIndex = i;
      }
    }
    return reductionFactors[newReduceIndex];
  } else if (direction === 'auto') {
    // If an 'auto' is specified, use that
    const autoMatch = reductionFactors.find(rf => rf.autofit == 'auto');
    if (autoMatch) return autoMatch;

    // Otherwise, choose the least reduction from height/width
    const candidates = reductionFactors.filter(({autofit}) => autofit == 'height' || autofit == 'width');
    let choice = null;
    for (let i = 0; i < candidates.length; i++) {
      if (choice === null || choice.reduce < candidates[i].reduce) {
        choice = candidates[i];
      }
    }
    if (choice) return choice;
  } else if (direction === 'height' || direction === 'width') {
    // Asked for specific autofit mode
    const match = reductionFactors.find(rf => rf.autofit == direction);
    if (match) return match;
  }

  return reductionFactors[0];
};

/**
 * @param {ReductionFactor} a
 * @param {ReductionFactor} b
 */
BookReader.prototype._reduceSort = (a, b) => a.reduce - b.reduce;

/**
 * Attempts to jump to page
 * @param {string}
 * @return {boolean} Returns true if page could be found, false otherwise.
 */
BookReader.prototype.jumpToPage = function(pageNum) {
  var pageIndex = this._models.book.parsePageString(pageNum);

  if ('undefined' != typeof(pageIndex)) {
    this.jumpToIndex(pageIndex);
    return true;
  }

  // Page not found
  return false;
};

/**
 * Check whether the specified index is currently displayed
 * @param {PageIndex} index
 */
BookReader.prototype._isIndexDisplayed = function(index) {
  // One up "caches" pages +- current, so exclude those in the test.
  return this.constMode1up == this.mode ? this.displayedIndices.slice(1, -1).includes(index) :
    this.displayedIndices ? this.displayedIndices.includes(index) :
      this.currentIndex() == index;
};

/**
 * Changes the current page
 * @param {PageIndex} index
 * @param {number} [pageX]
 * @param {number} [pageY]
 * @param {boolean} [noAnimate]
 */
BookReader.prototype.jumpToIndex = function(index, pageX, pageY, noAnimate) {
  // Don't jump into specific unviewable page
  const page = this._models.book.getPage(index);
  if (!page.isViewable && page.unviewablesStart != page.index) {
    // If already in unviewable range, jump to end of that range
    const alreadyInPreview = this._isIndexDisplayed(page.unviewablesStart);
    const newIndex = alreadyInPreview ? page.findNext({ combineConsecutiveUnviewables: true }).index : page.unviewablesStart;
    return this.jumpToIndex(newIndex, pageX, pageY, noAnimate);
  }

  this.trigger(BookReader.eventNames.stop);

  if (this.constMode2up == this.mode) {
    this._modes.mode2Up.jumpToIndex(index);
  } else if (this.constModeThumb == this.mode) {
    this._modes.modeThumb.jumpToIndex(index);
  } else { // 1up
    this._modes.mode1Up.jumpToIndex(index, pageX, pageY, noAnimate);
  }
};

/**
 * Return mode or 1up if initial thumb
 * @param {number}
 * @see BookReader.prototype.drawLeafsThumbnail
 */
BookReader.prototype.getPrevReadMode = function(mode) {
  if (mode === BookReader.constMode1up || mode === BookReader.constMode2up) {
    return mode;
  } else if (this.prevReadMode === null) {
    // Initial thumb, return 1up
    return BookReader.constMode1up;
  }
};

/**
 * Switches the mode (eg 1up 2up thumb)
 * @param {number}
 * @param {object} [options]
 * @param {boolean} [options.suppressFragmentChange = false]
 * @param {boolean} [options.onInit = false] - this
 */
BookReader.prototype.switchMode = function(
  mode,
  {
    suppressFragmentChange = false,
    init = false,
    pageFound = false
  } = {}
) {
  // Skip checks before init() complete
  if (this.init.initComplete) {
    if (mode === this.mode) {
      return;
    }
    if (!this.canSwitchToMode(mode)) {
      return;
    }
  }

  this.trigger(BookReader.eventNames.stop);

  this.prevReadMode = this.getPrevReadMode(this.mode);

  if (this.mode != mode) {
    this.activeMode.unprepare?.();
  }

  this.mode = mode;

  // reinstate scale if moving from thumbnail view
  if (this.pageScale !== this.reduce) {
    this.reduce = this.pageScale;
  }

  // $$$ TODO preserve center of view when switching between mode
  //     See https://bugs.edge.launchpad.net/gnubook/+bug/416682

  // XXX maybe better to preserve zoom in each mode
  if (this.constMode1up == mode) {
    this.prepareOnePageView();
  } else if (this.constModeThumb == mode) {
    this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
    this.prepareThumbnailView();
  } else {
    // $$$ why don't we save autofit?
    // this.twoPage.autofit = null; // Take zoom level from other mode
    // spread indices not set, so let's set them
    if (init || !pageFound) {
      this.setSpreadIndices();
    }

    this.twoPageCalculateReductionFactors(); // this sets this.twoPage && this.reduce
    this.prepareTwoPageView();
    this.twoPageCenterView(0.5, 0.5); // $$$ TODO preserve center
  }

  if (!(this.suppressFragmentChange || suppressFragmentChange)) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }
  var eventName = mode + 'PageViewSelected';
  this.trigger(BookReader.eventNames[eventName]);

  this.textSelectionPlugin?.stopPageFlip(this.refs.$brContainer);
};

BookReader.prototype.updateBrClasses = function() {
  var modeToClass = {};
  modeToClass[this.constMode1up] = 'BRmode1up';
  modeToClass[this.constMode2up] = 'BRmode2Up';
  modeToClass[this.constModeThumb] = 'BRmodeThumb';

  this.refs.$br
    .removeClass('BRmode1up BRmode2Up BRmodeThumb')
    .addClass(modeToClass[this.mode]);

  if (this.isFullscreen()) {
    this.refs.$br.addClass('fullscreenActive');
    $(document.body).addClass('BRfullscreenActive');
  } else {
    this.refs.$br.removeClass('fullscreenActive');
    $(document.body).removeClass('BRfullscreenActive');
  }
};

BookReader.prototype.isFullscreen = function() {
  return this.isFullscreenActive;
};

/**
 * Toggles fullscreen
 * @param { boolean } bindKeyboardControls
 */
BookReader.prototype.toggleFullscreen = async function(bindKeyboardControls = true) {
  if (this.isFullscreen()) {
    await this.exitFullScreen();
  } else {
    await this.enterFullscreen(bindKeyboardControls);
  }
};

/**
 * Enters fullscreen
 * including:
 * - animation
 * - binds keyboard controls
 * - fires custom event
 * @param { boolean } bindKeyboardControls
 */
BookReader.prototype.enterFullscreen = async function(bindKeyboardControls = true) {
  const currentIndex = this.currentIndex();
  this.refs.$brContainer.css('opacity', 0);

  if (bindKeyboardControls) {
    this._fullscreenCloseHandler = (e) => {
      if (e.keyCode === 27) this.toggleFullscreen();
    };
    $(document).on("keyup", this._fullscreenCloseHandler);
  }

  const windowWidth = $(window).width();
  if (windowWidth <= this.onePageMinBreakpoint) {
    this.switchMode(this.constMode1up);
  }

  this.isFullscreenActive = true;
  this.animating = true;
  await new Promise(res => this.refs.$brContainer.animate({opacity: 1}, 'fast', 'linear', res));
  this.resize();
  if (this.activeMode instanceof Mode1Up) {
    this.activeMode.mode1UpLit.scale = this.activeMode.mode1UpLit.computeDefaultScale(this._models.book.getPage(currentIndex));
    // Need the new scale to be applied before calling jumpToIndex
    await this.activeMode.mode1UpLit.requestUpdate();
  }
  this.jumpToIndex(currentIndex);
  this.animating = false;

  this.textSelectionPlugin?.stopPageFlip(this.refs.$brContainer);
  // Add "?view=theater"
  this.trigger(BookReader.eventNames.fragmentChange);
  this.trigger(BookReader.eventNames.fullscreenToggled);
};

/**
 * Exits fullscreen
 * - toggles fullscreen
 * - binds keyboard controls
 * - fires custom event
 * @param { boolean } bindKeyboardControls
 */
BookReader.prototype.exitFullScreen = async function () {
  this.refs.$brContainer.css('opacity', 0);

  $(document).off('keyup', this._fullscreenCloseHandler);

  var windowWidth = $(window).width();

  const canShow2up = this.options.controls.twoPage.visible;
  if (canShow2up && (windowWidth <= this.onePageMinBreakpoint)) {
    this.switchMode(this.constMode2up);
  }

  this.isFullscreenActive = false;
  this.updateBrClasses();
  this.animating = true;
  await new Promise((res => this.refs.$brContainer.animate({opacity: 1}, 'fast', 'linear', res)));
  this.resize();

  if (this.activeMode instanceof Mode1Up) {
    this.activeMode.mode1UpLit.scale = this.activeMode.mode1UpLit.computeDefaultScale(this._models.book.getPage(this.currentIndex()));
    await this.activeMode.mode1UpLit.requestUpdate();
  }

  this.animating = false;

  this.textSelectionPlugin?.stopPageFlip(this.refs.$brContainer);
  // Remove "?view=theater"
  this.trigger(BookReader.eventNames.fragmentChange);
  this.trigger(BookReader.eventNames.fullscreenToggled);
};

/**
 * Returns the currently active index
 * @return {number}
 * @throws
 */
BookReader.prototype.currentIndex = function() {
  // $$$ we should be cleaner with our idea of which index is active in 1up/2up
  if (this.mode == this.constMode1up || this.mode == this.constModeThumb) {
    return this.firstIndex; // $$$ TODO page in center of view would be better
  } else if (this.mode == this.constMode2up) {
    // Only allow indices that are actually present in book
    return utils.clamp(this.firstIndex, 0, this._models.book.getNumLeafs() - 1);
  } else {
    throw 'currentIndex called for unimplemented mode ' + this.mode;
  }
};

/**
 * Setter for this.firstIndex
 * Also triggers an event and updates the navbar slider position
 * @param {number} index
 * @param {object} [options]
 * @param {boolean} [options.suppressFragmentChange = false]
 */
BookReader.prototype.updateFirstIndex = function(
  index,
  { suppressFragmentChange = false } = {}
) {
  // If there's no change, do nothing
  if (this.firstIndex === index) return;

  this.firstIndex = index;
  if (!(this.suppressFragmentChange || suppressFragmentChange)) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }
  // If there's an initial search we stop suppressing global URL changes
  // when local suppression ends
  // This seems to correctly handle multiple calls during mode/1up
  if (this.options.initialSearchTerm && !suppressFragmentChange) {
    this.suppressFragmentChange = false;
  }
  this.trigger('pageChanged');
  this.updateNavIndexThrottled(index);
};

/**
 * Flip the right page over onto the left
 */
BookReader.prototype.right = function() {
  if ('rl' != this.pageProgression) {
    this.next();
  } else {
    this.prev();
  }
};

/**
 * Flip to the rightmost page
 */
BookReader.prototype.rightmost = function() {
  if ('rl' != this.pageProgression) {
    this.last();
  } else {
    this.first();
  }
};

/**
 * Flip the left page over onto the right
 */
BookReader.prototype.left = function() {
  if ('rl' != this.pageProgression) {
    this.prev();
  } else {
    this.next();
  }
};

/**
 * Flip to the leftmost page
 */
BookReader.prototype.leftmost = function() {
  if ('rl' != this.pageProgression) {
    this.first();
  } else {
    this.last();
  }
};

BookReader.prototype.next = function() {
  if (this.constMode2up == this.mode) {
    this.trigger(BookReader.eventNames.stop);
    this.flipFwdToIndex(null);
  } else {
    if (this.firstIndex < this.lastDisplayableIndex()) {
      this.jumpToIndex(this.firstIndex + 1);
    }
  }
};

BookReader.prototype.prev = function() {
  const isOnFrontPage = this.firstIndex < 1;
  if (isOnFrontPage) return;

  if (this.constMode2up == this.mode) {
    this.trigger(BookReader.eventNames.stop);
    this.flipBackToIndex(null);
  } else {
    if (this.firstIndex >= 1) {
      this.jumpToIndex(this.firstIndex - 1);
    }
  }
};

BookReader.prototype.first = function() {
  this.jumpToIndex(this.firstDisplayableIndex());
};

BookReader.prototype.last = function() {
  this.jumpToIndex(this.lastDisplayableIndex());
};

/**
 * Scrolls down one screen view
 */
BookReader.prototype.scrollDown = function() {
  if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
    if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
      // Whole pages are visible, scroll whole page only
      return this.next();
    }

    this.refs.$brContainer.stop(true).animate(
      { scrollTop: '+=' + this._scrollAmount() + 'px'},
      400, 'easeInOutExpo'
    );
    return true;
  } else {
    return false;
  }
};

/**
 * Scrolls up one screen view
 */
BookReader.prototype.scrollUp = function() {
  if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
    if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
      // Whole pages are visible, scroll whole page only
      return this.prev();
    }

    this.refs.$brContainer.stop(true).animate(
      { scrollTop: '-=' + this._scrollAmount() + 'px'},
      400, 'easeInOutExpo'
    );
    return true;
  } else {
    return false;
  }
};

/**
 * The amount to scroll vertically in integer pixels
 */
BookReader.prototype._scrollAmount = function() {
  if (this.constMode1up == this.mode) {
    // Overlap by % of page size
    return parseInt(this.refs.$brContainer.prop('clientHeight') - this._models.book.getPageHeight(this.currentIndex()) / this.reduce * 0.03);
  }

  return parseInt(0.9 * this.refs.$brContainer.prop('clientHeight'));
};

/**
 * @deprecated No longer used; will be remove in v5
 */
BookReader.prototype.prefetchImg = async function(index, fetchNow = false) {
  console.warn('Call to deprecated function: BookReader.prefetchImg. No-op.');
};

/**
 * @deprecated No longer used; will be remove in v5
 */
BookReader.prototype.pruneUnusedImgs = function() {
  console.warn('Call to deprecated function: BookReader.pruneUnused. No-op.');
};

/************************/
/** Mode1Up extensions **/
/************************/
/** @deprecated not used outside BookReader */
BookReader.prototype.prepareOnePageView = Mode1Up.prototype.prepare;
exposeOverrideableMethod(Mode1Up, '_modes.mode1Up', 'prepare', 'prepareOnePageView');
/** @deprecated not used outside BookReader */
BookReader.prototype.zoom1up = Mode1Up.prototype.zoom;
exposeOverrideableMethod(Mode1Up, '_modes.mode1Up', 'zoom', 'zoom1up');
/** @deprecated not used outside Mode1Up, BookReader */
BookReader.prototype.resizePageView1up = Mode1Up.prototype.resizePageView;
exposeOverrideableMethod(Mode1Up, '_modes.mode1Up', 'resizePageView', 'resizePageView1up');
/** @deprecated not used outside Mode1Up */
BookReader.prototype.onePageCalculateViewDimensions = Mode1Up.prototype.calculateViewDimensions;
exposeOverrideableMethod(Mode1Up, '_modes.mode1Up', 'calculateViewDimensions', 'onePageCalculateViewDimensions');

/************************/
/** Mode2Up extensions **/
/************************/
/** @deprecated not used outside Mode2Up */
BookReader.prototype.zoom2up = Mode2Up.prototype.zoom;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'zoom', 'zoom2up');
BookReader.prototype.twoPageGetAutofitReduce = Mode2Up.prototype.getAutofitReduce;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'getAutofitReduce', 'twoPageGetAutofitReduce');
BookReader.prototype.flipBackToIndex = Mode2Up.prototype.flipBackToIndex;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipBackToIndex', 'flipBackToIndex');
BookReader.prototype.flipFwdToIndex = Mode2Up.prototype.flipFwdToIndex;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipFwdToIndex', 'flipFwdToIndex');
BookReader.prototype.setHilightCss2UP = Mode2Up.prototype.setHilightCss;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'setHilightCss', 'setHilightCss2UP');
/** @deprecated not used outside Mode2Up */
BookReader.prototype.drawLeafsTwoPage = Mode2Up.prototype.drawLeafs;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'drawLeafs', 'drawLeafsTwoPage');
/** @deprecated not used outside BookReader */
BookReader.prototype.prepareTwoPageView = Mode2Up.prototype.prepareTwoPageView;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'prepareTwoPageView', 'prepareTwoPageView');
/** @deprecated not used outside Mode2Up */
BookReader.prototype.prepareTwoPagePopUp = Mode2Up.prototype.preparePopUp;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'preparePopUp', 'prepareTwoPagePopUp');
/** @deprecated not used outside BookReader, Mode2Up */
BookReader.prototype.calculateSpreadSize = Mode2Up.prototype.calculateSpreadSize;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'calculateSpreadSize', 'calculateSpreadSize');
/** @deprecated not used outside BookReader, Mode2Up */
BookReader.prototype.getIdealSpreadSize = Mode2Up.prototype.getIdealSpreadSize;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'getIdealSpreadSize', 'getIdealSpreadSize');
/** @deprecated not used outside BookReader, Mode2Up */
BookReader.prototype.getSpreadSizeFromReduce = Mode2Up.prototype.getSpreadSizeFromReduce;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'getSpreadSizeFromReduce', 'getSpreadSizeFromReduce');
/** @deprecated unused */
BookReader.prototype.twoPageIsZoomedIn = Mode2Up.prototype.isZoomedIn;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'isZoomedIn', 'twoPageIsZoomedIn');
/** @deprecated not used outside BookReader */
BookReader.prototype.twoPageCalculateReductionFactors = Mode2Up.prototype.calculateReductionFactors;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'calculateReductionFactors', 'twoPageCalculateReductionFactors');
/** @deprecated unused */
BookReader.prototype.twoPageSetCursor = Mode2Up.prototype.setCursor;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'setCursor', 'twoPageSetCursor');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.flipLeftToRight = Mode2Up.prototype.flipLeftToRight;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipLeftToRight', 'flipLeftToRight');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.flipRightToLeft = Mode2Up.prototype.flipRightToLeft;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipRightToLeft', 'flipRightToLeft');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.prepareFlipLeftToRight = Mode2Up.prototype.prepareFlipLeftToRight;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'prepareFlipLeftToRight', 'prepareFlipLeftToRight');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.prepareFlipRightToLeft = Mode2Up.prototype.prepareFlipRightToLeft;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'prepareFlipRightToLeft', 'prepareFlipRightToLeft');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.getPageWidth2UP = Mode2Up.prototype.getPageWidth;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'getPageWidth', 'getPageWidth2UP');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageGutter = Mode2Up.prototype.gutter;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'gutter', 'twoPageGutter');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageTop = Mode2Up.prototype.top;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'top', 'twoPageTop');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageCoverWidth = Mode2Up.prototype.coverWidth;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'coverWidth', 'twoPageCoverWidth');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageGetViewCenter = Mode2Up.prototype.getViewCenter;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'getViewCenter', 'twoPageGetViewCenter');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.twoPageCenterView = Mode2Up.prototype.centerView;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'centerView', 'twoPageCenterView');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageFlipAreaHeight = Mode2Up.prototype.flipAreaHeight;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipAreaHeight', 'twoPageFlipAreaHeight');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageFlipAreaWidth = Mode2Up.prototype.flipAreaWidth;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipAreaWidth', 'twoPageFlipAreaWidth');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.twoPageFlipAreaTop = Mode2Up.prototype.flipAreaTop;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'flipAreaTop', 'twoPageFlipAreaTop');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageLeftFlipAreaLeft = Mode2Up.prototype.leftFlipAreaLeft;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'leftFlipAreaLeft', 'twoPageLeftFlipAreaLeft');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.twoPageRightFlipAreaLeft = Mode2Up.prototype.rightFlipAreaLeft;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'rightFlipAreaLeft', 'twoPageRightFlipAreaLeft');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.gutterOffsetForIndex = Mode2Up.prototype.gutterOffsetForIndex;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'gutterOffsetForIndex', 'gutterOffsetForIndex');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.leafEdgeWidth = Mode2Up.prototype.leafEdgeWidth;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'leafEdgeWidth', 'leafEdgeWidth');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.jumpIndexForLeftEdgePageX = Mode2Up.prototype.jumpIndexForLeftEdgePageX;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'jumpIndexForLeftEdgePageX', 'jumpIndexForLeftEdgePageX');
/** @deprecated unused outside BookReader, Mode2Up */
BookReader.prototype.jumpIndexForRightEdgePageX = Mode2Up.prototype.jumpIndexForRightEdgePageX;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'jumpIndexForRightEdgePageX', 'jumpIndexForRightEdgePageX');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.prefetch = Mode2Up.prototype.prefetch;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'prefetch', 'prefetch');
/** @deprecated unused outside Mode2Up */
BookReader.prototype.setSpreadIndices = Mode2Up.prototype.setSpreadIndices;
exposeOverrideableMethod(Mode2Up, '_modes.mode2Up', 'setSpreadIndices', 'setSpreadIndices');
/**
 * Immediately stop flip animations.  Callbacks are triggered.
 */
BookReader.prototype.stopFlipAnimations = function() {
  this.trigger(BookReader.eventNames.stop);

  // Stop animation, clear queue, trigger callbacks
  if (this.leafEdgeTmp) {
    $(this.leafEdgeTmp).stop(false, true);
  }
  jQuery.each(this._modes.mode2Up.pageContainers, function() {
    $(this.$container).stop(false, true);
  });

  // And again since animations also queued in callbacks
  if (this.leafEdgeTmp) {
    $(this.leafEdgeTmp).stop(false, true);
  }
  jQuery.each(this._modes.mode2Up.pageContainers, function() {
    $(this.$container).stop(false, true);
  });
};

/**
 * @template TClass extends { br: BookReader }
 * Helper method to expose a method onto BookReader from a composed class.
 * Only composed classes in BookReader._overridable can be exposed in this
 * way.
 * @param {new () => TClass} Class
 * @param {keyof BookReader['_overrideable']} classKey
 * @param {keyof TClass} method
 * @param {string} [brMethod]
 */
function exposeOverrideableMethod(Class, classKey, method, brMethod = method) {
  /** @type {function(TClass): BookReader} */
  const classToBr = cls => cls.br;
  /** @type {function(BookReader): TClass} */
  const brToClass = br => br._overrideable[classKey];
  exposeOverrideable(Class, method, classToBr, BookReader, brMethod, brToClass);
}


/***********************/
/** Navbar extensions **/
/***********************/
BookReader.prototype.initNavbar = Navbar.prototype.init;
exposeOverrideableMethod(Navbar, '_components.navbar', 'init', 'initNavbar');
BookReader.prototype.switchNavbarControls = Navbar.prototype.switchNavbarControls;
exposeOverrideableMethod(Navbar, '_components.navbar', 'switchNavbarControls');
BookReader.prototype.updateViewModeButton = Navbar.prototype.updateViewModeButton;
exposeOverrideableMethod(Navbar, '_components.navbar', 'updateViewModeButton');
BookReader.prototype.getNavPageNumString = Navbar.prototype.getNavPageNumString;
exposeOverrideableMethod(Navbar, '_components.navbar', 'getNavPageNumString');
/** @deprecated unused */
BookReader.prototype.getNavPageNumHtml = getNavPageNumHtml;
/** @deprecated unused outside this file */
BookReader.prototype.updateNavPageNum = Navbar.prototype.updateNavPageNum;
exposeOverrideableMethod(Navbar, '_components.navbar', 'updateNavPageNum');
/** @deprecated unused outside this file */
BookReader.prototype.updateNavIndex = Navbar.prototype.updateNavIndex;
exposeOverrideableMethod(Navbar, '_components.navbar', 'updateNavIndex');
/** @deprecated unused outside this file */
BookReader.prototype.updateNavIndexThrottled = utils.throttle(BookReader.prototype.updateNavIndex, 250, false);
/** @deprecated unused */
BookReader.prototype.updateNavIndexDebounced = utils.debounce(BookReader.prototype.updateNavIndex, 500, false);


/************************/
/** Toolbar extensions **/
/************************/
BookReader.prototype.buildToolbarElement = Toolbar.prototype.buildToolbarElement;
exposeOverrideableMethod(Toolbar, '_components.toolbar', 'buildToolbarElement');
BookReader.prototype.initToolbar = Toolbar.prototype.initToolbar;
exposeOverrideableMethod(Toolbar, '_components.toolbar', 'initToolbar');
BookReader.prototype.buildShareDiv = Toolbar.prototype.buildShareDiv;
exposeOverrideableMethod(Toolbar, '_components.toolbar', 'buildShareDiv');
BookReader.prototype.buildInfoDiv = Toolbar.prototype.buildInfoDiv;
exposeOverrideableMethod(Toolbar, '_components.toolbar', 'buildInfoDiv');
BookReader.prototype.getToolBarHeight = Toolbar.prototype.getToolBarHeight;
exposeOverrideableMethod(Toolbar, '_components.toolbar', 'getToolBarHeight');
/** @deprecated zoom no longer in toolbar */
BookReader.prototype.updateToolbarZoom = Toolbar.prototype.updateToolbarZoom;
exposeOverrideableMethod(Toolbar, '_components.toolbar', 'updateToolbarZoom');
/** @deprecated unused */
BookReader.prototype.blankInfoDiv = blankInfoDiv;
/** @deprecated unused */
BookReader.prototype.blankShareDiv = blankShareDiv;
/** @deprecated unused */
BookReader.prototype.createPopup = createPopup;

/**
 * Bind navigation handlers
 */
BookReader.prototype.bindNavigationHandlers = function() {
  const self = this;

  // Note the mobile plugin attaches itself to body, so we need to select outside
  const jIcons = this.$('.BRicon').add('.BRmobileMenu .BRicon');
  // Map of jIcon class -> click handler
  const navigationControls = {
    book_left: () => {
      this.trigger(BookReader.eventNames.stop);
      this.left();
    },
    book_right: () => {
      this.trigger(BookReader.eventNames.stop);
      this.right();
    },
    book_up: () => {
      if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        this.scrollUp();
      } else {
        this.prev();
      }
    },
    book_down: () => {
      if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        this.scrollDown();
      } else {
        this.next();
      }
    },
    book_top: this.first.bind(this),
    book_bottom: this.last.bind(this),
    book_leftmost: this.leftmost.bind(this),
    book_rightmost: this.rightmost.bind(this),
    onepg: () => {
      this.switchMode(self.constMode1up);
    },
    thumb: () => {
      this.switchMode(self.constModeThumb);
    },
    twopg: () => {
      this.switchMode(self.constMode2up);
    },
    zoom_in: () => {
      this.trigger(BookReader.eventNames.stop);
      this.zoom(1);
      this.trigger(BookReader.eventNames.zoomIn);
    },
    zoom_out: () => {
      this.trigger(BookReader.eventNames.stop);
      this.zoom(-1);
      this.trigger(BookReader.eventNames.zoomOut);
    },
    full: () => {
      if (this.ui == 'embed') {
        var url = this.$('.BRembedreturn a').attr('href');
        window.open(url);
      } else {
        this.toggleFullscreen();
      }
    },
  };

  jIcons.filter('.fit').bind('fit', function() {
    // XXXmang implement autofit zoom
  });

  for (const control in navigationControls) {
    jIcons.filter(`.${control}`).on('click.bindNavigationHandlers', () => {
      navigationControls[control]();
      return false;
    });
  }

  var $brNavCntlBtmEl = this.$('.BRnavCntlBtm');
  var $brNavCntlTopEl = this.$('.BRnavCntlTop');

  this.$('.BRnavCntl').click(
    function() {
      var promises = [];
      // TODO don't use magic constants
      // TODO move this to a function
      if ($brNavCntlBtmEl.hasClass('BRdn')) {
        if (self.refs.$BRtoolbar)
          promises.push(self.refs.$BRtoolbar.animate(
            {top: self.getToolBarHeight() * -1}
          ).promise());
        promises.push(self.$('.BRfooter').animate({bottom: self.getFooterHeight() * -1}).promise());
        $brNavCntlBtmEl.addClass('BRup').removeClass('BRdn');
        $brNavCntlTopEl.addClass('BRdn').removeClass('BRup');
        self.$('.BRnavCntlBtm.BRnavCntl').animate({height:'45px'});
        self.$('.BRnavCntl').delay(1000).animate({opacity:.75}, 1000);
      } else {
        if (self.refs.$BRtoolbar)
          promises.push(self.refs.$BRtoolbar.animate({top:0}).promise());
        promises.push(self.$('.BRfooter').animate({bottom:0}).promise());
        $brNavCntlBtmEl.addClass('BRdn').removeClass('BRup');
        $brNavCntlTopEl.addClass('BRup').removeClass('BRdn');
        self.$('.BRnavCntlBtm.BRnavCntl').animate({height:'30px'});
        self.$('.BRvavCntl').animate({opacity:1});
      }
      $.when.apply($, promises).done(function() {
        // Only do full resize in auto mode and need to recalc. size
        if (self.mode == self.constMode2up && self.twoPage.autofit != null
                    && self.twoPage.autofit != 'none'
        ) {
          self.resize();
        } else if (self.mode == self.constMode1up && self.onePage.autofit != null
                           && self.onePage.autofit != 'none') {
          self.resize();
        } else {
          // Don't do a full resize to avoid redrawing images
          self.resizeBRcontainer();
        }
      });
    }
  );
  $brNavCntlBtmEl
    .on("mouseover", function() {
      if ($(this).hasClass('BRup')) {
        self.$('.BRnavCntl').animate({opacity:1},250);
      }
    })
    .on("mouseleave", function() {
      if ($(this).hasClass('BRup')) {
        self.$('.BRnavCntl').animate({opacity:.75},250);
      }
    });
  $brNavCntlTopEl
    .on("mouseover", function() {
      if ($(this).hasClass('BRdn')) {
        self.$('.BRnavCntl').animate({opacity:1},250);
      }
    })
    .on("mouseleave", function() {
      if ($(this).hasClass('BRdn')) {
        self.$('.BRnavCntl').animate({opacity:.75},250);
      }
    });

  this.initSwipeData();

  $(document).off('mousemove.navigation', this.el);
  $(document).on(
    'mousemove.navigation',
    this.el,
    { 'br': this },
    this.navigationMousemoveHandler
  );

  $(document).off('mousedown.swipe', '.BRpageimage');
  $(document).on(
    'mousedown.swipe',
    '.BRpageimage',
    { 'br': this },
    this.swipeMousedownHandler
  );

  this.bindMozTouchHandlers();
};

/**
 * Unbind navigation handlers
 */
BookReader.prototype.unbindNavigationHandlers = function() {
  $(document).off('mousemove.navigation', this.el);
};

/**
 * Handle mousemove related to navigation.  Bind at #BookReader level to allow autohide.
 */
BookReader.prototype.navigationMousemoveHandler = function(event) {
  // $$$ possibly not great to be calling this for every mousemove
  if (event.data['br'].uiAutoHide) {
    // 77px is an approximate height of the Internet Archive Top Nav
    // 75 & 76 (pixels) provide used in this context is checked against the IA top nav height
    var navkey = $(document).height() - 75;
    if ((event.pageY < 76) || (event.pageY > navkey)) {
      // inside or near navigation elements
      event.data['br'].hideNavigation();
    } else {
      event.data['br'].showNavigation();
    }
  }
};

BookReader.prototype.initSwipeData = function(clientX, clientY) {
  /*
     * Based on the really quite awesome "Today's Guardian" at http://guardian.gyford.com/
     */
  this._swipe = {
    mightBeSwiping: false,
    didSwipe: false,
    mightBeDraggin: false,
    didDrag: false,
    startTime: (new Date).getTime(),
    startX: clientX,
    startY: clientY,
    lastX: clientX,
    lastY: clientY,
    deltaX: 0,
    deltaY: 0,
    deltaT: 0
  };
};

BookReader.prototype.swipeMousedownHandler = function(event) {
  var self = event.data['br'];

  // We should be the last bubble point for the page images
  // Disable image drag and select, but keep right-click
  if (event.which == 3) {
    return !self.protected;
  }

  $(event.target).on('mouseout.swipe',
    { 'br': self},
    self.swipeMouseupHandler
  ).on('mouseup.swipe',
    { 'br': self},
    self.swipeMouseupHandler
  ).on('mousemove.swipe',
    { 'br': self },
    self.swipeMousemoveHandler
  );

  self.initSwipeData(event.clientX, event.clientY);
  self._swipe.mightBeSwiping = true;
  self._swipe.mightBeDragging = true;

  event.preventDefault();
  event.returnValue  = false;
  event.cancelBubble = true;
  return false;
};

BookReader.prototype.swipeMousemoveHandler = function(event) {
  var self = event.data['br'];
  var _swipe = self._swipe;
  if (! _swipe.mightBeSwiping) {
    return;
  }

  // Update swipe data
  _swipe.deltaX = event.clientX - _swipe.startX;
  _swipe.deltaY = event.clientY - _swipe.startY;
  _swipe.deltaT = (new Date).getTime() - _swipe.startTime;

  var absX = Math.abs(_swipe.deltaX);
  var absY = Math.abs(_swipe.deltaY);

  // Minimum distance in the amount of tim to trigger the swipe
  var minSwipeLength = Math.min(self.refs.$br.width() / 5, 80);
  var maxSwipeTime = 400;

  // Check for horizontal swipe
  if (absX > absY && (absX > minSwipeLength) && _swipe.deltaT < maxSwipeTime) {
    _swipe.mightBeSwiping = false; // only trigger once
    _swipe.didSwipe = true;
    if (self.mode == self.constMode2up) {
      if (_swipe.deltaX < 0) {
        self.right();
      } else {
        self.left();
      }
    }
  }

  if ( _swipe.deltaT > maxSwipeTime && !_swipe.didSwipe) {
    if (_swipe.mightBeDragging) {
      // Dragging
      _swipe.didDrag = true;
      self.refs.$brContainer
        .scrollTop(self.refs.$brContainer.scrollTop() - event.clientY + _swipe.lastY)
        .scrollLeft(self.refs.$brContainer.scrollLeft() - event.clientX + _swipe.lastX);
    }
  }
  _swipe.lastX = event.clientX;
  _swipe.lastY = event.clientY;

  event.preventDefault();
  event.returnValue  = false;
  event.cancelBubble = true;
  return false;
};

BookReader.prototype.swipeMouseupHandler = function(event) {
  var _swipe = event.data['br']._swipe;
  _swipe.mightBeSwiping = false;
  _swipe.mightBeDragging = false;

  $(event.target).off('mouseout.swipe').off('mouseup.swipe').off('mousemove.swipe');

  if (_swipe.didSwipe || _swipe.didDrag) {
    // Swallow event if completed swipe gesture
    event.preventDefault();
    event.returnValue  = false;
    event.cancelBubble = true;
    return false;
  }
  return true;
};

BookReader.prototype.bindMozTouchHandlers = function() {
  var self = this;

  // Currently only want touch handlers in 2up
  this.refs.$br
    .on('MozTouchDown', function(event) {
      if (this.mode == self.constMode2up) {
        event.preventDefault();
      }
    })
    .on('MozTouchMove', function(event) {
      if (this.mode == self.constMode2up) {
        event.preventDefault();
      }
    })
    .on('MozTouchUp', function(event) {
      if (this.mode == self.constMode2up) {
        event.preventDefault();
      }
    });
};

/**
 * Returns true if the navigation elements are currently visible
 * @return {boolean}
 */
BookReader.prototype.navigationIsVisible = function() {
  // $$$ doesn't account for transitioning states, nav must be fully visible to return true
  var toolpos = this.refs.$BRtoolbar.position();
  var tooltop = toolpos.top;
  return tooltop == 0;
};

/**
 * Main controller that sets navigation into view.
 * Defaults to SHOW the navigation chrome
 */
BookReader.prototype.setNavigationView = function brSetNavigationView(hide) {
  var animationLength = this.constNavAnimationDuration;
  var animationType = 'linear';
  var resizePageContainer = function resizePageContainer () {
    /* main page container fills whole container */
    if (this.constMode2up !== this.mode) {
      var animate = true;
      this.resizeBRcontainer(animate);
    }
    this.trigger(BookReader.eventNames.navToggled);
  }.bind(this);

  var toolbarHeight = 0;
  var navbarHeight = 0;
  if (hide) {
    toolbarHeight = this.getToolBarHeight() * -1;
    navbarHeight = this.getFooterHeight() * -1;

    this.refs.$BRtoolbar.addClass('js-menu-hide');
    this.refs.$BRfooter.addClass('js-menu-hide');
  } else {
    this.refs.$BRtoolbar.removeClass('js-menu-hide');
    this.refs.$BRfooter.removeClass('js-menu-hide');
  }

  this.refs.$BRtoolbar.animate(
    { top: toolbarHeight },
    animationLength,
    animationType,
    resizePageContainer
  );
  this.refs.$BRfooter.animate(
    { bottom: navbarHeight },
    animationLength,
    animationType,
    resizePageContainer
  );
};
/**
 * Hide navigation elements, if visible
 */
BookReader.prototype.hideNavigation = function() {
  // Check if navigation is showing
  if (this.navigationIsVisible()) {
    var hide = true;
    this.setNavigationView(hide);
  }
};

/**
 * Show navigation elements
 */
BookReader.prototype.showNavigation = function() {
  // Check if navigation is hidden
  if (!this.navigationIsVisible()) {
    this.setNavigationView();
  }
};

/**
 * Returns the index of the first visible page, dependent on the mode.
 * $$$ Currently we cannot display the front/back cover in 2-up and will need to update
 * this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
 * @return {number}
 */
BookReader.prototype.firstDisplayableIndex = function() {
  if (this.mode != this.constMode2up) {
    return 0;
  }

  if ('rl' != this.pageProgression) {
    // LTR
    if (this._models.book.getPageSide(0) == 'L') {
      return 0;
    } else {
      return -1;
    }
  } else {
    // RTL
    if (this._models.book.getPageSide(0) == 'R') {
      return 0;
    } else {
      return -1;
    }
  }
};

/**
 * Returns the index of the last visible page, dependent on the mode.
 * $$$ Currently we cannot display the front/back cover in 2-up and will need to update
 * this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
 * @return {number}
 */
BookReader.prototype.lastDisplayableIndex = function() {

  var lastIndex = this._models.book.getNumLeafs() - 1;

  if (this.mode != this.constMode2up) {
    return lastIndex;
  }

  if ('rl' != this.pageProgression) {
    // LTR
    if (this._models.book.getPageSide(lastIndex) == 'R') {
      return lastIndex;
    } else {
      return lastIndex + 1;
    }
  } else {
    // RTL
    if (this._models.book.getPageSide(lastIndex) == 'L') {
      return lastIndex;
    } else {
      return lastIndex + 1;
    }
  }
};


/**************************/
/** BookModel extensions **/
/**************************/
/** @deprecated not used outside */
BookReader.prototype.getMedianPageSize = BookModel.prototype.getMedianPageSize;
exposeOverrideableMethod(BookModel, '_models.book', 'getMedianPageSize');
BookReader.prototype._getPageWidth = BookModel.prototype._getPageWidth;
exposeOverrideableMethod(BookModel, '_models.book', '_getPageWidth');
BookReader.prototype._getPageHeight = BookModel.prototype._getPageHeight;
exposeOverrideableMethod(BookModel, '_models.book', '_getPageHeight');
BookReader.prototype.getPageIndex = BookModel.prototype.getPageIndex;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageIndex');
/** @deprecated not used outside */
BookReader.prototype.getPageIndices = BookModel.prototype.getPageIndices;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageIndices');
BookReader.prototype.getPageName = BookModel.prototype.getPageName;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageName');
BookReader.prototype.getNumLeafs = BookModel.prototype.getNumLeafs;
exposeOverrideableMethod(BookModel, '_models.book', 'getNumLeafs');
BookReader.prototype.getPageWidth = BookModel.prototype.getPageWidth;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageWidth');
BookReader.prototype.getPageHeight = BookModel.prototype.getPageHeight;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageHeight');
BookReader.prototype.getPageURI = BookModel.prototype.getPageURI;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageURI');
BookReader.prototype.getPageSide = BookModel.prototype.getPageSide;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageSide');
BookReader.prototype.getPageNum = BookModel.prototype.getPageNum;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageNum');
BookReader.prototype.getPageProp = BookModel.prototype.getPageProp;
exposeOverrideableMethod(BookModel, '_models.book', 'getPageProp');
BookReader.prototype.getSpreadIndices = BookModel.prototype.getSpreadIndices;
exposeOverrideableMethod(BookModel, '_models.book', 'getSpreadIndices');
BookReader.prototype.leafNumToIndex = BookModel.prototype.leafNumToIndex;
exposeOverrideableMethod(BookModel, '_models.book', 'leafNumToIndex');
BookReader.prototype.parsePageString = BookModel.prototype.parsePageString;
exposeOverrideableMethod(BookModel, '_models.book', 'parsePageString');
/** @deprecated unused */
BookReader.prototype._getDataFlattened = BookModel.prototype._getDataFlattened;
exposeOverrideableMethod(BookModel, '_models.book', '_getDataFlattened');
/** @deprecated unused */
BookReader.prototype._getDataProp = BookModel.prototype._getDataProp;
exposeOverrideableMethod(BookModel, '_models.book', '_getDataProp');

// Parameter related functions

/**
 * Update from the params object
 * @param {Object}
 */
BookReader.prototype.updateFromParams = function(params) {
  // Set init, fragment change options for switchMode()
  const {
    mode = 0,
    init = false,
    fragmentChange = false,
  } = params;

  if (mode) {
    this.switchMode(
      mode,
      { init: init, suppressFragmentChange: !fragmentChange }
    );
  }

  // $$$ process /zoom
  // We only respect page if index is not set
  if ('undefined' != typeof(params.index)) {
    if (params.index != this.currentIndex()) {
      this.jumpToIndex(params.index);
    }
  } else if ('undefined' != typeof(params.page)) {
    // $$$ this assumes page numbers are unique
    if (params.page != this._models.book.getPageNum(this.currentIndex())) {
      this.jumpToPage(params.page);
    }
  }


  // process /search
  // @deprecated for urlMode 'history'
  // Continues to work for urlMode 'hash'
  if (this.enableSearch && 'undefined' != typeof(params.search)) {
    if (this.searchTerm !== params.search) {
      this.$('.BRsearchInput').val(params.search);
    }
  }

  // $$$ process /region
  // $$$ process /highlight

  // $$$ process /theme
  if (this.enableThemesPlugin && 'undefined' != typeof(params.theme)) {
    this.updateTheme(params.theme);
  }
};

/**
 * Returns true if we can switch to the requested mode
 * @param {number} mode
 * @return {boolean}
 */
BookReader.prototype.canSwitchToMode = function(mode) {
  if (mode == this.constMode2up || mode == this.constModeThumb) {
    // check there are enough pages to display
    // $$$ this is a workaround for the mis-feature that we can't display
    //     short books in 2up mode
    if (this._models.book.getNumLeafs() < 2) {
      return false;
    }
  }

  return true;
};


/**
 * @deprecated. Use PageModel.getURISrcSet. Slated for removal in v5.
 * Returns the srcset with correct URIs or void string if out of range
 * Also makes the reduce argument optional
 * @param {number} index
 * @param {number} [reduce]
 * @param {number} [rotate]
 * @return {string}
 */
BookReader.prototype._getPageURISrcset = function(index, reduce, rotate) {
  const page = this._models.book.getPage(index, false);
  // Synthesize page
  if (!page) return "";

  // reduce not passed in
  // $$$ this probably won't work for thumbnail mode
  if ('undefined' == typeof(reduce)) {
    reduce = page.height / this.twoPage.height;
  }

  return page.getURISrcSet(reduce, rotate);
};


/**
 * Returns the page URI or transparent image if out of range
 * Also makes the reduce argument optional
 * @param {number} index
 * @param {number} [reduce]
 * @param {number} [rotate]
 * @return {string}
 */
BookReader.prototype._getPageURI = function(index, reduce, rotate) {
  const page = this._models.book.getPage(index, false);
  // Synthesize page
  if (!page) return this.imagesBaseURL + "transparent.png";

  if ('undefined' == typeof(reduce)) {
    // reduce not passed in
    // $$$ this probably won't work for thumbnail mode
    reduce = page.height / this.twoPage.height;
  }

  return page.getURI(reduce, rotate);
};

/**
 * @param {string} msg
 * @param {function|undefined} onCloseCallback
 */
BookReader.prototype.showProgressPopup = function(msg, onCloseCallback) {
  if (this.popup) return;

  this.popup = document.createElement("div");
  $(this.popup).prop('className', 'BRprogresspopup');

  if (typeof(onCloseCallback) === 'function') {
    const closeButton = document.createElement('button');
    closeButton.setAttribute('title', 'close');
    closeButton.setAttribute('class', 'close-popup');
    const icon = document.createElement('span');
    icon.setAttribute('class', 'icon icon-close-dark');
    $(closeButton).append(icon);
    closeButton.addEventListener('click', () => {
      onCloseCallback();
      this.removeProgressPopup();
    });
    $(this.popup).append(closeButton);
  }

  const bar = document.createElement("div");
  $(bar).css({
    height:   '20px'
  }).prop('className', 'BRprogressbar');
  $(this.popup).append(bar);

  if (msg) {
    const msgdiv = document.createElement("div");
    msgdiv.innerHTML = msg;
    $(this.popup).append(msgdiv);
  }

  $(this.popup).appendTo(this.refs.$br);
};

BookReader.prototype.removeProgressPopup = function() {
  $(this.popup).remove();
  this.$('.BRprogresspopup').remove();
  this.popup = null;
};

/**
 * Can be overridden
 */
BookReader.prototype.initUIStrings = function() {
  // Navigation handlers will be bound after all UI is in place -- makes moving icons between
  // the toolbar and nav bar easier

  // Setup tooltips -- later we could load these from a file for i18n
  var titles = {
    '.logo': 'Go to Archive.org', // $$$ update after getting OL record
    '.zoom_in': 'Zoom in',
    '.zoom_out': 'Zoom out',
    '.onepg': 'One-page view',
    '.twopg': 'Two-page view',
    '.thumb': 'Thumbnail view',
    '.print': 'Print this page',
    '.embed': 'Embed BookReader',
    '.link': 'Link to this book (and page)',
    '.bookmark': 'Bookmark this page',
    '.share': 'Share this book',
    '.info': 'About this book',
    '.full': 'Toggle fullscreen',
    '.book_left': 'Flip left',
    '.book_right': 'Flip right',
    '.book_up': 'Page up',
    '.book_down': 'Page down',
    '.play': 'Play',
    '.pause': 'Pause',
    '.BRdn': 'Show/hide nav bar', // Would have to keep updating on state change to have just "Hide nav bar"
    '.BRup': 'Show/hide nav bar',
    '.book_top': 'First page',
    '.book_bottom': 'Last page',
    '.book_leftmost': 'First page',
    '.book_rightmost': 'Last page',
  };
  if ('rl' == this.pageProgression) {
    titles['.book_leftmost'] = 'Last page';
    titles['.book_rightmost'] = 'First page';
  }

  for (var icon in titles) {
    this.$(icon).prop('title', titles[icon]);
  }
};

/**
 * Reloads images. Useful when some images might have failed.
 */
BookReader.prototype.reloadImages = function() {
  this.refs.$brContainer.find('img').each(function(index, elem) {
    if (!elem.complete || elem.naturalHeight === 0) {
      var src = elem.src;
      elem.src = '';
      setTimeout(function() {
        elem.src = src;
      }, 1000);
    }
  });
};

/**
 * @param {boolean} ignoreDisplay - bypass the display check
 * @return {number}
 */
BookReader.prototype.getFooterHeight = function() {
  var $heightEl = this.mode == this.constMode2up ? this.refs.$BRfooter : this.refs.$BRnav;
  if ($heightEl && this.refs.$BRfooter) {
    var outerHeight = $heightEl.outerHeight();
    var bottom = parseInt(this.refs.$BRfooter.css('bottom'));
    if (!isNaN(outerHeight) && !isNaN(bottom)) {
      return outerHeight + bottom;
    }
  }
  return 0;
};

// Basic Usage built-in Methods (can be overridden through options)
// This implementation uses options.data value for populating BookReader

/**
 * Create a params object from the current parameters.
 * @return {Object}
 */
BookReader.prototype.paramsFromCurrent = function() {
  var params = {};

  // Path params
  var index = this.currentIndex();
  var pageNum = this._models.book.getPageNum(index);
  if ((pageNum === 0) || pageNum) {
    params.page = pageNum;
  }

  params.index = index;
  params.mode = this.mode;

  // Unused params
  // $$$ highlight
  // $$$ region

  // Querystring params
  // View
  const fullscreenView = 'theater';
  if (this.isFullscreenActive) {
    params.view = fullscreenView;
  }
  // Search
  if (this.enableSearch) {
    params.search = this.searchTerm;
  }

  return params;
};

/**
 * Return an object with configuration parameters from a fragment string.
 *
 * Fragments are formatted as a URL path but may be used outside of URLs as a
 * serialization format for BookReader parameters
 *
 * @see http://openlibrary.org/dev/docs/bookurls for fragment syntax
 *
 * @param {string} fragment initial # is allowed for backwards compatibility
 *                          but is deprecated
 * @return {Object}
 */
BookReader.prototype.paramsFromFragment = function(fragment) {
  var params = {};

  // For backwards compatibility we allow an initial # character
  // (as from window.location.hash) but don't require it
  if (fragment.substr(0, 1) == '#') {
    fragment = fragment.substr(1);
  }

  // Simple #nn syntax
  var oldStyleLeafNum = parseInt( /^\d+$/.exec(fragment) );
  if ( !isNaN(oldStyleLeafNum) ) {
    params.index = oldStyleLeafNum;

    // Done processing if using old-style syntax
    return params;
  }

  // Split into key-value pairs
  var urlArray = fragment.split('/');
  var urlHash = {};
  for (var i = 0; i < urlArray.length; i += 2) {
    urlHash[urlArray[i]] = urlArray[i + 1];
  }

  // Mode
  if ('1up' == urlHash['mode']) {
    params.mode = this.constMode1up;
  } else if ('2up' == urlHash['mode']) {
    params.mode = this.constMode2up;
  } else if ('thumb' == urlHash['mode']) {
    params.mode = this.constModeThumb;
  }

  // Index and page
  if ('undefined' != typeof(urlHash['page'])) {
    // page was set -- may not be int
    params.page = urlHash['page'];
  }

  // $$$ process /region
  // $$$ process /search

  if (urlHash['search'] != undefined) {
    params.search = utils.decodeURIComponentPlus(urlHash['search']);
  }

  // $$$ process /highlight

  // $$$ process /theme
  if (urlHash['theme'] != undefined) {
    params.theme = urlHash['theme'];
  }
  return params;
};

/**
 * Create a fragment string from the params object.
 *
 * Fragments are formatted as a URL path but may be used outside of URLs as a
 * serialization format for BookReader parameters
 *
 * @see https://openlibrary.org/dev/docs/bookurls for fragment syntax
 *
 * @param {Object} params
 * @param {string} [urlMode]
 * @return {string}
 */
BookReader.prototype.fragmentFromParams = function(params, urlMode = 'hash') {
  const separator = '/';
  const fragments = [];

  if ('undefined' != typeof(params.page)) {
    fragments.push('page', params.page);
  } else {
    if ('undefined' != typeof(params.index)) {
      // Don't have page numbering but we do have the index
      fragments.push('page', 'n' + params.index);
    }
  }

  // $$$ highlight
  // $$$ region

  // mode
  if ('undefined' != typeof(params.mode)) {
    if (params.mode == this.constMode1up) {
      fragments.push('mode', '1up');
    } else if (params.mode == this.constMode2up) {
      fragments.push('mode', '2up');
    } else if (params.mode == this.constModeThumb) {
      fragments.push('mode', 'thumb');
    } else {
      throw 'fragmentFromParams called with unknown mode ' + params.mode;
    }
  }

  // search
  if (params.search && urlMode === 'hash') {
    fragments.push('search', params.search);
  }

  return utils.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
};

/**
 * Create, update querystring from the params object
 *
 * Handles:
 *  view=
 *  q=
 * @param {Object} params
 * @param {string} currQueryString
 * @param {string} [urlMode]
 * @return {string}
 */
BookReader.prototype.queryStringFromParams = function(
  params,
  currQueryString,
  urlMode = 'hash'
) {
  const newParams = new URLSearchParams(currQueryString);

  if (params.view) {
    // Set ?view=theater when fullscreen
    newParams.set('view', params.view);
  } else {
    // Remove
    newParams.delete('view');
  }

  if (params.search && urlMode === 'history') {
    newParams.set('q', params.search);
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString
  // Note: This method returns the query string without the question mark.
  const result = newParams.toString();
  return result ? '?' + result : '';
};

/**
 * Helper to select within instance's elements
 */
BookReader.prototype.$ = function(selector) {
  return this.refs.$br.find(selector);
};

/**
 * Polyfill for deprecated method
 */
jQuery.curCSS = function(element, prop, val) {
  return jQuery(element).css(prop, val);
};

window.BookReader = BookReader;
