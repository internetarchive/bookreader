/* global BookReader */
/**
 * Plugin for Archive.org book search
 * NOTE: This script must be loaded AFTER `plugin.mobile_nav.js`
 * as it mutates mobile nav drawer
 */

jQuery.extend(BookReader.defaultOptions, {
  server: 'ia600609.us.archive.org',
  bookId: '',
  subPrefix: '',
  bookPath: '',
  enableSearch: true,
  searchInsideUrl: '/fulltext/inside.php',
  initialSearchTerm: null,
});

/** @override */
BookReader.prototype.setup = (function (super_) {
  return function (options) {
    super_.call(this, options);

    this.searchTerm = '';
    this.searchResults = null;
    this.searchInsideUrl = options.searchInsideUrl;
    this.enableSearch = options.enableSearch;

    // Base server used by some api calls
    this.bookId = options.bookId;
    this.server = options.server;
    this.subPrefix = options.subPrefix;
    this.bookPath = options.bookPath;
  };
})(BookReader.prototype.setup);

/** @override */
BookReader.prototype.init = (function (super_) {
  return function () {
    super_.call(this);

    if (this.options.enableSearch && this.options.initialSearchTerm) {
      this.$('.BRsearchInput').val(this.options.initialSearchTerm);
      this.search(
        this.options.initialSearchTerm,
        { goToFirstResult: true, suppressFragmentChange: true }
      );
    }

    $(document).on('BookReader:navToggled', () => {
      const pinsVisibleState = this.navigationIsVisible() ? 'visible' : 'hidden';
      this.refs.$BRfooter.find('.BRsearch').css({ visibility: pinsVisibleState });
    });
  };
})(BookReader.prototype.init);

/** @override */
BookReader.prototype.buildMobileDrawerElement = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (this.enableSearch) {
      $el.find('.BRmobileMenu__moreInfoRow').after($(
        `<li>
          <span>
            <span class="DrawerIconWrapper">
              <img class="DrawerIcon" src="${this.imagesBaseURL}icon_search_button_blue.svg" alt="info-speaker"/>
            </span>
            Search
          </span>
          <div>
            <form class="BRbooksearch mobile">
              <input type="search" class="BRsearchInput" placeholder="Search inside"/>
              <button type="submit" class="BRsearchSubmit"></button>
            </form>
            <div class="BRmobileSearchResultWrapper">Enter your search above.</div>
          </div>
        </li>`
      ));
    }
    return $el;
  };
})(BookReader.prototype.buildMobileDrawerElement);

/** @override */
BookReader.prototype.buildToolbarElement = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (this.enableSearch) {
      const $BRtoolbarSectionSearch = $(
        `<span class="BRtoolbarSection BRtoolbarSectionSearch">
          <form class="BRbooksearch desktop">
            <input type="search" class="BRsearchInput" val="" placeholder="Search inside"/>
            <button type="submit" class="BRsearchSubmit">
              <img src="${this.imagesBaseURL}icon_search_button.svg" />
            </button>
          </form>
        </span>`
      );
      $BRtoolbarSectionSearch.insertAfter($el.find('.BRtoolbarSectionInfo'));
    }
    return $el;
  };
})(BookReader.prototype.buildToolbarElement);

/** @override */
BookReader.prototype.initToolbar = (function (super_) {
  return function (mode, ui) {
    super_.apply(this, arguments);

    const onSubmitDesktop = (e) => {
      e.preventDefault();
      const val = $(e.target).find('.BRsearchInput').val();
      if (!val.length) return false;
      this.search(val);
      return false;
    };

    const onSubmitMobile = (e) => {
      e.preventDefault();
      const val = $(e.target).find('.BRsearchInput').val();
      if (!val.length) return false;
      this.search(val, { disablePopup: true });
      this.$('.BRmobileSearchResultWrapper').append(
        `<div>Your search results will appear below.</div>
          <div class="loader tc mt20"></div>`
      );
      return false;
    };

    // Bind search forms
    this.$('.BRbooksearch.desktop').submit(onSubmitDesktop);
    this.$('.BRbooksearch.mobile').submit(onSubmitMobile);

    // Handle clearing the search results
    this.$(".BRsearchInput").bind('input propertychange', () => {
      if (this.value === "") this.removeSearchResults();
    });
  };
})(BookReader.prototype.initToolbar);

/**
 * @typedef {object} SearchOptions
 * @property {boolean} goToFirstResult
 * @property {boolean} disablePopup
 * @property {(null|function)} error - @deprecated at v.5.0
 * @property {(null|function)} success - @deprecated at v.5.0
 */

/**
 * Submits search request
 *
 * @param {string} term
 * @param {SearchOptions} options
 */
BookReader.prototype.search = function(term = '', options) {
  options = options !== undefined ? options : {};
  /** @type {SearchOptions} */
  const defaultOptions = {
    goToFirstResult: false, /* jump to the first result (default=false) */
    disablePopup: false,    /* don't show the modal progress (default=false) */
    suppressFragmentChange: false, /* don't change the URL on initial load */
    error: null,            /* optional error handler (default=null) */
    success: null,          /* optional success handler (default=null) */

  };
  options = jQuery.extend({}, defaultOptions, options);

  /* DOM updates */
  this.$('.BRsearchInput').blur(); //cause mobile safari to hide the keyboard
  this.removeSearchResults();
  // update value to desktop & mobile search inputs
  this.$('.BRsearchInput').val(term);
  /* End DOM updates */
  this.suppressFragmentChange = options.suppressFragmentChange

  this.removeSearchResults(options.suppressFragmentChange);

  // strip slashes, since this goes in the url
  this.searchTerm = term.replace(/\//g, ' ');

  if (!options.suppressFragmentChange) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }

  // Add quotes to the term. This is to compenstate for the backends default OR query
  // term = term.replace(/['"]+/g, '');
  // term = '"' + term + '"';

  // Remove the port and userdir
  const serverPath = this.server.replace(/:.+/, '');
  const baseUrl = `https://${serverPath}${this.searchInsideUrl}?`;

  // Remove subPrefix from end of path
  let path = this.bookPath;
  const subPrefixWithSlash = `/${this.subPrefix}`;
  if (this.bookPath.length - this.bookPath.lastIndexOf(subPrefixWithSlash) == subPrefixWithSlash.length) {
    path = this.bookPath.substr(0, this.bookPath.length - subPrefixWithSlash.length);
  }

  const urlParams = {
    item_id: this.bookId,
    doc: this.subPrefix,
    path,
    q: term,
  };

  // NOTE that the API does not expect / (slashes) to be encoded. (%2F) won't work
  const paramStr = $.param(urlParams).replace(/%2F/g, '/');

  const url = `${baseUrl}${paramStr}`;

  if (!options.disablePopup) {
    this.showProgressPopup(
      `<img class="searchmarker" src="${this.imagesBaseURL}marker_srch-on.svg" />
      Search results will appear below...`);
  }

  const processSearchResults = (searchInsideResults) => {
    const responseHasError = searchInsideResults.error || !searchInsideResults.matches.length;
    const hasCustomError = typeof options.error === 'function';
    const hasCustomSuccess = typeof options.success === 'function';

    if (responseHasError) {
      hasCustomError
        ? options.error.call(this, searchInsideResults, options)
        : this.BRSearchCallbackError(searchInsideResults, options);
    } else {
      hasCustomSuccess
        ? options.success.call(this, searchInsideResults, options)
        : this.BRSearchCallback(searchInsideResults, options);
    }
  };

  $.ajax({
    url: url,
    dataType: 'jsonp'
  }).then(processSearchResults);
};

/**
  * @typedef {object} SearchInsideMatchBox
  * @property {number} page
  * @property {number} r
  * @property {number} l
  * @property {number} b
  * @property {number} t
  * @property {HTMLDivElement} [div]
  */

/**
 * @typedef {object} SearchInsideMatch
 * @property {string} text
 * @property {Array<{ page: number, boxes: SearchInsideMatchBox[] }>} par
 */

/**
 * @typedef {object} SearchInsideResults
 * @property {string} error
 * @property {SearchInsideMatch[]} matches
 * @property {boolean} indexed
 */

/**
 * Search Results return handler
 * @callback
 * @param {SearchInsideResults} results
 * @param {object} options
 * @param {boolean} options.goToFirstResult
 */
BookReader.prototype.BRSearchCallback = function(results, options) {
  this.searchResults = results;
  this.$('.BRnavpos .search').remove();
  this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results

  // Update Mobile count
  const mobileResultsText = results.matches.length == 1 ? "1 match" : `${results.matches.length} matches`;
  this.$('.BRmobileSearchResultWrapper').append(
    `<div class="BRmobileNumResults">
    ${mobileResultsText} for "${this.searchTerm}"
    </div>`
  );

  let firstResultIndex = null;

  results.matches.forEach((match, i) => {
    const { text, par: [ partial ] } = match;
    this.addSearchResult(text, this.leafNumToIndex(partial.page));
    if (i === 0 && options.goToFirstResult === true) {
      firstResultIndex = this.leafNumToIndex(partial.page);
    }
  });

  this.updateSearchHilites();
  this.removeProgressPopup();
  if (firstResultIndex !== null) {
    this._searchPluginGoToResult(firstResultIndex);
  }
}

/** @deprecated */
BookReader.prototype.BRSearchCallbackErrorDesktop = function(results, options) {
  const $el = $(this.popup);
  this._BRSearchCallbackError(results, $el, true);
}

/**
 * Main search results error handler
 * @callback
 * @param {SearchInsideResults} results
 */
BookReader.prototype.BRSearchCallbackError = function(results) {
  const $el = $(this.popup);
  this._BRSearchCallbackError(results, $el, true);
  // sync mobileView
  this.BRSearchCallbackErrorMobile(results);
};

/**
 * Callback specifically to draw search results error on mobile
 * @callback
 * @param {array} results
 */
BookReader.prototype.BRSearchCallbackErrorMobile = function(results) {
  const $el = this.$('.BRmobileSearchResultWrapper');
  this._BRSearchCallbackError(results, $el);
};

/**
 * @private draws search results error
 * @callback
 * @param {SearchInsideResults} results
 * @param {jQuery} $el
 * @param {boolean} fade
 */
BookReader.prototype._BRSearchCallbackError = function(results, $el, fade) {
  this.$('.BRnavpos .search').remove();
  this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results

  this.searchResults = results;
  let timeout = 2000;
  if (results.error) {
    if (/debug/.test(window.location.href)) {
      $el.html(results.error);
    } else {
      timeout = 4000;
      $el.html('Sorry, there was an error with your search.<br />The text may still be processing.');

    }
  } else if (0 == results.matches.length) {
    let errStr  = 'No matches were found.';
    timeout = 2000;
    if (false === results.indexed) {
      errStr  = "<p>This book hasn't been indexed for searching yet. We've just started indexing it, so search should be available soon. Please try again later. Thanks!</p>";
      timeout = 5000;
    }
    $el.html(errStr);
  }

  if (fade) {
    const atFade = () => {
      this.removeProgressPopup();
    };
    setTimeout(() => {
      $el.fadeOut('slow', atFade);
    }, timeout);
  }
};

/**
 * updates search on-page highlights controller
 */
BookReader.prototype.updateSearchHilites = function() {
  if (this.constMode2up == this.mode) {
    this.updateSearchHilites2UP();
  } else {
    this.updateSearchHilites1UP();
  }
};

/**
 * update search on-page highlights in 1up mode
 */
BookReader.prototype.updateSearchHilites1UP = function() {
  const results = this.searchResults;
  if (null == results) return;
  results.matches.forEach(match => {
    match.par[0].boxes.forEach(box => {
      const pageIndex = this.leafNumToIndex(box.page);
      const pageIsInView = jQuery.inArray(pageIndex, this.displayedIndices) >= 0;
      if (pageIsInView) {
        if (!box.div) {
          //create a div for the search highlight, and stash it in the box object
          box.div = document.createElement('div');
          $(box.div).prop('className', 'BookReaderSearchHilite').appendTo(this.$(`.pagediv${pageIndex}`));
        }
        const highlight = {
          width:  `${(box.r - box.l) / this.reduce}px`,
          height: `${(box.b - box.t) / this.reduce}px`,
          left:   `${(box.l) / this.reduce}px`,
          top:    `${(box.t) / this.reduce}px`
        };
        $(box.div).css(highlight);
      } else {
        if (box.div) {
          $(box.div).remove();
          box.div = null;
        }
      }
    });
  });
};

/**
 * update search on-page highlights in 2up mode
 */
BookReader.prototype.updateSearchHilites2UP = function() {
  const results = this.searchResults;

  if (results === null) return;

  const { matches } = results;
  matches.forEach((match) => {
    match.par[0].boxes.forEach(box => {
      const pageIndex = this.leafNumToIndex(match.par[0].page);
      const pageIsInView = jQuery.inArray(pageIndex, this.displayedIndices) >= 0;
      const { isViewable } = this._models.book.getPage(pageIndex);

      if (pageIsInView && isViewable) {
        if (!box.div) {
          //create a div for the search highlight, and stash it in the box object
          box.div = document.createElement('div');
          $(box.div).addClass('BookReaderSearchHilite')
            .appendTo(this.refs.$brTwoPageView);
        }
        this.setHilightCss2UP(box.div, pageIndex, box.l, box.r, box.t, box.b);
      } else {
        // clear stale reference
        if (box.div) {
          $(box.div).remove();
          box.div = null;
        }
      }
    });
  });
};

/**
 * remove search highlights
 */
BookReader.prototype.removeSearchHilites = function() {
  const results = this.searchResults;
  if (null == results) return;
  results.matches.forEach(match => {
    match.par[0].boxes.forEach(box => {
      if (null != box.div) {
        $(box.div).remove();
        box.div = null;
      }
    });
  });
};

/**
 *  Adds a search result marker
 */
BookReader.prototype.addSearchResult = function(queryString, pageIndex) {
  const pageNumber = this.getPageNum(pageIndex);
  const uiStringSearch = "Search result"; // i18n
  const uiStringPage = "Page"; // i18n

  const percentThrough = BookReader.util.cssPercentage(pageIndex, this.getNumLeafs() - 1);
  const pageDisplayString = `${uiStringPage} ${this.getNavPageNumString(pageIndex, true)}`;

  const searchBtSettings = {
    contentSelector: '$(this).find(".BRquery")',
    trigger: 'hover',
    closeWhenOthersOpen: true,
    cssStyles: {
      padding: '12px 14px',
      backgroundColor: '#fff',
      border: '4px solid rgb(216,216,216)',
      color: 'rgb(52,52,52)'
    },
    shrinkToFit: false,
    width: '230px',
    padding: 0,
    spikeGirth: 0,
    spikeLength: 0,
    overlap: '0px',
    overlay: false,
    killTitle: false,
    offsetParent: null,
    positions: ['top'],
    fill: 'white',
    windowMargin: 10,
    strokeWidth: 0,
    cornerRadius: 0,
    centerPointX: 0,
    centerPointY: 0,
    shadow: false
  };

  const re = new RegExp('{{{(.+?)}}}', 'g');
  const queryStringWithB = queryString.replace(re, '<b>$1</b>');

  let queryStringWithBTruncated;

  if (queryString.length > 100) {
    queryStringWithBTruncated = queryString
      .replace(/^(.{100}[^\s]*).*/, "$1")
      .replace(re, '<b>$1</b>')
            + '...';
  } else {
    queryStringWithBTruncated = queryString.replace(re, '<b>$1</b>');
  }

  // draw marker
  const markerTopValue = (-this.refs.$brContainer.height());
  $('<div>')
    .addClass('BRsearch')
    .css({
      top: `${markerTopValue}px`,
      left: percentThrough,
    })
    .attr('title', uiStringSearch)
    .append(
      $('<div>')
        .addClass('BRquery')
        .append(
          $('<div>').html(queryStringWithB),
          $('<div>').html(`${uiStringPage} ${pageNumber}`)
        )
    )
    .data({ pageIndex })
    .appendTo(this.$('.BRnavline'))
    .bt(searchBtSettings)
    .hover(
      (event) => {
        // remove from other markers then turn on just for this
        // XXX should be done when nav slider moves
        $('.BRsearch,.BRchapter').removeClass('front');
        $(event.target).addClass('front');
      },
      (event) => $(event.target).removeClass('front'))
    .click(function (event) {
      // closures are nested and deep, using an arrow function breaks references.
      // Todo: update to arrow function & clean up closures
      // to remove `bind` dependency
      this._searchPluginGoToResult($(event.target).data('pageIndex'));
    }.bind(this))
    .animate({top:'-25px'}, 'slow');

  // Add Mobile Search Results
  const page = this._models.book.getPage(pageIndex);
  const $mobileSearchResultWrapper = this.$('.BRmobileSearchResultWrapper');
  if ($mobileSearchResultWrapper.length) {
    const onResultsClick = (e) => {
      e.preventDefault();
      this.switchMode(this.constMode1up);
      this._searchPluginGoToResult(pageIndex);
      this.refs.$mmenu.data('mmenu').close();
    };
    $(
      `<a class="BRmobileSearchResult">
        <table>
          <tr>
            <span class="pageDisplay">${pageDisplayString}</span>
          </tr>
          <tr>
            ${page.isViewable ? /** Scale down since it's a thumbnail */
    `<td><img class="searchImgPreview" src="${page.getURI(16, 0)}" /></td>` :
    ''
}
            <td ${!page.isViewable ? 'colspan="2"' : ''}>
              <span>${queryStringWithBTruncated}</span>
            </td>
          </tr>
        </table>
      </a>`
    )
      .attr('href', '#search/' + this.searchTerm)
      .click(onResultsClick)
      .appendTo($mobileSearchResultWrapper)
    ;
  }
};

/**
 * @private
 * Goes to the page specified. If the page is not viewable, tries to load the page
 * FIXME Most of this logic is IA specific, and should be less integrated into here
 * or at least more configurable.
 * @param {PageIndex} pageIndex
 */
BookReader.prototype._searchPluginGoToResult = async function (pageIndex) {
  const { book } = this._models;
  const page = book.getPage(pageIndex);
  let makeUnviewableAtEnd = false;
  if (!page.isViewable) {
    const resp = await fetch('/services/bookreader/request_page?' + new URLSearchParams({
      id: this.options.bookId,
      subprefix: this.options.subPrefix,
      leafNum: page.leafNum,
    })).then(r => r.json());

    for (const leafNum of resp.value) {
      book.getPage(book.leafNumToIndex(leafNum)).makeViewable();
    }

    // not able to show page; make the page viewable anyways so that it can
    // actually open. On IA, it has a fallback to a special error page.
    if (!resp.value.length) {
      book.getPage(pageIndex).makeViewable();
      makeUnviewableAtEnd = true;
    }
  }
  this.jumpToIndex(pageIndex);

  // Reset it to unviewable if it wasn't resolved
  if (makeUnviewableAtEnd) {
    book.getPage(pageIndex).makeViewable(false);
  }
};

/**
 * Removes all search pins
 */
BookReader.prototype.removeSearchResults = function(suppressFragmentChange = false) {
  this.removeSearchHilites(); //be sure to set all box.divs to null
  this.searchTerm = null;
  this.searchResults = null;
  if (!suppressFragmentChange) {
    this.trigger(BookReader.eventNames.fragmentChange);
  }
  this.$('.BRnavpos .BRsearch').remove();
  this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results
};

/**
 * Returns true if a search highlight is currently being displayed
 * @returns {boolean}
 */
BookReader.prototype.searchHighlightVisible = function() {
  const results = this.searchResults;
  let visiblePages = [];
  if (null == results) return false;

  if (this.constMode2up == this.mode) {
    visiblePages = [this.twoPage.currentIndexL, this.twoPage.currentIndexR];
  } else if (this.constMode1up == this.mode) {
    visiblePages = [this.currentIndex()];
  } else {
    return false;
  }

  results.matches.some(match => {
    return match.par[0].boxes.some(box => {
      const pageIndex = this.leafNumToIndex(box.page);
      if (jQuery.inArray(pageIndex, visiblePages) >= 0) {
        return true;
      }
    });
  });

  return false;
};
