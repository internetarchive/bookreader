/**
 * Plugin for chapter markers in BookReader. Fetches from openlibrary.org
 * Could be forked, or extended to alter behavior
 */

jQuery.extend(true, BookReader.defaultOptions, {
    olHost: 'https://openlibrary.org',
    enableChaptersPlugin: true,
    bookId: '',
});

// Extend the constructor to add search properties
BookReader.prototype.setup = (function (super_) {
    return function (options) {
        super_.call(this, options);

        this.olHost = options.olHost;
        this.enableChaptersPlugin = options.enableChaptersPlugin;
        this.bookId = options.bookId;
    };
})(BookReader.prototype.setup);


// Extend br.init to call Open Library for TOC
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);

    if (this.enableChaptersPlugin && this.ui !== 'embed') {
      this.getOpenLibraryRecord(this.gotOpenLibraryRecord);
    }
  }
})(BookReader.prototype.init);


BookReader.prototype.addChapter = function(chapterTitle, pageNumber, pageIndex) {
    var uiStringPage = 'Page'; // i18n

    var percentThrough = BookReader.util.cssPercentage(pageIndex, this.getNumLeafs() - 1);

    $('<div class="chapter" style="left:' + percentThrough + ';"><div class="title">'
        + chapterTitle + '<span>|</span> ' + uiStringPage + ' ' + pageNumber + '</div></div>')
    .appendTo('#BRnavline')
    .data({'self': this, 'pageIndex': pageIndex })
    .bt({
        contentSelector: '$(this).find(".title")',
        trigger: 'hover',
        closeWhenOthersOpen: true,
        cssStyles: {
            padding: '12px 14px',
            backgroundColor: '#fff',
            border: '4px solid rgb(216,216,216)',
            fontSize: '13px',
            color: 'rgb(52,52,52)'
        },
        shrinkToFit: true,
        width: '200px',
        padding: 0,
        spikeGirth: 0,
        spikeLength: 0,
        overlap: '21px',
        overlay: false,
        killTitle: true,
        textzIndex: 9999,
        boxzIndex: 9998,
        wrapperzIndex: 9997,
        offsetParent: null,
        positions: ['top'],
        fill: 'white',
        windowMargin: 10,
        strokeWidth: 0,
        cornerRadius: 0,
        centerPointX: 0,
        centerPointY: 0,
        shadow: false
    })
    .hover( function() {
        // remove hover effect from other markers then turn on just for this
        $('.search,.chapter').removeClass('front');
            $(this).addClass('front');
        }, function() {
            $(this).removeClass('front');
        }
    )
    .bind('click', function() {
        $(this).data('self').jumpToIndex($(this).data('pageIndex'));
    });
};

/*
 * Remove all chapters.
 */
BookReader.prototype.removeChapters = function() {
    $('#BRnavpos .chapter').remove();
};

/*
 * Update the table of contents based on array of TOC entries.
 */
BookReader.prototype.updateTOC = function(tocEntries) {
    this.removeChapters();
    for (var i = 0; i < tocEntries.length; i++) {
        this.addChapterFromEntry(tocEntries[i]);
    }
};

/*
 *   Example table of contents entry - this format is defined by Open Library
 *   {
 *       "pagenum": "17",
 *       "level": 1,
 *       "label": "CHAPTER I",
 *       "type": {"key": "/type/toc_item"},
 *       "title": "THE COUNTRY AND THE MISSION"
 *   }
 */
BookReader.prototype.addChapterFromEntry = function(tocEntryObject) {
    var pageIndex = this.getPageIndex(tocEntryObject['pagenum']);
    // Only add if we know where it is
    if (pageIndex) {
        this.addChapter(tocEntryObject['title'], tocEntryObject['pagenum'], pageIndex);
    }
    $('.chapter').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
    $('.search').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
    $('.searchChap').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
};

// getOpenLibraryRecord
//
// The bookreader is designed to call openlibrary API and constructs the
// "Return book" button using the response.
//
// This makes a call to OL API and calls the given callback function with the
// response from the API.
BookReader.prototype.getOpenLibraryRecord = function(callback) {
  // Try looking up by ocaid first, then by source_record
  var self = this; // closure
  var jsonURL = self.olHost + '/query.json?type=/type/edition&*=&ocaid=' + self.bookId;
  $.ajax({
    url: jsonURL,
    success: function(data) {
      if (data && data.length > 0) {
        callback(self, data[0]);
      } else {
        // try sourceid
        jsonURL = self.olHost + '/query.json?type=/type/edition&*=&source_records=ia:' + self.bookId;
        $.ajax({
          url: jsonURL,
          success: function(data) {
            if (data && data.length > 0) {
              callback(self, data[0]);
            }
          },
          dataType: 'jsonp'
        });
      }
    },
    dataType: 'jsonp'
  });
}

/*
 * Update based on received record from Open Library.
 * Open Library record is used for extra metadata, and also for lending
 */
BookReader.prototype.gotOpenLibraryRecord = function(self, olObject) {
  // $$$ could refactor this so that 'this' is available
  if (olObject) {
    if (olObject.table_of_contents) {
      // XXX check here that TOC is valid
      self.updateTOC(olObject.table_of_contents);
    }
  }
}
