/* global BookReader */
/**
 * Plugin for chapter markers in BookReader. Fetches from openlibrary.org
 * Could be forked, or extended to alter behavior
 */

jQuery.extend(BookReader.defaultOptions, {
    olHost: 'https://openlibrary.org',
    enableChaptersPlugin: true,
    bookId: '',
});

/** @override Extend the constructor to add search properties */
BookReader.prototype.setup = (function (super_) {
    return function (options) {
        super_.call(this, options);

        this.olHost = options.olHost;
        this.enableChaptersPlugin = options.enableChaptersPlugin;
        this.bookId = options.bookId;
    };
})(BookReader.prototype.setup);


/** @override Extend to call Open Library for TOC */
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);
    if (this.enableChaptersPlugin && this.ui !== 'embed') {
      this.getOpenLibraryRecord();
    }
  }
})(BookReader.prototype.init);

/**
 * Adds chapter marker to navigation scrubber
 *
 * @param {string} chapterTitle
 * @param {string} pageNumber
 * @param {number} pageIndex
 */
BookReader.prototype.addChapter = function(chapterTitle, pageNumber, pageIndex) {
    const uiStringPage = 'Page'; // i18n
    const percentThrough = BookReader.util.cssPercentage(pageIndex, this.getNumLeafs() - 1);
    const jumpToChapter = (event) => this.jumpToIndex($(event.target).data('pageIndex'));
    const title = `Chapter: ${chapterTitle} | ${uiStringPage} ${pageNumber}`;

    $(`<div><div>${title}</div></div>`)
    .addClass('BRchapter')
    .css({ left: percentThrough })
    .appendTo(this.$('.BRnavline'))
    .data({ pageIndex })
    .bt({
      contentSelector: '$(this).find("> div")',
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
    })
    .hover(() => {
        // remove hover effect from other markers then turn on just for this
        this.$('.BRsearch,.BRchapter').removeClass('front');
        $(this).addClass('front');
      },
      () => $(this).removeClass('front')
    )
    .bind('click', jumpToChapter);
};

/*
 * Remove all chapters.
 */
BookReader.prototype.removeChapters = function() {
    this.$('.BRnavpos .BRchapter').remove();
};

/**
 * Update the table of contents based on array of TOC entries.
 * @param { list } tocEntries
 */
BookReader.prototype.updateTOC = function(tocEntries) {
    this.removeChapters();
    for (let i = 0; i < tocEntries.length; i++) {
        this.addChapterFromEntry(tocEntries[i]);
    }
};

/**
 *   Example table of contents entry - this format is defined by Open Library
 *   {
 *       "pagenum": "17",
 *       "level": 1,
 *       "label": "CHAPTER I",
 *       "type": {"key": "/type/toc_item"},
 *       "title": "THE COUNTRY AND THE MISSION"
 *   }
 * @param { object } - tocEntryObject
 * @param { string } pageNum
 * @param { string } title
 */
BookReader.prototype.addChapterFromEntry = function(tocEntryObject) {
    const pageIndex = this.getPageIndex(tocEntryObject['pagenum']);
    // Only add if we know where it is
    if (pageIndex) {
        this.addChapter(tocEntryObject['title'], tocEntryObject['pagenum'], pageIndex);
    }
    this.$('.BRchapter').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
    this.$('.BRsearch').each(function(){
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
BookReader.prototype.getOpenLibraryRecord = function () {
  // Try looking up by ocaid first, then by source_record
  const baseURL = `${this.olHost}//query.json?type=/type/edition&*=`;
  const fetchUrlByBookId = `${baseURL}&ocaid=${this.bookId}`;

  /*
  * Update Chapter markers based on received record from Open Library.
  * Notes that Open Library record is used for extra metadata, and also for lending
  */
  const setUpChapterMarkers = (olObject) => {
    if (olObject && olObject.table_of_contents) {
      // XXX check here that TOC is valid
      this.updateTOC(olObject.table_of_contents);
    }
  };

  $.ajax({
    url: fetchUrlByBookId,
    success: (data) => {
      if (data && data.length > 0) {
        setUpChapterMarkers(data[0]);
      } else {
        // try sourceid
        const fetchURLBySourceId = `${baseURL}&source_records=ia:${this.bookId}`;
        $.ajax({
          url: fetchURLBySourceId,
          success: (data) => {
            if (data && data.length > 0) {
              setUpChapterMarkers(data[0]);
            }
          },
          dataType: 'jsonp'
        });
      }
    },
    dataType: 'jsonp'
  });
}
