<?
/*

Builds metadata about a book on the Internet Archive in json(p) format so that the book
can be accessed by other software including the Internet Archive BookReader.

Michael Ang <http://github.com/mangtronix>

Copyright (c) 2008-2010 Internet Archive. Software license AGPL version 3.

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

// Builds metadata object (to be encoded as JSON)
function buildMetadata() {
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

    $response = array();
    
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
    
    /* Find pages by type */
    $titleLeaf = '';
    $coverLeafs = array();
    foreach ($scanData->pageData->page as $page) {
        if (("Title Page" == $page->pageType) || ("Title" == $page->pageType)) {
            if ('' != $titleLeaf) {
                // not already set
                $titleLeaf = "{$page['leafNum']}";
            }
        }
        
        if (('Cover' == $page->pageType) || ('Cover Page' == $page->pageType)) {
            array_push($coverLeafs, $page['leafNum']);
        }
    }
    
    // These arrays map accessible page index numbers to width, height, scanned leaf numbers
    // and page number strings (NB: these may not be unique)
    $pageWidths = array();
    $pageHeights = array();
    $leafNums = array();
    $i=0;
    $totalHeight = 0;
    foreach ($scanData->pageData->page as $page) {
        if (shouldAddPage($page)) {
            $pageWidths[$i] = intval($page->cropBox->w);
            $pageHeight[$i] = intval($page->cropBox->h);
            $totalHeight += intval($page->cropBox->h/4) + 10;
            $leafNums[$i] = intval($page['leafNum']);
            $pageNums[$i] = $page->pageNumber . '';
            $i++;
        }
    }
            
    # Load some values from meta.xml
    $pageProgression = 'lr'; // default
    if ('' != $metaData->{'page-progression'}) {
      $pageProgression = $metaData->{"page-progression"};
    }
    
    // General metadata
    $response['title'] = $metaData->title . ''; // XXX renamed
    $response['numPages'] = count($pageNums); // XXX renamed    
    if ('' != $titleLeaf) {
        $response['titleLeaf'] = $titleLeaf; // XXX change to titleIndex - do leaf mapping here
        $titleIndex = indexForLeaf($titleLeaf, $leafNums);
        if ($titleIndex !== NULL) {
            $response['titleIndex'] = intval($titleIndex);
        }
    }
    $response['url'] = "http://www.archive.org/details/$id";
    $response['pageProgression'] = $pageProgression . '';
    $response['pageWidths'] = $pageWidths;
    $response['pageHeights'] = $pageHeights;
    $response['pageNums'] = $pageNums;
    
    // Internet Archive specific
    $response['itemId'] = $id; // XXX renamed
    $response['bookId'] = $subPrefix;  // XXX renamed
    $response['zip'] = $imageStackFile;
    $response['server'] = $server;
    $response['imageFormat'] = $imageFormat;
    $response['archiveFormat'] = $archiveFormat;
    $response['leafNums'] = $leafNums;
    
    // URL to title image
    if ('' != $titleLeaf) {
        $response['titleImage'] = imageURL($titleLeaf, $response);
    }
    
    if (count($coverLeafs) > 0) {
        $coverIndices = array();
        $coverImages = array();
        foreach ($coverLeafs as $key => $leafNum) {
            array_push($coverIndices, indexForLeaf($leafNum, $leafNums));
            array_push($coverImages, imageUrl($leafNum, $response));
        }
        
        $response['coverIndices'] = $coverIndices;
        $response['coverImages'] = $coverImages;
    }
    
    return $response;
}

function emitResponse($metadata) {
    $callback = $_REQUEST['callback'];
    
    $contentType = 'application/json'; // default
    if ($callback) {
        if (! isValidCallback($callback) ) {
            BRfatal("Invalid callback");
        }
        $contentType = 'text/javascript'; // JSONP is not JSON
    }
    
    header('Content-type: ' . $contentType . ';charset=UTF-8');
    header('Access-Control-Allow-Origin: *'); // allow cross-origin requests
    
    if ($callback) {
        print $callback . '( ';
    }
    print json_encode($metadata);
    if ($callback) {
        print ' );';
    }
}

function BRFatal($string) {
    // $$$ TODO log error
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

function isValidCallback($identifier) {
    $pattern = '/^[a-zA-Z_$][a-zA-Z0-9_$]*$/';
    return preg_match($pattern, $identifier) == 1;
}

function indexForLeaf($leafNum, $leafNums) {
    $key = array_search($leafNum, $leafNums);
    if ($key === FALSE) {
        return NULL;
    } else {
        return $key;
    }
}

function imageURL($leafNum, $metadata, $scale, $rotate) {
    // "Under the hood", non-public, dynamically changing (achtung!) image URLs currently look like:
    // http://{server}/BookReader/BookReaderImages.php?zip={zipPath}&file={filePath}&scale={scale}&rotate={rotate}
    // e.g. http://ia311213.us.archive.org/BookReader/BookReaderImages.php?zip=/0/items/coloritsapplicat00andriala/coloritsapplicat00andriala_jp2.zip&file=coloritsapplicat00andriala_jp2/coloritsapplicat00andriala_0009.jp2&scale=8&rotate=0
    

    $filePath = imageFilePath($leafNum, $metadata['bookId'], $metadata['imageFormat']);
    $url = 'http://' . $metadata['server'] . '/BookReader/BookReaderImages.php?zip=' . $metadata['zip'] . '&file=' . $filePath;
    
    if (defined($scale)) {
        $url .= '&scale=' . $scale;
    }
    if (defined($rotate)) {
        $url .= '&rotate=' . $rotate;
    }
    
    return $url;
}

function imageFilePath($leafNum, $bookId, $format) {
    return sprintf("%s_%s/%s_%04d.%s", $bookId, $format, $bookId, intval($leafNum), $format);
}

// Here we go
emitResponse(buildMetadata());

?>
