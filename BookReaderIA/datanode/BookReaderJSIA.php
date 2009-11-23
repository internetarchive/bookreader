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

$id = $_REQUEST['id'];
$itemPath = $_REQUEST['itemPath'];
$subPrefix = $_REQUEST['subPrefix'];
$server = $_REQUEST['server'];

// Check if we're on a dev vhost and point to JSIA in the user's public_html on the datanode
// $$$ TODO consolidate this logic
if (strpos($_SERVER["REQUEST_URI"], "/~mang") === 0) { // Serving out of home dir
    $server .= ':80/~mang';
} else if (strpos($_SERVER["REQUEST_URI"], "/~testflip") === 0) { // Serving out of home dir
    $server .= ':80/~testflip';
}

if ($subPrefix) {
    $subItemPath = $itemPath . '/' . $subPrefix;
} else {
    $subItemPath = $itemPath . '/' . $id;
}

if ("" == $id) {
    BRFatal("No identifier specified!");
}

if ("" == $itemPath) {
    BRFatal("No itemPath specified!");
}

if ("" == $server) {
    BRFatal("No server specified!");
}

if (!preg_match("|^/[0-3]/items/{$id}$|", $itemPath)) {
    BRFatal("Bad id!");
}

// XXX check here that subitem is okay

$imageFormat = 'unknown';
$zipFile = "${subItemPath}_jp2.zip";

if (file_exists($zipFile)) {
    $imageFormat = 'jp2';
} else {
  $zipFile = "${subItemPath}_tif.zip";
  if (file_exists($zipFile)) {
    $imageFormat = 'tif';
  }
}

if ("unknown" == $imageFormat) {
  BRfatal("Unknown image format");
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
    if (1==this.mode) {
        var url = 'http://'+this.server+'/BookReader/BookReaderImages.php?zip='+this.zip+'&file='+file+'&scale='+_reduce+'&rotate='+_rotate;
    } else {
        if ('undefined' == typeof(reduce)) {
            // reduce not passed in
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
            _reduce = scale;
        }
    
        var url = 'http://'+this.server+'/BookReader/BookReaderImages.php?zip='+this.zip+'&file='+file+'&scale='+_reduce+'&rotate='+_rotate;
        
    }
    return url;
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

br.leafNumToIndex = function(leafNum) {
    var index = jQuery.inArray(leafNum, this.leafMap);
    if (-1 == index) {
        return null;
    } else {
        return index;
    }
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
br.getEmbedURL = function() {
    // We could generate a URL hash fragment here but for now we just leave at defaults
    var url = 'http://' + window.location.host + '/stream/'+this.bookId;
    if (this.subPrefix != this.bookId) { // Only include if needed
        url += '/' + this.subPrefix;
    }
    url += '?ui=embed';
    return url;
}

// getEmbedCode
//________
// Returns the embed code HTML fragment suitable for copy and paste
br.getEmbedCode = function() {
    return "<iframe src='" + this.getEmbedURL() + "' width='480px' height='430px'></iframe>";
}

br.pageW =		[
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

br.pageH =		[
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
br.zip      = '<?echo $zipFile;?>';
br.subPrefix = '<?echo $subPrefix;?>';
br.server   = '<?echo $server;?>';
br.bookTitle= '<?echo preg_replace("/\'/", "\\'", $metaData->title);?>';
br.bookPath = '<?echo $subItemPath;?>';
br.bookUrl  = '<?echo "http://www.archive.org/details/$id";?>';
br.imageFormat = '<?echo $imageFormat;?>';

<?

# Load some values from meta.xml
if ('' != $metaData->{'page-progression'}) {
  echo "br.pageProgression = '" . $metaData->{"page-progression"} . "';";
} else {
  // Assume page progression is Left To Right
  echo "br.pageProgression = 'lr';";
}

# Special cases
if ('bandersnatchhsye00scarrich' == $id) {
    echo "br.mode     = 2;\n";
    echo "br.auto     = true;\n";
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
      
<?
        //$$$mang hack to override request for 2up for books with attribution page
        //   as first page until we can display that page in 2up
        $needle = 'goog';
        if (strrpos($id, $needle) === strlen($id)-strlen($needle)) {
            print "// override for books with attribution page\n";
            print "br.mode = 1;\n";
        }
?>
    }
} // brConfig

br.cleanupMetadata();
br.init();

<?


function BRFatal($string) {
    echo "alert('$string')\n";
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

?>
