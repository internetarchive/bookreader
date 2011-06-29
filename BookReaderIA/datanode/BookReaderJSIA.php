<?
/*
Copyright(c)2008 Internet Archive. Software license AGPL version 3.

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
*/

header('Content-Type: application/javascript');

$id = $_REQUEST['id'];
$itemPath = $_REQUEST['itemPath'];
$subPrefix = $_REQUEST['subPrefix'];
$server = $_REQUEST['server'];

// $$$mang this code has been refactored into BookReaderMeta.inc.php for use e.g. by
//         BookReaderPreview.php and BookReaderImages.php.  The code below should be
//         taken out and replaced by calls into BookReaderMeta

// Check if we're on a dev vhost and point to JSIA in the user's public_html on the datanode

// $$$ TODO consolidate this logic
if (strpos($_SERVER["REQUEST_URI"], "/~mang") === 0) { // Serving out of home dir
    $server .= ':80/~mang';
} else if (strpos($_SERVER["REQUEST_URI"], "/~rkumar") === 0) { // Serving out of home dir
    $server .= ':80/~rkumar';
} else if (strpos($_SERVER["REQUEST_URI"], "/~testflip") === 0) { // Serving out of home dir
    $server .= ':80/~testflip';
}

if (! $subPrefix) {
    $subPrefix = $id;
}
$subItemPath = $itemPath . '/' . $subPrefix;

if ("" == $id) {
    BRFatal("No identifier specified!");
}

if ("" == $itemPath) {
    BRFatal("No itemPath specified!");
}

if ("" == $server) {
    BRFatal("No server specified!");
}

if (!preg_match("|^/\d+/items/{$id}$|", $itemPath)) {
    BRFatal("Bad id!");
}

// XXX check here that subitem is okay

$filesDataFile = "$itemPath/${id}_files.xml";

if (file_exists($filesDataFile)) {
    $filesData = simplexml_load_file("$itemPath/${id}_files.xml");
} else {
    BRfatal("File metadata not found!");
}

$imageStackInfo = findImageStack($subPrefix, $filesData);
if ($imageStackInfo['imageFormat'] == 'unknown') {
    BRfatal('Couldn\'t find image stack');
}

$imageFormat = $imageStackInfo['imageFormat'];
$archiveFormat = $imageStackInfo['archiveFormat'];
$imageStackFile = $itemPath . "/" . $imageStackInfo['imageStackFile'];

if ("unknown" == $imageFormat) {
  BRfatal("Unknown image format");
}

if ("unknown" == $archiveFormat) {
  BRfatal("Unknown archive format");
}


$scanDataFile = "${subItemPath}_scandata.xml";
$scanDataZip  = "$itemPath/scandata.zip";
if (file_exists($scanDataFile)) {
    $scanData = simplexml_load_file($scanDataFile);
} else if (file_exists($scanDataZip)) {
    $cmd  = 'unzip -p ' . escapeshellarg($scanDataZip) . ' scandata.xml';
    exec($cmd, $output, $retval);
    if ($retval != 0) BRFatal("Could not unzip ScanData!");
    
    $dump = join("\n", $output);
    $scanData = simplexml_load_string($dump);
} else if (file_exists("$itemPath/scandata.xml")) {
    // For e.g. Scribe v.0 books!
    $scanData = simplexml_load_file("$itemPath/scandata.xml");
} else {
    BRFatal("ScanData file not found!");
}

$metaDataFile = "$itemPath/{$id}_meta.xml";
if (!file_exists($metaDataFile)) {
    BRFatal("MetaData file not found!");
}


$metaData = simplexml_load_file($metaDataFile);

//$firstLeaf = $scanData->pageData->page[0]['leafNum'];
?>

// Error reporting - this helps us fix errors quickly
function logError(description,page,line) {
    if (typeof(archive_analytics) != 'undefined') {
        var values = {
            'bookreader': 'error',
            'description': description,
            'page': page,
            'line': line,
            'itemid': '<?echo $id;?>',
            'subPrefix': '<?echo $subPrefix;?>',
            'server': '<?echo $server;?>',
            'bookPath': '<?echo $subItemPath;?>'
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
        
        var qs = archive_analytics.format_bug(values);

        var error_img = new Image(100,25);
        error_img.src = archive_analytics.img_src + "?" + qs;
    }

    return false; // allow browser error handling so user sees there was a problem
}
window.onerror=logError;

br = new BookReader();

<?
/* Output title leaf if marked */
$titleLeaf = '';
foreach ($scanData->pageData->page as $page) {
    if (("Title Page" == $page->pageType) || ("Title" == $page->pageType)) {
        $titleLeaf = "{$page['leafNum']}";
        break;
    }
}
    
if ('' != $titleLeaf) {
    printf("br.titleLeaf = %d;\n", $titleLeaf);
}
?>

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
    return 'http://'+this.server+'/BookReader/BookReaderImages.php?zip='+this.zip+'&file='+file+'&scale='+_reduce+'&rotate='+_rotate;
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
    
    return 'http://'+this.server+'/BookReader/BookReaderImages.php?id=' + this.bookId + '&itemPath=' + itemPath + '&server=' + this.server + '&subPrefix=' + this.subPrefix + '&page=' +page + '.jpg';
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
    
    <? // Use special function if we should infer the page sides based off the title page index
    if (preg_match('/goog$/', $id) && ('' != $titleLeaf)) {
    ?>
    // assume page side based on title pagex
    var titleIndex = br.leafNumToIndex(br.titleLeaf);
    // assume title page is RHS
    var delta = titleIndex - index;
    if (0 == (delta & 0x1)) {
        // even delta
        return 'R';
    } else {
        return 'L';
    }
    <?
    }
    ?>
    
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
    var url = 'http://' + window.location.host + '/stream/'+this.bookId;
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

br.buildInfoDiv = function(jInfoDiv) {
    // $$$ it might make more sense to have a URL on openlibrary.org that returns this info

    var escapedTitle = BookReader.util.escapeHTML(this.bookTitle);
    var domainRe = /(\w+\.(com|org))/;
    var domainMatch = domainRe.exec(this.bookUrl);
    var domain = this.bookUrl;
    if (domainMatch) {
        domain = domainMatch[1];
    }
       
    // $$$ cover looks weird before it loads
    jInfoDiv.find('.BRfloatCover').append([
                    '<div style="height: 140px; min-width: 80px; padding: 0; margin: 0;"><a href="', this.bookUrl, '"><img src="http://www.archive.org/download/', this.bookId, '/page/cover_t.jpg" alt="' + escapedTitle + '" height="140px" /></a></div>'].join('')
    );

    jInfoDiv.find('.BRfloatMeta').append([
                    // $$$ description
                    //'<p>Published ', this.bookPublished,
                    //, <a href="Open Library Publisher Page">Publisher name</a>',
                    //'</p>',
                    //'<p>Written in <a href="Open Library Language page">Language</a></p>',
                    '<h3>Other Formats</h3>',
                    '<ul class="links">',
                        '<li><a href="http://www.archive.org/download/', this.bookId, '/', this.subPrefix, '.pdf">PDF</a><span>|</span></li>',
                        '<li><a href="http://www.archive.org/download/', this.bookId, '/', this.subPrefix, '_djvu.txt">Plain Text</a><span>|</span></li>',
                        '<li><a href="http://www.archive.org/download/', this.bookId, '/', this.subPrefix, '_daisy.zip">DAISY</a><span>|</span></li>',
                        '<li><a href="http://www.archive.org/download/', this.bookId, '/', this.subPrefix, '.epub">ePub</a><span>|</span></li>',
                        '<li><a href="https://www.amazon.com/gp/digital/fiona/web-to-kindle?clientid=IA&itemid=', this.bookId, '&docid=', this.subPrefix, '">Send to Kindle</a></li>',
                    '</ul>',
                    '<p class="moreInfo"><span></span>More information on <a href="'+ this.bookUrl + '">' + domain + '</a>  </p>'].join('\n'));
                    
    jInfoDiv.find('.BRfloatFoot').append([
                '<span>|</span>',                
                '<a href="http://openlibrary.org/contact" class="problem">Report a problem</a>',
    ].join('\n'));
                
    if (domain == 'archive.org') {
        jInfoDiv.find('.BRfloatMeta p.moreInfo span').css(
            {'background': 'url(http://www.archive.org/favicon.ico) no-repeat', 'width': 22, 'height': 18 }
        );
    }
    
    jInfoDiv.find('.BRfloatTitle a').attr({'href': this.bookUrl, 'alt': this.bookTitle}).text(this.bookTitle);
    var bookPath = (window.location + '').replace('#','%23');
    jInfoDiv.find('a.problem').attr('href','http://openlibrary.org/contact?path=' + bookPath);

}

br.pageW =  [
            <?
            $i=0;
            foreach ($scanData->pageData->page as $page) {
                if (shouldAddPage($page)) {
                    if(0 != $i) echo ",";   //stupid IE
                    echo "{$page->cropBox->w}";
                    $i++;
                }
            }
            ?>
            ];

br.pageH =  [
            <?
            $totalHeight = 0;
            $i=0;            
            foreach ($scanData->pageData->page as $page) {
                if (shouldAddPage($page)) {
                    if(0 != $i) echo ",";   //stupid IE                
                    echo "{$page->cropBox->h}";
                    $totalHeight += intval($page->cropBox->h/4) + 10;
                    $i++;
                }
            }
            ?>
            ];
br.leafMap = [
            <?
            $i=0;
            foreach ($scanData->pageData->page as $page) {
                if (shouldAddPage($page)) {
                    if(0 != $i) echo ",";   //stupid IE
                    echo "{$page['leafNum']}";
                    $i++;
                }
            }
            ?>    
            ];

br.pageNums = [
            <?
            $i=0;
            foreach ($scanData->pageData->page as $page) {
                if (shouldAddPage($page)) {
                    if(0 != $i) echo ",";   //stupid IE                
                    if (array_key_exists('pageNumber', $page) && ('' != $page->pageNumber)) {
                        echo "'{$page->pageNumber}'";
                    } else {
                        echo "null";
                    }
                    $i++;
                }
            }
            ?>    
            ];
            
      
br.numLeafs = br.pageW.length;

br.bookId   = '<?echo $id;?>';
br.zip      = '<?echo $imageStackFile;?>';
br.subPrefix = '<?echo $subPrefix;?>';
br.server   = '<?echo $server;?>';
br.bookTitle= '<?echo preg_replace("/\'/", "\\'", $metaData->title);?>';
br.bookPath = '<?echo $subItemPath;?>';
br.bookUrl  = '<?echo "http://www.archive.org/details/$id";?>';
br.imageFormat = '<?echo $imageFormat;?>';
br.archiveFormat = '<?echo $archiveFormat;?>';

<?

# Load some values from meta.xml
if ('' != $metaData->{'page-progression'}) {
  echo "br.pageProgression = '" . $metaData->{"page-progression"} . "';\n";
} else {
  // Assume page progression is Left To Right
  echo "br.pageProgression = 'lr';\n";
}

$useOLAuth = false;
$protected = false;
foreach ($metaData->xpath('//collection') as $collection) {
    if('browserlending' == $collection) {
        $useOLAuth = true;
        $protected = true;
    }
}

echo "br.olHost = 'http://openlibrary.org';\n";
#echo "br.olHost = 'http://mang-dev.us.archive.org:8080';\n";

if ($useOLAuth) {
    echo "br.olAuth = true;\n";
} else {
    echo "br.olAuth = false;\n";
}

if ($protected) {
    echo "br.protected = true;\n";
}

# Default options for BookReader
if ('' != $metaData->{'bookreader-defaults'}) {
    echo "br.defaults = '" . $metaData->{'bookreader-defaults'} . "';\n";
}

?>

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
            br.olHost = 'http://' + unescape(cookies[i].split('=')[1]);
        }
    }

    this.authUrl = br.olHost + '/ia_auth/' + br.bookId;

    return this;
}

OLAuth.prototype.init = function() {
    var htmlStr =  'Checking loan status with Open Library';

    this.showPopup("#F0EEE2", "#000", htmlStr, 'Please wait as we check the status of this book...');
    var authUrl = this.authUrl+'?rand='+Math.random();
    if (false !== this.loanUUID) {
        authUrl += '&loan='+this.loanUUID
    }
    if (false !== this.permsToken) {
        authUrl += '&token='+this.permsToken
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
          //be sure to add random param to authUrl to avoid stale cache
          var authUrl = self.authUrl+'?rand='+Math.random();
          if (false !== self.loanUUID) {
              authUrl += '&loan='+self.loanUUID
          }
          if (false !== self.permsToken) {
              authUrl += '&token='+self.permsToken
          }

          $.ajax({url:authUrl, dataType:'jsonp', jsonpCallback:'olAuth.callback'});
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
<?


function BRFatal($string) {
    // log error
    ?>
    
    if (typeof(archive_analytics) != 'undefined') {
        var values = {
            'bookreader': 'fatal',
            'description': "<? echo $string; ?>",
            'itemid': "<? echo $_REQUEST['id']; ?>",
            'server': "<? echo $_REQUEST['server']; ?>",
            'request_uri': "<? echo $_SERVER["REQUEST_URI"]; ?>"
        }
        
        if (document.referrer == '') {
            values['referrer'] = '-';
        } else {
            values['referrer'] = document.referrer;
        }
        
        var qs = archive_analytics.format_bug(values);

        var error_img = new Image(100,25);
        error_img.src = archive_analytics.img_src + "?" + qs;
    }

    alert("<? echo $string;?>");
    
    <?
    
    die(-1);
}

// Returns true if a page should be added based on it's information in
// the metadata
function shouldAddPage($page) {
    // Return false only if the page is marked addToAccessFormats false.
    // If there is no assertion we assume it should be added.
    if (isset($page->addToAccessFormats)) {
        if ("false" == strtolower(trim($page->addToAccessFormats))) {
            return false;
        }
    }
    
    return true;
}

// Returns { 'imageFormat' => , 'archiveFormat' => '} given a sub-item prefix and loaded xml data
function findImageStack($subPrefix, $filesData) {

    // $$$ The order of the image formats determines which will be returned first
    $imageFormats = array('JP2' => 'jp2', 'TIFF' => 'tif', 'JPEG' => 'jpg');
    $archiveFormats = array('ZIP' => 'zip', 'Tar' => 'tar');
    $imageGroup = implode('|', array_keys($imageFormats));
    $archiveGroup = implode('|', array_keys($archiveFormats));
    // $$$ Currently only return processed images
    $imageStackRegex = "/Single Page (Processed) (${imageGroup}) (${archiveGroup})/";
        
    foreach ($filesData->file as $file) {        
        if (strpos($file['name'], $subPrefix) === 0) { // subprefix matches beginning
            if (preg_match($imageStackRegex, $file->format, $matches)) {
            
                // Make sure we have a regular image stack
                $imageFormat = $imageFormats[$matches[2]];
                if (strpos($file['name'], $subPrefix . '_' . $imageFormat) === 0) {            
                    return array('imageFormat' => $imageFormat,
                                 'archiveFormat' => $archiveFormats[$matches[3]],
                                 'imageStackFile' => $file['name']);
                }
            }
        }
    }
    
    return array('imageFormat' => 'unknown', 'archiveFormat' => 'unknown', 'imageStackFile' => 'unknown');
        
}

?>

