/*
Copyright(c)2008-2016 Internet Archive. Software license AGPL version 3.

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

window.BookReader = (function ($) {

// BookReader()
//_________________________________________________________________________

/**
 * BookReader
 * @param      {Object} options
 * TODO document all options properties
 * @constructor
 */
function BookReader(options) {
    options = options || {};
    options = jQuery.extend(true, {}, BookReader.defaultOptions, options, BookReader.optionOverrides);
    this.setup(options);
}

BookReader.version = "3.2.1";

// Mode constants
BookReader.constMode1up = 1;
BookReader.constMode2up = 2;
BookReader.constModeThumb = 3;

// Names of events that can be triggered via BookReader.prototype.trigger()
BookReader.eventNames = {
    // Indicates that the fragment (a serialization of the reader state)
    // has changed.
    fragmentChange: 'fragmentChange',
};

BookReader.defaultOptions = {
    // A string, such as "mode/1up"
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

    bookTitle: '',
    bookUrl: null,
    bookUrlText: null,
    bookUrlTitle: null,

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
    leafNumToIndex: null,

    // Optional: if present, and embed code will be shown in the share dialog
    getEmbedCode: null,
};

/**
 * This is here, just in case you need to absolutely override an option.
 */
BookReader.optionOverrides = {};

/**
 * Setup
 * It is separate from the constructor, so plugins can extend.
 * @param  {Object} options
 */
BookReader.prototype.setup = function(options) {
    // Store the options used to setup bookreader
    this.options = options;

    // @deprecated: Instance constants. Use Class constants instead
    this.constMode1up = BookReader.constMode1up;
    this.constMode2up = BookReader.constMode2up;
    this.constModeThumb = BookReader.constModeThumb;

    // Private properties below. Configuration should be done with options.
    this.reduce = 4;
    this.defaults = options.defaults;
    this.padding = options.padding;
    this.mode = this.constMode1up;
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
    this.imgs = {};
    this.prefetchedImgs = {}; //an object with numeric keys cooresponding to page index

    this.animating = false;
    this.auto      = false;
    this.autoTimer = null;
    this.flipSpeed = options.flipSpeed;
    this.twoPagePopUp = null;
    this.leafEdgeTmp  = null;
    this.firstIndex = null;
    this.lastDisplayableIndex2up = null;

    this.showToolbar = options.showToolbar;
    this.showLogo = options.showLogo;
    this.logoURL = options.logoURL;
    this.imagesBaseURL = options.imagesBaseURL;

    this.reductionFactors = options.reductionFactors;
    this.onePage = options.onePage;
    this.twoPage = options.twoPage;

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

    // Assign the data methods
    this.data = options.data;
    this.getNumLeafs = options.getNumLeafs || BookReader.prototype.getNumLeafs;
    this.getPageWidth = options.getPageWidth  || BookReader.prototype.getPageWidth;
    this.getPageHeight = options.getPageHeight || BookReader.prototype.getPageHeight;
    this.getPageURI = options.getPageURI || BookReader.prototype.getPageURI;
    this.getPageSide = options.getPageSide || BookReader.prototype.getPageSide;
    this.getPageNum = options.getPageNum || BookReader.prototype.getPageNum;
    this.getSpreadIndices = options.getSpreadIndices || BookReader.prototype.getSpreadIndices;
    this.leafNumToIndex = options.leafNumToIndex || BookReader.prototype.leafNumToIndex;
    this.refs = {};
};

// Library functions
// At top of file so they can be used below
BookReader.util = {
    disableSelect: function(jObject) {
        // Bind mouse handlers
        // Disable mouse click to avoid selected/highlighted page images - bug 354239
        jObject.bind('mousedown', function(e) {
            // $$$ check here for right-click and don't disable.  Also use jQuery style
            //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
            return false;
        });
        // Special hack for IE7
        jObject[0].onselectstart = function(e) { return false; };
    },

    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Given value and maximum, calculate a percentage suitable for CSS
    cssPercentage: function(value, max) {
        return (((value + 0.0) / max) * 100) + '%';
    },

    notInArray: function(value, array) {
        // inArray returns -1 or undefined if value not in array
        return ! (jQuery.inArray(value, array) >= 0);
    },

    getIFrameDocument: function(iframe) {
        // Adapted from http://xkr.us/articles/dom/iframe-document/
        var outer = (iframe.contentWindow || iframe.contentDocument);
        return (outer.document || outer);
    },

    escapeHTML: function (str) {
        return(
            str.replace(/&/g,'&amp;').
                replace(/>/g,'&gt;').
                replace(/</g,'&lt;').
                replace(/"/g,'&quot;')
        );
    },

    decodeURIComponentPlus: function(value) {
        // Decodes a URI component and converts '+' to ' '
        return decodeURIComponent(value).replace(/\+/g, ' ');
    },

    encodeURIComponentPlus: function(value) {
        // Encodes a URI component and converts ' ' to '+'
        return encodeURIComponent(value).replace(/%20/g, '+');
    },

    /**
     * Returns a function, that, as long as it continues to be invoked, will not
     * be triggered. The function will be called after it stops being called for
     * N milliseconds. If `immediate` is passed, trigger the function on the
     * leading edge, instead of the trailing.
     * @see https://davidwalsh.name/javascript-debounce-function
     */
    debounce: function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },

    /**
     * Throttle function
     * @see https://remysharp.com/2010/07/21/throttling-function-calls
     */
    throttle: function(fn, threshhold, delay) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;
        if (delay) last = +new Date;
        return function () {
          var context = this;
          var now = +new Date,
              args = arguments;
          if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
              last = now;
              fn.apply(context, args);
            }, threshhold);
          } else {
            last = now;
            fn.apply(context, args);
          }
        };
    },
};

/**
 * Helper to merge in params in to a params object.
 * It normalizes "page" into the "index" field to disambiguate and prevent concflicts
 * @private
 */
BookReader.prototype.extendParams = function(params, newParams) {
    var modifiedNewParams = $.extend(true, newParams);
    if ('undefined' != typeof(modifiedNewParams.page)) {
        var pageIndex = this.parsePageString(modifiedNewParams.page);
        if (!isNaN(pageIndex))
            modifiedNewParams.index = pageIndex;
        delete modifiedNewParams.page;
    }
    $.extend(true, params, modifiedNewParams);
}

/**
 * Parses params from from various initialization contexts (url, cookie, options)
 * @private
 * @return {object} the parased params
 */
BookReader.prototype.initParams = function() {
    var params = {};

    // This is ordered from lowest to highest priority

    // If we have a title leaf, use that as the default instead of index 0,
    // but only use as default if book has a few pages
    if ('undefined' != typeof(this.titleLeaf) && this.getNumLeafs() > 2) {
        params.index = this.leafNumToIndex(this.titleLeaf);
    } else {
        params.index = 0;
    }

    // this.defaults is a string passed in the url format. eg "page/1/mode/1up"
    if (this.defaults) {
        this.extendParams(params, this.paramsFromFragment(this.defaults));
    }

    // Check for Resume plugin
    if (this.enablePageResume) {
        // Check cookies
        var val = this.getResumeValue();
        if (val !== null) {
            params.index = val;
        }
    }

    if (this.enableUrlPlugin && window.location.hash) {
        // params explicitly set in URL take precedence over all other methods
        var urlParams = this.paramsFromFragment(window.location.hash.substr(1));
        if (urlParams.mode) {
            this.prevReadMode = urlParams.mode;
        }
        this.extendParams(params, urlParams);
    }

    return params;
}

// init()
//______________________________________________________________________________
BookReader.prototype.init = function() {
    this.pageScale = this.reduce; // preserve current reduce

    var params = this.initParams();

    // params.index takes precedence over params.page
    if (params.index) {
        this.firstIndex = params.index;
    } else {
        this.firstIndex = 0;
    }

    // Use params or browser width to set view mode
    var windowWidth = $(window).width();
    var nextMode;
    if ('undefined' != typeof(params.mode)) {
        nextMode = params.mode;
    } else if (this.ui == 'full'
          && (this.enableMobileNav && windowWidth <= this.onePageMinBreakpoint)) {
        // In full mode, we set the default based on width
        nextMode = this.constMode1up;
    } else {
        nextMode = this.constMode2up;
    }

    if (this.canSwitchToMode(nextMode)) {
        this.mode = nextMode;
    } else {
        this.mode = this.constMode1up;
    }

    //-------------------------------------------------------------------------
    // Setup Navbars and other UI

    this.isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);

    // Calculate Max page num (used for pagination display)
    this.maxPageNum = 0;
    var pageNumVal;
    for (var i = 0; i < this.getNumLeafs(); i++) {
        pageNumVal = this.getPageNum(i);
        if (!isNaN(pageNumVal) && pageNumVal > this.maxPageNum) {
            this.maxPageNum = pageNumVal;
        }
    }

    this.refs.$br = $(this.el);
    this.refs.$br.empty().removeClass().addClass("ui-" + this.ui).addClass('BookReader');
    this.initToolbar(this.mode, this.ui); // Build inside of toolbar div

    this.refs.$brContainer = $("<div class='BRcontainer' dir='ltr'></div>");
    this.refs.$br.append(this.refs.$brContainer);

    // We init the nav bar after the params processing so that the nav slider
    // knows where it should start (doesn't jump after init)
    if (this.ui == "embed") {
        this.initEmbedNavbar();
    } else {
        this.initNavbar();
    }
    this.resizeBRcontainer();

    // Set strings in the UI
    this.initUIStrings();

    // $$$ refactor this so it's enough to set the first index and call preparePageView
    //     (get rid of mode-specific logic at this point)
    if (this.constMode1up == this.mode) {
        this.prepareOnePageView();
    } else if (this.constModeThumb == this.mode) {
        this.prepareThumbnailView();
    } else {
        this.displayedIndices = [this.firstIndex];
        this.prepareTwoPageView();
    }

    // Enact other parts of initial params
    this.updateFromParams(params);

    // Add a class if this is a touch enabled device
    if (this.isTouchDevice) {
      $("body").addClass("touch");
    } else {
      $("body").addClass("no-touch");
    }

    // Add class to body for mode. Responsiveness is disabled in embed.
    $("body").addClass("br-ui-" + this.ui);

    //-------------------------------------------------------------------------
    // Bind to events

    if (!this.isTouchDevice) this.setupTooltips();
    this.bindNavigationHandlers();
    this.setupKeyListeners();

    this.lastScroll = (new Date().getTime());
    this.refs.$brContainer.bind('scroll', this, function(e) {
        // Note, this scroll event fires for both user, and js generated calls
        // It is functioning in some cases as the primary triggerer for rendering
        e.data.lastScroll = (new Date().getTime());
        if (e.data.constMode2up != e.data.mode) {
          e.data.drawLeafsThrottled();
        }
    });

    $(window).bind('resize', this, function(e) {
        e.data.resize();
    });
    $(window).bind("orientationchange", this, function(e) {
        e.data.resize();
    });

    if (this.protected) {
        $(document).on('contextmenu dragstart', '.BRpagediv1up', function(e) {
            return false;
        });
        $(document).on('contextmenu dragstart', '.BRpageimage', function(e) {
            return false;
        });
        $(document).on('contextmenu dragstart', '.BRpagedivthumb', function(e) {
            return false;
        });
        $('.BRicon.share').hide();
    }

    $('.BRpagediv1up').bind('mousedown', this, function(e) {
        // $$$ the purpose of this is to disable selection of the image (makes it turn blue)
        //     but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
        return false;
    });

    this.bind('stop', function(e, br) {
        br.autoStop();
    });

    this.trigger('PostInit');

    this.init.initComplete = true;
}

BookReader.prototype.trigger = function(name, props) {
    $(document).trigger('BookReader:' + name, this, props);
};

BookReader.prototype.bind = function(name, callback) {
    $(document).bind('BookReader:' + name, callback);
};

BookReader.prototype.unbind = function(name, callback) {
    $(document).bind('BookReader:' + name, callback);
};

// resize
// Resizes the bookreader
//______________________________________________________________________________
BookReader.prototype.resize = function() {
  if (!this.init.initComplete) return;

  this.resizeBRcontainer();

  if (this.constMode1up == this.mode) {
      if (this.onePage.autofit != 'none') {
          this.resizePageView();
          this.centerPageView();
          if (this.enableSearch) this.updateSearchHilites(); //deletes hilights but does not call remove()
      } else {
          this.centerPageView();
          this.displayedIndices = [];
          if (this.enableSearch) this.updateSearchHilites(); //deletes hilights but does not call remove()
          this.drawLeafsThrottled();
      }
  } else if (this.constModeThumb == this.mode){
      this.prepareThumbnailView();
  } else {
      // We only need to prepare again in autofit (size of spread changes)
      if (this.twoPage.autofit) {
          this.prepareTwoPageView();
      } else {
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
};

BookReader.prototype.setupKeyListeners = function() {
    var self = this;

    var KEY_PGUP = 33;
    var KEY_PGDOWN = 34;
    var KEY_END = 35;
    var KEY_HOME = 36;

    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;

    // We use document here instead of window to avoid a bug in jQuery on IE7
    $(document).keydown(function(e) {

        // Keyboard navigation
        if (!self.keyboardNavigationIsDisabled(e)) {
            switch(e.keyCode) {
                case KEY_PGUP:
                case KEY_UP:
                    // In 1up mode page scrolling is handled by browser
                    if (self.constMode2up == self.mode) {
                        e.preventDefault();
                        self.prev();
                    }
                    break;
                case KEY_DOWN:
                case KEY_PGDOWN:
                    if (self.constMode2up == self.mode) {
                        e.preventDefault();
                        self.next();
                    }
                    break;
                case KEY_END:
                    e.preventDefault();
                    self.last();
                    break;
                case KEY_HOME:
                    e.preventDefault();
                    self.first();
                    break;
                case KEY_LEFT:
                    if (self.constModeThumb != self.mode) {
                        e.preventDefault();
                        self.left();
                    }
                    break;
                case KEY_RIGHT:
                    if (self.constModeThumb != self.mode) {
                        e.preventDefault();
                        self.right();
                    }
                    break;
            }
        }
    });
};

// setupTooltips()
//______________________________________________________________________________
BookReader.prototype.setupTooltips = function() {
    $('.js-tooltip').bt(
      {
        positions: ['top', 'bottom'],
        shrinkToFit: true,
        spikeGirth: 5,
        spikeLength: 3,
        fill: '#4A90E2',
        cornerRadius: 0,
        strokeWidth: 0,
        cssStyles: {
          color: 'white',
          fontSize: '1.25em',
          whiteSpace: 'nowrap'
        },
      }
    )
    ;
}

// loadImage()
//______________________________________________________________________________
BookReader.prototype.loadImage = function(src, index, img) {
    img.src = src;
}

// drawLeafs()
//______________________________________________________________________________
BookReader.prototype.drawLeafs = function() {
    if (this.constMode1up == this.mode) {
        this.drawLeafsOnePage();
    } else if (this.constModeThumb == this.mode) {
        this.drawLeafsThumbnail();
    } else {
        this.drawLeafsTwoPage();
    }
};

// bindGestures(jElement)
//______________________________________________________________________________
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

BookReader.prototype.setClickHandler2UP = function( element, data, handler) {
    $(element).unbind('click').bind('click', data, function(e) {
        handler(e);
    });
};

// drawLeafsOnePage()
//______________________________________________________________________________
BookReader.prototype.drawLeafsOnePage = function() {
    var containerHeight = this.refs.$brContainer.height();
    var scrollTop = this.refs.$brContainer.prop('scrollTop');
    var scrollBottom = scrollTop + containerHeight;
    var viewWidth = this.refs.$brContainer.prop('scrollWidth');

    var indicesToDisplay = [];

    var i;
    var leafTop = 0;
    var leafBottom = 0;
    for (i=0; i<this.getNumLeafs(); i++) {
        var height  = parseInt(this._getPageHeight(i)/this.reduce);

        leafBottom += height;
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        if (topInView || bottomInView || middleInView) {
            indicesToDisplay.push(i);
        }
        leafTop += height +10;
        leafBottom += 10;
    }

    // Based of the pages displayed in the view we set the current index
    // $$$ we should consider the page in the center of the view to be the current one
    var firstIndexToDraw  = indicesToDisplay[0];
    this.firstIndex = firstIndexToDraw;

    // Notify of new fragment, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedIndices.length > 0) {
        this.trigger(BookReader.eventNames.fragmentChange);
    }

    if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
        firstIndexToDraw--;
        indicesToDisplay.unshift(firstIndexToDraw);
    }

    var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
    if ( ((this.getNumLeafs()-1) != lastIndexToDraw) && (1 < this.reduce) ) {
        indicesToDisplay.push(lastIndexToDraw+1);
    }

    var BRpageViewEl = document.getElementById('BRpageview');

    leafTop = 0;
    var i;
    for (i=0; i<firstIndexToDraw; i++) {
        leafTop += parseInt(this._getPageHeight(i)/this.reduce) +10;
    }

    for (i=0; i<indicesToDisplay.length; i++) {
        var index = indicesToDisplay[i];
        var height  = parseInt(this._getPageHeight(index)/this.reduce);

        if (BookReader.util.notInArray(indicesToDisplay[i], this.displayedIndices)) {
            var width   = parseInt(this._getPageWidth(index)/this.reduce);
            var div = document.createElement('div');
            div.className = 'BRpagediv1up';
            div.id = 'pagediv'+index;
            div.style.position = "absolute";
            div.style.top = leafTop + 'px';
            var left = (viewWidth-width)>>1;
            if (left<0) left = 0;
            div.style.left = left + 'px';
            div.style.width = width + 'px';
            div.style.height = height + 'px';

            BRpageViewEl.appendChild(div);

            var img = document.createElement('img');
            img.className = 'BRnoselect BRonePageImage';
            img.style.width = width + 'px';
            img.style.height = height + 'px';
            div.appendChild(img);
            this.loadImage(this._getPageURI(index, this.reduce, 0), index, img);
        }

        leafTop += height +10;

    }

    for (i=0; i<this.displayedIndices.length; i++) {
        if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
            var index = this.displayedIndices[i];
            $('#pagediv'+index).remove();
        }
    }

    this.displayedIndices = indicesToDisplay.slice();
    if (this.enableSearch) this.updateSearchHilites();

    if (null != this.getPageNum(firstIndexToDraw))  {
        $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce);

    // Update the slider
    this.updateNavIndexThrottled();
};

// drawLeafsThumbnail()
//______________________________________________________________________________
// If seekIndex is defined, the view will be drawn with that page visible (without any
// animated scrolling)
BookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
    var viewWidth = this.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer

    var i;
    var leafWidth;
    var leafHeight;
    var rightPos = 0;
    var bottomPos = 0;
    var maxRight = 0;
    var currentRow = 0;
    var leafIndex = 0;
    var leafMap = [];

    var self = this;

    // Will be set to top of requested seek index, if set
    var seekTop;

    // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
    for (i=0; i<this.getNumLeafs(); i++) {
        leafWidth = this.thumbWidth;
        if (rightPos + (leafWidth + this.thumbPadding) > viewWidth){
            currentRow++;
            rightPos = 0;
            leafIndex = 0;
        }

        if (leafMap[currentRow]===undefined) { leafMap[currentRow] = {}; }
        if (leafMap[currentRow].leafs===undefined) {
            leafMap[currentRow].leafs = [];
            leafMap[currentRow].height = 0;
            leafMap[currentRow].top = 0;
        }
        leafMap[currentRow].leafs[leafIndex] = {};
        leafMap[currentRow].leafs[leafIndex].num = i;
        leafMap[currentRow].leafs[leafIndex].left = rightPos;

        leafHeight = parseInt((this.getPageHeight(leafMap[currentRow].leafs[leafIndex].num)*this.thumbWidth)/this.getPageWidth(leafMap[currentRow].leafs[leafIndex].num), 10);
        if (leafHeight > leafMap[currentRow].height) {
            leafMap[currentRow].height = leafHeight;
        }
        if (leafIndex===0) { bottomPos += this.thumbPadding + leafMap[currentRow].height; }
        rightPos += leafWidth + this.thumbPadding;
        if (rightPos > maxRight) { maxRight = rightPos; }
        leafIndex++;

        if (i == seekIndex) {
            seekTop = bottomPos - this.thumbPadding - leafMap[currentRow].height;
        }
    }

    // reset the bottom position based on thumbnails
    $('#BRpageview').height(bottomPos);

    var pageViewBuffer = Math.floor((this.refs.$brContainer.prop('scrollWidth') - maxRight) / 2) - 14;

    // If seekTop is defined, seeking was requested and target found
    if (typeof(seekTop) != 'undefined') {
        this.refs.$brContainer.scrollTop( seekTop );
    }

    var scrollTop = this.refs.$brContainer.prop('scrollTop');
    var scrollBottom = scrollTop + this.refs.$brContainer.height();

    var leafTop = 0;
    var leafBottom = 0;
    var rowsToDisplay = [];

    // Visible leafs with least/greatest index
    var leastVisible = this.getNumLeafs() - 1;
    var mostVisible = 0;

    // Determine the thumbnails in view
    for (i=0; i<leafMap.length; i++) {
        leafBottom += this.thumbPadding + leafMap[i].height;
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        if (topInView || bottomInView || middleInView) {
            rowsToDisplay.push(i);
            if (leafMap[i].leafs[0].num < leastVisible) {
                leastVisible = leafMap[i].leafs[0].num;
            }
            if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
                mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
            }
        }
        if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
        leafTop = leafBottom;
    }

    // create a buffer of preloaded rows before and after the visible rows
    var firstRow = rowsToDisplay[0];
    var lastRow = rowsToDisplay[rowsToDisplay.length-1];
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (lastRow+i < leafMap.length) { rowsToDisplay.push(lastRow+i); }
    }
    for (i=1; i<this.thumbRowBuffer+1; i++) {
        if (firstRow-i >= 0) { rowsToDisplay.push(firstRow-i); }
    }

    // Create the thumbnail divs and images (lazy loaded)
    var j;
    var row;
    var left;
    var index;
    var div;
    var link;
    var img;
    var page;
    for (i=0; i<rowsToDisplay.length; i++) {
        if (BookReader.util.notInArray(rowsToDisplay[i], this.displayedRows)) {
            row = rowsToDisplay[i];

            for (j=0; j<leafMap[row].leafs.length; j++) {
                index = j;
                leaf = leafMap[row].leafs[j].num;

                leafWidth = this.thumbWidth;
                leafHeight = parseInt((this.getPageHeight(leaf)*this.thumbWidth)/this.getPageWidth(leaf), 10);
                leafTop = leafMap[row].top;
                left = leafMap[row].leafs[index].left + pageViewBuffer;
                if ('rl' == this.pageProgression){
                    left = viewWidth - leafWidth - left;
                }

                div = document.createElement("div");
                div.id = 'pagediv'+leaf;
                div.style.position = "absolute";
                div.className = "BRpagedivthumb";

                left += this.thumbPadding;
                div.style.top = leafTop + 'px';
                div.style.left = left + 'px';
                div.style.width = leafWidth + 'px';
                div.style.height = leafHeight + 'px';

                // link back to page
                link = document.createElement("a");
                $(link).data('leaf', leaf);
                link.addEventListener('mouseup', function(event) {
                  self.firstIndex = $(this).data('leaf');
                  if (self.prevReadMode === self.constMode1up
                        || self.prevReadMode === self.constMode2up) {
                    self.switchMode(self.prevReadMode);
                  } else {
                    self.switchMode(self.constMode1up);
                  }
                  event.preventDefault();
                  event.stopPropagation();
                }, true);
                $(div).append(link);

                $('#BRpageview').append(div);

                img = document.createElement("img");
                var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);

                $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                    .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                    .addClass('BRlazyload')
                    // Store the URL of the image that will replace this one
                    .data('srcURL',  this._getPageURI(leaf, thumbReduce));
                    .data('index', leaf);
                $(link).append(img);
            }
        }
    }

    // Remove thumbnails that are not to be displayed
    var k;
    for (i=0; i<this.displayedRows.length; i++) {
        if (BookReader.util.notInArray(this.displayedRows[i], rowsToDisplay)) {
            row = this.displayedRows[i];
            for (k=0; k<leafMap[row].leafs.length; k++) {
                index = leafMap[row].leafs[k].num;
                $('#pagediv'+index).remove();
            }
        }
    }

    // Update which page is considered current to make sure a visible page is the current one
    var currentIndex = this.currentIndex();
    if (currentIndex < leastVisible) {
        this.setCurrentIndex(leastVisible);
    } else if (currentIndex > mostVisible) {
        this.setCurrentIndex(mostVisible);
    }
    this.updateNavIndexThrottled();

    this.displayedRows = rowsToDisplay.slice();

    // Notify of new fragment, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedRows.length > 0) {
        this.trigger(BookReader.eventNames.fragmentChange);
    }

    // remove previous highlights
    $('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

    // highlight current page
    $('#pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');

    this.lazyLoadThumbnails();

    // Update page number box.  $$$ refactor to function
    if (null !== this.getPageNum(this.currentIndex()))  {
        $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }

    this.updateToolbarZoom(this.reduce);
};

BookReader.prototype.lazyLoadThumbnails = function() {
    // We check the complete property since load may not be fired if loading from the cache
    $('.BRlazyloading').filter('[complete=true]').removeClass('BRlazyloading');

    var loading = $('.BRlazyloading').length;
    var toLoad = this.thumbMaxLoading - loading;

    var self = this;

    if (toLoad > 0) {
        // $$$ TODO load those near top (but not beyond) page view first
        $('#BRpageview img.BRlazyload').filter(':lt(' + toLoad + ')').each( function() {
            self.lazyLoadImage(this);
        });
    }
};

BookReader.prototype.lazyLoadImage = function (dummyImage) {
    var img = new Image();
    var self = this;

    $(img)
        .addClass('BRlazyloading')
        .one('load', function() {
            $(this).removeClass('BRlazyloading');

            // $$$ Calling lazyLoadThumbnails here was causing stack overflow on IE so
            //     we call the function after a slight delay.  Also the img.complete property
            //     is not yet set in IE8 inside this onload handler
            setTimeout(function() { self.lazyLoadThumbnails(); }, 100);
        })
        .one('error', function() {
            // Remove class so we no longer count as loading
            $(this).removeClass('BRlazyloading');
        })

        //the width set with .attr is ignored by Internet Explorer, causing it to show the image at its original size
        //but with this one line of css, even IE shows the image at the proper size
        .css({
            'width': $(dummyImage).width()+'px',
            'height': $(dummyImage).height()+'px'
        })
        .attr({
            'width': $(dummyImage).width(),
            'height': $(dummyImage).height()
        });

    // replace with the new img
    this.loadImage($(dummyImage).data('srcURL'), $(dummyImage).data('index'), img);
    $(dummyImage).before(img).remove();

    img = null; // tidy up closure
};


// drawLeafsTwoPage()
//______________________________________________________________________________
BookReader.prototype.drawLeafsTwoPage = function() {
    var scrollTop = $('#BRtwopageview').prop('scrollTop');
    var scrollBottom = scrollTop + $('#BRtwopageview').height();

    // $$$ we should use calculated values in this.twoPage (recalc if necessary)

    var indexL = this.twoPage.currentIndexL;

    var heightL  = this._getPageHeight(indexL);
    var widthL   = this._getPageWidth(indexL);

    var leafEdgeWidthL = this.leafEdgeWidth(indexL);
    var leafEdgeWidthR = this.twoPage.edgeWidth - leafEdgeWidthL;
    var bookCoverDivWidth = this.twoPage.bookCoverDivWidth;

    var middle = this.twoPage.middle; // $$$ getter instead?
    var top = this.twoPageTop();
    var bookCoverDivLeft = this.twoPage.bookCoverDivLeft;

    this.twoPage.scaledWL = this.getPageWidth2UP(indexL);
    this.twoPage.gutter = this.twoPageGutter();

    this.prefetchImg(indexL);
    $(this.prefetchedImgs[indexL]).css({
        position: 'absolute',
        left: this.twoPage.gutter-this.twoPage.scaledWL+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height +'px', // $$$ height forced the same for both pages
        width:  this.twoPage.scaledWL + 'px',
        zIndex: 2
    }).appendTo('#BRtwopageview');

    var indexR = this.twoPage.currentIndexR;
    var heightR  = this._getPageHeight(indexR);
    var widthR   = this._getPageWidth(indexR);

    // $$$ should use getwidth2up?
    //var scaledWR = this.twoPage.height*widthR/heightR;
    this.twoPage.scaledWR = this.getPageWidth2UP(indexR);
    this.prefetchImg(indexR);
    $(this.prefetchedImgs[indexR]).css({
        position: 'absolute',
        left:   this.twoPage.gutter+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height + 'px', // $$$ height forced the same for both pages
        width:  this.twoPage.scaledWR + 'px',
        zIndex: 2
    }).appendTo('#BRtwopageview');


    this.displayedIndices = [this.twoPage.currentIndexL, this.twoPage.currentIndexR];
    this.setMouseHandlers2UP();
    this.twoPageSetCursor();

    this.updatePageNumBox2UP();
    this.updateToolbarZoom(this.reduce);
};

// updatePageNumBox2UP
//______________________________________________________________________________
BookReader.prototype.updatePageNumBox2UP = function() {
    if (null != this.getPageNum(this.twoPage.currentIndexL))  {
        $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }

    this.trigger(BookReader.eventNames.fragmentChange);
};

// drawLeafsThrottled()
// A throttled version of drawLeafs
//______________________________________________________________________________
BookReader.prototype.drawLeafsThrottled = BookReader.util.throttle(
    BookReader.prototype.drawLeafs,
    250 // 250 ms gives quick feedback, but doesn't eat cpu
);


// zoom(direction)
//
// Pass 1 to zoom in, anything else to zoom out
//______________________________________________________________________________
BookReader.prototype.zoom = function(direction) {
    switch (this.mode) {
        case this.constMode1up:
            if (direction == 1) {
                // XXX other cases
                this.zoom1up('in');
            } else {
                this.zoom1up('out');
            }
            break
        case this.constMode2up:
            if (direction == 1) {
                // XXX other cases
                this.zoom2up('in');
            } else {
                this.zoom2up('out');
            }
            break
        case this.constModeThumb:
            // XXX update zoomThumb for named directions
            this.zoomThumb(direction);
            break
    }
    return;
};

// zoom1up(dir)
//______________________________________________________________________________
BookReader.prototype.zoom1up = function(direction) {

    if (this.constMode2up == this.mode) {     //can only zoom in 1-page mode
        this.switchMode(this.constMode1up);
        return;
    }

    var reduceFactor = this.nextReduce(this.reduce, direction, this.onePage.reductionFactors);

    if (this.reduce == reduceFactor.reduce) {
        // Already at this level
        return;
    }

    this.reduce = reduceFactor.reduce; // $$$ incorporate into function
    this.onePage.autofit = reduceFactor.autofit;

    this.pageScale = this.reduce; // preserve current reduce

    this.resizePageView();
    this.updateToolbarZoom(this.reduce);

    // Recalculate search hilites
    if (this.enableSearch) this.removeSearchHilites();
    if (this.enableSearch) this.updateSearchHilites();

};

// Resizes the inner container to fit within the visible space to prevent
// the top toolbar and bottom navbar from clipping the visible book
BookReader.prototype.resizeBRcontainer = function() {
  this.refs.$brContainer.css({
    top: this.getToolBarHeight(),
    bottom: this.getNavHeight(),
  });
}

// resizePageView()
//______________________________________________________________________________
BookReader.prototype.resizePageView = function() {
    // $$$ This code assumes 1up mode
    //     e.g. does not preserve position in thumbnail mode
    //     See http://bugs.launchpad.net/bookreader/+bug/552972
    switch (this.mode) {
        case this.constMode1up:
            this.resizePageView1up(); // $$$ necessary in non-1up mode?
            break;
        case this.constMode2up:
            break;
        case this.constModeThumb:
            this.prepareThumbnailView( this.currentIndex() );
            break;
        default:
            alert('Resize not implemented for this mode');
    }
};

// Resize the current one page view
// Note this calls drawLeafs
BookReader.prototype.resizePageView1up = function() {
    var i;
    var viewHeight = 0;
    var viewWidth  = this.refs.$brContainer.prop('clientWidth');
    var oldScrollTop  = this.refs.$brContainer.prop('scrollTop');
    var oldPageViewHeight = $('#BRpageview').height();
    var oldPageViewWidth = $('#BRpageview').width();

    // May have come here after preparing the view, in which case the scrollTop and view height are not set

    var scrollRatio = 0;
    if (oldScrollTop > 0) {
        // We have scrolled - implies view has been set up
        var oldCenterY = this.centerY1up();
        var oldCenterX = this.centerX1up();
        scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
        // Have not scrolled, e.g. because in new container

        // We set the scroll ratio so that the current index will still be considered the
        // current index in drawLeafsOnePage after we create the new view container

        // Make sure this will count as current page after resize
        var fudgeFactor = (this.getPageHeight(this.currentIndex()) / this.reduce) * 0.6;
        var oldLeafTop = this.onePageGetPageTop(this.currentIndex()) + fudgeFactor;
        var oldViewDimensions = this.onePageCalculateViewDimensions(this.reduce, this.padding);
        scrollRatio = oldLeafTop / oldViewDimensions.height;
    }

    // Recalculate 1up reduction factors
    this.onePageCalculateReductionFactors();
    // Update current reduce (if in autofit)
    if (this.onePage.autofit) {
        var reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
        this.reduce = reductionFactor.reduce;
    }

    var viewDimensions = this.onePageCalculateViewDimensions(this.reduce, this.padding);

    $('#BRpageview').height(viewDimensions.height);
    $('#BRpageview').width(viewDimensions.width);


    var newCenterY = scrollRatio*viewDimensions.height;
    var newTop = Math.max(0, Math.floor( newCenterY - this.refs.$brContainer.height()/2 ));
    this.refs.$brContainer.prop('scrollTop', newTop);

    // We use clientWidth here to avoid miscalculating due to scroll bar
    var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    var newLeft = newCenterX - this.refs.$brContainer.prop('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    this.refs.$brContainer.prop('scrollLeft', newLeft);

    $('#BRpageview').empty();
    this.displayedIndices = [];
    this.drawLeafs();

    if (this.enableSearch) this.removeSearchHilites();
    if (this.enableSearch) this.updateSearchHilites();
};

// Calculate the dimensions for a one page view with images at the given reduce and padding
BookReader.prototype.onePageCalculateViewDimensions = function(reduce, padding) {
    var viewWidth = 0;
    var viewHeight = 0;
    for (i=0; i<this.getNumLeafs(); i++) {
        viewHeight += parseInt(this._getPageHeight(i)/reduce) + padding;
        var width = parseInt(this._getPageWidth(i)/reduce);
        if (width>viewWidth) viewWidth=width;
    }
    return { width: viewWidth, height: viewHeight }
};

// centerX1up()
//______________________________________________________________________________
// Returns the current offset of the viewport center in scaled document coordinates.
BookReader.prototype.centerX1up = function() {
    var centerX;
    if ($('#BRpageview').width() < this.refs.$brContainer.prop('clientWidth')) { // fully shown
        centerX = $('#BRpageview').width();
    } else {
        centerX = this.refs.$brContainer.prop('scrollLeft') + this.refs.$brContainer.prop('clientWidth') / 2;
    }
    centerX = Math.floor(centerX);
    return centerX;
};

// centerY1up()
//______________________________________________________________________________
// Returns the current offset of the viewport center in scaled document coordinates.
BookReader.prototype.centerY1up = function() {
    var centerY = this.refs.$brContainer.prop('scrollTop') + this.refs.$brContainer.height() / 2;
    return Math.floor(centerY);
};

// centerPageView()
//______________________________________________________________________________
BookReader.prototype.centerPageView = function() {
    var scrollWidth  = this.refs.$brContainer.prop('scrollWidth');
    var clientWidth  =  this.refs.$brContainer.prop('clientWidth');
    if (scrollWidth > clientWidth) {
        this.refs.$brContainer.prop('scrollLeft', (scrollWidth-clientWidth)/2);
    }
};

// zoom2up(direction)
//______________________________________________________________________________
BookReader.prototype.zoom2up = function(direction) {

    // Hard stop autoplay
    this.stopFlipAnimations();

    // Recalculate autofit factors
    this.twoPageCalculateReductionFactors();

    // Get new zoom state
    var reductionFactor = this.nextReduce(this.reduce, direction, this.twoPage.reductionFactors);
    if ((this.reduce == reductionFactor.reduce) && (this.twoPage.autofit == reductionFactor.autofit)) {
        // Same zoom
        return;
    }
    this.twoPage.autofit = reductionFactor.autofit;
    this.reduce = reductionFactor.reduce;
    this.pageScale = this.reduce; // preserve current reduce

    // Preserve view center position
    var oldCenter = this.twoPageGetViewCenter();

    // If zooming in, reload imgs.  DOM elements will be removed by prepareTwoPageView
    // $$$ An improvement would be to use the low res image until the larger one is loaded.
    if (1 == direction) {
        for (var img in this.prefetchedImgs) {
            delete this.prefetchedImgs[img];
        }
    }

    // Prepare view with new center to minimize visual glitches
    this.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);
};

BookReader.prototype.zoomThumb = function(direction) {
    var oldColumns = this.thumbColumns;
    switch (direction) {
        case -1:
            this.thumbColumns += 1;
            break;
        case 1:
            this.thumbColumns -= 1;
            break;
    }

    // clamp
    if (this.thumbColumns < 2) {
        this.thumbColumns = 2;
    } else if (this.thumbColumns > 8) {
        this.thumbColumns = 8;
    }

    if (this.thumbColumns != oldColumns) {
        this.prepareThumbnailView();
    }
};

// Returns the width per thumbnail to display the requested number of columns
// Note: #BRpageview must already exist since its width is used to calculate the
//       thumbnail width
BookReader.prototype.getThumbnailWidth = function(thumbnailColumns) {
    var padding = (thumbnailColumns + 1) * this.thumbPadding;
    var width = ($('#BRpageview').width() - padding) / (thumbnailColumns + 0.5); // extra 0.5 is for some space at sides
    return parseInt(width);
};

// quantizeReduce(reduce)
//______________________________________________________________________________
// Quantizes the given reduction factor to closest power of two from set from 12.5% to 200%
BookReader.prototype.quantizeReduce = function(reduce, reductionFactors) {
    var quantized = reductionFactors[0].reduce;
    var distance = Math.abs(reduce - quantized);
    for (var i = 1; i < reductionFactors.length; i++) {
        newDistance = Math.abs(reduce - reductionFactors[i].reduce);
        if (newDistance < distance) {
            distance = newDistance;
            quantized = reductionFactors[i].reduce;
        }
    }

    return quantized;
};

// reductionFactors should be array of sorted reduction factors
// e.g. [ {reduce: 0.25, autofit: null}, {reduce: 0.3, autofit: 'width'}, {reduce: 1, autofit: null} ]
BookReader.prototype.nextReduce = function(currentReduce, direction, reductionFactors) {
    // XXX add 'closest', to replace quantize function

    if (direction === 'in') {
        var newReduceIndex = 0;
        for (var i = 1; i < reductionFactors.length; i++) {
            if (reductionFactors[i].reduce < currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
    } else if (direction === 'out') { // zoom out
        var lastIndex = reductionFactors.length - 1;
        var newReduceIndex = lastIndex;

        for (var i = lastIndex; i >= 0; i--) {
            if (reductionFactors[i].reduce > currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
    } else if (direction === 'auto') {
      // Auto mode chooses the least reduction
      var choice = null;
      for (var i = 0; i < reductionFactors.length; i++) {
          if (reductionFactors[i].autofit === 'height' || reductionFactors[i].autofit === 'width') {
              if (choice === null || choice.reduce < reductionFactors[i].reduce) {
                  choice = reductionFactors[i];
              }
          }
      }
      if (choice) {
          return choice;
      }
    } else if (direction === 'height' || direction === 'width') {
      // Asked for specific autofit mode
      for (var i = 0; i < reductionFactors.length; i++) {
          if (reductionFactors[i].autofit === direction) {
              return reductionFactors[i];
          }
      }
    }

    alert('Could not find reduction factor for direction ' + direction);
    return reductionFactors[0];

};

BookReader.prototype._reduceSort = function(a, b) {
    return a.reduce - b.reduce;
};


// jumpToPage()
//______________________________________________________________________________
// Attempts to jump to page.  Returns true if page could be found, false otherwise.
BookReader.prototype.jumpToPage = function(pageNum) {
    var pageIndex = this.parsePageString(pageNum);

    if ('undefined' != typeof(pageIndex)) {
        this.jumpToIndex(pageIndex);
        return true;
    }

    // Page not found
    return false;
};

// jumpToIndex()
//______________________________________________________________________________
BookReader.prototype.jumpToIndex = function(index, pageX, pageY, noAnimate) {
    var self = this;
    var prevCurrentIndex = this.currentIndex();

    // Not throttling is important to prevent race conditions with scroll
    this.updateNavIndexThrottled(index);
    this.trigger('stop');

    if (this.constMode2up == this.mode) {
        // By checking against min/max we do nothing if requested index
        // is current
        if (index < Math.min(this.twoPage.currentIndexL, this.twoPage.currentIndexR)) {
            this.flipBackToIndex(index);
        } else if (index > Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR)) {
            this.flipFwdToIndex(index);
        }

    } else if (this.constModeThumb == this.mode) {
        var viewWidth = this.refs.$brContainer.prop('scrollWidth') - 20; // width minus buffer
        var i;
        var leafWidth = 0;
        var leafHeight = 0;
        var rightPos = 0;
        var bottomPos = 0;
        var rowHeight = 0;
        var leafTop = 0;
        var leafIndex = 0;

        for (i=0; i<(index+1); i++) {
            leafWidth = this.thumbWidth;
            if (rightPos + (leafWidth + this.thumbPadding) > viewWidth){
                rightPos = 0;
                rowHeight = 0;
                leafIndex = 0;
            }

            leafHeight = parseInt((this.getPageHeight(leafIndex)*this.thumbWidth)/this.getPageWidth(leafIndex), 10);
            if (leafHeight > rowHeight) { rowHeight = leafHeight; }
            if (leafIndex==0) { leafTop = bottomPos; }
            if (leafIndex==0) { bottomPos += this.thumbPadding + rowHeight; }
            rightPos += leafWidth + this.thumbPadding;
            leafIndex++;
        }
        this.firstIndex=index;
        if (this.refs.$brContainer.prop('scrollTop') == leafTop) {
            this.drawLeafs();
        } else {
            this.animating = true;
            this.refs.$brContainer.stop(true).animate({
                scrollTop: leafTop,
            }, 'fast', function() {
                self.animating = false;
            });
        }
    } else {
        // 1up
        var leafTop = this.onePageGetPageTop(index);

        if (pageY) {
            var offset = parseInt( (pageY) / this.reduce);
            offset -= this.refs.$brContainer.prop('clientHeight') >> 1;
            leafTop += offset;
        } else {
            // Show page just a little below the top
            leafTop -= this.padding / 2;
        }

        if (pageX) {
            var offset = parseInt( (pageX) / this.reduce);
            offset -= this.refs.$brContainer.prop('clientWidth') >> 1;
            leafLeft += offset;
        } else {
            // Preserve left position
            leafLeft = this.refs.$brContainer.scrollLeft();
        }

        // Only animate for small distances
        if (!noAnimate && Math.abs(prevCurrentIndex - index) <= 4) {
            this.animating = true;
            this.refs.$brContainer.stop(true).animate({
                scrollTop: leafTop,
                scrollLeft: leafLeft,
            }, 'fast', function() {
                self.animating = false;
            });
        } else {
            this.refs.$brContainer.stop(true).prop('scrollTop', leafTop);
        }
    }
};

// switchMode()
//______________________________________________________________________________
BookReader.prototype.switchMode = function(mode) {

    if (mode === this.mode) {
        return;
    }

    if (!this.canSwitchToMode(mode)) {
        return;
    }

    this.trigger('stop');
    if (this.enableSearch) this.removeSearchHilites();

    if (this.mode === this.constMode1up || this.mode === this.constMode2up) {
      this.prevReadMode = this.mode;
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
        this.onePageCalculateReductionFactors();
        this.reduce = this.quantizeReduce(this.reduce, this.onePage.reductionFactors);
        this.prepareOnePageView();
    } else if (this.constModeThumb == mode) {
        this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
        this.prepareThumbnailView();
    } else {
        // $$$ why don't we save autofit?
        // this.twoPage.autofit = null; // Take zoom level from other mode
        this.twoPageCalculateReductionFactors();
        this.reduce = this.quantizeReduce(this.reduce, this.twoPage.reductionFactors);
        this.prepareTwoPageView();
        this.twoPageCenterView(0.5, 0.5); // $$$ TODO preserve center
    }

};

//prepareOnePageView()
// This is called when we switch to one page view
//______________________________________________________________________________
BookReader.prototype.prepareOnePageView = function() {
    var startLeaf = this.currentIndex();

    this.refs.$brContainer.empty();
    this.refs.$brContainer.css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });

    this.refs.$brContainer.append("<div id='BRpageview'></div>");

    // Attaches to first child - child must be present
    this.refs.$brContainer.dragscrollable();
    this.bindGestures(this.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));

    this.resizePageView();
    this.jumpToIndex(startLeaf);
};

//prepareThumbnailView()
//______________________________________________________________________________
BookReader.prototype.prepareThumbnailView = function() {
    this.refs.$brContainer.empty();
    this.refs.$brContainer.css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });

    this.refs.$brContainer.append("<div id='BRpageview'></div>");
    this.refs.$brContainer.dragscrollable({preventDefault:true});

    this.bindGestures(this.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));

    this.thumbWidth = this.getThumbnailWidth(this.thumbColumns);
    this.reduce = this.getPageWidth(0)/this.thumbWidth;

    this.displayedRows = [];

    // Draw leafs with current index directly in view (no animating to the index)
    this.drawLeafsThumbnail( this.currentIndex() );
};

// prepareTwoPageView()
//______________________________________________________________________________
// Some decisions about two page view:
//
// Both pages will be displayed at the same height, even if they were different physical/scanned
// sizes.  This simplifies the animation (from a design as well as technical standpoint).  We
// examine the page aspect ratios (in calculateSpreadSize) and use the page with the most "normal"
// aspect ratio to determine the height.
//
// The two page view div is resized to keep the middle of the book in the middle of the div
// even as the page sizes change.  To e.g. keep the middle of the book in the middle of the BRcontent
// div requires adjusting the offset of BRtwpageview and/or scrolling in BRcontent.
BookReader.prototype.prepareTwoPageView = function(centerPercentageX, centerPercentageY) {
    this.refs.$brContainer.empty();
    this.refs.$brContainer.css('overflow', 'auto');

    // We want to display two facing pages.  We may be missing
    // one side of the spread because it is the first/last leaf,
    // foldouts, missing pages, etc

    var targetLeaf = this.firstIndex;

    if (targetLeaf < this.firstDisplayableIndex()) {
        targetLeaf = this.firstDisplayableIndex();
    }

    if (targetLeaf > this.lastDisplayableIndex()) {
        targetLeaf = this.lastDisplayableIndex();
    }

    var currentSpreadIndices = this.getSpreadIndices(targetLeaf);
    this.twoPage.currentIndexL = currentSpreadIndices[0];
    this.twoPage.currentIndexR = currentSpreadIndices[1];
    this.firstIndex = this.twoPage.currentIndexL;

    this.calculateSpreadSize(); //sets twoPage.width, twoPage.height and others

    this.pruneUnusedImgs();
    this.prefetch(); // Preload images or reload if scaling has changed

    // Add the two page view
    // $$$ Can we get everything set up and then append?
    this.refs.$brContainer.append('<div id="BRtwopageview"></div>');

    // Attaches to first child, so must come after we add the page view
    this.refs.$brContainer.dragscrollable({preventDefault:true});
    this.bindGestures(this.refs.$brContainer);

    // $$$ calculate first then set
    $('#BRtwopageview').css( {
        height: this.twoPage.totalHeight + 'px',
        width: this.twoPage.totalWidth + 'px',
        position: 'absolute'
        });

    // If there will not be scrollbars (e.g. when zooming out) we center the book
    // since otherwise the book will be stuck off-center
    if (this.twoPage.totalWidth < this.refs.$brContainer.prop('clientWidth')) {
        centerPercentageX = 0.5;
    }
    if (this.twoPage.totalHeight < this.refs.$brContainer.prop('clientHeight')) {
        centerPercentageY = 0.5;
    }

    this.twoPageCenterView(centerPercentageX, centerPercentageY);

    this.twoPage.coverDiv = document.createElement('div');
    $(this.twoPage.coverDiv).attr('id', 'BRbookcover').css({
        width:  this.twoPage.bookCoverDivWidth + 'px',
        height: this.twoPage.bookCoverDivHeight+'px',
        visibility: 'visible'
    }).appendTo('#BRtwopageview');

    this.leafEdgeR = document.createElement('div');
    this.leafEdgeR.className = 'BRleafEdgeR';
    $(this.leafEdgeR).css({
        width: this.twoPage.leafEdgeWidthR + 'px',
        height: this.twoPage.height + 'px',
        left: this.twoPage.gutter+this.twoPage.scaledWR+'px',
        top: this.twoPage.bookCoverDivTop+this.twoPage.coverInternalPadding+'px'
    }).appendTo('#BRtwopageview');

    this.leafEdgeL = document.createElement('div');
    this.leafEdgeL.className = 'BRleafEdgeL';
    $(this.leafEdgeL).css({
        width: this.twoPage.leafEdgeWidthL + 'px',
        height: this.twoPage.height + 'px',
        left: this.twoPage.bookCoverDivLeft+this.twoPage.coverInternalPadding+'px',
        top: this.twoPage.bookCoverDivTop+this.twoPage.coverInternalPadding+'px'
    }).appendTo('#BRtwopageview');

    div = document.createElement('div');
    $(div).attr('id', 'BRgutter').css({
        width:           this.twoPage.bookSpineDivWidth+'px',
        height:          this.twoPage.bookSpineDivHeight+'px',
        left:            (this.twoPage.gutter - this.twoPage.bookSpineDivWidth*0.5)+'px',
        top:             this.twoPage.bookSpineDivTop+'px'
    }).appendTo('#BRtwopageview');

    var self = this; // for closure

    this.prepareTwoPagePopUp();

    this.displayedIndices = [];

    this.drawLeafsTwoPage();
    this.updateToolbarZoom(this.reduce);

    this.prefetch();

    if (this.enableSearch) this.removeSearchHilites();
    if (this.enableSearch) this.updateSearchHilites();

};

// prepareTwoPagePopUp()
//
// This function prepares the "View Page n" popup that shows while the mouse is
// over the left/right "stack of sheets" edges.  It also binds the mouse
// events for these divs.
//______________________________________________________________________________
BookReader.prototype.prepareTwoPagePopUp = function() {

    this.twoPagePopUp = document.createElement('div');
    this.twoPagePopUp.className = 'BRtwoPagePopUp';
    $(this.twoPagePopUp).css({
        zIndex: '1000'
    }).appendTo(this.refs.$brContainer);
    $(this.twoPagePopUp).hide();

    $(this.leafEdgeL).add(this.leafEdgeR).bind('mouseenter', this, function(e) {
        $(e.data.twoPagePopUp).show();
    });

    $(this.leafEdgeL).add(this.leafEdgeR).bind('mouseleave', this, function(e) {
        $(e.data.twoPagePopUp).hide();
    });

    $(this.leafEdgeL).bind('click', this, function(e) {
        e.data.trigger('stop');
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        e.data.jumpToIndex(jumpIndex);
    });

    $(this.leafEdgeR).bind('click', this, function(e) {
        e.data.trigger('stop');
        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        e.data.jumpToIndex(jumpIndex);
    });

    $(this.leafEdgeR).bind('mousemove', this, function(e) {

        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View ' + e.data.getPageName(jumpIndex));

        // $$$ TODO: Make sure popup is positioned so that it is in view
        // (https://bugs.edge.launchpad.net/gnubook/+bug/327456)
        $(e.data.twoPagePopUp).css({
            left: e.pageX- e.data.refs.$brContainer.offset().left + e.data.refs.$brContainer.scrollLeft() - 100 + 'px',
            top: e.pageY - e.data.refs.$brContainer.offset().top + e.data.refs.$brContainer.scrollTop() + 'px'
        });
    });

    $(this.leafEdgeL).bind('mousemove', this, function(e) {

        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View '+ e.data.getPageName(jumpIndex));

        // $$$ TODO: Make sure popup is positioned so that it is in view
        //           (https://bugs.edge.launchpad.net/gnubook/+bug/327456)
        $(e.data.twoPagePopUp).css({
            left: e.pageX - e.data.refs.$brContainer.offset().left + e.data.refs.$brContainer.scrollLeft() - $(e.data.twoPagePopUp).width() + 100 + 'px',
            top: e.pageY-e.data.refs.$brContainer.offset().top + e.data.refs.$brContainer.scrollTop() + 'px'
        });
    });
};

// calculateSpreadSize()
//______________________________________________________________________________
// Calculates 2-page spread dimensions based on this.twoPage.currentIndexL and
// this.twoPage.currentIndexR
// This function sets this.twoPage.height, twoPage.width

BookReader.prototype.calculateSpreadSize = function() {

    var firstIndex  = this.twoPage.currentIndexL;
    var secondIndex = this.twoPage.currentIndexR;

    // Calculate page sizes and total leaf width
    var spreadSize;
    if ( this.twoPage.autofit) {
        spreadSize = this.getIdealSpreadSize(firstIndex, secondIndex);
    } else {
        // set based on reduction factor
        spreadSize = this.getSpreadSizeFromReduce(firstIndex, secondIndex, this.reduce);
    }

    // Both pages together
    this.twoPage.height = spreadSize.height;
    this.twoPage.width = spreadSize.width;

    // Individual pages
    this.twoPage.scaledWL = this.getPageWidth2UP(firstIndex);
    this.twoPage.scaledWR = this.getPageWidth2UP(secondIndex);

    // Leaf edges
    this.twoPage.edgeWidth = spreadSize.totalLeafEdgeWidth; // The combined width of both edges
    this.twoPage.leafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    this.twoPage.leafEdgeWidthR = this.twoPage.edgeWidth - this.twoPage.leafEdgeWidthL;


    // Book cover
    // The width of the book cover div.  The combined width of both pages, twice the width
    // of the book cover internal padding (2*10) and the page edges
    this.twoPage.bookCoverDivWidth = this.twoPageCoverWidth(this.twoPage.scaledWL + this.twoPage.scaledWR);
    // The height of the book cover div
    this.twoPage.bookCoverDivHeight = this.twoPage.height + 2 * this.twoPage.coverInternalPadding;


    // We calculate the total width and height for the div so that we can make the book
    // spine centered
    var leftGutterOffset = this.gutterOffsetForIndex(firstIndex);
    var leftWidthFromCenter = this.twoPage.scaledWL - leftGutterOffset + this.twoPage.leafEdgeWidthL;
    var rightWidthFromCenter = this.twoPage.scaledWR + leftGutterOffset + this.twoPage.leafEdgeWidthR;
    var largestWidthFromCenter = Math.max( leftWidthFromCenter, rightWidthFromCenter );
    this.twoPage.totalWidth = 2 * (largestWidthFromCenter + this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);
    this.twoPage.totalHeight = this.twoPage.height + 2 * (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);

    // We want to minimize the unused space in two-up mode (maximize the amount of page
    // shown).  We give width to the leaf edges and these widths change (though the sum
    // of the two remains constant) as we flip through the book.  With the book
    // cover centered and fixed in the BRcontainer div the page images will meet
    // at the "gutter" which is generally offset from the center.
    this.twoPage.middle = this.twoPage.totalWidth >> 1;
    this.twoPage.gutter = this.twoPage.middle + this.gutterOffsetForIndex(firstIndex);

    // The left edge of the book cover moves depending on the width of the pages
    // $$$ change to getter
    this.twoPage.bookCoverDivLeft = this.twoPage.gutter - this.twoPage.scaledWL - this.twoPage.leafEdgeWidthL - this.twoPage.coverInternalPadding;
    // The top edge of the book cover stays a fixed distance from the top
    this.twoPage.bookCoverDivTop = this.twoPage.coverExternalPadding;

    // Book spine
    this.twoPage.bookSpineDivHeight = this.twoPage.height + 2*this.twoPage.coverInternalPadding;
    this.twoPage.bookSpineDivLeft = this.twoPage.middle - (this.twoPage.bookSpineDivWidth >> 1);
    this.twoPage.bookSpineDivTop = this.twoPage.bookCoverDivTop;


    this.reduce = spreadSize.reduce; // $$$ really set this here?
};

BookReader.prototype.getIdealSpreadSize = function(firstIndex, secondIndex) {
    var ideal = {};

    // We check which page is closest to a "normal" page and use that to set the height
    // for both pages.  This means that foldouts and other odd size pages will be displayed
    // smaller than the nominal zoom amount.
    var canon5Dratio = 1.5;

    var first = {
        height: this._getPageHeight(firstIndex),
        width: this._getPageWidth(firstIndex)
    };

    var second = {
        height: this._getPageHeight(secondIndex),
        width: this._getPageWidth(secondIndex)
    };

    var firstIndexRatio  = first.height / first.width;
    var secondIndexRatio = second.height / second.width;

    var ratio;
    if (Math.abs(firstIndexRatio - canon5Dratio) < Math.abs(secondIndexRatio - canon5Dratio)) {
        ratio = firstIndexRatio;
    } else {
        ratio = secondIndexRatio;
    }

    var totalLeafEdgeWidth = parseInt(this.getNumLeafs() * 0.1);
    var maxLeafEdgeWidth   = parseInt(this.refs.$brContainer.prop('clientWidth') * 0.1);
    ideal.totalLeafEdgeWidth     = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);

    var widthOutsidePages = 2 * (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding) + ideal.totalLeafEdgeWidth;
    var heightOutsidePages = 2* (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);

    ideal.width = (this.refs.$brContainer.width() - widthOutsidePages) >> 1;
    ideal.width -= 10; // $$$ fudge factor
    ideal.height = this.refs.$brContainer.height() - heightOutsidePages;

    ideal.height -= 15; // fudge factor

    if (ideal.height/ratio <= ideal.width) {
        //use height
        ideal.width = parseInt(ideal.height/ratio);
    } else {
        //use width
        ideal.height = parseInt(ideal.width*ratio);
    }

    // $$$ check this logic with large spreads
    ideal.reduce = ((first.height + second.height) / 2) / ideal.height;

    return ideal;
};

// getSpreadSizeFromReduce()
//______________________________________________________________________________
// Returns the spread size calculated from the reduction factor for the given pages
BookReader.prototype.getSpreadSizeFromReduce = function(firstIndex, secondIndex, reduce) {
    var spreadSize = {};
    // $$$ Scale this based on reduce?
    var totalLeafEdgeWidth = parseInt(this.getNumLeafs() * 0.1);
    var maxLeafEdgeWidth   = parseInt(this.refs.$brContainer.prop('clientWidth') * 0.1); // $$$ Assumes leaf edge width constant at all zoom levels
    spreadSize.totalLeafEdgeWidth     = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);

    // $$$ Possibly incorrect -- we should make height "dominant"
    var nativeWidth = this._getPageWidth(firstIndex) + this._getPageWidth(secondIndex);
    var nativeHeight = this._getPageHeight(firstIndex) + this._getPageHeight(secondIndex);
    spreadSize.height = parseInt( (nativeHeight / 2) / this.reduce );
    spreadSize.width = parseInt( (nativeWidth / 2) / this.reduce );
    spreadSize.reduce = reduce;

    return spreadSize;
};

// twoPageGetAutofitReduce()
//______________________________________________________________________________
// Returns the current ideal reduction factor
BookReader.prototype.twoPageGetAutofitReduce = function() {
    var spreadSize = this.getIdealSpreadSize(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    return spreadSize.reduce;
};

// twoPageIsZoomedIn
//______________________________________________________________________________
// Returns true if the pages extend past the edge of the view
BookReader.prototype.twoPageIsZoomedIn = function() {
    var autofitReduce = this.twoPageGetAutofitReduce();
    var isZoomedIn = false;
    if (this.twoPage.autofit != 'auto') {
        if (this.reduce < this.twoPageGetAutofitReduce()) {
            isZoomedIn = true;
        }
    }
    return isZoomedIn;
};

BookReader.prototype.onePageGetAutofitWidth = function() {
    var widthPadding = 20;
    return (this.getMedianPageSize().width + 0.0) / (this.refs.$brContainer.prop('clientWidth') - widthPadding * 2);
};

BookReader.prototype.onePageGetAutofitHeight = function() {
    var availableHeight = this.refs.$brContainer.innerHeight();
    return (this.getMedianPageSize().height + 0.0) / (availableHeight - this.padding * 2); // make sure a little of adjacent pages show
};

// Returns where the top of the page with given index should be in one page view
BookReader.prototype.onePageGetPageTop = function(index)
{
    var i;
    var leafTop = 0;
    var leafLeft = 0;
    var h;
    for (i=0; i<index; i++) {
        h = parseInt(this._getPageHeight(i)/this.reduce);
        leafTop += h + this.padding;
    }
    return leafTop;
};

BookReader.prototype.getMedianPageSize = function() {
    if (this._medianPageSize) {
        return this._medianPageSize;
    }

    // A little expensive but we just do it once
    var widths = [];
    var heights = [];
    for (var i = 0; i < this.getNumLeafs(); i++) {
        widths.push(this.getPageWidth(i));
        heights.push(this.getPageHeight(i));
    }

    widths.sort();
    heights.sort();

    this._medianPageSize = { width: widths[parseInt(widths.length / 2)], height: heights[parseInt(heights.length / 2)] };
    return this._medianPageSize;
};

// Update the reduction factors for 1up mode given the available width and height.  Recalculates
// the autofit reduction factors.
BookReader.prototype.onePageCalculateReductionFactors = function() {
    this.onePage.reductionFactors = this.reductionFactors.concat(
        [
            { reduce: this.onePageGetAutofitWidth(), autofit: 'width' },
            { reduce: this.onePageGetAutofitHeight(), autofit: 'height'}
        ]);
    this.onePage.reductionFactors.sort(this._reduceSort);
};

BookReader.prototype.twoPageCalculateReductionFactors = function() {
    this.twoPage.reductionFactors = this.reductionFactors.concat(
        [
            { reduce: this.getIdealSpreadSize( this.twoPage.currentIndexL, this.twoPage.currentIndexR ).reduce,
              autofit: 'auto' }
        ]);
    this.twoPage.reductionFactors.sort(this._reduceSort);
};

// twoPageSetCursor()
//______________________________________________________________________________
// Set the cursor for two page view
BookReader.prototype.twoPageSetCursor = function() {
    if ( ($('#BRtwopageview').width() > this.refs.$brContainer.prop('clientWidth')) ||
         ($('#BRtwopageview').height() > this.refs.$brContainer.prop('clientHeight')) ) {
        if (this.prefetchedImgs[this.twoPage.currentIndexL])
          this.prefetchedImgs[this.twoPage.currentIndexL].style.cursor = 'move';
        if (this.prefetchedImgs[this.twoPage.currentIndexR])
          this.prefetchedImgs[this.twoPage.currentIndexR].style.cursor = 'move';
    } else {
      if (this.prefetchedImgs[this.twoPage.currentIndexL])
        this.prefetchedImgs[this.twoPage.currentIndexL].style.cursor = '';
      if (this.prefetchedImgs[this.twoPage.currentIndexR])
        this.prefetchedImgs[this.twoPage.currentIndexR].style.cursor = '';
    }
};

// currentIndex()
//______________________________________________________________________________
// Returns the currently active index.
BookReader.prototype.currentIndex = function() {
    // $$$ we should be cleaner with our idea of which index is active in 1up/2up
    if (this.mode == this.constMode1up || this.mode == this.constModeThumb) {
        return this.firstIndex; // $$$ TODO page in center of view would be better
    } else if (this.mode == this.constMode2up) {
        // Only allow indices that are actually present in book
        return BookReader.util.clamp(this.firstIndex, 0, this.getNumLeafs() - 1);
    } else {
        throw 'currentIndex called for unimplemented mode ' + this.mode;
    }
};

// setCurrentIndex(index)
//______________________________________________________________________________
// Sets the idea of current index without triggering other actions such as animation.
// Compare to jumpToIndex which animates to that index
BookReader.prototype.setCurrentIndex = function(index) {
    this.firstIndex = index;
};


// right()
//______________________________________________________________________________
// Flip the right page over onto the left
BookReader.prototype.right = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.next();
    } else {
        // RTL
        this.prev();
    }
};

// rightmost()
//______________________________________________________________________________
// Flip to the rightmost page
BookReader.prototype.rightmost = function() {
    if ('rl' != this.pageProgression) {
        this.last();
    } else {
        this.first();
    }
};

// left()
//______________________________________________________________________________
// Flip the left page over onto the right.
BookReader.prototype.left = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.prev();
    } else {
        // RTL
        this.next();
    }
};

// leftmost()
//______________________________________________________________________________
// Flip to the leftmost page
BookReader.prototype.leftmost = function() {
    if ('rl' != this.pageProgression) {
        this.first();
    } else {
        this.last();
    }
};

// next()
//______________________________________________________________________________
BookReader.prototype.next = function() {
    if (this.constMode2up == this.mode) {
        this.autoStop();
        this.flipFwdToIndex(null);

    } else {
        if (this.firstIndex < this.lastDisplayableIndex()) {
            this.jumpToIndex(this.firstIndex+1);
        }
    }
};

// prev()
//______________________________________________________________________________
BookReader.prototype.prev = function() {
    if (this.constMode2up == this.mode) {
        this.autoStop();
        this.flipBackToIndex(null);
    } else {
        if (this.firstIndex >= 1) {
            this.jumpToIndex(this.firstIndex-1);
        }
    }
};

BookReader.prototype.first = function() {
    this.jumpToIndex(this.firstDisplayableIndex());
};

BookReader.prototype.last = function() {
    this.jumpToIndex(this.lastDisplayableIndex());
};

// scrollDown()
//______________________________________________________________________________
// Scrolls down one screen view
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

// scrollUp()
//______________________________________________________________________________
// Scrolls up one screen view
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

// _scrollAmount()
//______________________________________________________________________________
// The amount to scroll vertically in integer pixels
BookReader.prototype._scrollAmount = function() {
    if (this.constMode1up == this.mode) {
        // Overlap by % of page size
        return parseInt(this.refs.$brContainer.prop('clientHeight') - this.getPageHeight(this.currentIndex()) / this.reduce * 0.03);
    }

    return parseInt(0.9 * this.refs.$brContainer.prop('clientHeight'));
};


// flipBackToIndex()
//______________________________________________________________________________
// to flip back one spread, pass index=null
BookReader.prototype.flipBackToIndex = function(index) {

    if (this.constMode1up == this.mode) return;

    var leftIndex = this.twoPage.currentIndexL;

    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = leftIndex-2;
    }

    this.updateNavIndex(index);

    var previousIndices = this.getSpreadIndices(index);

    if (previousIndices[0] < this.firstDisplayableIndex() || previousIndices[1] < this.firstDisplayableIndex()) {
        return;
    }

    this.animating = true;

    if ('rl' != this.pageProgression) {
        // Assume LTR and we are going backward
        this.prepareFlipLeftToRight(previousIndices[0], previousIndices[1]);
        this.flipLeftToRight(previousIndices[0], previousIndices[1]);
    } else {
        // RTL and going backward
        var gutter = this.prepareFlipRightToLeft(previousIndices[0], previousIndices[1]);
        this.flipRightToLeft(previousIndices[0], previousIndices[1], gutter);
    }
};

// flipLeftToRight()
//______________________________________________________________________________
// Flips the page on the left towards the page on the right
BookReader.prototype.flipLeftToRight = function(newIndexL, newIndexR) {

    var leftLeaf = this.twoPage.currentIndexL;

    var oldLeafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    var newLeafEdgeWidthL = this.leafEdgeWidth(newIndexL);
    var leafEdgeTmpW = oldLeafEdgeWidthL - newLeafEdgeWidthL;

    var currWidthL   = this.getPageWidth2UP(leftLeaf);
    var newWidthL    = this.getPageWidth2UP(newIndexL);
    var newWidthR    = this.getPageWidth2UP(newIndexR);

    var top  = this.twoPageTop();
    var gutter = this.twoPage.middle + this.gutterOffsetForIndex(newIndexL);

    //animation strategy:
    // 0. remove search highlight, if any.
    // 1. create a new div, called leafEdgeTmp to represent the leaf edge between the leftmost edge
    //    of the left leaf and where the user clicked in the leaf edge.
    //    Note that if this function was triggered by left() and not a
    //    mouse click, the width of leafEdgeTmp is very small (zero px).
    // 2. animate both leafEdgeTmp to the gutter (without changing its width) and animate
    //    leftLeaf to width=0.
    // 3. When step 2 is finished, animate leafEdgeTmp to right-hand side of new right leaf
    //    (left=gutter+newWidthR) while also animating the new right leaf from width=0 to
    //    its new full width.
    // 4. After step 3 is finished, do the following:
    //      - remove leafEdgeTmp from the dom.
    //      - resize and move the right leaf edge (leafEdgeR) to left=gutter+newWidthR
    //          and width=twoPage.edgeWidth-newLeafEdgeWidthL.
    //      - resize and move the left leaf edge (leafEdgeL) to left=gutter-newWidthL-newLeafEdgeWidthL
    //          and width=newLeafEdgeWidthL.
    //      - resize the back cover (twoPage.coverDiv) to left=gutter-newWidthL-newLeafEdgeWidthL-10
    //          and width=newWidthL+newWidthR+twoPage.edgeWidth+20
    //      - move new left leaf (newIndexL) forward to zindex=2 so it can receive clicks.
    //      - remove old left and right leafs from the dom [pruneUnusedImgs()].
    //      - prefetch new adjacent leafs.
    //      - set up click handlers for both new left and right leafs.
    //      - redraw the search highlight.
    //      - update the pagenum box and the url.


    var leftEdgeTmpLeft = gutter - currWidthL - leafEdgeTmpW;

    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height + 'px',
        left: leftEdgeTmpLeft + 'px',
        top: top+'px',
        zIndex:1000
    }).appendTo('#BRtwopageview');

    $(this.leafEdgeL).css({
        width: newLeafEdgeWidthL+'px',
        left: gutter-currWidthL-newLeafEdgeWidthL+'px'
    });

    // Left gets the offset of the current left leaf from the document
    var left = $(this.prefetchedImgs[leftLeaf]).offset().left;
    // $$$ This seems very similar to the gutter.  May be able to consolidate the logic.
    var right = $('#BRtwopageview').prop('clientWidth')-left-$(this.prefetchedImgs[leftLeaf]).width()+$('#BRtwopageview').offset().left-2+'px';

    // We change the left leaf to right positioning
    // $$$ This causes animation glitches during resize.  See https://bugs.edge.launchpad.net/gnubook/+bug/328327
    $(this.prefetchedImgs[leftLeaf]).css({
        right: right,
        left: ''
    });

    $(this.leafEdgeTmp).animate({left: gutter}, this.flipSpeed, 'easeInSine');

    var self = this;

    if (this.enableSearch) this.removeSearchHilites();

    $(this.prefetchedImgs[leftLeaf]).animate({width: '0px'}, self.flipSpeed, 'easeInSine', function() {

        $(self.leafEdgeTmp).animate({left: gutter+newWidthR+'px'}, self.flipSpeed, 'easeOutSine');

        $('#BRgutter').css({left: (gutter - self.twoPage.bookSpineDivWidth*0.5)+'px'});

        $(self.prefetchedImgs[newIndexR]).animate({width: newWidthR+'px'}, self.flipSpeed, 'easeOutSine', function() {
            $(self.prefetchedImgs[newIndexL]).css('zIndex', 2);

            //jquery adds display:block to the element style, which interferes with our print css
            $(self.prefetchedImgs[newIndexL]).css('display', '');
            $(self.prefetchedImgs[newIndexR]).css('display', '');

            $(self.leafEdgeR).css({
                // Moves the right leaf edge
                width: self.twoPage.edgeWidth-newLeafEdgeWidthL+'px',
                left:  gutter+newWidthR+'px'
            });

            $(self.leafEdgeL).css({
                // Moves and resizes the left leaf edge
                width: newLeafEdgeWidthL+'px',
                left:  gutter-newWidthL-newLeafEdgeWidthL+'px'
            });

            // Resizes the brown border div
            $(self.twoPage.coverDiv).css({
                width: self.twoPageCoverWidth(newWidthL+newWidthR)+'px',
                left: gutter-newWidthL-newLeafEdgeWidthL-self.twoPage.coverInternalPadding+'px'
            });

            $(self.leafEdgeTmp).remove();
            self.leafEdgeTmp = null;

            // $$$ TODO refactor with opposite direction flip

            self.twoPage.currentIndexL = newIndexL;
            self.twoPage.currentIndexR = newIndexR;
            self.twoPage.scaledWL = newWidthL;
            self.twoPage.scaledWR = newWidthR;
            self.twoPage.gutter = gutter;

            self.firstIndex = self.twoPage.currentIndexL;
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();
            self.animating = false;

            if (self.enableSearch) self.updateSearchHilites2UP();
            self.updatePageNumBox2UP();

            self.setMouseHandlers2UP();
            self.twoPageSetCursor();

            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });

};

// flipFwdToIndex()
//______________________________________________________________________________
// Whether we flip left or right is dependent on the page progression
// to flip forward one spread, pass index=null
BookReader.prototype.flipFwdToIndex = function(index) {

    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = this.twoPage.currentIndexR+2; // $$$ assumes indices are continuous
    }
    if (index > this.lastDisplayableIndex()) return;

    this.updateNavIndex(index);

    this.animating = true;

    var nextIndices = this.getSpreadIndices(index);

    if ('rl' != this.pageProgression) {
        // We did not specify RTL
        var gutter = this.prepareFlipRightToLeft(nextIndices[0], nextIndices[1]);
        this.flipRightToLeft(nextIndices[0], nextIndices[1], gutter);
    } else {
        // RTL
        var gutter = this.prepareFlipLeftToRight(nextIndices[0], nextIndices[1]);
        this.flipLeftToRight(nextIndices[0], nextIndices[1]);
    }
};

// flipRightToLeft(nextL, nextR, gutter)
// $$$ better not to have to pass gutter in
//______________________________________________________________________________
// Flip from left to right and show the nextL and nextR indices on those sides
BookReader.prototype.flipRightToLeft = function(newIndexL, newIndexR) {
    var oldLeafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    var oldLeafEdgeWidthR = this.twoPage.edgeWidth-oldLeafEdgeWidthL;
    var newLeafEdgeWidthL = this.leafEdgeWidth(newIndexL);
    var newLeafEdgeWidthR = this.twoPage.edgeWidth-newLeafEdgeWidthL;

    var leafEdgeTmpW = oldLeafEdgeWidthR - newLeafEdgeWidthR;

    var top = this.twoPageTop();
    var scaledW = this.getPageWidth2UP(this.twoPage.currentIndexR);

    var middle = this.twoPage.middle;
    var gutter = middle + this.gutterOffsetForIndex(newIndexL);

    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height + 'px',
        left: gutter+scaledW+'px',
        top: top+'px',
        zIndex:1000
    }).appendTo('#BRtwopageview');

    var currWidthL = this.getPageWidth2UP(this.twoPage.currentIndexL);
    var currWidthR = this.getPageWidth2UP(this.twoPage.currentIndexR);
    var newWidthL = this.getPageWidth2UP(newIndexL);
    var newWidthR = this.getPageWidth2UP(newIndexR);

    $(this.leafEdgeR).css({width: newLeafEdgeWidthR+'px', left: gutter+newWidthR+'px' });

    var self = this; // closure-tastic!

    var speed = this.flipSpeed;

    if (this.enableSearch) this.removeSearchHilites();

    $(this.leafEdgeTmp).animate({left: gutter}, speed, 'easeInSine');
    $(this.prefetchedImgs[this.twoPage.currentIndexR]).animate({width: '0px'}, speed, 'easeInSine', function() {
        $('#BRgutter').css({left: (gutter - self.twoPage.bookSpineDivWidth*0.5)+'px'});
        $(self.leafEdgeTmp).animate({left: gutter-newWidthL-leafEdgeTmpW+'px'}, speed, 'easeOutSine');
        $(self.prefetchedImgs[newIndexL]).animate({width: newWidthL+'px'}, speed, 'easeOutSine', function() {
            $(self.prefetchedImgs[newIndexR]).css('zIndex', 2);

            //jquery adds display:block to the element style, which interferes with our print css
            $(self.prefetchedImgs[newIndexL]).css('display', '');
            $(self.prefetchedImgs[newIndexR]).css('display', '');

            $(self.leafEdgeL).css({
                width: newLeafEdgeWidthL+'px',
                left: gutter-newWidthL-newLeafEdgeWidthL+'px'
            });

            // Resizes the book cover
            $(self.twoPage.coverDiv).css({
                width: self.twoPageCoverWidth(newWidthL+newWidthR)+'px',
                left: gutter - newWidthL - newLeafEdgeWidthL - self.twoPage.coverInternalPadding + 'px'
            });

            $(self.leafEdgeTmp).remove();
            self.leafEdgeTmp = null;

            self.twoPage.currentIndexL = newIndexL;
            self.twoPage.currentIndexR = newIndexR;
            self.twoPage.scaledWL = newWidthL;
            self.twoPage.scaledWR = newWidthR;
            self.twoPage.gutter = gutter;

            self.firstIndex = self.twoPage.currentIndexL;
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();
            self.animating = false;


            if (self.enableSearch) self.updateSearchHilites2UP();
            self.updatePageNumBox2UP();

            self.setMouseHandlers2UP();
            self.twoPageSetCursor();

            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });
};

// setMouseHandlers2UP
//______________________________________________________________________________
BookReader.prototype.setMouseHandlers2UP = function() {
    this.setClickHandler2UP( this.prefetchedImgs[this.twoPage.currentIndexL],
        { self: this },
        function(e) {
            if (e.which == 3) {
                // right click
                if (e.data.self.protected) {
                    return false;
                }
                return true;
            }

             if (! e.data.self.twoPageIsZoomedIn()) {
                e.data.self.trigger('stop');
                e.data.self.left();
            }
            e.preventDefault();
        }
    );

    this.setClickHandler2UP( this.prefetchedImgs[this.twoPage.currentIndexR],
        { self: this },
        function(e) {
            if (e.which == 3) {
                // right click
                return !e.data.self.protected;
            }

            if (! e.data.self.twoPageIsZoomedIn()) {
                e.data.self.trigger('stop');
                e.data.self.right();
            }
            e.preventDefault();
        }
    );
};

// prefetchImg()
//______________________________________________________________________________
BookReader.prototype.prefetchImg = function(index) {
    var pageURI = this._getPageURI(index);

    // Load image if not loaded or URI has changed (e.g. due to scaling)
    var loadImage = false;
    if (undefined == this.prefetchedImgs[index]) {
        loadImage = true;
    } else if (pageURI != this.prefetchedImgs[index].uri) {
        loadImage = true;
    }

    if (loadImage) {
        var img = document.createElement("img");
        $(img).addClass('BRpageimage').addClass('BRnoselect');
        if (index < 0 || index > (this.getNumLeafs() - 1) ) {
            // Facing page at beginning or end, or beyond
            $(img).addClass('BRemptypage');
        }
        this.loadImage(pageURI, index, img);
        img.uri = pageURI; // browser may rewrite src so we stash raw URI here
        this.prefetchedImgs[index] = img;
    }
};


// prepareFlipLeftToRight()
//
//______________________________________________________________________________
//
// Prepare to flip the left page towards the right.  This corresponds to moving
// backward when the page progression is left to right.
BookReader.prototype.prepareFlipLeftToRight = function(prevL, prevR) {
    this.prefetchImg(prevL);
    this.prefetchImg(prevR);

    var height  = this._getPageHeight(prevL);
    var width   = this._getPageWidth(prevL);
    var middle = this.twoPage.middle;
    var top  = this.twoPageTop();
    var scaledW = this.twoPage.height*width/height; // $$$ assumes height of page is dominant

    // The gutter is the dividing line between the left and right pages.
    // It is offset from the middle to create the illusion of thickness to the pages
    var gutter = middle + this.gutterOffsetForIndex(prevL);

    var leftCSS = {
        position: 'absolute',
        left: gutter-scaledW+'px',
        right: '', // clear right property
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW+'px',
        zIndex: 1
    };

    $(this.prefetchedImgs[prevL]).css(leftCSS);

    $('#BRtwopageview').append(this.prefetchedImgs[prevL]);

    var rightCSS = {
        position: 'absolute',
        left:   gutter+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height,
        width:  '0',
        zIndex: 2
    };

    $(this.prefetchedImgs[prevR]).css(rightCSS);

    $('#BRtwopageview').append(this.prefetchedImgs[prevR]);
};

// $$$ mang we're adding an extra pixel in the middle.  See https://bugs.edge.launchpad.net/gnubook/+bug/411667
// prepareFlipRightToLeft()
//______________________________________________________________________________
BookReader.prototype.prepareFlipRightToLeft = function(nextL, nextR) {
    // Prefetch images
    this.prefetchImg(nextL);
    this.prefetchImg(nextR);

    var height  = this._getPageHeight(nextR);
    var width   = this._getPageWidth(nextR);
    var middle = this.twoPage.middle;
    var top  = this.twoPageTop();
    var scaledW = this.twoPage.height*width/height;

    var gutter = middle + this.gutterOffsetForIndex(nextL);

    $(this.prefetchedImgs[nextR]).css({
        position: 'absolute',
        left:   gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW+'px',
        zIndex: 1
    });

    $('#BRtwopageview').append(this.prefetchedImgs[nextR]);

    height  = this._getPageHeight(nextL);
    width   = this._getPageWidth(nextL);
    scaledW = this.twoPage.height*width/height;

    $(this.prefetchedImgs[nextL]).css({
        position: 'absolute',
        right:   $('#BRtwopageview').prop('clientWidth')-gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        width:  0+'px', // Start at 0 width, then grow to the left
        zIndex: 2
    });

    $('#BRtwopageview').append(this.prefetchedImgs[nextL]);

};

// getNextLeafs() -- NOT RTL AWARE
//______________________________________________________________________________
// BookReader.prototype.getNextLeafs = function(o) {
//     //TODO: we might have two left or two right leafs in a row (damaged book)
//     //For now, assume that leafs are contiguous.
//
//     //return [this.twoPage.currentIndexL+2, this.twoPage.currentIndexL+3];
//     o.L = this.twoPage.currentIndexL+2;
//     o.R = this.twoPage.currentIndexL+3;
// }

// getprevLeafs() -- NOT RTL AWARE
//______________________________________________________________________________
// BookReader.prototype.getPrevLeafs = function(o) {
//     //TODO: we might have two left or two right leafs in a row (damaged book)
//     //For now, assume that leafs are contiguous.
//
//     //return [this.twoPage.currentIndexL-2, this.twoPage.currentIndexL-1];
//     o.L = this.twoPage.currentIndexL-2;
//     o.R = this.twoPage.currentIndexL-1;
// }

// pruneUnusedImgs()
//______________________________________________________________________________
BookReader.prototype.pruneUnusedImgs = function() {
    for (var key in this.prefetchedImgs) {
        if ((key != this.twoPage.currentIndexL) && (key != this.twoPage.currentIndexR)) {
            $(this.prefetchedImgs[key]).remove();
        }
        if ((key < this.twoPage.currentIndexL-4) || (key > this.twoPage.currentIndexR+4)) {
            delete this.prefetchedImgs[key];
        }
    }
};

// prefetch()
//______________________________________________________________________________
BookReader.prototype.prefetch = function() {
    // $$$ We should check here if the current indices have finished
    //     loading (with some timeout) before loading more page images
    //     See https://bugs.edge.launchpad.net/bookreader/+bug/511391

    // prefetch visible pages first
    this.prefetchImg(this.twoPage.currentIndexL);
    this.prefetchImg(this.twoPage.currentIndexR);

    var adjacentPagesToLoad = 3;

    var lowCurrent = Math.min(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    var highCurrent = Math.max(this.twoPage.currentIndexL, this.twoPage.currentIndexR);

    var start = Math.max(lowCurrent - adjacentPagesToLoad, 0);
    var end = Math.min(highCurrent + adjacentPagesToLoad, this.getNumLeafs() - 1);

    // Load images spreading out from current
    for (var i = 1; i <= adjacentPagesToLoad; i++) {
        var goingDown = lowCurrent - i;
        if (goingDown >= start) {
            this.prefetchImg(goingDown);
        }
        var goingUp = highCurrent + i;
        if (goingUp <= end) {
            this.prefetchImg(goingUp);
        }
    }
};

// getPageWidth2UP()
//______________________________________________________________________________
BookReader.prototype.getPageWidth2UP = function(index) {
    // We return the width based on the dominant height
    var height  = this._getPageHeight(index);
    var width   = this._getPageWidth(index);
    return Math.floor(this.twoPage.height*width/height); // $$$ we assume width is relative to current spread
};

// twoPageGutter()
//______________________________________________________________________________
// Returns the position of the gutter (line between the page images)
BookReader.prototype.twoPageGutter = function() {
    return this.twoPage.middle + this.gutterOffsetForIndex(this.twoPage.currentIndexL);
};

// twoPageTop()
//______________________________________________________________________________
// Returns the offset for the top of the page images
BookReader.prototype.twoPageTop = function() {
    return this.twoPage.coverExternalPadding + this.twoPage.coverInternalPadding; // $$$ + border?
};

// twoPageCoverWidth()
//______________________________________________________________________________
// Returns the width of the cover div given the total page width
BookReader.prototype.twoPageCoverWidth = function(totalPageWidth) {
    return totalPageWidth + this.twoPage.edgeWidth + 2*this.twoPage.coverInternalPadding;
};

// twoPageGetViewCenter()
//______________________________________________________________________________
// Returns the percentage offset into twopageview div at the center of container div
// { percentageX: float, percentageY: float }
BookReader.prototype.twoPageGetViewCenter = function() {
    var center = {};

    var containerOffset = this.refs.$brContainer.offset();
    var viewOffset = $('#BRtwopageview').offset();
    center.percentageX = (containerOffset.left - viewOffset.left + (this.refs.$brContainer.prop('clientWidth') >> 1)) / this.twoPage.totalWidth;
    center.percentageY = (containerOffset.top - viewOffset.top + (this.refs.$brContainer.prop('clientHeight') >> 1)) / this.twoPage.totalHeight;

    return center;
};

// twoPageCenterView(percentageX, percentageY)
//______________________________________________________________________________
// Centers the point given by percentage from left,top of twopageview
BookReader.prototype.twoPageCenterView = function(percentageX, percentageY) {
    if ('undefined' == typeof(percentageX)) {
        percentageX = 0.5;
    }
    if ('undefined' == typeof(percentageY)) {
        percentageY = 0.5;
    }

    var viewWidth = $('#BRtwopageview').width();
    var containerClientWidth = this.refs.$brContainer.prop('clientWidth');
    var intoViewX = percentageX * viewWidth;

    var viewHeight = $('#BRtwopageview').height();
    var containerClientHeight = this.refs.$brContainer.prop('clientHeight');
    var intoViewY = percentageY * viewHeight;

    if (viewWidth < containerClientWidth) {
        // Can fit width without scrollbars - center by adjusting offset
        $('#BRtwopageview').css('left', (containerClientWidth >> 1) - intoViewX + 'px');
    } else {
        // Need to scroll to center
        $('#BRtwopageview').css('left', 0);
        this.refs.$brContainer.scrollLeft(intoViewX - (containerClientWidth >> 1));
    }

    if (viewHeight < containerClientHeight) {
        // Fits with scrollbars - add offset
        $('#BRtwopageview').css('top', (containerClientHeight >> 1) - intoViewY + 'px');
    } else {
        $('#BRtwopageview').css('top', 0);
        this.refs.$brContainer.scrollTop(intoViewY - (containerClientHeight >> 1));
    }
};

// twoPageFlipAreaHeight
//______________________________________________________________________________
// Returns the integer height of the click-to-flip areas at the edges of the book
BookReader.prototype.twoPageFlipAreaHeight = function() {
    return parseInt(this.twoPage.height);
};

// twoPageFlipAreaWidth
//______________________________________________________________________________
// Returns the integer width of the flip areas
BookReader.prototype.twoPageFlipAreaWidth = function() {
    var max = 100; // $$$ TODO base on view width?
    var min = 10;

    var width = this.twoPage.width * 0.15;
    return parseInt(BookReader.util.clamp(width, min, max));
};

// twoPageFlipAreaTop
//______________________________________________________________________________
// Returns integer top offset for flip areas
BookReader.prototype.twoPageFlipAreaTop = function() {
    return parseInt(this.twoPage.bookCoverDivTop + this.twoPage.coverInternalPadding);
};

// twoPageLeftFlipAreaLeft
//______________________________________________________________________________
// Left offset for left flip area
BookReader.prototype.twoPageLeftFlipAreaLeft = function() {
    return parseInt(this.twoPage.gutter - this.twoPage.scaledWL);
};

// twoPageRightFlipAreaLeft
//______________________________________________________________________________
// Left offset for right flip area
BookReader.prototype.twoPageRightFlipAreaLeft = function() {
    return parseInt(this.twoPage.gutter + this.twoPage.scaledWR - this.twoPageFlipAreaWidth());
};

// setHilightCss2UP()
//______________________________________________________________________________
//position calculation shared between search and text-to-speech functions
BookReader.prototype.setHilightCss2UP = function(div, index, left, right, top, bottom) {
    // We calculate the reduction factor for the specific page because it can be different
    // for each page in the spread
    var height = this._getPageHeight(index);
    var width  = this._getPageWidth(index);
    var reduce = this.twoPage.height/height;
    var scaledW = parseInt(width*reduce);

    var gutter = this.twoPageGutter();
    var pageL;
    if ('L' == this.getPageSide(index)) {
        pageL = gutter-scaledW;
    } else {
        pageL = gutter;
    }
    var pageT  = this.twoPageTop();

    $(div).css({
        width:  (right-left)*reduce + 'px',
        height: (bottom-top)*reduce + 'px',
        left:   pageL+left*reduce + 'px',
        top:    pageT+top*reduce +'px'
    });
};


// autoToggle()
//______________________________________________________________________________
BookReader.prototype.autoToggle = function() {

    this.trigger('stop');

    var bComingFrom1up = false;
    if (2 != this.mode) {
        bComingFrom1up = true;
        this.switchMode(this.constMode2up);
    }

    // Change to autofit if book is too large
    if (this.reduce < this.twoPageGetAutofitReduce()) {
        this.zoom2up('auto');
    }

    var self = this;
    if (null == this.autoTimer) {
        this.flipSpeed = 2000;

        // $$$ Draw events currently cause layout problems when they occur during animation.
        //     There is a specific problem when changing from 1-up immediately to autoplay in RTL so
        //     we workaround for now by not triggering immediate animation in that case.
        //     See https://bugs.launchpad.net/gnubook/+bug/328327
        if (('rl' == this.pageProgression) && bComingFrom1up) {
            // don't flip immediately -- wait until timer fires
        } else {
            // flip immediately
            this.flipFwdToIndex();
        }

        this.refs.$BRtoolbar.find('.play').hide();
        this.refs.$BRtoolbar.find('.pause').show();
        this.autoTimer=setInterval(function(){
            if (self.animating) {return;}

            if (Math.max(self.twoPage.currentIndexL, self.twoPage.currentIndexR) >= self.lastDisplayableIndex()) {
                self.flipBackToIndex(1); // $$$ really what we want?
            } else {
                self.flipFwdToIndex();
            }
        },5000);
    } else {
        this.autoStop();
    }
};

// autoStop()
//______________________________________________________________________________
// Stop autoplay mode, allowing animations to finish
BookReader.prototype.autoStop = function() {
    if (null != this.autoTimer) {
        clearInterval(this.autoTimer);
        this.flipSpeed = 'fast';
        this.refs.$BRtoolbar.find('.pause').hide();
        this.refs.$BRtoolbar.find('.play').show();
        this.autoTimer = null;
    }
};

// stopFlipAnimations
//______________________________________________________________________________
// Immediately stop flip animations.  Callbacks are triggered.
BookReader.prototype.stopFlipAnimations = function() {

    this.autoStop(); // Clear timers

    // Stop animation, clear queue, trigger callbacks
    if (this.leafEdgeTmp) {
        $(this.leafEdgeTmp).stop(false, true);
    }
    jQuery.each(this.prefetchedImgs, function() {
        $(this).stop(false, true);
        });

    // And again since animations also queued in callbacks
    if (this.leafEdgeTmp) {
        $(this.leafEdgeTmp).stop(false, true);
    }
    jQuery.each(this.prefetchedImgs, function() {
        $(this).stop(false, true);
    });

};

// keyboardNavigationIsDisabled(event)
//   - returns true if keyboard navigation should be disabled for the event
//______________________________________________________________________________
BookReader.prototype.keyboardNavigationIsDisabled = function(event) {
    return event.target.tagName == "INPUT";
};

// gutterOffsetForIndex
//______________________________________________________________________________
//
// Returns the gutter offset for the spread containing the given index.
// This function supports RTL
BookReader.prototype.gutterOffsetForIndex = function(pindex) {

    // To find the offset of the gutter from the middle we calculate our percentage distance
    // through the book (0..1), remap to (-0.5..0.5) and multiply by the total page edge width
    var offset = parseInt(((pindex / this.getNumLeafs()) - 0.5) * this.twoPage.edgeWidth);

    // But then again for RTL it's the opposite
    if ('rl' == this.pageProgression) {
        offset = -offset;
    }

    return offset;
};

// leafEdgeWidth
//______________________________________________________________________________
// Returns the width of the leaf edge div for the page with index given
BookReader.prototype.leafEdgeWidth = function(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.getPageSide(pindex) == 'L') && (this.pageProgression != 'rl')) {
        return parseInt( (pindex/this.getNumLeafs()) * this.twoPage.edgeWidth + 0.5);
    } else {
        return parseInt( (1 - pindex/this.getNumLeafs()) * this.twoPage.edgeWidth + 0.5);
    }
};

// jumpIndexForLeftEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the left page edge div)
BookReader.prototype.jumpIndexForLeftEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR - flipping backward
        var jumpIndex = this.twoPage.currentIndexL - ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;

        // browser may have resized the div due to font size change -- see https://bugs.launchpad.net/gnubook/+bug/333570
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexL - 2);
        return jumpIndex;

    } else {
        var jumpIndex = this.twoPage.currentIndexL + ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexL + 2, this.lastDisplayableIndex());
        return jumpIndex;
    }
};

// jumpIndexForRightEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the right page edge div)
BookReader.prototype.jumpIndexForRightEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR
        var jumpIndex = this.twoPage.currentIndexR + (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexR + 2, this.lastDisplayableIndex());
        return jumpIndex;
    } else {
        var jumpIndex = this.twoPage.currentIndexR - (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexR - 2);
        return jumpIndex;
    }
};


// initNavbar
//______________________________________________________________________________
// Initialize the navigation bar.
// $$$ this could also add the base elements to the DOM, so disabling the nav bar
//     could be as simple as not calling this function
BookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar
    this.refs.$br.append(
      "<div id=\"BRnav\" class=\"BRnavDesktop\">"
      +"  <div id=\"BRcurrentpageWrapper\"><span class='currentpage'></span></div>"
      +"  <div id=\"BRpage\">"
      // Note, it's important for there to not be whitespace
      +     "<button class=\"BRicon book_left\"></button>"
      +     "<button class=\"BRicon book_right\"></button>"
      +     "<span class=\"desktop-only\">&nbsp;&nbsp;</span>"
      +     "<button class=\"BRicon onepg desktop-only\"></button>"
      +     "<button class=\"BRicon twopg desktop-only\"></button>"
      +     "<button class=\"BRicon thumb desktop-only\"></button>"
      +"  </div>"
      +"  <div id=\"BRnavpos\">"
      +"    <div id=\"BRpager\"></div>"
      +"    <div id=\"BRnavline\">"
      +"      <div class=\"BRnavend\" id=\"BRnavleft\"></div>"
      +"      <div class=\"BRnavend\" id=\"BRnavright\"></div>"
      +"    </div>"
      +"  </div>"
      +"  <div id=\"BRnavCntlBtm\" class=\"BRnavCntl BRdn\"></div>"
      +"</div>"
    );

    var self = this;
    $('#BRpager').slider({
        animate: true,
        min: 0,
        max: this.getNumLeafs() - 1,
        value: this.currentIndex(),
        range: "min"
    })
    .bind('slide', function(event, ui) {
        self.updateNavPageNum(ui.value);
        return true;
    })
    .bind('slidechange', function(event, ui) {
        self.updateNavPageNum(ui.value);
        // recursion prevention for jumpToIndex
        if ( $(this).data('swallowchange') ) {
            $(this).data('swallowchange', false);
        } else {
            self.jumpToIndex(ui.value);
        }
        return true;
    });

    this.updateNavPageNum(this.currentIndex());

    $("#BRzoombtn").draggable({axis:'y',containment:'parent'});
};

// initEmbedNavbar
//______________________________________________________________________________
// Initialize the navigation bar when embedded
BookReader.prototype.initEmbedNavbar = function() {
    var thisLink = (window.location + '').replace('?ui=embed',''); // IA-specific
    var logoHtml = '';
    if (this.showLogo) {
      logoHtml = "<a class='logo' href='" + this.logoURL + "' 'target='_blank' ></a>";
    }

    this.refs.$br.append(
        '<div id="BRnav" class="BRnavEmbed">'
        +   "<span class='BRtoolbarbuttons'>"
        +         '<button class="BRicon full"></button>'
        +         '<button class="BRicon book_left"></button>'
        +         '<button class="BRicon book_right"></button>'
        +   "</span>"
        +   logoHtml
        +   "<span class='BRembedreturn'><a href='" + thisLink + "' target='_blank' ></a></span>"
        + '</div>'
    );
    this.refs.$br.find('.BRembedreturn a').text(this.bookTitle);
};


BookReader.prototype.getNavPageNumString = function(index, excludePrefix) {
    excludePrefix = excludePrefix === undefined ? false : true;
    var pageNum = this.getPageNum(index);
    var pageStr;
    if (pageNum && pageNum[0] == 'n') { // funny index
        pageStr = index + 1 + ' / ' + this.getNumLeafs(); // Accessible index starts at 0 (alas) so we add 1 to make human
    } else {
        pageStr = pageNum + ' of ' + this.maxPageNum;
        if (!excludePrefix) pageStr = 'Page ' + pageStr;
    }
    return pageStr;
}
BookReader.prototype.updateNavPageNum = function(index) {
    $('.currentpage').text(this.getNavPageNumString(index));
};

/*
 * Update the nav bar display - does not cause navigation.
 */
BookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.currentIndex();
    $('#BRpager').data('swallowchange', true).slider('value', index);
};

BookReader.prototype.updateNavIndexDebounced = BookReader.util.debounce(BookReader.prototype.updateNavIndex, 500);

BookReader.prototype.updateNavIndexThrottled = BookReader.util.throttle(BookReader.prototype.updateNavIndex, 500, false);



/**
 * This method builds the html for the toolbar. It can be decorated to extend
 * the toolbar.
 * @return {jqueryElement}
 */
BookReader.prototype.buildToolbarElement = function() {
  var logoHtml = '';
  if (this.showLogo) {
    logoHtml = "<span class='BRtoolbarSection BRtoolbarSectionLogo tc'>"
    +  "<a class='logo' href='" + this.logoURL + "'></a>"
    + "</span>";
  }

  // Add large screen navigation
  this.refs.$BRtoolbar = $(
    "<div class='BRtoolbar header'>"
    +   "<span class='BRtoolbarbuttons'>"
    +     "<span class='BRtoolbarLeft'>"
    +       logoHtml
    +       "<span class='BRtoolbarSection BRtoolbarSectionTitle title tl ph10 last'>"
    +           "<span id='BRreturn'><a></a></span>"
    +           "<div id='BRnavCntlTop' class='BRnabrbuvCntl'></div>"
    +       "</span>"
    +    "</span>"

    +     "<span class='BRtoolbarRight'>"

    +       "<span class='BRtoolbarSection BRtoolbarSectionInfo tc ph10'>"
    +         "<button class='BRicon info js-tooltip'></button>"
    +         "<button class='BRicon share js-tooltip'></button>"
    +       "</span>"

    // zoom
    +       "<span class='BRtoolbarSection BRtoolbarSectionZoom tc ph10'>"
    +         "<button class='BRicon zoom_out js-tooltip'></button>"
    +         "<button class='BRicon zoom_in js-tooltip'></button>"
    +       "</span>"

    +     "</span>" // end BRtoolbarRight
    +   "</span>" // end desktop-only
    + "</div>"
    );
    return this.refs.$BRtoolbar;
}



BookReader.prototype.initToolbar = function(mode, ui) {
    if (ui == 'embed' || !this.showToolbar) {
        return; // No toolbar at top in embed mode
    }
    var self = this;

    this.refs.$br.append(this.buildToolbarElement());

    $('#BRreturn a')
      .addClass('BRTitleLink')
      .attr({'href': self.bookUrl, 'title': self.bookTitle})
      .html('<span class="BRreturnTitle">' + this.bookTitle + '</span>');

    if (self.bookUrl && self.bookUrlTitle && self.bookUrlText) {
        $('#BRreturn a').append('<br>' + self.bookUrlText)
    }

    this.refs.$BRtoolbar.find('.BRnavCntl').addClass('BRup');
    this.refs.$BRtoolbar.find('.pause').hide();

    this.updateToolbarZoom(this.reduce); // Pretty format

    // We build in mode 2
    this.refs.$BRtoolbar.append();

    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        this.refs.$BRtoolbar.find('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        this.refs.$BRtoolbar.find('.thumbnail_mode').hide();
    }

    // Hide one page button if it is the only mode available
    if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
        this.refs.$BRtoolbar.find('.one_page_mode').hide();
    }

    // $$$ Don't hardcode ids
    this.refs.$BRtoolbar.find('.share').colorbox({
        inline: true,
        opacity: "0.5",
        href: "#BRshare",
        onLoad: function() {
            self.trigger('stop');
            $('.BRpageviewValue').val(window.location.href);
        }
    });
    this.refs.$BRtoolbar.find('.info').colorbox({
        inline: true,
        opacity: "0.5",
        href: "#BRinfo",
        onLoad: function() {
            self.trigger('stop');
        }
    });

    $('<div style="display: none;"></div>').append(
        this.blankShareDiv()
    ).append(
        this.blankInfoDiv()
    ).appendTo($('body'));

    $('#BRinfo .BRfloatTitle a')
        .attr({'href': this.bookUrl})
        .text(this.bookTitle)
        .addClass('title');

    // These functions can be overridden
    this.buildInfoDiv($('#BRinfo'));
    this.buildShareDiv($('#BRshare'));
};

BookReader.prototype.blankInfoDiv = function() {
    return $([
        '<div class="BRfloat" id="BRinfo">',
            '<div class="BRfloatHead">About this book',
                '<button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
            '<div class="BRfloatBody">',
                '<div class="BRfloatCover">',
                '</div>',
                '<div class="BRfloatMeta">',
                    '<div class="BRfloatTitle">',
                        '<h2><a/></h2>',
                    '</div>',
                '</div>',
            '</div>',
            '<div class="BRfloatFoot">',
                '<a href="https://openlibrary.org/dev/docs/bookreader">About the BookReader</a>',
            '</div>',
        '</div>'].join('\n')
    );
};

BookReader.prototype.blankShareDiv = function() {
    return $([
        '<div class="BRfloat" id="BRshare">',
            '<div class="BRfloatHead">',
                'Share',
                '<button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
        '</div>'].join('\n')
    );
};


// updateToolbarZoom(reduce)
//______________________________________________________________________________
// Update the displayed zoom factor based on reduction factor
BookReader.prototype.updateToolbarZoom = function(reduce) {
    var value;
    var autofit = null;

    // $$$ TODO preserve zoom/fit for each mode
    if (this.mode == this.constMode2up) {
        autofit = this.twoPage.autofit;
    } else {
        autofit = this.onePage.autofit;
    }

    if (autofit) {
        value = autofit.slice(0,1).toUpperCase() + autofit.slice(1);
    } else {
        value = (100 / reduce).toFixed(2);
        // Strip trailing zeroes and decimal if all zeroes
        value = value.replace(/0+$/,'');
        value = value.replace(/\.$/,'');
        value += '%';
    }
    $('#BRzoom').text(value);
};

// bindNavigationHandlers
//______________________________________________________________________________
// Bind navigation handlers
BookReader.prototype.bindNavigationHandlers = function() {

    var self = this; // closure
    jIcons = $('.BRicon');

    jIcons.filter('.onepg').bind('click', function(e) {
        self.switchMode(self.constMode1up);
    });

    jIcons.filter('.twopg').bind('click', function(e) {
        self.switchMode(self.constMode2up);
    });

    jIcons.filter('.thumb').bind('click', function(e) {
        self.switchMode(self.constModeThumb);
    });

    jIcons.filter('.fit').bind('fit', function(e) {
        // XXXmang implement autofit zoom
    });

    jIcons.filter('.book_left').click(function(e) {
        self.trigger('stop');
        self.left();
        return false;
    });

    jIcons.filter('.book_right').click(function(e) {
        self.trigger('stop');
        self.right();
        return false;
    });

    jIcons.filter('.book_up').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollUp();
        } else {
            self.prev();
        }
        return false;
    });

    jIcons.filter('.book_down').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollDown();
        } else {
            self.next();
        }
        return false;
    });

    jIcons.filter('.play').click(function(e) {
        self.autoToggle();
        return false;
    });

    jIcons.filter('.pause').click(function(e) {
        self.autoToggle();
        return false;
    });

    jIcons.filter('.book_top').click(function(e) {
        self.first();
        return false;
    });

    jIcons.filter('.book_bottom').click(function(e) {
        self.last();
        return false;
    });

    jIcons.filter('.book_leftmost').click(function(e) {
        self.leftmost();
        return false;
    });

    jIcons.filter('.book_rightmost').click(function(e) {
        self.rightmost();
        return false;
    });

    jIcons.filter('.zoom_in').bind('click', function() {
        self.trigger('stop');
        self.zoom(1);
        return false;
    });

    jIcons.filter('.zoom_out').bind('click', function() {
        self.trigger('stop');
        self.zoom(-1);
        return false;
    });

    jIcons.filter('.full').bind('click', function() {
        if (self.ui == 'embed') {
            // $$$ bit of a hack, IA-specific
            var url = (window.location + '').replace("?ui=embed","");
            window.open(url);
        }

        // Not implemented
    });

    $('.BRnavCntl').click(
        function(){
            var promises = [];
            // TODO don't use magic constants
            if ($('#BRnavCntlBtm').hasClass('BRdn')) {
                if (self.refs.$BRtoolbar)
                    promises.push(self.refs.$BRtoolbar.animate({top: self.refs.$BRtoolbar.height() * -1}).promise());
                promises.push($('#BRnav').animate({bottom:-55}).promise());
                $('#BRnavCntlBtm').addClass('BRup').removeClass('BRdn');
                $('#BRnavCntlTop').addClass('BRdn').removeClass('BRup');
                $('#BRnavCntlBtm.BRnavCntl').animate({height:'45px'});
                $('.BRnavCntl').delay(1000).animate({opacity:.25}, 1000);
            } else {
                if (self.refs.$BRtoolbar)
                    promises.push(self.refs.$BRtoolbar.animate({top:0}).promise());
                promises.push($('#BRnav').animate({bottom:0}).promise());
                $('#BRnavCntlBtm').addClass('BRdn').removeClass('BRup');
                $('#BRnavCntlTop').addClass('BRup').removeClass('BRdn');
                $('#BRnavCntlBtm.BRnavCntl').animate({height:'30px'});
                $('.BRvavCntl').animate({opacity:1})
            };
            $.when.apply($, promises).done(function() {
              // Only do full resize in auto mode and need to recalc. size
              if (self.mode == self.constMode2up && self.twoPage.autofit != null && self.twoPage.autofit != 'none') {
                self.resize();
              } else if (self.mode == self.constMode1up && self.onePage.autofit != null && self.onePage.autofit != 'none') {
                self.resize();
              } else {
                // Don't do a full resize to avoid redrawing images
                self.resizeBRcontainer();
              }
            });
        }
    );
    $('#BRnavCntlBtm').mouseover(function(){
        if ($(this).hasClass('BRup')) {
            $('.BRnavCntl').animate({opacity:1},250);
        }
    });
    $('#BRnavCntlBtm').mouseleave(function(){
        if ($(this).hasClass('BRup')) {
            $('.BRnavCntl').animate({opacity:.25},250);
        }
    });
    $('#BRnavCntlTop').mouseover(function(){
        if ($(this).hasClass('BRdn')) {
            $('.BRnavCntl').animate({opacity:1},250);
        }
    });
    $('#BRnavCntlTop').mouseleave(function(){
        if ($(this).hasClass('BRdn')) {
            $('.BRnavCntl').animate({opacity:.25},250);
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

// unbindNavigationHandlers
//______________________________________________________________________________
// Unbind navigation handlers
BookReader.prototype.unbindNavigationHandlers = function() {
    $(document).off('mousemove.navigation', this.el);
};

// navigationMousemoveHandler
//______________________________________________________________________________
// Handle mousemove related to navigation.  Bind at #BookReader level to allow autohide.
BookReader.prototype.navigationMousemoveHandler = function(event) {
    // $$$ possibly not great to be calling this for every mousemove

    if (event.data['br'].uiAutoHide) {
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
    }
};

BookReader.prototype.swipeMousedownHandler = function(event) {
    var self = event.data['br'];

    // We should be the last bubble point for the page images
    // Disable image drag and select, but keep right-click
    if (event.which == 3) {
        return !self.protected;
    }

    $(event.target).bind('mouseout.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mouseup.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mousemove.swipe',
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

    $(event.target).unbind('mouseout.swipe').unbind('mouseup.swipe').unbind('mousemove.swipe');

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
    this.refs.$br.bind('MozTouchDown', function(event) {
        if (this.mode == self.constMode2up) {
            event.preventDefault();
        }
    })
    .bind('MozTouchMove', function(event) {
        if (this.mode == self.constMode2up) {
            event.preventDefault();
        }
    })
    .bind('MozTouchUp', function(event) {
        if (this.mode == self.constMode2up) {
            event.preventDefault();
        }
    });
};

// navigationIsVisible
//______________________________________________________________________________
// Returns true if the navigation elements are currently visible
BookReader.prototype.navigationIsVisible = function() {
    // $$$ doesn't account for transitioning states, nav must be fully visible to return true
    var toolpos = this.refs.$BRtoolbar.offset();
    var tooltop = toolpos.top;
    return tooltop == 0;
};

// hideNavigation
//______________________________________________________________________________
// Hide navigation elements, if visible
BookReader.prototype.hideNavigation = function() {
    // Check if navigation is showing
    if (this.navigationIsVisible()) {
        // $$$ don't hardcode height
        this.refs.$BRtoolbar.animate({top:-60});
        $('#BRnav').animate({bottom:-60});
    }
};

// showNavigation
//______________________________________________________________________________
// Show navigation elements
BookReader.prototype.showNavigation = function() {
    // Check if navigation is hidden
    if (!this.navigationIsVisible()) {
        this.refs.$BRtoolbar.animate({top:0});
        $('#BRnav').animate({bottom:0});
    }
};


// firstDisplayableIndex
//______________________________________________________________________________
// Returns the index of the first visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.firstDisplayableIndex = function() {
    if (this.mode != this.constMode2up) {
        return 0;
    }

    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(0) == 'L') {
            return 0;
        } else {
            return -1;
        }
    } else {
        // RTL
        if (this.getPageSide(0) == 'R') {
            return 0;
        } else {
            return -1;
        }
    }
};

// lastDisplayableIndex
//______________________________________________________________________________
// Returns the index of the last visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as pa  rt of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.lastDisplayableIndex = function() {

    var lastIndex = this.getNumLeafs() - 1;

    if (this.mode != this.constMode2up) {
        return lastIndex;
    }

    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(lastIndex) == 'R') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    } else {
        // RTL
        if (this.getPageSide(lastIndex) == 'L') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    }
};

// Parameter related functions

// updateFromParams(params)
//________
// Update ourselves from the params object.
//
// e.g. this.updateFromParams(this.paramsFromFragment(window.location.hash.substr(1)))
BookReader.prototype.updateFromParams = function(params) {
    if ('undefined' != typeof(params.mode)) {
        this.switchMode(params.mode);
    }

    // $$$ process /zoom
    var pageFound = false;
    // We only respect page if index is not set
    if ('undefined' != typeof(params.index)) {
        pageFound = true;
        if (params.index != this.currentIndex()) {
            this.jumpToIndex(params.index);
        }
    } else if ('undefined' != typeof(params.page)) {
        pageFound = true;
        // $$$ this assumes page numbers are unique
        if (params.page != this.getPageNum(this.currentIndex())) {
            this.jumpToPage(params.page);
        }
    }

    // process /search
    if ('undefined' != typeof(params.searchTerm) && this.enableSearch) {
        if (this.searchTerm != params.searchTerm) {
            this.search(params.searchTerm, {goToFirstResult: !pageFound});
            // Update the search fields
            $('.textSrch').val(params.searchTerm); // TODO fix issues with placeholder
        }
    }

    // $$$ process /region
    // $$$ process /highlight

    // $$$ process /theme
    if (this.enableThemesPlugin && 'undefined' != typeof(params.theme)) {
        this.updateTheme(params.theme);
    }
};


// getPageIndex(pageNum)
//________
// Returns the *highest* index the given page number, or undefined
BookReader.prototype.getPageIndex = function(pageNum) {
    var pageIndices = this.getPageIndices(pageNum);

    if (pageIndices.length > 0) {
        return pageIndices[pageIndices.length - 1];
    }

    return undefined;
};

// getPageIndices(pageNum)
//________
// Returns an array (possibly empty) of the indices with the given page number
BookReader.prototype.getPageIndices = function(pageNum) {
    var indices = [];

    // Check for special "nXX" page number
    if (pageNum.slice(0,1) == 'n') {
        try {
            var pageIntStr = pageNum.slice(1, pageNum.length);
            var pageIndex = parseInt(pageIntStr);
            indices.push(pageIndex);
            return indices;
        } catch(err) {
            // Do nothing... will run through page names and see if one matches
        }
    }

    var i;
    for (i=0; i<this.getNumLeafs(); i++) {
        if (this.getPageNum(i) == pageNum) {
            indices.push(i);
        }
    }

    return indices;
};

// getPageName(index)
//________
// Returns the name of the page as it should be displayed in the user interface
BookReader.prototype.getPageName = function(index) {
    return 'Page ' + this.getPageNum(index);
};


// canSwitchToMode
//________
// Returns true if we can switch to the requested mode
BookReader.prototype.canSwitchToMode = function(mode) {
    if (mode == this.constMode2up || mode == this.constModeThumb) {
        // check there are enough pages to display
        // $$$ this is a workaround for the mis-feature that we can't display
        //     short books in 2up mode
        if (this.getNumLeafs() < 2) {
            return false;
        }
    }

    return true;
};

// _getPageWidth
//--------
// Returns the page width for the given index, or first or last page if out of range
BookReader.prototype._getPageWidth = function(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = BookReader.util.clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageWidth(index);
};

// _getPageHeight
//--------
// Returns the page height for the given index, or first or last page if out of range
BookReader.prototype._getPageHeight = function(index) {
    index = BookReader.util.clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageHeight(index);
};

// _getPageURI
//--------
// Returns the page URI or transparent image if out of range
BookReader.prototype._getPageURI = function(index, reduce, rotate) {
    if (index < 0 || index >= this.getNumLeafs()) { // Synthesize page
        return this.imagesBaseURL + "transparent.png";
    }

    if ('undefined' == typeof(reduce)) {
        // reduce not passed in
        // $$$ this probably won't work for thumbnail mode
        var ratio = this.getPageHeight(index) / this.twoPage.height;
        var scale;
        // $$$ we make an assumption here that the scales are available pow2 (like kakadu)
        if (ratio < 2) {
            scale = 1;
        } else if (ratio < 4) {
            scale = 2;
        } else if (ratio < 8) {
            scale = 4;
        } else if (ratio < 16) {
            scale = 8;
        } else  if (ratio < 32) {
            scale = 16;
        } else {
            scale = 32;
        }
        reduce = scale;
    }

    return this.getPageURI(index, reduce, rotate);
};


// showProgressPopup
//______________________________________________________________________________
BookReader.prototype.showProgressPopup = function(msg) {
    if (this.popup) return;

    this.popup = document.createElement("div");
    $(this.popup).css({
        top:      (this.refs.$br.height()*0.5-100) + 'px',
        left:     (this.refs.$br.width()-300)*0.5 + 'px'
    }).prop('className', 'BRprogresspopup');

    var bar = document.createElement("div");
    $(bar).css({
        height:   '20px'
    }).prop('className', 'BRprogressbar');
    $(this.popup).append(bar);

    if (msg) {
        var msgdiv = document.createElement("div");
        msgdiv.innerHTML = msg;
        $(this.popup).append(msgdiv);
    }

    $(this.popup).appendTo(this.refs.$br);
};

// removeProgressPopup
//______________________________________________________________________________
BookReader.prototype.removeProgressPopup = function() {
    $(this.popup).remove();
    $('.BRprogresspopup').remove();
    this.popup=null;
};


BookReader.prototype.buildShareDiv = function(jShareDiv) {
    var pageView = document.location + '';
    var bookView = (pageView + '').replace(/#.*/,'');
    var self = this;

    var embedHtml = '';
    if (this.getEmbedCode) {
      embedHtml = [
        '<div class="share-embed">',
          '<p class="share-embed-prompt">Copy and paste one of these options to share this book elsewhere.</p>',
          '<form method="post" action="">',
              '<fieldset class="fieldset-share-pageview">',
                  '<label for="pageview">Link to this page view</label>',
                  '<input type="text" name="pageview" class="BRpageviewValue" value="' + pageView + '"/>',
              '</fieldset>',
              '<fieldset class="fieldset-share-book-link">',
                  '<label for="booklink">Link to the book</label>',
                  '<input type="text" name="booklink" id="booklink" value="' + bookView + '"/>',
              '</fieldset>',
              '<fieldset class="fieldset-embed">',
                  '<label for="iframe">Embed a mini Book Reader</label>',
                  '<fieldset class="sub">',
                      '<label class="sub">',
                          '<input type="radio" name="pages" value="' + this.constMode1up + '" checked="checked"/>',
                          '1 page',
                      '</label>',
                      '<label class="sub">',
                          '<input type="radio" name="pages" value="' + this.constMode2up + '"/>',
                          '2 pages',
                      '</label>',
                      '<label class="sub">',
                          '<input type="checkbox" name="thispage" value="thispage"/>',
                          'Open to this page?',
                      '</label>',
                  '</fieldset>',
                  '<textarea cols="30" rows="4" name="iframe" class="BRframeEmbed"></textarea>',
              '</fieldset>',
          '</form>',
        '</div>'
      ].join('\n');
    }

    var jForm = $([
        '<div class="share-title">Share this book</div>',
        '<div class="share-social">',
          '<div><button class="action share facebook-share-button"><i class="BRicon fb" /> Facebook</button></div>',
          '<div><button class="action share twitter-share-button"><i class="BRicon twitter" /> Twitter</button></div>',
          '<div><button class="action share email-share-button"><i class="BRicon email" /> Email</button></div>',
          '<label class="sub open-to-this-page">',
              '<input class="thispage-social" type="checkbox" />',
              'Open to this page?',
          '</label>',
        '</div>',
        embedHtml,
        '<div class="BRfloatFoot center">',
            '<button class="share-finished" type="button" onclick="$.fn.colorbox.close();">Finished</button>',
        '</div>'
        ].join('\n'));

    jForm.appendTo(jShareDiv);

    jForm.find('.fieldset-embed input').bind('change', function() {
        var form = $(this).parents('form:first');
        var params = {};
        params.mode = $(form.find('.fieldset-embed input[name=pages]:checked')).val();
        if (form.find('.fieldset-embed input[name=thispage]').prop('checked')) {
            params.page = self.getPageNum(self.currentIndex());
        }

        if (self.getEmbedCode) {
          // $$$ changeable width/height to be added to share UI
          var frameWidth = "480px";
          var frameHeight = "430px";
          form.find('.BRframeEmbed').val(self.getEmbedCode(frameWidth, frameHeight, params));
        }
    });

    jForm.find('input, textarea').bind('focus', function() {
        this.select();
    });

    // Bind share buttons

    // Use url without hashes
    jForm.find('.facebook-share-button').click(function(){
      var params = $.param({ u: self._getSocialShareUrl() });
      var url = 'https://www.facebook.com/sharer.php?' + params;
      self.createPopup(url, 600, 400, 'Share')
    });
    jForm.find('.twitter-share-button').click(function(){
      var params = $.param({
        url: self._getSocialShareUrl(),
        text: self.bookTitle
      });
      var url = 'https://twitter.com/intent/tweet?' + params;
      self.createPopup(url, 600, 400, 'Share')
    });
    jForm.find('.email-share-button').click(function(){
      var body = self.bookTitle + "\n\n" + self._getSocialShareUrl();
      window.location.href = 'mailto:?subject=' + encodeURI(self.bookTitle) + '&body=' + encodeURI(body);
    });

    jForm.find('input[name=thispage]').trigger('change');

    jForm.appendTo(jShareDiv);
};

BookReader.prototype._getSocialShareUrl = function() {
    var shareThisPage = this.refs.$br.find('.thispage-social').prop('checked');
    if (shareThisPage) {
      return window.location.href;
    } else {
      return document.location.protocol + "//" + window.location.hostname + window.location.pathname;
    }
};

/**
 * @param JInfoDiv DOM element. Appends info to this element
 * Can be overridden or extended
 */
BookReader.prototype.buildInfoDiv = function(jInfoDiv) {
    // Remove these legacy elements
    jInfoDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

    var $leftCol = $("<div class=\"BRinfoLeftCol\"></div>");
    if (this.thumbnail) {
      $leftCol.append($("<div class=\"BRimageW\">"
      +"  <img src=\""+this.thumbnail+"\" "
      +"       alt=\""+BookReader.util.escapeHTML(this.bookTitle)+"\" />"
      +"</div>"));
    }

    var $rightCol = $("<div class=\"BRinfoRightCol\">");

    // A loop to build fields
    var extraClass;
    for (var i = 0; i < this.metadata.length; i++) {
      extraClass = this.metadata[i].extraValueClass || '';
      $rightCol.append($("<div class=\"BRinfoValueW\">"
      +"  <div class=\"BRinfoLabel\">"
      +     this.metadata[i].label
      +"  </div>"
      +"  <div class=\"BRinfoValue " + extraClass + "\">"
      +     this.metadata[i].value
      +"  </div>"
      +"</div>"));
    }

    var moreInfoText;
    if (this.bookUrlMoreInfo) {
      moreInfoText = this.bookUrlMoreInfo;
    } else if (this.bookTitle) {
      moreInfoText = this.bookTitle;
    }

    if (moreInfoText && this.bookUrl) {
      $rightCol.append($("<div class=\"BRinfoValueW\">"
        +"<div class=\"BRinfoMoreInfoW\">"
        +"  <a class=\"BRinfoMoreInfo\" href=\""+this.bookUrl+"\">"
        +   moreInfoText
        +"  </a>"
        +"</div>"
      +"</div>"));
    }


    var footerEl = "<div class=\"BRfloatFoot BRinfoFooter\"></div>";

    var children = [
      $leftCol,
      $rightCol,
      '<br style="clear:both"/>'
    ];
    var childrenEl = $('<div class="BRinfoW mv20-lg">').append(children);

    jInfoDiv.append(
      childrenEl,
      $(footerEl)
    ).addClass('wide');
};

// Can be overriden
BookReader.prototype.initUIStrings = function() {
    // Navigation handlers will be bound after all UI is in place -- makes moving icons between
    // the toolbar and nav bar easier

    // Setup tooltips -- later we could load these from a file for i18n
    var titles = { '.logo': 'Go to Archive.org', // $$$ update after getting OL record
                   '.zoom_in': 'Zoom in',
                   '.zoom_out': 'Zoom out',
                   '.onepg': 'One-page view',
                   '.twopg': 'Two-page view',
                   '.thumb': 'Thumbnail view',
                   '.print': 'Print this page',
                   '.embed': 'Embed BookReader',
                   '.link': 'Link to this book (and page)',
                   '.bookmark': 'Bookmark this page',
                   '.read': 'Read this book aloud',
                   '.share': 'Share this book',
                   '.info': 'About this book',
                   '.full': 'Show fullscreen',
                   '.book_left': 'Flip left',
                   '.book_right': 'Flip right',
                   '.book_up': 'Page up',
                   '.book_down': 'Page down',
                   '.play': 'Play',
                   '.pause': 'Pause',
                   '.BRdn': 'Show/hide nav bar', // Would have to keep updating on state change to have just "Hide nav bar"
                   '.BRup': 'Show/hide nav bar',
                   '.book_top': 'First page',
                   '.book_bottom': 'Last page'
                  };
    if ('rl' == this.pageProgression) {
        titles['.book_leftmost'] = 'Last page';
        titles['.book_rightmost'] = 'First page';
    } else { // LTR
        titles['.book_leftmost'] = 'First page';
        titles['.book_rightmost'] = 'Last page';
    }

    for (var icon in titles) {
        if (titles.hasOwnProperty(icon)) {
            this.refs.$br.find(icon).prop('title', titles[icon]);
        }
    }
}

/**
 * Helper opens a popup window. On mobile it only opens a new tab. Used for share.
 */
BookReader.prototype.createPopup = function(href, width, height, name) {
  // Fixes dual-screen position
  var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
  var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

  var win_w = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  var win_h = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

  var left   = ((win_w / 2) - (width / 2)) + dualScreenLeft,
      top    = ((win_h / 2) - (height / 2)) + dualScreenTop,
      url    = href,
      opts   = 'status=1' +
               ',width='  + width  +
               ',height=' + height +
               ',top='    + top    +
               ',left='   + left;

  window.open(url, name, opts);
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

BookReader.prototype.getToolBarHeight = function() {
  if (this.refs.$BRtoolbar && this.refs.$BRtoolbar.css('display') === 'block') {
    return (this.refs.$BRtoolbar.outerHeight() + parseInt(this.refs.$BRtoolbar.css('top')));
  } else {
    return 0;
  }
}

/**
 * @param {boolean} ignoreDisplay - bypass the display check
 * @return {Number}
 */
BookReader.prototype.getNavHeight = function(ignoreDisplay) {
  if (ignoreDisplay || $('#BRnav').css('display') === 'block') {
    var outerHeight = $('#BRnav').outerHeight();
    var bottom = parseInt($('#BRnav').css('bottom'));
    if (!isNaN(outerHeight) && !isNaN(bottom)) {
      return outerHeight + bottom;
    }
  }
  return 0;
}

//------------------------------------------------------------------------------
// Basic Usage built-in Methods (can be overridden through options)
// This implementation uses options.data value for populating BookReader

/**
 * @return {Number} the total number of leafs (like an array length)
 */
BookReader.prototype.getNumLeafs = function() {
    // For deprecated interface support, if numLeafs is set, use that.
    if (this.numLeafs !== undefined)
      return this.numLeafs;
    return this._getDataFlattened().length;
};

/**
 * @param  {Number} index
 * @return {Number|undefined}
 */
BookReader.prototype.getPageWidth = function(index) {
    return this._getDataProp(index, 'width');
};

/**
 * @param  {Number} index
 * @return {Number|undefined}
 */
BookReader.prototype.getPageHeight = function(index) {
    return this._getDataProp(index, 'height');
};

/**
 * @param  {Number} index
 * @param  {Number} reduce - not used in default implementation
 * @param  {Number} rotate - not used in default implementation
 * @return {Number|undefined}
 */
BookReader.prototype.getPageURI = function(index, reduce, rotate) {
    return this._getDataProp(index, 'uri');
};

/**
 * @param  {Number} index
 * @return {String} - L or R
 */
BookReader.prototype.getPageSide = function(index) {
    var pageSide = this._getDataProp(index, 'pageSide');
    if (!pageSide) {
        // Fallback for invalid values
        pageSide = index % 2 === 0 ? 'R' : 'L';
    }
    return pageSide;
};

/**
 * @param  {Number} index
 * @return {String}
 */
BookReader.prototype.getPageNum = function(index) {
    var pageNum = this._getDataProp(index, 'pageNum');
    if (pageNum === undefined) {
        pageNum = 'n' + index;
    }
    return pageNum;
};

/**
 * @param  {Number} pindex
 * @return {Array} - eg [0, 1]
 */
BookReader.prototype.getSpreadIndices = function(pindex) {
    var spreadIndices = [null, null];
    if ('rl' == this.pageProgression) {
        // Right to Left
        if (this.getPageSide(pindex) == 'R') {
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex + 1;
        } else {
            // Given index was LHS
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex - 1;
        }
    } else {
        // Left to right
        if (this.getPageSide(pindex) == 'L') {
            spreadIndices[0] = pindex;
            spreadIndices[1] = pindex + 1;
        } else {
            // Given index was RHS
            spreadIndices[1] = pindex;
            spreadIndices[0] = pindex - 1;
        }
    }
    return spreadIndices;
};

/**
 * Override if "leafNum" does not correspond to "index"
 * @param  {Number} index
 * @return {Number}
 */
BookReader.prototype.leafNumToIndex = function(index) {
  return index;
};

/**
 * Create a params object from the current parameters.
 * @param {boolean} processParams - pass true to process params
 * @return {Object}
 */
BookReader.prototype.paramsFromCurrent = function(processParams) {
    processParams = processParams || false;

    var params = {};

    var index = this.currentIndex();
    var pageNum = this.getPageNum(index);
    if ((pageNum === 0) || pageNum) {
        params.page = pageNum;
    }

    params.index = index;
    params.mode = this.mode;

    // $$$ highlight
    // $$$ region

    // search
    if (this.enableSearch) {
        params.searchTerm = this.searchTerm;
    }

    if (processParams) {
        // Only include the mode (eg mode/2up) if user has made a choice
        if (this.prevReadMode == null) {
            delete params.mode;
        }
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
 * @param {String} fragment initial # is allowed for backwards compatibility
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
        urlHash[urlArray[i]] = urlArray[i+1];
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
        params.searchTerm = BookReader.util.decodeURIComponentPlus(urlHash['search']);
    }

    // $$$ process /highlight

    // $$$ process /theme
    if (urlHash['theme'] != undefined) {
        params.theme = urlHash['theme']
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
 * @return {String}
 */
BookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];

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
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }

    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
};

/**
 * Parses the pageString format
 * @param {string} pageNum
 * @return {number|undefined}
 */
BookReader.prototype.parsePageString = function(pageNum) {
    var pageIndex;
    // Check for special "leaf"
    var re = new RegExp('^leaf(\\d+)');
    var leafMatch = re.exec(pageNum);
    if (leafMatch) {
        pageIndex = this.leafNumToIndex(parseInt(leafMatch[1], 10));
        if (pageIndex === null) {
            pageIndex = undefined; // to match return type of getPageIndex
        }
    } else {
        pageIndex = this.getPageIndex(pageNum);
    }
    return pageIndex;
}

/**
 * Helper. Flatten the nested structure (make 1d array),
 * and also add pageSide prop
 * @return {Array}
 */
BookReader.prototype._getDataFlattened = function() {
    if (this._getDataFlattened.cached && this._getDataFlattened.cached[1] === this.data.length)
        return this._getDataFlattened.cached[0];

    var flattend = [];
    var prevPageSide = null;
    for (var i = 0; i < this.data.length; i++) {
        for (var j = 0; j < this.data[i].length; j++) {
            if (prevPageSide === null) {
                this.data[i][j].pageSide = this.data[i].length === 2 ? 'L' : 'R';
            } else {
                this.data[i][j].pageSide = prevPageSide === 'L' ? 'R' : 'L';
            }
            prevPageSide = this.data[i][j].pageSide;
            flattend.push(this.data[i][j]);
        }
    }
    // length is used as a cache breaker
    this._getDataFlattened.cached = [flattend, this.data.length];
    return flattend;
};

/**
 * Helper. Return a prop for a given index
 * @param {Number} index
 * @param {String} prop
 * @return {Array}
 */
BookReader.prototype._getDataProp = function(index, prop) {
    var dataf = this._getDataFlattened();
    if (isNaN(index) || index < 0 || index >= dataf.length)
        return;
    if ('undefined' == typeof(dataf[index][prop]))
        return;
    return dataf[index][prop];
};


//------------------------------------------------------------------------------

// Fix for deprecated method
jQuery.curCSS = function(element, prop, val) {
    return jQuery(element).css(prop, val);
};

return BookReader;

})(jQuery);
