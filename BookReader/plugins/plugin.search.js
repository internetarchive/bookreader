/**
 * Plugin for Archive.org book search
 */

jQuery.extend(true, BookReader.defaultOptions, {
    server: 'ia600609.us.archive.org',
    bookId: '',
    subPrefix: '',
    bookPath: '',
    enableSearch: true,
    searchInsideUrl: '/fulltext/inside.php',
});

// Extend the constructor to add search properties
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


// Extend buildMobileDrawerElement
BookReader.prototype.buildMobileDrawerElement = (function (super_) {
    return function () {
        var $el = super_.call(this);
        if (this.enableSearch) {
            $el.find('.BRmobileMenu__moreInfoRow').after($(
                "<li>"
                +"      <span>"
                +"        <span class=\"DrawerIconWrapper \"><img class=\"DrawerIcon\" src=\""+this.imagesBaseURL+"icon_search_button_blue.svg\" alt=\"info-speaker\"/></span>"
                +"        Search"
                +"      </span>"
                +"      <div>"
                +         "<form class='BRbooksearch mobile'>"
                +           "<input type='search' class='BRsearchInput' val='' placeholder='Search inside'/>"
                +           "<button type='submit' class='BRsearchSubmit'>"
                +              "<img src=\""+this.imagesBaseURL+"icon_search_button.svg\" />"
                +           "</button>"
                +         "</form>"
                +         "<div class='BRmobileSearchResultWrapper'>Enter your search above.</div>"
                +"      </div>"
                +"    </li>"
            ));
        };
        return $el;
    };
})(BookReader.prototype.buildMobileDrawerElement);


// Extend buildToolbarElement
BookReader.prototype.buildToolbarElement = (function (super_) {
    return function () {
        var $el = super_.call(this);
        if (this.enableSearch) {
          var $BRtoolbarSectionSearch = $("<span class='BRtoolbarSection BRtoolbarSectionSearch'>"
          +         "<form class='BRbooksearch desktop'>"
          +           "<input type='search' class='BRsearchInput' val='' placeholder='Search inside'/>"
          +           "<button type='submit' class='BRsearchSubmit'>"
          +              "<img src=\""+this.imagesBaseURL+"icon_search_button.svg\" />"
          +           "</button>"
          +         "</form>"
          +       "</span>");
          $BRtoolbarSectionSearch.insertAfter($el.find('.BRtoolbarSectionInfo'));
        }
        return $el;
    };
})(BookReader.prototype.buildToolbarElement);


// Extend initToolbar
BookReader.prototype.initToolbar = (function (super_) {
    return function (mode, ui) {
        super_.apply(this, arguments);

        var self = this;

        // Bind search forms
        this.$('.BRbooksearch.desktop').submit(function(e) {
            e.preventDefault();
            var val = $(this).find('.BRsearchInput').val();
            if (!val.length) return false;
            self.search(val);
            return false;
        });
        this.$('.BRbooksearch.mobile').submit(function(e) {
            e.preventDefault();
            var val = $(this).find('.BRsearchInput').val();
            if (!val.length) return false;
            self.search(val, {
                disablePopup:true,
                error: self.BRSearchCallbackErrorMobile,
            });
            self.$('.BRmobileSearchResultWrapper').append(
                '<div class="">Your search results will appear below.</div>'
                + '<div class="loader tc mt20"></div>'
            );
            return false;
        });
        // Handle clearing the search results
        this.$(".BRsearchInput").bind('input propertychange', function() {
            if (this.value == "") self.removeSearchResults();
        });
    };
})(BookReader.prototype.initToolbar);



// search()
// @param {string} term
// @param {object} options
//______________________________________________________________________________
BookReader.prototype.search = function(term, options) {
    options = options !== undefined ? options : {};
    var defaultOptions = {
        // {bool} (default=false) goToFirstResult - jump to the first result
        goToFirstResult: false,
        // {bool} (default=false) disablePopup - don't show the modal progress
        disablePopup: false,
        error: this.BRSearchCallbackErrorDesktop.bind(this),
        success: this.BRSearchCallback.bind(this),
    };
    options = jQuery.extend({}, defaultOptions, options);

    this.$('.BRsearchInput').blur(); //cause mobile safari to hide the keyboard

    this.removeSearchResults();

    this.searchTerm = term;
    this.searchTerm = this.searchTerm.replace(/\//g, ' '); // strip slashes, since this goes in the url
    if (this.enableUrlPlugin) this.updateLocationHash(true);

    // Add quotes to the term. This is to compenstate for the backends default OR query
    term = term.replace(/['"]+/g, '');
    term = '"' + term + '"';

    // Remove the port and userdir
    var url = 'https://' + this.server.replace(/:.+/, '') + this.searchInsideUrl + '?';

    // Remove subPrefix from end of path
    var path = this.bookPath;
    var subPrefixWithSlash = '/' + this.subPrefix;
    if (this.bookPath.length - this.bookPath.lastIndexOf(subPrefixWithSlash) == subPrefixWithSlash.length) {
      path = this.bookPath.substr(0, this.bookPath.length - subPrefixWithSlash.length);
    }

    var urlParams = {
      'item_id': this.bookId,
      'doc': this.subPrefix,
      'path': path,
      'q': term,
    };

    var paramStr = $.param(urlParams);

    // NOTE that the API does not expect / (slashes) to be encoded. (%2F) won't work
    paramStr = paramStr.replace(/%2F/g, '/');

    url += paramStr;

    if (!options.disablePopup) {
        this.showProgressPopup('<img class="searchmarker" src="'+this.imagesBaseURL + 'marker_srch-on.svg'+'"> Search results will appear below...');
    }
    $.ajax({
        url:url,
        dataType:'jsonp',
        success: function(data) {
            if (data.error || 0 == data.matches.length) {
                options.error.call(br, data, options);
            } else {
                options.success.call(br, data, options);
            }
        },
    });
};



// BRSearchCallback()
//______________________________________________________________________________
BookReader.prototype.BRSearchCallback = function(results, options) {
    this.searchResults = results;
    this.$('.BRnavpos .search').remove();
    this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results

    // Update Mobile count
    var mobileResultsText = results.matches.length == 1 ? "1 match" : results.matches.length + " matches";
    this.$('.BRmobileSearchResultWrapper').append("<div class='BRmobileNumResults'>"+mobileResultsText+" for &quot;"+this.searchTerm+"&quot;</div>");

    var i, firstResultIndex = null;
    for (i=0; i < results.matches.length; i++) {
        this.addSearchResult(results.matches[i].text, this.leafNumToIndex(results.matches[i].par[0].page));
        if (i === 0 && options.goToFirstResult === true) {
          firstResultIndex = this.leafNumToIndex(results.matches[i].par[0].page);
        }
    }
    this.updateSearchHilites();
    this.removeProgressPopup();
    if (firstResultIndex !== null) {
        this.jumpToIndex(firstResultIndex);
    }
}

// BRSearchCallbackErrorDesktop()
//______________________________________________________________________________
BookReader.prototype.BRSearchCallbackErrorDesktop = function(results, options) {
    var $el = $(this.popup);
    this._BRSearchCallbackError(results, $el, true);
};

// BRSearchCallbackErrorMobile()
//______________________________________________________________________________
BookReader.prototype.BRSearchCallbackErrorMobile = function(results, options) {
    var $el = this.$('.BRmobileSearchResultWrapper');
    this._BRSearchCallbackError(results, $el);
};
BookReader.prototype._BRSearchCallbackError = function(results, $el, fade, options) {
    var self = this;
    this.$('.BRnavpos .search').remove();
    this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results

    this.searchResults = results;
    var timeout = 2000;
    if (results.error) {
        if (/debug/.test(window.location.href)) {
            $el.html(results.error);
        } else {
            timeout = 4000;
            $el.html('Sorry, there was an error with your search.<br />The text may still be processing.');

        }
    } else if (0 == results.matches.length) {
        var errStr  = 'No matches were found.';
        timeout = 2000;
        if (false === results.indexed) {
            errStr  = "<p>This book hasn't been indexed for searching yet. We've just started indexing it, so search should be available soon. Please try again later. Thanks!</p>";
            timeout = 5000;
        }
        $el.html(errStr);
    }
    if (fade) {
        setTimeout(function(){
            $el.fadeOut('slow', function() {
                self.removeProgressPopup();
            })
        }, timeout);
    }
};


// updateSearchHilites()
//______________________________________________________________________________
BookReader.prototype.updateSearchHilites = function() {
    if (this.constMode2up == this.mode) {
        this.updateSearchHilites2UP();
    } else {
        this.updateSearchHilites1UP();
    }
};

// showSearchHilites1UP()
//______________________________________________________________________________
BookReader.prototype.updateSearchHilites1UP = function() {
    var results = this.searchResults;
    if (null == results) return;
    var i, j;
    for (i=0; i<results.matches.length; i++) {
        for (j=0; j<results.matches[i].par[0].boxes.length; j++) {
            var box = results.matches[i].par[0].boxes[j];
            var pageIndex = this.leafNumToIndex(box.page);
            if (jQuery.inArray(pageIndex, this.displayedIndices) >= 0) {
                if (null == box.div) {
                    //create a div for the search highlight, and stash it in the box object
                    box.div = document.createElement('div');
                    $(box.div).prop('className', 'BookReaderSearchHilite').appendTo(this.$('.pagediv'+pageIndex));
                }
                $(box.div).css({
                    width:  (box.r-box.l)/this.reduce + 'px',
                    height: (box.b-box.t)/this.reduce + 'px',
                    left:   (box.l)/this.reduce + 'px',
                    top:    (box.t)/this.reduce +'px'
                });
            } else {
                if (null != box.div) {
                    $(box.div).remove();
                    box.div=null;
                }
            }
        }
    }

};

// showSearchHilites2UPNew()
//______________________________________________________________________________
BookReader.prototype.updateSearchHilites2UP = function() {
    var results = this.searchResults;
    if (null == results) return;
    var i, j;
    for (i=0; i<results.matches.length; i++) {
        //TODO: loop over all par objects
        var pageIndex = this.leafNumToIndex(results.matches[i].par[0].page);
        for (j=0; j<results.matches[i].par[0].boxes.length; j++) {
            var box = results.matches[i].par[0].boxes[j];
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


// removeSearchHilites()
//______________________________________________________________________________
BookReader.prototype.removeSearchHilites = function() {
    var results = this.searchResults;
    if (null == results) return;
    var i, j;
    for (i=0; i<results.matches.length; i++) {
        for (j=0; j<results.matches[i].par[0].boxes.length; j++) {
            var box = results.matches[i].par[0].boxes[j];
            if (null != box.div) {
                $(box.div).remove();
                box.div=null;
            }
        }
    }
};


BookReader.prototype.addSearchResult = function(queryString, pageIndex) {
    var self = this;

    var pageNumber = this.getPageNum(pageIndex);
    var uiStringSearch = "Search result"; // i18n
    var uiStringPage = "Page"; // i18n

    var percentThrough = BookReader.util.cssPercentage(pageIndex, this.getNumLeafs() - 1);
    var pageDisplayString = uiStringPage + ' ' + this.getNavPageNumString(pageIndex, true);

    var searchBtSettings = {
        contentSelector: '$(this).find(".query")',
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
        fill: 'blue',
        windowMargin: 10,
        strokeWidth: 0,
        cornerRadius: 0,
        centerPointX: 0,
        centerPointY: 0,
        shadow: false
    };

    var re = new RegExp('{{{(.+?)}}}', 'g');
    var queryStringReplaced = queryString.replace(re, '$1');
    var queryStringWithB = queryString;

    if (queryStringWithB.length > 100) {
        queryStringWithB = queryStringWithB.replace(/^(.{100}[^\s]*).*/, "$1");
        queryStringWithB = queryStringWithB.replace(re, '<b>$1</b>');
        queryStringWithB = queryStringWithB + '...';
    } else {
        queryStringWithB = queryStringWithB.replace(re, '<b>$1</b>');
    }

    var $marker = $('<div>')
    .addClass('search')
    .css({
        top: (-this.refs.$brContainer.height())+'px',
        left: percentThrough,
    })
    .attr('title', uiStringSearch)
    .append(
        $('<div>')
        .addClass('query')
        .append(
            $('<div>').html(queryStringReplaced),
            $('<div>').html(uiStringPage + ' ' + pageNumber)
        )
    );

    $marker
    .data({'self': this, 'pageIndex': pageIndex})
    .appendTo(this.$('.BRnavline'))
    .bt(searchBtSettings)
    .hover(function() {
            // remove from other markers then turn on just for this
            // XXX should be done when nav slider moves
            self.$('.search,.chapter').removeClass('front');
            $(this).addClass('front');
        }, function() {
            $(this).removeClass('front');
        }
    )
    .bind('click', function() {
        $(this).data('self').jumpToIndex($(this).data('pageIndex'));
    })
    .animate({top:'-25px'}, 'slow')
    ;

    // Add Mobile Search Results
    var imgPreviewUrl = this.getPageURI(pageIndex, 16, 0); // scale 16 is small
    var $mobileSearchResultWrapper = self.$('.BRmobileSearchResultWrapper');
    if ($mobileSearchResultWrapper.length) {
        $('<a class="BRmobileSearchResult">'
            +"<table>"
            +"  <tr>"
            +"     <span class='pageDisplay'>"+pageDisplayString+"</span>"
            +"  </tr>"
            +"  <tr>"
            +"    <td>"
            +"      <img class='searchImgPreview' src=\""+imgPreviewUrl+"\" />"
            +"    </td>"
            +"    <td>"
            +"      <span>"+queryStringWithB+"</span>"
            +"    </td>"
            +"  </tr>"
            +"</table>"
        +'</a>')
        .attr('href', '#search/' + this.searchTerm)
        .click(function(e){
            e.preventDefault();
            self.switchMode(self.constMode1up);
            self.jumpToIndex(pageIndex);
            self.refs.$mmenu.data('mmenu').close();
        })
        .appendTo($mobileSearchResultWrapper)
        ;
    }
};

BookReader.prototype.removeSearchResults = function() {
    this.removeSearchHilites(); //be sure to set all box.divs to null
    this.searchTerm = null;
    this.searchResults = null;
    if (this.enableUrlPlugin) this.updateLocationHash(true);
    this.$('.BRnavpos .search').remove();
    this.$('.BRmobileSearchResultWrapper').empty(); // Empty mobile results
};


// searchHighlightVisible
//________
// Returns true if a search highlight is currently being displayed
BookReader.prototype.searchHighlightVisible = function() {
    var results = this.searchResults;
    if (null == results) return false;

    if (this.constMode2up == this.mode) {
        var visiblePages = Array(this.twoPage.currentIndexL, this.twoPage.currentIndexR);
    } else if (this.constMode1up == this.mode) {
        var visiblePages = Array();
        visiblePages[0] = this.currentIndex();
    } else {
        return false;
    }

    var i, j;
    for (i=0; i<results.matches.length; i++) {
        for (j=0; j<results.matches[i].par[0].boxes.length; j++) {
            var box = results.matches[i].par[0].boxes[j];
            var pageIndex = this.leafNumToIndex(box.page);
            if (jQuery.inArray(pageIndex, visiblePages) >= 0) {
                return true;
            }
        }
    }

    return false;
};
