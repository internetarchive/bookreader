/**
 * Plugin for chapter markers in BookReader
 */

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

// Stub Method. Original removed from Book Reader source
BookReader.prototype.gotOpenLibraryRecord = function(self, olObject) {};
