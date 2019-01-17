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

window.BookReader = (function ($) {

/**
 * BookReader
 * @param {Object} options
 * TODO document all options properties
 * @constructor
 */
function BookReader(options) {
    options = options || {};
    options = jQuery.extend({}, BookReader.defaultOptions, options, BookReader.optionOverrides);
    this.setup(options);
}

BookReader.version = "4.2.0";

// Mode constants
BookReader.constMode1up = 1;
BookReader.constMode2up = 2;
BookReader.constModeThumb = 3;

// Names of events that can be triggered via BookReader.prototype.trigger()
BookReader.eventNames = {
    // Indicates that the fragment (a serialization of the reader state)
    // has changed.
    fragmentChange: 'fragmentChange',
    PostInit: 'PostInit',
    stop: 'stop',
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
    this.imgs = {};
    this.prefetchedImgs = {}; //an object with numeric keys cooresponding to page index

    this.animating = false;
    this.flipSpeed = options.flipSpeed;
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
    this.getNumLeafs = options.getNumLeafs || BookReader.prototype.getNumLeafs;
    this.getPageWidth = options.getPageWidth  || BookReader.prototype.getPageWidth;
    this.getPageHeight = options.getPageHeight || BookReader.prototype.getPageHeight;
    this.getPageURI = options.getPageURI || BookReader.prototype.getPageURI;
    this.getPageSide = options.getPageSide || BookReader.prototype.getPageSide;
    this.getPageNum = options.getPageNum || BookReader.prototype.getPageNum;
    this.getPageProp = options.getPageProp || BookReader.prototype.getPageProp;
    this.getSpreadIndices = options.getSpreadIndices || BookReader.prototype.getSpreadIndices;
    this.leafNumToIndex = options.leafNumToIndex || BookReader.prototype.leafNumToIndex;
    this.refs = {};
};

/**
 * BookReader.util are static library functions
 * At top of file so they can be used below
 */
BookReader.util = {
    disableSelect: function(jObject) {
        // Bind mouse handlers
        // Disable mouse click to avoid selected/highlighted page images - bug 354239
        jObject.bind('mousedown', function() {
            // $$$ check here for right-click and don't disable.  Also use jQuery style
            //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
            return false;
        });
        // Special hack for IE7
        jObject[0].onselectstart = function() { return false; };
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
    var modifiedNewParams = $.extend({}, newParams);
    if ('undefined' != typeof(modifiedNewParams.page)) {
        var pageIndex = this.parsePageString(modifiedNewParams.page);
        if (!isNaN(pageIndex))
            modifiedNewParams.index = pageIndex;
        delete modifiedNewParams.page;
    }
    $.extend(params, modifiedNewParams);
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
    if (this.options.enablePageResume) {
        // Check cookies
        var val = this.getResumeValue();
        if (val !== null) {
            params.index = val;
        }
    }

    if (this.options.enableUrlPlugin) {
        // params explicitly set in URL take precedence over all other methods
        var urlParams = this.paramsFromFragment(this.urlReadFragment());
        if (urlParams.mode) {
            this.prevReadMode = urlParams.mode;
        }
        this.extendParams(params, urlParams);
    }

    return params;
}

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

    var initialMode = this.getInitialMode(params);
    this.mode = initialMode;

    if (this.ui == "embed" && this.options.showNavbar) {
        this.initEmbedNavbar();
    } else {
        if (this.options.showToolbar) {
            this.initToolbar(this.mode, this.ui); // Build inside of toolbar div
        }
        if (this.options.showNavbar) {
            this.initNavbar();
        }
    }

    this.resizeBRcontainer();
    this.mode = null; // Needed or else switchMode is a noop
    this.switchMode(initialMode);
    this.updateFromParams(params);
    this.initUIStrings();

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
        $(document).on('contextmenu dragstart', '.BRpagediv1up', function() {
            return false;
        });
        $(document).on('contextmenu dragstart', '.BRpageimage', function() {
            return false;
        });
        $(document).on('contextmenu dragstart', '.BRpagedivthumb', function() {
            return false;
        });
        this.$('.BRicon.share').hide();
    }

    this.$('.BRpagediv1up').bind('mousedown', this, function() {
        // $$$ the purpose of this is to disable selection of the image (makes it turn blue)
        //     but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
        return false;
    });

    this.trigger(BookReader.eventNames.PostInit);

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

/**
 * Resizes based on the container width and height
 */
BookReader.prototype.resize = function() {
  if (!this.init.initComplete) return;

  this.resizeBRcontainer();

  if (this.constMode1up == this.mode) {
      if (this.onePage.autofit != 'none') {
          this.resizePageView1up();
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

/**
 * Binds keyboard event listeners
 */
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

BookReader.prototype.setupTooltips = function() {
    this.$('.js-tooltip').each(function(idx, el) {
        var options = {
            positions: ['top', 'bottom'],
            shrinkToFit: true,
            spikeGirth: 0,
            spikeLength: 8,
            fill: 'transparent',
            cornerRadius: 0,
            strokeWidth: 0,
            cssStyles: {},
        };
        var $el = $(el);
        if ($el.parents('.BRtoolbar').length) {
            options.positions = ['bottom'];
            options.spikeLength = 12;
        } else if ($el.parents('.BRnav').length) {
            options.positions = ['top'];
        }
        $el.bt(options);
    });
}

BookReader.prototype.drawLeafs = function() {
    if (this.constMode1up == this.mode) {
        this.drawLeafsOnePage();
    } else if (this.constModeThumb == this.mode) {
        this.drawLeafsThumbnail();
    } else {
        this.drawLeafsTwoPage();
    }
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

BookReader.prototype.setClickHandler2UP = function( element, data, handler) {
    $(element).unbind('click').bind('click', data, function(e) {
        handler(e);
    });
};

BookReader.prototype.drawLeafsOnePage = function() {
    var containerHeight = this.refs.$brContainer.height();
    var scrollTop = this.refs.$brContainer.prop('scrollTop');
    var scrollBottom = scrollTop + containerHeight;
    var viewWidth = this.refs.$brContainer.prop('scrollWidth');

    var indicesToDisplay = [];
    var index;
    var height;

    var i;
    var leafTop = 0;
    var leafBottom = 0;

    for (i=0; i<this.getNumLeafs(); i++) {
        height  = parseInt(this._getPageHeight(i)/this.reduce);

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
    this.updateFirstIndex(firstIndexToDraw);

    if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
        firstIndexToDraw--;
        indicesToDisplay.unshift(firstIndexToDraw);
    }

    var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
    if ( ((this.getNumLeafs()-1) != lastIndexToDraw) && (1 < this.reduce) ) {
        indicesToDisplay.push(lastIndexToDraw+1);
    }

    var BRpageViewEl = this.refs.$brPageViewEl.get(0);

    leafTop = 0;

    for (i=0; i<firstIndexToDraw; i++) {
        leafTop += parseInt(this._getPageHeight(i)/this.reduce) +10;
    }

    for (i=0; i<indicesToDisplay.length; i++) {
        index = indicesToDisplay[i];
        height = parseInt(this._getPageHeight(index)/this.reduce);

        if (BookReader.util.notInArray(indicesToDisplay[i], this.displayedIndices)) {
            var width = parseInt(this._getPageWidth(index)/this.reduce);
            var div = document.createElement('div');
            div.className = 'BRpagediv1up pagediv' + index;
            div.style.position = "absolute";
            div.style.top = leafTop + 'px';
            var left = (viewWidth-width)>>1;
            if (left<0) left = 0;
            div.style.left = left + 'px';
            div.style.width = width + 'px';
            div.style.height = height + 'px';

            BRpageViewEl.appendChild(div);

            var img = document.createElement('img');
            img.src = this._getPageURI(index, this.reduce, 0);
            img.className = 'BRnoselect BRonePageImage';
            img.style.width = width + 'px';
            img.style.height = height + 'px';
            div.appendChild(img);
        }

        leafTop += height +10;

    }

    for (i=0; i<this.displayedIndices.length; i++) {
        if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
            index = this.displayedIndices[i];
            this.$('.pagediv'+index).remove();
        }
    }

    this.displayedIndices = indicesToDisplay.slice();
    if (this.enableSearch) this.updateSearchHilites();

    this.updateToolbarZoom(this.reduce);

    // Update the slider
    this.updateNavIndexThrottled();
};

/**
 * Draws the thumbnail view
 * @param {number} optional If seekIndex is defined, the view will be drawn
 *    with that page visible (without any animated scrolling).
 */
BookReader.prototype.drawLeafsThumbnail = function(seekIndex) {
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
    this.refs.$brPageViewEl.height(bottomPos);

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
    var leaf;

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
                div.style.position = "absolute";
                div.className = 'BRpagedivthumb pagediv' + leaf;

                left += this.thumbPadding;
                div.style.top = leafTop + 'px';
                div.style.left = left + 'px';
                div.style.width = leafWidth + 'px';
                div.style.height = leafHeight + 'px';

                // link back to page
                link = document.createElement("a");
                $(link).data('leaf', leaf);
                link.addEventListener('mouseup', function(event) {
                  self.updateFirstIndex($(this).data('leaf'));
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

                this.refs.$brPageViewEl.append(div);

                img = document.createElement("img");
                var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);

                $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                    .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                    .addClass('BRlazyload')
                    // Store the URL of the image that will replace this one
                    .data('srcURL',  this._getPageURI(leaf, thumbReduce));
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
                this.$('.pagediv'+index).remove();
            }
        }
    }

    // Update which page is considered current to make sure a visible page is the current one
    var currentIndex = this.currentIndex();
    if (currentIndex < leastVisible) {
        this.updateFirstIndex(leastVisible);
    } else if (currentIndex > mostVisible) {
        this.updateFirstIndex(mostVisible);
    }

    this.displayedRows = rowsToDisplay.slice();

    // remove previous highlights
    this.$('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

    // highlight current page
    this.$('.pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');

    this.lazyLoadThumbnails();

    this.updateToolbarZoom(this.reduce);
};

BookReader.prototype.lazyLoadThumbnails = function() {
    // We check the complete property since load may not be fired if loading from the cache
    this.$('.BRlazyloading').filter('[complete=true]').removeClass('BRlazyloading');

    var loading = this.$('.BRlazyloading').length;
    var toLoad = this.thumbMaxLoading - loading;

    var self = this;

    if (toLoad > 0) {
        // $$$ TODO load those near top (but not beyond) page view first
        this.refs.$brPageViewEl.find('img.BRlazyload').filter(':lt(' + toLoad + ')').each( function() {
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
            'height': $(dummyImage).height(),
            'src': $(dummyImage).data('srcURL')
        });

    // replace with the new img
    $(dummyImage).before(img).remove();

    img = null; // tidy up closure
};

BookReader.prototype.drawLeafsTwoPage = function() {
    var $twoPageViewEl = this.refs.$brTwoPageView;

    // $$$ we should use calculated values in this.twoPage (recalc if necessary)
    var indexL = this.twoPage.currentIndexL;
    var top = this.twoPageTop();

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
    }).appendTo($twoPageViewEl);

    var indexR = this.twoPage.currentIndexR;

    // $$$ should use getwidth2up?
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
    }).appendTo($twoPageViewEl);


    this.displayedIndices = [this.twoPage.currentIndexL, this.twoPage.currentIndexR];
    this.setMouseHandlers2UP();
    this.twoPageSetCursor();
    this.updateToolbarZoom(this.reduce);
};

/**
 * A throttled version of drawLeafs
 */
BookReader.prototype.drawLeafsThrottled = BookReader.util.throttle(
    BookReader.prototype.drawLeafs,
    250 // 250 ms gives quick feedback, but doesn't eat cpu
);

/**
 * @param {number} direction Pass 1 to zoom in, anything else to zoom out
 */
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

    this.resizePageView1up();
    this.updateToolbarZoom(this.reduce);

    // Recalculate search hilites
    if (this.enableSearch) this.removeSearchHilites();
    if (this.enableSearch) this.updateSearchHilites();
};

/**
 * Resizes the inner container to fit within the visible space to prevent
 * the top toolbar and bottom navbar from clipping the visible book
 */
BookReader.prototype.resizeBRcontainer = function() {
  this.refs.$brContainer.css({
    top: this.getToolBarHeight(),
    bottom: this.getNavHeight(),
  });
}

/**
 * Resize the current one page view
 * Note this calls drawLeafs
 */
BookReader.prototype.resizePageView1up = function() {
    var viewWidth  = this.refs.$brContainer.prop('clientWidth');
    var oldScrollTop  = this.refs.$brContainer.prop('scrollTop');
    var oldPageViewHeight = this.refs.$brPageViewEl.height();
    var oldPageViewWidth = this.refs.$brPageViewEl.width();

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

    this.refs.$brPageViewEl.height(viewDimensions.height);
    this.refs.$brPageViewEl.width(viewDimensions.width);


    var newCenterY = scrollRatio*viewDimensions.height;
    var newTop = Math.max(0, Math.floor( newCenterY - this.refs.$brContainer.height()/2 ));
    this.refs.$brContainer.prop('scrollTop', newTop);

    // We use clientWidth here to avoid miscalculating due to scroll bar
    var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    var newLeft = newCenterX - this.refs.$brContainer.prop('clientWidth') / 2;
    newLeft = Math.max(newLeft, 0);
    this.refs.$brContainer.prop('scrollLeft', newLeft);

    this.refs.$brPageViewEl.empty();
    this.displayedIndices = [];
    this.drawLeafs();

    if (this.enableSearch) {
        this.removeSearchHilites();
        this.updateSearchHilites();
    }
};

/**
 * Calculate the dimensions for a one page view with images at the given reduce and padding
 */
BookReader.prototype.onePageCalculateViewDimensions = function(reduce, padding) {
    var viewWidth = 0;
    var viewHeight = 0;
    for (var i=0; i<this.getNumLeafs(); i++) {
        viewHeight += parseInt(this._getPageHeight(i)/reduce) + padding;
        var width = parseInt(this._getPageWidth(i)/reduce);
        if (width>viewWidth) viewWidth=width;
    }
    return { width: viewWidth, height: viewHeight }
};

/**
 * Returns the current offset of the viewport center in scaled document coordinates.
 * @return {number}
 */
BookReader.prototype.centerX1up = function() {
    var centerX;
    if (this.refs.$brPageViewEl.width() < this.refs.$brContainer.prop('clientWidth')) { // fully shown
        centerX = this.refs.$brPageViewEl.width();
    } else {
        centerX = this.refs.$brContainer.prop('scrollLeft') + this.refs.$brContainer.prop('clientWidth') / 2;
    }
    centerX = Math.floor(centerX);
    return centerX;
};

/**
 * Returns the current offset of the viewport center in scaled document coordinates.
 * @return {number}
 */
BookReader.prototype.centerY1up = function() {
    var centerY = this.refs.$brContainer.prop('scrollTop') + this.refs.$brContainer.height() / 2;
    return Math.floor(centerY);
};

BookReader.prototype.centerPageView = function() {
    var scrollWidth  = this.refs.$brContainer.prop('scrollWidth');
    var clientWidth  =  this.refs.$brContainer.prop('clientWidth');
    if (scrollWidth > clientWidth) {
        this.refs.$brContainer.prop('scrollLeft', (scrollWidth-clientWidth)/2);
    }
};

BookReader.prototype.zoom2up = function(direction) {
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

/**
 * Returns the width per thumbnail to display the requested number of columns
 * Note: #BRpageview must already exist since its width is used to calculate the
 *       thumbnail width
 * @param {number}
 * @param {number}
 */
BookReader.prototype.getThumbnailWidth = function(thumbnailColumns) {
    var padding = (thumbnailColumns + 1) * this.thumbPadding;
    var width = (this.refs.$brPageViewEl.width() - padding) / (thumbnailColumns + 0.5); // extra 0.5 is for some space at sides
    return parseInt(width);
};

/**
 * Quantizes the given reduction factor to closest power of two from set from 12.5% to 200%
 * @param {number}
 * @param {array}
 * @return {number}
 */
BookReader.prototype.quantizeReduce = function(reduce, reductionFactors) {
    var quantized = reductionFactors[0].reduce;
    var distance = Math.abs(reduce - quantized);
    var newDistance;

    for (var i = 1; i < reductionFactors.length; i++) {
        newDistance = Math.abs(reduce - reductionFactors[i].reduce);
        if (newDistance < distance) {
            distance = newDistance;
            quantized = reductionFactors[i].reduce;
        }
    }
    return quantized;
};

/**
 * @param {number}
 * @param {string}
 * @param {array} reductionFactors should be array of sorted reduction factors
 *   e.g. [ {reduce: 0.25, autofit: null}, {reduce: 0.3, autofit: 'width'}, {reduce: 1, autofit: null} ]
 */
BookReader.prototype.nextReduce = function(currentReduce, direction, reductionFactors) {
    // XXX add 'closest', to replace quantize function
    var i;
    var newReduceIndex;

    if (direction === 'in') {
        newReduceIndex = 0;
        for (i = 1; i < reductionFactors.length; i++) {
            if (reductionFactors[i].reduce < currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
    } else if (direction === 'out') { // zoom out
        var lastIndex = reductionFactors.length - 1;
        newReduceIndex = lastIndex;

        for (i = lastIndex; i >= 0; i--) {
            if (reductionFactors[i].reduce > currentReduce) {
                newReduceIndex = i;
            }
        }
        return reductionFactors[newReduceIndex];
    } else if (direction === 'auto') {
      // Auto mode chooses the least reduction
      var choice = null;
      for (i = 0; i < reductionFactors.length; i++) {
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
      for (i = 0; i < reductionFactors.length; i++) {
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

/**
 * Attempts to jump to page
 * @param {string}
 * @return {boolean} Returns true if page could be found, false otherwise.
 */
BookReader.prototype.jumpToPage = function(pageNum) {
    var pageIndex = this.parsePageString(pageNum);

    if ('undefined' != typeof(pageIndex)) {
        this.jumpToIndex(pageIndex);
        return true;
    }

    // Page not found
    return false;
};

/**
 * Changes the current page
 * @param {number}
 * @param {number} optional
 * @param {number} optional
 * @param {boolean} optional
 */
BookReader.prototype.jumpToIndex = function(index, pageX, pageY, noAnimate) {
    var self = this;
    var prevCurrentIndex = this.currentIndex();
    var offset = 0;
    var leafTop = 0;
    var leafLeft = 0;

    this.trigger(BookReader.eventNames.stop);

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
        this.updateFirstIndex(index);
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
        leafTop = this.onePageGetPageTop(index);

        if (pageY) {
            offset = parseInt( (pageY) / this.reduce);
            offset -= this.refs.$brContainer.prop('clientHeight') >> 1;
            leafTop += offset;
        } else {
            // Show page just a little below the top
            leafTop -= this.padding / 2;
        }

        if (pageX) {
            offset = parseInt( (pageX) / this.reduce);
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

/**
 * Switches the mode (eg 1up 2up thumb)
 * @param {number}
 */
BookReader.prototype.switchMode = function(mode) {
    if (mode === this.mode) {
        return;
    }

    if (!this.canSwitchToMode(mode)) {
        return;
    }

    this.trigger(BookReader.eventNames.stop);
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

    this.trigger(BookReader.eventNames.fragmentChange);
};

BookReader.prototype.updateBrClasses = function() {
    var modeToClass = {};
    modeToClass[this.constMode1up] = 'BRmode1up';
    modeToClass[this.constMode2up] = 'BRmode2up';
    modeToClass[this.constModeThumb] = 'BRmodeThumb';

    this.refs.$br
    .removeClass('BRmode1up BRmode2up BRmodeThumb')
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

BookReader.prototype.toggleFullscreen = function() {
    if (this.isFullscreen()) {
        this.exitFullScreen();
    } else {
        this.enterFullscreen();
    }
};

BookReader.prototype.enterFullscreen = function() {
    this.refs.$brContainer.css('opacity', 0);

    var windowWidth = $(window).width();
    if (windowWidth <= this.onePageMinBreakpoint) {
        this.switchMode(this.constMode1up);
    }

    this.isFullscreenActive = true;
    this.updateBrClasses();

    this.resize();
    this.refs.$brContainer.animate({opacity: 1}, 400, 'linear');

    this._fullscreenCloseHandler = function (e) {
        if (e.keyCode === 27) this.exitFullScreen();
    }.bind(this);
    $(document).keyup(this._fullscreenCloseHandler);
};

BookReader.prototype.exitFullScreen = function() {
    this.refs.$brContainer.css('opacity', 0);

    $(document).unbind('keyup', this._fullscreenCloseHandler);

    var windowWidth = $(window).width();
    if (windowWidth <= this.onePageMinBreakpoint) {
        this.switchMode(this.constMode2up);
    }

    this.isFullscreenActive = false;
    this.updateBrClasses()

    this.resize();
    this.refs.$brContainer.animate({opacity: 1}, 400, 'linear');
};

/**
 * This is called when we switch to one page view
 */
BookReader.prototype.prepareOnePageView = function() {
    var startLeaf = this.currentIndex();

    this.refs.$brContainer.empty();
    this.refs.$brContainer.css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });

    this.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.refs.$brContainer.append(this.refs.$brPageViewEl);

    // Attaches to first child - child must be present
    this.refs.$brContainer.dragscrollable();
    this.bindGestures(this.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect(this.$('#BRpageview'));

    this.resizePageView1up();
    this.jumpToIndex(startLeaf);
    this.updateBrClasses();
};

BookReader.prototype.prepareThumbnailView = function() {
    this.refs.$brContainer.empty();
    this.refs.$brContainer.css({
        overflowY: 'scroll',
        overflowX: 'auto'
    });

    this.refs.$brPageViewEl = $("<div class='BRpageview'></div>");
    this.refs.$brContainer.append(this.refs.$brPageViewEl);
    this.refs.$brContainer.dragscrollable({preventDefault:true});

    this.bindGestures(this.refs.$brContainer);

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect(this.$('#BRpageview'));

    this.thumbWidth = this.getThumbnailWidth(this.thumbColumns);
    this.reduce = this.getPageWidth(0)/this.thumbWidth;

    this.displayedRows = [];

    // Draw leafs with current index directly in view (no animating to the index)
    this.drawLeafsThumbnail( this.currentIndex() );
    this.updateBrClasses();
};

/**
 * @param {number}
 * @param {number}
 */
BookReader.prototype.prepareTwoPageView = function(centerPercentageX, centerPercentageY) {
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

    this.calculateSpreadSize(); //sets twoPage.width, twoPage.height and others

    this.pruneUnusedImgs();
    this.prefetch(); // Preload images or reload if scaling has changed

    // Add the two page view
    // $$$ Can we get everything set up and then append?
    var $twoPageViewEl = $('<div class="BRtwopageview"></div>');
    this.refs.$brTwoPageView = $twoPageViewEl;
    this.refs.$brContainer.append($twoPageViewEl);

    // Attaches to first child, so must come after we add the page view
    this.refs.$brContainer.dragscrollable({preventDefault:true});
    this.bindGestures(this.refs.$brContainer);

    // $$$ calculate first then set
    this.refs.$brTwoPageView.css({
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
    $(this.twoPage.coverDiv).attr('class', 'BRbookcover').css({
        width:  this.twoPage.bookCoverDivWidth + 'px',
        height: this.twoPage.bookCoverDivHeight+'px',
        visibility: 'visible'
    }).appendTo(this.refs.$brTwoPageView);

    this.leafEdgeR = document.createElement('div');
    this.leafEdgeR.className = 'BRleafEdgeR';

    $(this.leafEdgeR).css({
        width: this.twoPage.leafEdgeWidthR + 'px',
        height: this.twoPage.height + 'px',
        left: this.twoPage.gutter+this.twoPage.scaledWR+'px',
        top: this.twoPage.bookCoverDivTop+this.twoPage.coverInternalPadding+'px',
        border: this.twoPage.leafEdgeWidthR === 0 ? 'none' : null
    }).appendTo(this.refs.$brTwoPageView);

    this.leafEdgeL = document.createElement('div');
    this.leafEdgeL.className = 'BRleafEdgeL';
    $(this.leafEdgeL).css({
        width: this.twoPage.leafEdgeWidthL + 'px',
        height: this.twoPage.height + 'px',
        left: this.twoPage.bookCoverDivLeft+this.twoPage.coverInternalPadding+'px',
        top: this.twoPage.bookCoverDivTop+this.twoPage.coverInternalPadding+'px',
        border: this.twoPage.leafEdgeWidthL === 0 ? 'none' : null
    }).appendTo(this.refs.$brTwoPageView);

    var div = document.createElement('div');
    $(div).attr('class', 'BRgutter').css({
        width:           this.twoPage.bookSpineDivWidth+'px',
        height:          this.twoPage.bookSpineDivHeight+'px',
        left:            (this.twoPage.gutter - this.twoPage.bookSpineDivWidth*0.5)+'px',
        top:             this.twoPage.bookSpineDivTop+'px'
    }).appendTo(this.refs.$brTwoPageView);

    this.prepareTwoPagePopUp();

    this.displayedIndices = [];

    this.drawLeafsTwoPage();
    this.updateToolbarZoom(this.reduce);

    this.prefetch();

    if (this.enableSearch) {
        this.removeSearchHilites();
        this.updateSearchHilites();
    }

    this.updateBrClasses();
};

/**
 * This function prepares the "View Page n" popup that shows while the mouse is
 * over the left/right "stack of sheets" edges.  It also binds the mouse
 * events for these divs.
 */
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
        e.data.trigger(BookReader.eventNames.stop);
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        e.data.jumpToIndex(jumpIndex);
    });

    $(this.leafEdgeR).bind('click', this, function(e) {
        e.data.trigger(BookReader.eventNames.stop);
        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        e.data.jumpToIndex(jumpIndex);
    });

    $(this.leafEdgeR).bind('mousemove', this, function(e) {
        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View ' + e.data.getPageName(BookReader.util.clamp(jumpIndex, 0, e.data.getNumLeafs() - 1)));

        // $$$ TODO: Make sure popup is positioned so that it is in view
        // (https://bugs.edge.launchpad.net/gnubook/+bug/327456)
        $(e.data.twoPagePopUp).css({
            left: e.pageX- e.data.refs.$brContainer.offset().left + e.data.refs.$brContainer.scrollLeft() - 120 + 'px',
            top: e.pageY - e.data.refs.$brContainer.offset().top + e.data.refs.$brContainer.scrollTop() + 'px'
        });
    });

    $(this.leafEdgeL).bind('mousemove', this, function(e) {
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View '+ e.data.getPageName(BookReader.util.clamp(jumpIndex, 0, e.data.getNumLeafs() - 1)));

        // $$$ TODO: Make sure popup is positioned so that it is in view
        //           (https://bugs.edge.launchpad.net/gnubook/+bug/327456)
        $(e.data.twoPagePopUp).css({
            left: e.pageX - e.data.refs.$brContainer.offset().left + e.data.refs.$brContainer.scrollLeft() - $(e.data.twoPagePopUp).width() + 120 + 'px',
            top: e.pageY-e.data.refs.$brContainer.offset().top + e.data.refs.$brContainer.scrollTop() + 'px'
        });
    });
};

/**
 * Calculates 2-page spread dimensions based on this.twoPage.currentIndexL and
 * this.twoPage.currentIndexR
 * This function sets this.twoPage.height, twoPage.width
 */
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

/**
 * Returns the spread size calculated from the reduction factor for the given pages
 * @param {number}
 * @param {number}
 * @return {Object}
 */
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

/**
 * Returns the current ideal reduction factor
 * @return {number}
 */
BookReader.prototype.twoPageGetAutofitReduce = function() {
    var spreadSize = this.getIdealSpreadSize(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    return spreadSize.reduce;
};

/**
 * Returns true if the pages extend past the edge of the view
 * @return {boolean}
 */
BookReader.prototype.twoPageIsZoomedIn = function() {
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

/**
 * Returns where the top of the page with given index should be in one page view
 * @param {number}
 * @return {number}
 */
BookReader.prototype.onePageGetPageTop = function(index) {
    var i;
    var leafTop = 0;
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

/**
 * Update the reduction factors for 1up mode given the available width and height.
 * Recalculates the autofit reduction factors.
 */
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

/**
 * Set the cursor for two page view
 */
BookReader.prototype.twoPageSetCursor = function() {
    var $twoPageViewEl = this.refs.$brTwoPageView;
    if ( ($twoPageViewEl.width() > this.refs.$brContainer.prop('clientWidth')) ||
         ($twoPageViewEl.height() > this.refs.$brContainer.prop('clientHeight')) ) {
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
        return BookReader.util.clamp(this.firstIndex, 0, this.getNumLeafs() - 1);
    } else {
        throw 'currentIndex called for unimplemented mode ' + this.mode;
    }
};

/**
 * Setter for this.firstIndex
 * Also triggers an event and updates the navbar slider position
 * @param {number}
 */
BookReader.prototype.updateFirstIndex = function(index) {
    this.firstIndex = index;
    this.trigger(BookReader.eventNames.fragmentChange);
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
        return parseInt(this.refs.$brContainer.prop('clientHeight') - this.getPageHeight(this.currentIndex()) / this.reduce * 0.03);
    }

    return parseInt(0.9 * this.refs.$brContainer.prop('clientHeight'));
};

/**
 * @param {Number|null} index to flip back one spread, pass index=null
 */
BookReader.prototype.flipBackToIndex = function(index) {
    if (this.constMode1up == this.mode) return;

    var leftIndex = this.twoPage.currentIndexL;

    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = leftIndex - 2;
    }

    this.updateNavIndexThrottled(index);

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

/**
 * Flips the page on the left towards the page on the right
 * @param {number}
 * @param {number}
 */
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

    var $twoPageViewEl = this.refs.$brTwoPageView;
    var leftEdgeTmpLeft = gutter - currWidthL - leafEdgeTmpW;

    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height + 'px',
        left: leftEdgeTmpLeft + 'px',
        top: top+'px',
        zIndex:1000
    }).appendTo($twoPageViewEl);

    $(this.leafEdgeL).css({
        width: newLeafEdgeWidthL+'px',
        left: gutter-currWidthL-newLeafEdgeWidthL+'px'
    });

    // Left gets the offset of the current left leaf from the document
    var left = $(this.prefetchedImgs[leftLeaf]).offset().left;
    // $$$ This seems very similar to the gutter.  May be able to consolidate the logic.
    var right = $twoPageViewEl.prop('clientWidth') - left - $(this.prefetchedImgs[leftLeaf]).width() + $twoPageViewEl.offset().left - 2 + 'px';

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

        self.$('.BRgutter').css({left: (gutter - self.twoPage.bookSpineDivWidth*0.5)+'px'});

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

            self.updateFirstIndex(self.twoPage.currentIndexL);
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();
            self.animating = false;

            if (self.enableSearch) self.updateSearchHilites2UP();

            self.setMouseHandlers2UP();
            self.twoPageSetCursor();

            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });

};

/**
 * Whether we flip left or right is dependent on the page progression
 * to flip forward one spread, pass index=null
 * @param {number}
 */
BookReader.prototype.flipFwdToIndex = function(index) {
    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = this.twoPage.currentIndexL + 2; // $$$ assumes indices are continuous
    }
    if (index > this.lastDisplayableIndex()) return;

    this.updateNavIndexThrottled(index);

    this.animating = true;

    var nextIndices = this.getSpreadIndices(index);
    var gutter;

    if ('rl' != this.pageProgression) {
        // We did not specify RTL
        gutter = this.prepareFlipRightToLeft(nextIndices[0], nextIndices[1]);
        this.flipRightToLeft(nextIndices[0], nextIndices[1], gutter);
    } else {
        // RTL
        gutter = this.prepareFlipLeftToRight(nextIndices[0], nextIndices[1]);
        this.flipLeftToRight(nextIndices[0], nextIndices[1]);
    }
};

/**
 * Flip from left to right and show the nextL and nextR indices on those sides
 * $$$ better not to have to pass gutter in
 * @param {number}
 * @param {number}
 */
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

    var $twoPageViewEl = this.refs.$brTwoPageView;

    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height + 'px',
        left: gutter+scaledW+'px',
        top: top+'px',
        zIndex:1000
    }).appendTo($twoPageViewEl);

    var newWidthL = this.getPageWidth2UP(newIndexL);
    var newWidthR = this.getPageWidth2UP(newIndexR);

    $(this.leafEdgeR).css({width: newLeafEdgeWidthR+'px', left: gutter+newWidthR+'px' });

    var self = this;

    var speed = this.flipSpeed;

    if (this.enableSearch) this.removeSearchHilites();

    $(this.leafEdgeTmp).animate({left: gutter}, speed, 'easeInSine');
    $(this.prefetchedImgs[this.twoPage.currentIndexR]).animate({width: '0px'}, speed, 'easeInSine', function() {
        self.$('BRgutter').css({left: (gutter - self.twoPage.bookSpineDivWidth*0.5)+'px'});
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

            self.updateFirstIndex(self.twoPage.currentIndexL);
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();
            self.animating = false;


            if (self.enableSearch) self.updateSearchHilites2UP();

            self.setMouseHandlers2UP();
            self.twoPageSetCursor();

            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });
};

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
                e.data.self.trigger(BookReader.eventNames.stop);
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
                e.data.self.trigger(BookReader.eventNames.stop);
                e.data.self.right();
            }
            e.preventDefault();
        }
    );
};

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
        img.src = pageURI;
        img.uri = pageURI; // browser may rewrite src so we stash raw URI here
        this.prefetchedImgs[index] = img;
    }
};

/**
 * Prepare to flip the left page towards the right.  This corresponds to moving
 * backward when the page progression is left to right.
 * @param {number}
 * @param {number}
 */
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

    var $twoPageViewEl = this.refs.$brTwoPageView;
    $twoPageViewEl.append(this.prefetchedImgs[prevL]);

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

    $twoPageViewEl.append(this.prefetchedImgs[prevR]);
};

// $$$ mang we're adding an extra pixel in the middle.  See https://bugs.edge.launchpad.net/gnubook/+bug/411667
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

    var $twoPageViewEl = this.refs.$brTwoPageView;
    $twoPageViewEl.append(this.prefetchedImgs[nextR]);

    height  = this._getPageHeight(nextL);
    width   = this._getPageWidth(nextL);
    scaledW = this.twoPage.height*width/height;

    $(this.prefetchedImgs[nextL]).css({
        position: 'absolute',
        right:   $twoPageViewEl.prop('clientWidth')-gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        width:  0+'px', // Start at 0 width, then grow to the left
        zIndex: 2
    });

    $twoPageViewEl.append(this.prefetchedImgs[nextL]);
};

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

BookReader.prototype.getPageWidth2UP = function(index) {
    // We return the width based on the dominant height
    var height  = this._getPageHeight(index);
    var width   = this._getPageWidth(index);
    return Math.floor(this.twoPage.height*width/height); // $$$ we assume width is relative to current spread
};

/**
 * Returns the position of the gutter (line between the page images)
 */
BookReader.prototype.twoPageGutter = function() {
    return this.twoPage.middle + this.gutterOffsetForIndex(this.twoPage.currentIndexL);
};

/**
 * Returns the offset for the top of the page images
 */
BookReader.prototype.twoPageTop = function() {
    return this.twoPage.coverExternalPadding + this.twoPage.coverInternalPadding; // $$$ + border?
};

/**
 * Returns the width of the cover div given the total page width
 * @param {number}
 * @return {number}
 */
BookReader.prototype.twoPageCoverWidth = function(totalPageWidth) {
    return totalPageWidth + this.twoPage.edgeWidth + 2*this.twoPage.coverInternalPadding;
};

/**
 * Returns the percentage offset into twopageview div at the center of container div
 * { percentageX: float, percentageY: float }
 */
BookReader.prototype.twoPageGetViewCenter = function() {
    var center = {};

    var containerOffset = this.refs.$brContainer.offset();
    var viewOffset = this.refs.$brTwoPageView.offset();
    center.percentageX = (containerOffset.left - viewOffset.left + (this.refs.$brContainer.prop('clientWidth') >> 1)) / this.twoPage.totalWidth;
    center.percentageY = (containerOffset.top - viewOffset.top + (this.refs.$brContainer.prop('clientHeight') >> 1)) / this.twoPage.totalHeight;

    return center;
};

/**
 * Centers the point given by percentage from left,top of twopageview
 * @param {number}
 * @param {number}
 */
BookReader.prototype.twoPageCenterView = function(percentageX, percentageY) {
    if ('undefined' == typeof(percentageX)) {
        percentageX = 0.5;
    }
    if ('undefined' == typeof(percentageY)) {
        percentageY = 0.5;
    }

    var viewWidth = this.refs.$brTwoPageView.width();
    var containerClientWidth = this.refs.$brContainer.prop('clientWidth');
    var intoViewX = percentageX * viewWidth;

    var viewHeight = this.refs.$brTwoPageView.height();
    var containerClientHeight = this.refs.$brContainer.prop('clientHeight');
    var intoViewY = percentageY * viewHeight;

    if (viewWidth < containerClientWidth) {
        // Can fit width without scrollbars - center by adjusting offset
        this.refs.$brTwoPageView.css('left', (containerClientWidth >> 1) - intoViewX + 'px');
    } else {
        // Need to scroll to center
        this.refs.$brTwoPageView.css('left', 0);
        this.refs.$brContainer.scrollLeft(intoViewX - (containerClientWidth >> 1));
    }

    if (viewHeight < containerClientHeight) {
        // Fits with scrollbars - add offset
        this.refs.$brTwoPageView.css('top', (containerClientHeight >> 1) - intoViewY + 'px');
    } else {
        this.refs.$brTwoPageView.css('top', 0);
        this.refs.$brContainer.scrollTop(intoViewY - (containerClientHeight >> 1));
    }
};

/**
 * Returns the integer height of the click-to-flip areas at the edges of the book
 * @return {number}
 */
BookReader.prototype.twoPageFlipAreaHeight = function() {
    return parseInt(this.twoPage.height);
};

/**
 * Returns the the integer width of the flip areas
 * @return {number}
 */
BookReader.prototype.twoPageFlipAreaWidth = function() {
    var max = 100; // $$$ TODO base on view width?
    var min = 10;

    var width = this.twoPage.width * 0.15;
    return parseInt(BookReader.util.clamp(width, min, max));
};

/**
 * Returns integer top offset for flip areas
 * @return {number}
 */
BookReader.prototype.twoPageFlipAreaTop = function() {
    return parseInt(this.twoPage.bookCoverDivTop + this.twoPage.coverInternalPadding);
};

/**
 * Left offset for left flip area
 * @return {number}
 */
BookReader.prototype.twoPageLeftFlipAreaLeft = function() {
    return parseInt(this.twoPage.gutter - this.twoPage.scaledWL);
};

/**
 * Left offset for right flip area
 * @return {number}
 */
BookReader.prototype.twoPageRightFlipAreaLeft = function() {
    return parseInt(this.twoPage.gutter + this.twoPage.scaledWR - this.twoPageFlipAreaWidth());
};

/**
 * Position calculation shared between search and text-to-speech functions
 */
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

/**
 * Immediately stop flip animations.  Callbacks are triggered.
 */
BookReader.prototype.stopFlipAnimations = function() {
    this.trigger(BookReader.eventNames.stop);

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

/**
 * Returns true if keyboard navigation should be disabled for the event
 * @param {Event}
 * @return {boolean}
 */
BookReader.prototype.keyboardNavigationIsDisabled = function(event) {
    return event.target.tagName == "INPUT";
};

/**
 * Returns the gutter offset for the spread containing the given index.
 * This function supports RTL
 * @param {number}
 * @return {number}
 */
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

/**
 * Returns the width of the leaf edge div for the page with index given
 * @param {number}
 * @return {number}
 */
BookReader.prototype.leafEdgeWidth = function(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.getPageSide(pindex) == 'L') && (this.pageProgression != 'rl')) {
        return parseInt( (pindex/this.getNumLeafs()) * this.twoPage.edgeWidth + 0.5);
    } else {
        return parseInt( (1 - pindex/this.getNumLeafs()) * this.twoPage.edgeWidth + 0.5);
    }
};

/**
 * Returns the target jump leaf given a page coordinate (inside the left page edge div)
 * @param {number}
 * @return {number}
 */
BookReader.prototype.jumpIndexForLeftEdgePageX = function(pageX) {
    var jumpIndex;
    if ('rl' != this.pageProgression) {
        // LTR - flipping backward
        jumpIndex = this.twoPage.currentIndexL - ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;

        // browser may have resized the div due to font size change -- see https://bugs.launchpad.net/gnubook/+bug/333570
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexL - 2);
        return jumpIndex;

    } else {
        jumpIndex = this.twoPage.currentIndexL + ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexL + 2, this.lastDisplayableIndex());
        return jumpIndex;
    }
};

/**
 * Returns the target jump leaf given a page coordinate (inside the right page edge div)
 */
BookReader.prototype.jumpIndexForRightEdgePageX = function(pageX) {
    var jumpIndex;
    if ('rl' != this.pageProgression) {
        // LTR
        jumpIndex = this.twoPage.currentIndexL + (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexL + 2, this.lastDisplayableIndex());
        return jumpIndex;
    } else {
        jumpIndex = this.twoPage.currentIndexL - (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexL - 2);
        return jumpIndex;
    }
};

/**
 * Initialize the navigation bar (bottom)
 */
BookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar
    var navbarTitleHtml = '';
    if (this.options.navbarTitle) {
        navbarTitleHtml = "<div class=\"BRnavTitle\">" + this.options.navbarTitle + "</div>";
    }

    this.refs.$BRnav = $(
        "<div class=\"BRnav BRnavDesktop\">"
        +"  <div class=\"BRnavCntl BRnavCntlBtm BRdn js-tooltip\" title=\"Toogle toolbars\"></div>"
        + navbarTitleHtml
        +"  <div class=\"BRnavpos\">"
        +"    <div class=\"BRpager\"></div>"
        +"    <div class=\"BRnavline\">"
        +"    </div>"
        +"  </div>"
        +"  <div class=\"BRpage\">"

        // Note, it's important for there to not be whitespace
        +     "<span class='BRcurrentpage'></span>"
        +     "<button class=\"BRicon book_left js-tooltip\"></button>"
        +     "<button class=\"BRicon book_right js-tooltip\"></button>"
        +     "<button class=\"BRicon onepg desktop-only js-tooltip\"></button>"
        +     "<button class=\"BRicon twopg desktop-only js-tooltip\"></button>"
        +     "<button class=\"BRicon thumb desktop-only js-tooltip\"></button>"

        // zoomx`
        +     "<button class='BRicon zoom_out desktop-only js-tooltip'></button>"
        +     "<button class='BRicon zoom_in desktop-only js-tooltip'></button>"
        +     "<button class='BRicon full js-tooltip'></button>"
        +"  </div>"
        +"</div>"
    );

    this.refs.$br.append(this.refs.$BRnav);

    var self = this;
    this.$('.BRpager').slider({
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

    return this.refs.$BRnav;
};

/**
 * Initialize the navigation bar when embedded
 */
BookReader.prototype.initEmbedNavbar = function() {
    // IA-specific
    var thisLink = (window.location + '')
        .replace('?ui=embed','')
        .replace('/stream/', '/details/')
        .replace('#', '/')
    ;

    var logoHtml = '';
    if (this.showLogo) {
      logoHtml = "<a class='logo' href='" + this.logoURL + "' 'target='_blank' ></a>";
    }

    this.refs.$BRnav = $('<div class="BRnav BRnavEmbed">'
        +   logoHtml
        +   "<span class='BRembedreturn'>"
        +      "<a href='" + thisLink + "' target='_blank'>"+this.bookTitle+"</a>"
        +   "</span>"
        +   "<span class='BRtoolbarbuttons'>"
        +         '<button class="BRicon book_left"></button>'
        +         '<button class="BRicon book_right"></button>'
        +         '<button class="BRicon full"></button>'
        +   "</span>"
        + '</div>');

    this.refs.$br.append(this.refs.$BRnav);
};

/**
 * Returns the textual representation of the current page for the navbar
 * @param {number}
 * @return {string}
 */
BookReader.prototype.getNavPageNumString = function(index) {
    // Accessible index starts at 0 (alas) so we add 1 to make human
    var pageNum = this.getPageNum(index);
    var pageType = this.getPageProp(index, 'pageType');
    var numLeafs = this.getNumLeafs();

    if (!this.getNavPageNumString.maxPageNum) {
        // Calculate Max page num (used for pagination display)
        var maxPageNum = 0;
        var pageNumVal;
        for (var i = 0; i < numLeafs; i++) {
            pageNumVal = this.getPageNum(i);
            if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
                maxPageNum = pageNumVal;
            }
        }
        this.getNavPageNumString.maxPageNum = maxPageNum;
    }

    return this.getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.getNavPageNumString.maxPageNum);
}

/**
 * Renders the html for the page string
 * @param {number} index
 * @param {number} numLeafs
 * @param {number} pageNum
 * @param {string} pageType
 */
BookReader.prototype.getNavPageNumHtml = function(index, numLeafs, pageNum, pageType, maxPageNum) {
    var pageStr;
    if (pageNum[0] != 'n') {
        pageStr = ' Page ' + pageNum;
        if (maxPageNum) {
            pageStr += ' of ' + maxPageNum;
        }
    } else {
        pageStr = (index + 1) + '&nbsp;/&nbsp;' + numLeafs;
    }
    return pageStr;
};

/**
 * Renders the navbar string to the DOM
 * @param {number}
 */
BookReader.prototype.updateNavPageNum = function(index) {
    this.$('.BRcurrentpage').html(this.getNavPageNumString(index));
};

/**
 * Update the nav bar display - does not cause navigation.
 * @param {number}
 */
BookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.currentIndex();
    this.$('.BRpager').data('swallowchange', true).slider('value', index);
};

BookReader.prototype.updateNavIndexDebounced = BookReader.util.debounce(BookReader.prototype.updateNavIndex, 500);
BookReader.prototype.updateNavIndexThrottled = BookReader.util.throttle(BookReader.prototype.updateNavIndex, 250, false);

/**
 * This method builds the html for the toolbar. It can be decorated to extend
 * the toolbar.
 * @return {jqueryElement}
 */
BookReader.prototype.buildToolbarElement = function() {
  var logoHtml = '';
  if (this.showLogo) {
    logoHtml = "<span class='BRtoolbarSection BRtoolbarSectionLogo'>"
    +  "<a class='logo' href='" + this.logoURL + "'></a>"
    + "</span>";
  }

  // Add large screen navigation
  this.refs.$BRtoolbar = $(
    "<div class='BRtoolbar header'>"
    +   "<div class='BRtoolbarbuttons'>"
    +     "<div class='BRtoolbarLeft'>"
    +       logoHtml
    +       "<span class='BRtoolbarSection BRtoolbarSectionTitle'></span>"
    +    "</div>"

    +     "<div class='BRtoolbarRight'>"
    +       "<span class='BRtoolbarSection BRtoolbarSectionInfo'>"
    +         "<button class='BRpill info js-tooltip'>Info</button>"
    +         "<button class='BRpill share js-tooltip'>Share</button>"
    +       "</span>"
    // +       "<span class='BRtoolbarSection BRtoolbarSectionMenu'>"
              // TODO actual hamburger menu
    // +         "<button class='BRpill BRtoolbarHamburger'>"
    // +           "<img src='"+this.imagesBaseURL+"icon_hamburger.svg' />"
    // +           "<div class='BRhamburgerDrawer'><ul><li>hi</li></ul></div>"
    // +         "</button>"
    // +       "</span>"
    +     "</div>" // end BRtoolbarRight
    +   "</div>"
    + "</div>"
    );

    var $titleSectionEl = this.refs.$BRtoolbar.find('.BRtoolbarSectionTitle');

    if (this.bookUrl && this.options.enableBookTitleLink) {
        $titleSectionEl.append(
            $('<a>')
            .attr({'href': this.bookUrl, 'title': this.bookUrlTitle})
            .addClass('BRreturn')
            .html(this.bookUrlText || this.bookTitle)
        )
    } else if (this.bookTitle) {
        $titleSectionEl.append(this.bookUrlText || this.bookTitle);
    }

    // var $hamburger = this.refs.$BRtoolbar.find('BRtoolbarHamburger');
    return this.refs.$BRtoolbar;
}

/**
 * Initializes the toolbar (top)
 * @param {string} mode
 * @param {string} ui
 */
// eslint-disable-next-line no-unused-vars
BookReader.prototype.initToolbar = function(mode, ui) {
    var self = this;

    this.refs.$br.append(this.buildToolbarElement());

    this.$('.BRnavCntl').addClass('BRup');
    this.$('.pause').hide();

    this.updateToolbarZoom(this.reduce); // Pretty format

    // We build in mode 2
    this.refs.$BRtoolbar.append();

    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        this.$('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        this.$('.thumbnail_mode').hide();
    }

    // Hide one page button if it is the only mode available
    if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
        this.$('.one_page_mode').hide();
    }

    $('<div style="display: none;"></div>').append(
        this.blankShareDiv()
    ).append(
        this.blankInfoDiv()
    ).appendTo(this.refs.$br);

    this.$('.BRinfo .BRfloatTitle a')
        .attr({'href': this.bookUrl})
        .text(this.bookTitle)
        .addClass('title');

    // These functions can be overridden
    this.buildInfoDiv(this.$('.BRinfo'));
    this.buildShareDiv(this.$('.BRshare'));


    this.$('.share').colorbox({
        inline: true,
        opacity: "0.5",
        href: this.$('.BRshare'),
        onLoad: function() {
            self.trigger(BookReader.eventNames.stop);
            self.$('.BRpageviewValue').val(window.location.href);
        }
    });
    this.$('.info').colorbox({
        inline: true,
        opacity: "0.5",
        href: this.$('.BRinfo'),
        onLoad: function() {
            self.trigger(BookReader.eventNames.stop);
        }
    });
};

BookReader.prototype.blankInfoDiv = function() {
    return $([
        '<div class="BRfloat BRinfo">',
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
        '<div class="BRfloat BRshare">',
            '<div class="BRfloatHead">',
                'Share',
                '<button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
        '</div>'].join('\n')
    );
};

/**
 * Update the displayed zoom factor based on reduction factor
 * @param {number} reduce
 */
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
    this.$('.BRzoom').text(value);
};

/**
 * Bind navigation handlers
 */
BookReader.prototype.bindNavigationHandlers = function() {
    var self = this;

    // Note the mobile plugin attaches itself to body, so we need to select outside
    var jIcons = this.$('.BRicon').add('.BRmobileMenu .BRicon');

    jIcons.filter('.onepg').bind('click', function() {
        self.switchMode(self.constMode1up);
    });

    jIcons.filter('.twopg').bind('click', function() {
        self.switchMode(self.constMode2up);
    });

    jIcons.filter('.thumb').bind('click', function() {
        self.switchMode(self.constModeThumb);
    });

    jIcons.filter('.fit').bind('fit', function() {
        // XXXmang implement autofit zoom
    });

    jIcons.filter('.book_left').click(function() {
        self.trigger(BookReader.eventNames.stop);
        self.left();
        return false;
    });

    jIcons.filter('.book_right').click(function() {
        self.trigger(BookReader.eventNames.stop);
        self.right();
        return false;
    });

    jIcons.filter('.book_up').bind('click', function() {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollUp();
        } else {
            self.prev();
        }
        return false;
    });

    jIcons.filter('.book_down').bind('click', function() {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollDown();
        } else {
            self.next();
        }
        return false;
    });

    jIcons.filter('.book_top').click(function() {
        self.first();
        return false;
    });

    jIcons.filter('.book_bottom').click(function() {
        self.last();
        return false;
    });

    jIcons.filter('.book_leftmost').click(function() {
        self.leftmost();
        return false;
    });

    jIcons.filter('.book_rightmost').click(function() {
        self.rightmost();
        return false;
    });

    jIcons.filter('.zoom_in').bind('click', function() {
        self.trigger(BookReader.eventNames.stop);
        self.zoom(1);
        return false;
    });

    jIcons.filter('.zoom_out').bind('click', function() {
        self.trigger(BookReader.eventNames.stop);
        self.zoom(-1);
        return false;
    });

    jIcons.filter('.full').bind('click', function() {
        if (self.ui == 'embed') {
            var url = self.$('.BRembedreturn a').attr('href');
            window.open(url);
        } else {
            self.toggleFullscreen();
        }
    });

    var $brNavCntlBtmEl = this.$('.BRnavCntlBtm');
    var $brNavCntlTopEl = this.$('.BRnavCntlTop');

    this.$('.BRnavCntl').click(
        function(){
            var promises = [];
            // TODO don't use magic constants
            // TODO move this to a function
            if ($brNavCntlBtmEl.hasClass('BRdn')) {
                if (self.refs.$BRtoolbar)
                    promises.push(self.refs.$BRtoolbar.animate(
                        {top: self.getToolBarHeight() * -1}
                    ).promise());
                promises.push(self.$('.BRnav').animate({bottom: self.getNavHeight() * -1}).promise());
                $brNavCntlBtmEl.addClass('BRup').removeClass('BRdn');
                $brNavCntlTopEl.addClass('BRdn').removeClass('BRup');
                self.$('.BRnavCntlBtm.BRnavCntl').animate({height:'45px'});
                self.$('.BRnavCntl').delay(1000).animate({opacity:.75}, 1000);
            } else {
                if (self.refs.$BRtoolbar)
                    promises.push(self.refs.$BRtoolbar.animate({top:0}).promise());
                promises.push(self.$('.BRnav').animate({bottom:0}).promise());
                $brNavCntlBtmEl.addClass('BRdn').removeClass('BRup');
                $brNavCntlTopEl.addClass('BRup').removeClass('BRdn');
                self.$('.BRnavCntlBtm.BRnavCntl').animate({height:'30px'});
                self.$('.BRvavCntl').animate({opacity:1})
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
    $brNavCntlBtmEl.mouseover(function(){
        if ($(this).hasClass('BRup')) {
            self.$('.BRnavCntl').animate({opacity:1},250);
        }
    }).mouseleave(function(){
        if ($(this).hasClass('BRup')) {
            self.$('.BRnavCntl').animate({opacity:.75},250);
        }
    });
    $brNavCntlTopEl.mouseover(function(){
        if ($(this).hasClass('BRdn')) {
            self.$('.BRnavCntl').animate({opacity:1},250);
        }
    }).mouseleave(function(){
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
        // TODO look into these magic numbers: 75 and 76
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

/**
 * Returns true if the navigation elements are currently visible
 * @return {boolean}
 */
BookReader.prototype.navigationIsVisible = function() {
    // $$$ doesn't account for transitioning states, nav must be fully visible to return true
    var toolpos = this.refs.$BRtoolbar.offset();
    var tooltop = toolpos.top;
    return tooltop == 0;
};

/**
 * Hide navigation elements, if visible
 */
BookReader.prototype.hideNavigation = function() {
    // Check if navigation is showing
    if (this.navigationIsVisible()) {
        var toolbarHeight = this.getToolBarHeight();
        var navbarHeight = this.getNavHeight();
        this.refs.$BRtoolbar.animate({top: toolbarHeight * -1});
        this.refs.$BRnav.animate({bottom: navbarHeight * -1});
    }
};

/**
 * Show navigation elements
 */
BookReader.prototype.showNavigation = function() {
    // Check if navigation is hidden
    if (!this.navigationIsVisible()) {
        this.refs.$BRtoolbar.animate({top:0});
        this.refs.$BRnav.animate({bottom:0});
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

/**
 * Returns the index of the last visible page, dependent on the mode.
 * $$$ Currently we cannot display the front/back cover in 2-up and will need to update
 * this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
 * @return {number}
 */
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

/**
 * Update from the params object
 * @param {Object}
 */
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
    if (this.enableSearch && 'undefined' != typeof(params.search)) {
        if (this.searchTerm != params.search) {
            this.search(params.search, {goToFirstResult: !pageFound});
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
 * Returns the *highest* index the given page number, or undefined
 * @param {string}
 * @return {Array|undefined}
 */
BookReader.prototype.getPageIndex = function(pageNum) {
    var pageIndices = this.getPageIndices(pageNum);

    if (pageIndices.length > 0) {
        return pageIndices[pageIndices.length - 1];
    }

    return undefined;
};

/**
 * Returns an array (possibly empty) of the indices with the given page number
 * @param {string}
 * @return {array}
 */
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

/**
 * Returns the name of the page as it should be displayed in the user interface
 * @param {number} index
 * @return {string}
 */
BookReader.prototype.getPageName = function(index) {
    return 'Page ' + this.getPageNum(index);
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
        if (this.getNumLeafs() < 2) {
            return false;
        }
    }

    return true;
};

/**
 * Returns the page width for the given index, or first or last page if out of range
 * @deprecated see getPageWidth
 */
BookReader.prototype._getPageWidth = function(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = BookReader.util.clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageWidth(index);
};

/**
 * Returns the page height for the given index, or first or last page if out of range
 * @deprecated see getPageHeight
 */
BookReader.prototype._getPageHeight = function(index) {
    var clampedIndex = BookReader.util.clamp(index, 0, this.getNumLeafs() - 1);
    return this.getPageHeight(clampedIndex);
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

/**
 * @param {string}
 */
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

BookReader.prototype.removeProgressPopup = function() {
    $(this.popup).remove();
    this.$('.BRprogresspopup').remove();
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
                  '<input type="text" name="booklink" class="booklink" value="' + bookView + '"/>',
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
            '<label class="sub open-to-this-page">',
                '<input class="thispage-social" type="checkbox" />',
                'Open to this page?',
            '</label>',
            '<div><button class="BRaction share facebook-share-button"><i class="BRicon fb" /> Facebook</button></div>',
            '<div><button class="BRaction share twitter-share-button"><i class="BRicon twitter" /> Twitter</button></div>',
            '<div><button class="BRaction share email-share-button"><i class="BRicon email" /> Email</button></div>',
        '</div>',
        embedHtml,
        '<div class="BRfloatFoot">',
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
    var shareThisPage = this.$('.thispage-social').prop('checked');
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
      $rightCol.append($("<div class=\"BRinfoValueWrapper\">"
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
      $rightCol.append($("<div class=\"BRinfoValueWrapper\">"
        +"<div class=\"BRinfoMoreInfoWrapper\">"
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

/**
 * Can be overriden
 */
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
            this.$(icon).prop('title', titles[icon]);
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

/**
 * @return {number} (in pixels) of the toolbar height. 0 if no toolbar.
 */
BookReader.prototype.getToolBarHeight = function() {
  if (this.refs.$BRtoolbar && this.refs.$BRtoolbar.css('display') === 'block') {
    return (this.refs.$BRtoolbar.outerHeight() + parseInt(this.refs.$BRtoolbar.css('top')));
  } else {
    return 0;
  }
}

/**
 * @param {boolean} ignoreDisplay - bypass the display check
 * @return {number}
 */
BookReader.prototype.getNavHeight = function() {
    if (this.refs.$BRnav) {
        var outerHeight = this.refs.$BRnav.outerHeight();
        var bottom = parseInt(this.refs.$BRnav.css('bottom'));
        if (!isNaN(outerHeight) && !isNaN(bottom)) {
          return outerHeight + bottom;
        }
    }
    return 0;
}

// Basic Usage built-in Methods (can be overridden through options)
// This implementation uses options.data value for populating BookReader

/**
 * @return {number} the total number of leafs (like an array length)
 */
BookReader.prototype.getNumLeafs = function() {
    // For deprecated interface support, if numLeafs is set, use that.
    if (this.numLeafs !== undefined)
      return this.numLeafs;
    return this._getDataFlattened().length;
};

/**
 * @param  {number} index
 * @return {Number|undefined}
 */
BookReader.prototype.getPageWidth = function(index) {
    return this.getPageProp(index, 'width');
};

/**
 * @param  {number} index
 * @return {Number|undefined}
 */
BookReader.prototype.getPageHeight = function(index) {
    return this.getPageProp(index, 'height');
};

/**
 * @param  {number} index
 * @param  {number} reduce - not used in default implementation
 * @param  {number} rotate - not used in default implementation
 * @return {Number|undefined}
 */
// eslint-disable-next-line no-unused-vars
BookReader.prototype.getPageURI = function(index, reduce, rotate) {
    return this.getPageProp(index, 'uri');
};

/**
 * @param  {number} index
 * @return {string} - L or R
 */
BookReader.prototype.getPageSide = function(index) {
    var pageSide = this.getPageProp(index, 'pageSide');
    if (!pageSide) {
        pageSide = index % 2 === 0 ? 'R' : 'L';
    }
    return pageSide;
};

/**
 * @param  {number} index
 * @return {string}
 */
BookReader.prototype.getPageNum = function(index) {
    var pageNum = this.getPageProp(index, 'pageNum');
    if (pageNum === undefined) {
        pageNum = 'n' + index;
    }
    return pageNum;
};

/**
 * Generalized property accessor.
 * @param  {number} index
 * @return {mixed|undefined}
 */
BookReader.prototype.getPageProp = function(index, propName) {
    return this._getDataProp(index, propName);
};

/**
 * This function returns the left and right indices for the user-visible
 * spread that contains the given index.  The return values may be
 * null if there is no facing page or the index is invalid.
 * @param  {number} pindex
 * @return {array} - eg [0, 1]
 */
BookReader.prototype.getSpreadIndices = function(pindex) {
    var spreadIndices;
    if ('rl' == this.pageProgression) {
        spreadIndices = this.getPageSide(pindex) == 'R' ? [pindex + 1, pindex] : [pindex, pindex - 1];
    } else {
        spreadIndices = this.getPageSide(pindex) == 'L' ? [pindex, pindex + 1] : [pindex - 1, pindex];
    }
    return spreadIndices;
};

/**
 * Single images in the Internet Archive scandata.xml metadata are (somewhat incorrectly)
 * given a "leaf" number.  Some of these images from the scanning process should not
 * be displayed in the BookReader (for example colour calibration cards).  Since some
 * of the scanned images will not be displayed in the BookReader (those marked with
 * addToAccessFormats false in the scandata.xml) leaf numbers and BookReader page
 * indexes are generally not the same.  This function returns the BookReader page
 * index given a scanned leaf number.
 *
 * This function is used, for example, to map between search results (that use the
 * leaf numbers) and the displayed pages in the BookReader.
 * @param  {number} index
 * @return {number}
 */
BookReader.prototype.leafNumToIndex = function(leafNum) {
    var dataf = this._getDataFlattened();
    for (var i = 0; i < dataf.length; i++) {
        if (dataf[i].leafNum == leafNum) {
            return i;
        }
    }
    // If no match is found, fall back to the leafNum provide (leafNum == index)
    return leafNum;
};

/**
 * Create a params object from the current parameters.
 * @return {Object}
 */
BookReader.prototype.paramsFromCurrent = function() {
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
        params.search = BookReader.util.decodeURIComponentPlus(urlHash['search']);
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
 * @return {string}
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
    if (params.search) {
        fragments.push('search', params.search);
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
 * @return {array}
 */
BookReader.prototype._getDataFlattened = function() {
    if (this._getDataFlattened.cached && this._getDataFlattened.cached[1] === this.data.length)
        return this._getDataFlattened.cached[0];

    var flattend = [];
    var prevPageSide = null;
    for (var i = 0; i < this.data.length; i++) {
        for (var j = 0; j < this.data[i].length; j++) {
            if (!this.data[i][j].pageSide) {
                if (prevPageSide === null) {
                    this.data[i][j].pageSide = this.data[i].length === 2 ? 'L' : 'R';
                } else {
                    this.data[i][j].pageSide = prevPageSide === 'L' ? 'R' : 'L';
                }
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
 * @param {number} index
 * @param {string} prop
 * @return {array}
 */
BookReader.prototype._getDataProp = function(index, prop) {
    var dataf = this._getDataFlattened();
    if (isNaN(index) || index < 0 || index >= dataf.length)
        return;
    if ('undefined' == typeof(dataf[index][prop]))
        return;
    return dataf[index][prop];
};

/**
 * Helper to select within instance's elements
 */
BookReader.prototype.$ = function(selector) {
    return this.refs.$br.find(selector);
}

/**
 * Polyfill for deprecated method
 */
jQuery.curCSS = function(element, prop, val) {
    return jQuery(element).css(prop, val);
};

return BookReader;

})(jQuery);
