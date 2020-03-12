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
      this.search(this.options.initialSearchTerm, { goToFirstResult: true });
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
 * Submits search request
 *
 * @param { string } term
 * @param { object } options
 * @param { boolean } options.disablePopup
 */
BookReader.prototype.search = function(term, options) {
  options = options !== undefined ? options : {};
  const defaultOptions = {
    /** @type {boolean} jump to the first result (default=false) */
    goToFirstResult: false,
    /** @type {boolean} don't show the modal progress (default=false) */
    disablePopup: false
  };
  options = jQuery.extend({}, defaultOptions, options);

  this.$('.BRsearchInput').blur(); //cause mobile safari to hide the keyboard

  this.removeSearchResults();

  this.searchTerm = term;
  // strip slashes, since this goes in the url
  this.searchTerm = this.searchTerm.replace(/\//g, ' ');

  this.trigger(BookReader.eventNames.fragmentChange);

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

  const processSearchResults = (data) => {
    if (data.error || 0 == data.matches.length) {
      this.BRSearchCallbackError(data, options);
    } else {
      this.BRSearchCallback(data, options);
    }
  };

  $.ajax({
    url: url,
    dataType: 'jsonp'
  }).then(processSearchResults);
};

/**
 * Search Results return handler
 * @param { object } results
 * @param { array } results.matches
 * @param { object } options
 * @param { boolean } options.goToFirstResult
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

  results.matches.forEach(match => this.addSearchResult(match.text, match.par[0].page));
  this.updateSearchHilites();
  this.removeProgressPopup();
  if (options.goToFirstResult === true) {
    this.jumpToIndex(this.leafNumToIndex(results.matches[0].par[0].page));
  }
}

/** @deprecated */
BookReader.prototype.BRSearchCallbackErrorDesktop = function(results, options) {
  const $el = $(this.popup);
  this._BRSearchCallbackError(results, $el, true);
}

/**
 * Main search results error handler
 * @param { array } results
 */
BookReader.prototype.BRSearchCallbackError = function(results) {
  const $el = $(this.popup);
  this._BRSearchCallbackError(results, $el, true);
  // sync mobileView
  this.BRSearchCallbackErrorMobile(results);
};

/**
 * Callback specifically to draw search results error on mobile
 * @param { array } results
 */
BookReader.prototype.BRSearchCallbackErrorMobile = function(results) {
  const $el = this.$('.BRmobileSearchResultWrapper');
  this._BRSearchCallbackError(results, $el);
};

/**
 * @private draws search results error
 * @param { object } results
 * @param { string } results.error
 * @param { array } results.matches
 * @param { boolean } results.indexed
 * @param { jQuery } $el
 * @param { boolean } fade
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
          width:  `${(box.r-box.l)/this.reduce}px`,
          height: `${(box.b-box.t)/this.reduce}px`,
          left:   `${(box.l)/this.reduce}px`,
          top:    `${(box.t)/this.reduce}px`
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
  if (null == results) return;
  let i, j;
  for (i=0; i<results.matches.length; i++) {
    //TODO: loop over all par objects
    const pageIndex = this.leafNumToIndex(results.matches[i].par[0].page);
    for (j=0; j<results.matches[i].par[0].boxes.length; j++) {
      const box = results.matches[i].par[0].boxes[j];
      if (jQuery.inArray(pageIndex, this.displayedIndices) >= 0) {
        if (null == box.div) {
          //create a div for the search highlight, and stash it in the box object
          box.div = document.createElement('div');
          $(box.div).addClass('BookReaderSearchHilite')
            .appendTo(this.refs.$brTwoPageView)
          ;
        }
        this.setHilightCss2UP(box.div, pageIndex, box.l, box.r, box.t, box.b);
      } else {
        if (null != box.div) {
          $(box.div).remove();
          box.div=null;
        }
      }
    }
  }
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
      this.jumpToIndex($(event.target).data('pageIndex'));
    }.bind(this))
    .animate({top:'-25px'}, 'slow');

  // Add Mobile Search Results
  const imgPreviewUrl = this.getPageURI(pageIndex, 16, 0); // scale 16 is small
  const $mobileSearchResultWrapper = this.$('.BRmobileSearchResultWrapper');
  if ($mobileSearchResultWrapper.length) {
    const onResultsClick = (e) => {
      e.preventDefault();
      this.switchMode(this.constMode1up);
      this.jumpToIndex(pageIndex);
      this.refs.$mmenu.data('mmenu').close();
    };
    $(
      `<a class="BRmobileSearchResult">
        <table>
          <tr>
            <span class="pageDisplay">${pageDisplayString}</span>
          </tr>
          <tr>
            <td>
              <img class="searchImgPreview" src="${imgPreviewUrl}" />
            </td>
            <td>
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
 * Removes all search pins
 */
BookReader.prototype.removeSearchResults = function() {
  this.removeSearchHilites(); //be sure to set all box.divs to null
  this.searchTerm = null;
  this.searchResults = null;
  this.trigger(BookReader.eventNames.fragmentChange);
  this.$('.BRnavpos .BRsearch').remove();
  this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results
};

/**
 * Returns true if a search highlight is currently being displayed
 */
BookReader.prototype.searchHighlightVisible = function() {
  const results = this.searchResults;
  let visiblePages = [];
  if (null == results) return false;

  if (this.constMode2up == this.mode) {
    visiblePages = [this.twoPage.currentIndexL, this.twoPage.currentIndex];
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
