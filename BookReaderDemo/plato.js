
// Error reporting - this helps us fix errors quickly
function logError(description,page,line) {
    if (typeof(archive_analytics) != 'undefined') {
        var values = {
            'bookreader': 'error',
            'description': description,
            'page': page,
            'line': line,
            'itemid': 'theworksofplato01platiala',
            'subPrefix': 'theworksofplato01platiala',
            'server': 'ia801407.us.archive.org',
            'bookPath': '\x2F12\x2Fitems\x2Ftheworksofplato01platiala\x2Ftheworksofplato01platiala'
        };

        // if no referrer set '-' as referrer
        if (document.referrer == '') {
            values['referrer'] = '-';
        } else {
            values['referrer'] = document.referrer;
        }

        if (typeof(br) != 'undefined') {
            values['itemid'] = br.bookId;
            values['subPrefix'] = br.subPrefix;
            values['server'] = br.server;
            values['bookPath'] = br.bookPath;
        }

        archive_analytics.send_ping(values);
    }

    return false; // allow browser error handling so user sees there was a problem
}
window.onerror=logError;

br = new BookReader();

br.titleLeaf = 7;

br.getPageWidth = function(index) {
    return this.pageW[index];
}

br.getPageHeight = function(index) {
    return this.pageH[index];
}

// Returns true if page image is available rotated
br.canRotatePage = function(index) {
    return 'jp2' == this.imageFormat; // Assume single format for now
}

// reduce defaults to 1 (no reduction)
// rotate defaults to 0 (no rotation)
br.getPageURI = function(index, reduce, rotate) {
    var _reduce;
    var _rotate;

    if ('undefined' == typeof(reduce)) {
        _reduce = 1;
    } else {
        _reduce = reduce;
    }
    if ('undefined' == typeof(rotate)) {
        _rotate = 0;
    } else {
        _rotate = rotate;
    }

    var file = this._getPageFile(index);

    // $$$ add more image stack formats here
    return '//'+this.server+'/BookReader/BookReaderImages.php?zip='+this.zip+'&file='+file+'&scale='+_reduce+'&rotate='+_rotate;
}

// Get a rectangular region out of a page
br.getRegionURI = function(index, reduce, rotate, sourceX, sourceY, sourceWidth, sourceHeight) {

    // Map function arguments to the url keys
    var urlKeys = ['n', 'r', 'rot', 'x', 'y', 'w', 'h'];
    var page = '';
    for (var i = 0; i < arguments.length; i++) {
        if ('undefined' != typeof(arguments[i])) {
            if (i > 0 ) {
                page += '_';
            }
            page += urlKeys[i] + arguments[i];
        }
    }

    var itemPath = this.bookPath.replace(new RegExp('/'+this.subPrefix+'$'), ''); // remove trailing subPrefix

    return '//'+this.server+'/BookReader/BookReaderImages.php?id=' + this.bookId + '&itemPath=' + itemPath + '&server=' + this.server + '&subPrefix=' + this.subPrefix + '&page=' +page + '.jpg';
}

br._getPageFile = function(index) {
    var leafStr = '0000';
    var imgStr = this.leafMap[index].toString();
    var re = new RegExp("0{"+imgStr.length+"}$");

    var insideZipPrefix = this.subPrefix.match('[^/]+$');
    var file = insideZipPrefix + '_' + this.imageFormat + '/' + insideZipPrefix + '_' + leafStr.replace(re, imgStr) + '.' + this.imageFormat;

    return file;
}

br.getPageSide = function(index) {
    //assume the book starts with a cover (right-hand leaf)
    //we should really get handside from scandata.xml


    // $$$ we should get this from scandata instead of assuming the accessible
    //     leafs are contiguous
    if ('rl' != this.pageProgression) {
        // If pageProgression is not set RTL we assume it is LTR
        if (0 == (index & 0x1)) {
            // Even-numbered page
            return 'R';
        } else {
            // Odd-numbered page
            return 'L';
        }
    } else {
        // RTL
        if (0 == (index & 0x1)) {
            return 'L';
        } else {
            return 'R';
        }
    }
}

br.getPageNum = function(index) {
    var pageNum = this.pageNums[index];
    if (pageNum) {
        return pageNum;
    } else {
        return 'n' + index;
    }
}

// Single images in the Internet Archive scandata.xml metadata are (somewhat incorrectly)
// given a "leaf" number.  Some of these images from the scanning process should not
// be displayed in the BookReader (for example colour calibration cards).  Since some
// of the scanned images will not be displayed in the BookReader (those marked with
// addToAccessFormats false in the scandata.xml) leaf numbers and BookReader page
// indexes are generally not the same.  This function returns the BookReader page
// index given a scanned leaf number.
//
// This function is used, for example, to map between search results (that use the
// leaf numbers) and the displayed pages in the BookReader.
br.leafNumToIndex = function(leafNum) {
    for (var index = 0; index < this.leafMap.length; index++) {
        if (this.leafMap[index] == leafNum) {
            return index;
        }
    }

    return null;
}

// This function returns the left and right indices for the user-visible
// spread that contains the given index.  The return values may be
// null if there is no facing page or the index is invalid.
br.getSpreadIndices = function(pindex) {
    // $$$ we could make a separate function for the RTL case and
    //      only bind it if necessary instead of always checking
    // $$$ we currently assume there are no gaps

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

    //console.log("   index %d mapped to spread %d,%d", pindex, spreadIndices[0], spreadIndices[1]);

    return spreadIndices;
}

// Remove the page number assertions for all but the highest index page with
// a given assertion.  Ensures there is only a single page "{pagenum}"
// e.g. the last page asserted as page 5 retains that assertion.
br.uniquifyPageNums = function() {
    if (br.pageNums.length == 0)return;
    var seen = {};

    for (var i = br.pageNums.length - 1; i--; i >= 0) {
        var pageNum = br.pageNums[i];
        if ( !seen[pageNum] ) {
            seen[pageNum] = true;
        } else {
            br.pageNums[i] = null;
        }
    }

}

br.cleanupMetadata = function() {
    br.uniquifyPageNums();
}

// getEmbedURL
//________
// Returns a URL for an embedded version of the current book
br.getEmbedURL = function(viewParams) {
    // We could generate a URL hash fragment here but for now we just leave at defaults
    var url = 'https://' + window.location.host + '/stream/'+this.bookId;
    if (this.subPrefix != this.bookId) { // Only include if needed
        url += '/' + this.subPrefix;
    }
    url += '?ui=embed';
    if (typeof(viewParams) != 'undefined') {
        url += '#' + this.fragmentFromParams(viewParams);
    }
    return url;
}

// getEmbedCode
//________
// Returns the embed code HTML fragment suitable for copy and paste
br.getEmbedCode = function(frameWidth, frameHeight, viewParams) {
    return "<iframe src='" + this.getEmbedURL(viewParams) + "' width='" + frameWidth + "' height='" + frameHeight + "' frameborder='0' ></iframe>";
}


// getOpenLibraryRecord
br.getOpenLibraryRecord = function(callback) {
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

/**
 * @param JInfoDiv DOM element. Appends info to this element
 */
br.buildInfoDiv = function(jInfoDiv) {
    // $$$ it might make more sense to have a URL on openlibrary.org that returns this info
    var escapedTitle = BookReader.util.escapeHTML(this.bookTitle);
    var domainRe = /(\w+\.(com|org))/;
    var domainMatch = domainRe.exec(this.bookUrl);
    var domain = this.bookUrl;
    if (domainMatch) {
      domain = domainMatch[1];
    }

    var data = {
      title: this.bookTitle,
      escapedTitle: escapedTitle,
      coverImage: '//archive.org/download/' + this.bookId + '/page/cover_t.jpg',
      publishDate: this.publishDate,
      language: this.language,
      collection: this.collection,
      identifierAccess: this.bookUrl,
      formats: [
        ['PDF', '//archive.org/download/' + this.bookId + '/' + this.subPrefix + '.pdf'],
        ['Plain Text', '//archive.org/download/' + this.bookId + '/' + this.subPrefix + '_djvu.txt'],
        ['DAISY', '//archive.org/download/' + this.bookId, '/' + this.subPrefix + '_daisy.zip'],
        ['ePub', '//archive.org/download/' + this.bookId + '/' + this.subPrefix + '.epub'],
        ['Send to Kindle', 'https://www.amazon.com/gp/digital/fiona/web-to-kindle?clientid=IA&itemid=' + this.bookId + '&docid=' + this.subPrefix],
      ]
    }

    // TODO generate about HTML in responsive format from data
    var render = function(tmpl, data) {
      return tmpl.replace(/{{(.+?)}}/g, function(_, placeholder) {
        return data[placeholder];
      });
    }
    var createEl = function(tmpl) {
      return $(render(tmpl, data));
    }

    var $leftCol = $("<div class=\"br__info__left_col\">");
    var $rightCol = $("<div class=\"br__info__right_col\">");

    $leftCol.append(createEl("<div class=\"br__image__w\">"
    +"  <img src=\"{{coverImage}}\" alt=\"{{escapedTitle}}\" />"
    +"</div>"));

    $rightCol.append(createEl("<div class=\"br__info__title__w\">"
    +"  <div class=\"br__info__title__label\">Title</div>"
    +"  <div class=\"br__info__title\">{{title}}</div>"
    +"</div>"));

    $rightCol.append(createEl("<div class=\"br__info__publish_date__w\">"
    +"  <div class=\"br__info__publish_date__label\">Publish Date</div>"
    +"  <div class=\"br__info__publish_date\">{{publishDate}}</div>"
    +"</div>"));

    $rightCol.append(createEl("<div class=\"br__info__language__w\">"
    +"  <div class=\"br__info__language__label\">Language</div>"
    +"  <div class=\"br__info__language\">{{language}}</div>"
    +"</div>"));

    $rightCol.append(createEl("<div class=\"br__info__collection__w\">"
    +"  <div class=\"br__info__collection__label\">Collection</div>"
    +"  <div class=\"br__info__collection\">{{collection}}</div>"
    +"</div>"));

    $rightCol.append(createEl("<div class=\"br__info__more_info__w\">"
    +"  <a class=\"br__info__more_info\" href=\"{{identifierAccess}}\">More information on Archive.org</a>"
    +"</div>"));

    var otherFormatsEl = "<div class=\"br_info_other_formats\">"
    +"  <div class=\"br_info__other_formats__label\">Other formats</div>";
    $.each(data.formats, function(index, row) {
      otherFormatsEl = otherFormatsEl + "<div class=\"br_info_other_formats__format\">"
        + "<a href=\""+row[1]+"\">"
        + row[0]
        + "</a></div>";
    });
    otherFormatsEl = otherFormatsEl + "</div>";

    $rightCol.append(createEl(otherFormatsEl));

    var footerEl = "<div class=\"br__info__footer\">"
    +"  <a href=\"https://openlibrary.org/dev/docs/bookreader\">About the BookReader</a>"
    +"  <a href=\"https://openlibrary.org/contact\" class=\"problem-icon\">Report a problem</a>"
    +"</div>";

    var children = [
      $leftCol,
      $rightCol,
      createEl(footerEl)
    ];
    var childrenEl = $('<div class="br__info__w">').append(children);
    jInfoDiv.append(childrenEl);

    // Remove these legacy elements
    $('#BRinfo').find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

    return;


    // --------- legacy code below

    // $$$ cover looks weird before it loads
    jInfoDiv.find('.BRfloatCover').append([
                    '<div style="height: 140px; min-width: 80px; padding: 0; margin: 0;"><a href="', this.bookUrl, '"><img src="//archive.org/download/', this.bookId, '/page/cover_t.jpg" alt="' + escapedTitle + '" height="140px" /></a></div>'].join('')
    );

    var download_links = [];
    if (!this.olAuth) {
        download_links = [
            '<h3>Other Formats</h3>',
            '<ul class="links">',
                '<li><a href="//archive.org/download/', this.bookId, '/', this.subPrefix, '.pdf">PDF</a><span>|</span></li>',
                '<li><a href="//archive.org/download/', this.bookId, '/', this.subPrefix, '_djvu.txt">Plain Text</a><span>|</span></li>',
                '<li><a href="//archive.org/download/', this.bookId, '/', this.subPrefix, '_daisy.zip">DAISY</a><span>|</span></li>',
                '<li><a href="//archive.org/download/', this.bookId, '/', this.subPrefix, '.epub">ePub</a><span>|</span></li>',
                '<li><a href="https://www.amazon.com/gp/digital/fiona/web-to-kindle?clientid=IA&itemid=', this.bookId, '&docid=', this.subPrefix, '">Send to Kindle</a></li>',
            '</ul>'
        ];
    }

    download_links.push('<p class="moreInfo"><span></span>More information on <a href="'+ this.bookUrl + '">' + domain + '</a>  </p>');

    jInfoDiv.find('.BRfloatMeta').append(download_links.join('\n'));

    jInfoDiv.find('.BRfloatFoot').append([
                '<span>|</span>',
                '<a href="https://openlibrary.org/contact" class="problem">Report a problem</a>',
    ].join('\n'));

    if (domain == 'archive.org') {
        jInfoDiv.find('.BRfloatMeta p.moreInfo span').css(
            {'background': 'url(https://archive.org/favicon.ico) no-repeat', 'width': 22, 'height': 18 }
        );
    }

    jInfoDiv.find('.BRfloatTitle a').attr({'href': this.bookUrl, 'alt': this.bookTitle}).text(this.bookTitle);
    var bookPath = (window.location + '').replace('#','%23');
    jInfoDiv.find('a.problem').attr('href','https://openlibrary.org/contact?path=' + bookPath);

}

br.pageW =  [
            1746.0,1610.0,1610.0,1610.0,1610.0,1610.0,1610.0,1610.0,1610.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1506.0,1592.0,1592.0,1746.0            ];

br.pageH =  [
            2900.0,2746.0,2746.0,2746.0,2746.0,2746.0,2746.0,2746.0,2746.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2638.0,2718.0,2718.0,2900.0            ];
br.leafMap = [
            1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524            ];

br.pageNums = [
            null,null,null,null,null,null,null,null,null,null,null,'viii',null,'2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98','99','100','101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116','117','118','119','120','121','122','123','124','125','126','127','128','129','130','131','132','133','134','135','136','137','138','139','140','141','142','143','144','145','146','147','148','149','150','151','152','153','154','155','156','157','158','159','160','161','162','163','164','165','166','167','168','169','170','171','172','173','174','175','176','177','178','179','180','181','182','183','184','185','186','187','188','189','190','191','192','193','194','195','196','197','198','199','200','201','202','203','204','205','206','207','208','209','210','211','212','213','214','215','216','217','218','219','220','221','222','223','224','225','226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','247','248','249','250','251','252','253','254','255','256','257','258','259','260','261','262','263','264','265','266','267','268','269','270','271','272','273','274','275','276','277','278','279','280','281','282','283','284','285','286','287','288','289','290','291','292','293','294','295','296','297','298','299','300','301','302','303','304','305','306','307','308','309','310','311','312','313','314','315','316','317','318','319','320','321','322','323','324','325','326','327','328','329','330','331','332','333','334','335','336','337','338','339','340','341','342','343','344','345','346','347','348','349','350','351','352','353','354','355','356','357','358','359','360','361','362','363','364','365','366','367','368','369','370','371','372','373','374','375','376','377','378','379','380','381','382','383','384','385','386','387','388','389','390','391','392','393','394','395','396','397','398','399','400','401','402','403','404','405','406','407','408','409','410','411','412','413','414','415','416','417','418','419','420','421','422','423','424','425','426','427','428','429','430','431','432','433','434','435','436','437','438','439','440','441','442','443','444','445','446','447','448','449','450','451','452','453','454','455','456','457','458','459','460','461','462','463','464','465','466','467','468','469','470','471','472','473','474','475','476','477','478','479','480','481','482','483','484','485','486','487','488','489','490','491','492','493','494','495','496','497','498','499','500','501','502','503','504','505','506','507',null,null,null,null,null            ];


br.numLeafs = br.pageW.length;


br.bookId   = 'theworksofplato01platiala';
br.zip      = '\x2F12\x2Fitems\x2Ftheworksofplato01platiala\x2Ftheworksofplato01platiala_jp2.zip';
br.subPrefix = 'theworksofplato01platiala';
br.server   = 'ia801407.us.archive.org';
br.bookTitle= 'The\x20works\x20of\x20Plato\x20\x3A\x20a\x20new\x20and\x20literal\x20version,\x20chiefly\x20from\x20the\x20text\x20of\x20Stallbaum';
br.bookPath = '\x2F12\x2Fitems\x2Ftheworksofplato01platiala\x2Ftheworksofplato01platiala';
br.bookUrl  = 'https://archive.org/details/theworksofplato01platiala';
br.imageFormat = 'jp2';
br.archiveFormat = 'zip';
// TODO add these via php
br.publishDate = 'July 21, 2016';
br.language = 'English';
br.collection = 'A collection';

br.pageProgression = 'lr';
br.olHost = 'https://openlibrary.org';
br.olAuthUrl = null;
br.olAuth = false;

// Check for config object
// $$$ change this to use the newer params object
if (typeof(brConfig) != 'undefined') {
    if (typeof(brConfig["ui"]) != 'undefined') {
        br.ui = brConfig["ui"];
    }

    if (brConfig['mode'] == 1) {
        br.mode = 1;
        if (typeof(brConfig['reduce'] != 'undefined')) {
            br.reduce = brConfig['reduce'];
        }
    } else if (brConfig['mode'] == 2) {
        br.mode = 2;
    }

    if (typeof(brConfig["isAdmin"]) != 'undefined') {
        br.isAdmin = brConfig["isAdmin"];
    } else {
        br.isAdmin = false;
    }

    if (typeof(brConfig["theme"]) != 'undefined') {
        br.theme = brConfig["theme"];
    }
} // brConfig


function OLAuth() {
    this.olConnect = false;
    this.loanUUID = false;
    this.permsToken = false;

    var cookieRe = /;\s*/;
    var cookies = document.cookie.split(cookieRe);
    var length = cookies.length;
    var i;
    for (i=0; i<length; i++) {
        if (0 == cookies[i].indexOf('br-loan-' + br.bookId)) {
            this.loanUUID = cookies[i].split('=')[1];
        }
        if (0 == cookies[i].indexOf('loan-' + br.bookId)) {
            this.permsToken = cookies[i].split('=')[1];
        }

        // Set olHost to use if passed in
        if (0 == cookies[i].indexOf('ol-host')) {
            br.olHost = 'https://' + unescape(cookies[i].split('=')[1]);
        }

        if (0 == cookies[i].indexOf('ol-auth-url')) {
            br.olAuthUrl = unescape(cookies[i].split('=')[1]);
        }
    }

    if (br.olAuthUrl == null) {
        br.olAuthUrl = 'https://archive.org/bookreader/BookReaderAuthProxy.php?id=XXX';
    }

    this.authUrl = br.olAuthUrl.replace("XXX", br.bookId);
    return this;
}

function add_query_param(url, name, value) {
    // Use & if the url already has some query parameters.
    // Use ? otherwise.
    var prefix = (url.indexOf("?") >= 0) ? "&" : "?";
    return url + prefix + name + "=" + value;
}

OLAuth.prototype.init = function() {
    var htmlStr =  'Checking loan status';

    this.showPopup("#F0EEE2", "#000", htmlStr, 'Please wait as we check the status of this book...');
    this.callAuthUrl();
}

OLAuth.prototype.callAuthUrl = function() {
    var authUrl = this.authUrl;

    // be sure to add random param to authUrl to avoid stale cache
    authUrl = add_query_param(authUrl, 'rand', Math.random());

    if (false !== this.loanUUID) {
        authUrl = add_query_param(authUrl, 'loan', this.loanUUID);
    }
    if (false !== this.permsToken) {
        authUrl = add_query_param(authUrl, 'token', this.permsToken);
    }
    $.ajax({url:authUrl, dataType:'jsonp', jsonpCallback:'olAuth.initCallback'});
}

OLAuth.prototype.showPopup = function(bgColor, textColor, msg, resolution) {
    this.popup = document.createElement("div");
    $(this.popup).css({
        position: 'absolute',
        top:      '50px',
        left:     ($('#BookReader').attr('clientWidth')-400)/2 + 'px',
        width:    '400px',
        padding:  "15px",
        border:   "3px double #999999",
        zIndex:   3,
        textAlign: 'center',
        backgroundColor: bgColor,
        color: textColor
    }).appendTo('#BookReader');

    this.setPopupMsg(msg, resolution);

}

OLAuth.prototype.setPopupMsg = function(msg, resolution) {
    this.popup.innerHTML = ['<p><strong>', msg, '</strong></p><p>', resolution, '</p>'].join('\n');
}

OLAuth.prototype.showError = function(msg, resolution) {
   $(this.popup).css({
        backgroundColor: "#fff",
        color: "#000"
    });

    this.setPopupMsg(msg, resolution);
}

OLAuth.prototype.initCallback = function(obj) {
    if (false == obj.success) {
        if (br.isAdmin) {
            ret = confirm("We couldn't authenticate your loan with Open Library, but since you are an administrator or uploader of this book, you can access this book for QA purposes. Would you like to QA this book?");
            if (!ret) {
                this.showError(obj.msg, obj.resolution)
            } else {
                br.init();
            }
        } else {
            this.showError(obj.msg, obj.resolution)
        }
    } else {
        //user is authenticated
        this.setCookie(obj.token);
        this.olConnect = true;
        this.startPolling();
        br.init();
    }
}

OLAuth.prototype.callback = function(obj) {
    if (false == obj.success) {
        this.showPopup("#F0EEE2", "#000", obj.msg, obj.resolution);
        clearInterval(this.poller);
        this.ttsPoller = null;
    } else {
        this.olConnect = true;
        this.setCookie(obj.token);
    }
}

OLAuth.prototype.setCookie = function(value) {
    var date = new Date();
    date.setTime(date.getTime()+(10*60*1000));  //10 min expiry
    var expiry = date.toGMTString();
    var cookie = 'loan-'+br.bookId+'='+value;
    cookie    += '; expires='+expiry;
    cookie    += '; path=/; domain=.archive.org;';
    document.cookie = cookie;
    this.permsToken = value;

    //refresh the br-loan uuid cookie with current expiry, if needed
    if (false !== this.loanUUID) {
        cookie = 'br-loan-'+br.bookId+'='+this.loanUUID;
        cookie    += '; expires='+expiry;
        cookie    += '; path=/; domain=.archive.org;';
        document.cookie = cookie;
    }
}

OLAuth.prototype.deleteCookies = function() {
    var date = new Date();
    date.setTime(date.getTime()-(24*60*60*1000));  //one day ago
    var expiry = date.toGMTString();
    var cookie = 'loan-'+br.bookId+'=""';
    cookie    += '; expires='+expiry;
    cookie    += '; path=/; domain=.archive.org;';
    document.cookie = cookie;

    cookie = 'br-loan-'+br.bookId+'=""';
    cookie    += '; expires='+expiry;
    cookie    += '; path=/; domain=.archive.org;';
    document.cookie = cookie;
}

OLAuth.prototype.startPolling = function () {
    var self = this;
    this.poller=setInterval(function(){
        if (!self.olConnect) {
          self.showPopup("#F0EEE2", "#000", 'Connection error', 'The BookReader cannot reach Open Library. This might mean that you are offline or that Open Library is down. Please check your Internet connection and refresh this page or try again later.');
          clearInterval(self.poller);
          self.ttsPoller = null;
        } else {
          self.olConnect = false;
          self.callAuthUrl();
        }
    },300000);   //five minute interval
}

br.cleanupMetadata();
if (br.olAuth) {
    var olAuth = new OLAuth();
    olAuth.init();
} else {
    br.init();
}
