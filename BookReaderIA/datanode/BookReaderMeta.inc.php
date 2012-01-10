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

class BookReaderMeta {

    // Fields from _meta.xml to add to response (if present)
    var $metaFields = array(
        'title' => 'title',
        'author' => 'author',
        'publisher' => 'publisher',
        'date' => 'date',
        'language' => 'language',
        'contributor' => 'contributor',
        'collection' => 'collection',
        'page-progression' => 'pageProgression',
        'ppi' => 'ppi',
    );
    
    var $metaDefaults = array(
        'pageProgression' => 'lr',
    );
    
    // Stash spot for callback data... where are closures when we need them?
    static $cbData = NULL;

    // Builds metadata object (to be encoded as JSON)
    function buildMetadata($id, $itemPath, $subPrefix, $server) {
    
        $response = array();
        
        if ("" == $id) {
            $this->BRFatal("No identifier specified!");
        }
        
        if ("" == $itemPath) {
            $this->BRFatal("No itemPath specified!");
        }
        
        if ("" == $server) {
            $this->BRFatal("No server specified!");
        }
        
        if (!preg_match("|^/\d+/items/{$id}$|", $itemPath)) {
            $this->BRFatal("Bad id!");
        }
        
        $filesDataFile = "$itemPath/${id}_files.xml";
        
        if (file_exists($filesDataFile)) {
            $filesData = simplexml_load_file("$itemPath/${id}_files.xml");
        } else {
            $this->BRfatal("File metadata not found!");
        }
        
        $imageStackInfo = $this->findImageStack($subPrefix, $filesData);
        if ($imageStackInfo['imageFormat'] == 'unknown') {
            $this->BRfatal('Couldn\'t find image stack');
        }
        // Update subPrefix -> may have been autodetected
        $subPrefix = $imageStackInfo['subPrefix'];
        $subItemPath = $itemPath . '/' . $subPrefix;

        
        $imageFormat = $imageStackInfo['imageFormat'];
        $archiveFormat = $imageStackInfo['archiveFormat'];
        $imageStackFile = $itemPath . "/" . $imageStackInfo['imageStackFile'];
        
        if ("unknown" == $imageFormat) {
          $this->BRfatal("Unknown image format");
        }
        
        if ("unknown" == $archiveFormat) {
          $this->BRfatal("Unknown archive format");
        }
        
        
        $scanDataFile = "${subItemPath}_scandata.xml";
        $scanDataZip  = "$itemPath/scandata.zip";
        if (file_exists($scanDataFile)) {
            $this->checkPrivs($scanDataFile);
            $scanData = simplexml_load_file($scanDataFile);
        } else if (file_exists($scanDataZip)) {
            $this->checkPrivs($scanDataZip);
            $cmd  = 'unzip -p ' . escapeshellarg($scanDataZip) . ' scandata.xml';
            exec($cmd, $output, $retval);
            if ($retval != 0) {
                $this->BRFatal("Could not unzip ScanData!");
            }
            
            $dump = join("\n", $output);
            $scanData = simplexml_load_string($dump);
        } else if (file_exists("$itemPath/scandata.xml")) {
            // For e.g. Scribe v.0 books!
            $scanData = simplexml_load_file("$itemPath/scandata.xml");
        } else {
            $this->BRFatal("ScanData file not found!");
        }
        
        $metaDataFile = "$itemPath/{$id}_meta.xml";
        if (!file_exists($metaDataFile)) {
            $this->BRFatal("MetaData file not found!");
        }
        
        
        $metaData = simplexml_load_file($metaDataFile);
        
        /* Find pages by type */
        $titleLeaf = '';
        $coverLeafs = array();
        foreach ($scanData->pageData->page as $page) {
            if (("Title Page" == $page->pageType) || ("Title" == $page->pageType)) {
                if ('' == $titleLeaf) {
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
            if ($this->shouldAddPage($page)) {
                $pageWidths[$i] = intval($page->cropBox->w);
                $pageHeights[$i] = intval($page->cropBox->h);
                $totalHeight += intval($page->cropBox->h/4) + 10;
                $leafNums[$i] = intval($page['leafNum']);
                $pageNums[$i] = $page->pageNumber . '';
                $i++;
            }
        }
                
        # Load some values from meta.xml
        foreach ($this->metaFields as $srcName => $destName) {
            if ($metaData->{$srcName}) {
                $response[$destName] = $metaData->{$srcName} . '';
            } else {
                if (array_key_exists($destName, $this->metaDefaults)) {
                    $response[$destName] = $this->metaDefaults[$destName];
                }
            }
        }
        
        // General metadata
        $response['numPages'] = count($pageNums); // $$$ renamed    
        if ('' != $titleLeaf) {
            $response['titleLeaf'] = $titleLeaf; // $$$ change to titleIndex - do leaf mapping here
            $titleIndex = $this->indexForLeaf($titleLeaf, $leafNums);
            if ($titleIndex !== NULL) {
                $response['titleIndex'] = intval($titleIndex);
            }
        }
        $response['url'] = "http://www.archive.org/details/$id";
        $response['pageWidths'] = $pageWidths;
        $response['pageHeights'] = $pageHeights;
        $response['pageNums'] = $pageNums;
        
        // Internet Archive specific
        $response['itemId'] = $id; // $$$ renamed
        $response['subPrefix'] = $subPrefix;  // $$$ renamed
        $response['itemPath'] = $itemPath;
        $response['zip'] = $imageStackFile;
        $response['server'] = $server;
        $response['imageFormat'] = $imageFormat;
        $response['archiveFormat'] = $archiveFormat;
        $response['leafNums'] = $leafNums;
        $response['previewImage'] = $this->previewURL('preview', $response);
        
        // URL to title image
        if ('' != $titleLeaf) {
            $response['titleImage'] = $this->previewURL('title', $response);
        }
        
        if (count($coverLeafs) > 0) {
            $coverIndices = array();
            $coverImages = array();
            foreach ($coverLeafs as $key => $leafNum) {
                array_push($coverIndices, $this->indexForLeaf($leafNum, $leafNums));
                // $$$ TODO use preview API once it supports multiple covers
                array_push($coverImages, $this->imageUrl($leafNum, $response));
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
            if (! $this->isValidCallback($callback) ) {
                $this->BRfatal("Invalid callback");
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
        throw new Exception("Metadata error: $string");
        //echo "alert('$string');\n";
        //die(-1);
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
        
        // The order of the image formats determines which will be returned first
        $imageFormats = array('JP2' => 'jp2', 'TIFF' => 'tif', 'JPEG' => 'jpg');
        $imageFormatOrder = array_values($imageFormats);
        $archiveFormats = array('ZIP' => 'zip', 'Tar' => 'tar');
        $imageGroup = implode('|', array_keys($imageFormats));
        $archiveGroup = implode('|', array_keys($archiveFormats));
        // $$$ Currently only return processed images
        $imageStackRegex = "/Single Page (Processed) (${imageGroup}) (${archiveGroup})/";

        // Strategy:
        //   - Find potential image stacks, regardless of subPrefix
        //   - If not given subPrefix sort based on potential subPrefix and assign based on asciibetical first
        //   - Filter results by subPrefix
        //   - Sort based on image format
        //   - Take best match

        $imageStacks = array();
        foreach ($filesData->file as $file) {
            if ( preg_match($imageStackRegex, $file->format, $matches) === 1 ) {
                $imageFormat = $imageFormats[$matches[2]];
                $archiveFormat = $archiveFormats[$matches[3]];
                $imageStackFile = $file['name'] . '';
                
                if ( preg_match("#(.*)_${imageFormat}\.${archiveFormat}#", $imageStackFile, $matches) === 0) {
                    // stack filename not regular
                    continue;
                } else {
                    array_push($imageStacks, array(
                                                'imageFormat' => $imageFormat,
                                                'archiveFormat' => $archiveFormat,
                                                'imageStackFile' => $imageStackFile,
                                                'subPrefix' => $matches[1])
                    );
                }

            }
        }

        // print("<pre>");
        // print("found subPrefix $subPrefix\n");
        // print_r($imageStacks);
        // die(0);
        
        function subPrefixSort($imageStackA, $imageStackB) {
            return strcmp($imageStackA['subPrefix'], $imageStackB['subPrefix']);
        }
        if (! $subPrefix) {
            usort($imageStacks, 'subPrefixSort');
            $subPrefix = $imageStacks[0]['subPrefix'];
        }
        
        self::$cbData = $subPrefix;
        function subPrefixFilter($imageStack) {
            return $imageStack['subPrefix'] == BookReaderMeta::$cbData;
        }
        $imageStacks = array_filter($imageStacks, 'subPrefixFilter');
                
        function formatSort($imageStackA, $imageStackB) {
            $formatA = $imageStackA['imageFormat'];
            $formatB = $imageStackB['imageFormat'];
            if ($formatA == $formatB) {
                return 0;
            }
            
            $indexA = array_search($formatA, $imageFormatOrder);
            $indexB = array_search($formatB, $imageFormatOrder);
            // We already matched base on format, so both indices should be set
            if ($indexA == $indexB) {
                return 0;
            }
            return ($indexA < $indexB) ? 1 : -1;
        }
        usort($imageStacks, 'formatSort'); // necessary to remap keys
        
        if ( count($imageStacks) > 0 ) {
            return $imageStacks[0];
        } else {
            return array('imageFormat' => 'unknown', 'archiveFormat' => 'unknown', 'imageStackFile' => 'unknown');
        }
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
    
    function leafForIndex($index, $leafNums) {
        return $leafNums[$index]; // $$$ todo change to instance variables
    }
    
    function imageURL($leafNum, $metadata, $scale = null, $rotate = null) {
        // "Under the hood", non-public, dynamically changing (achtung!) image URLs currently look like:
        // http://{server}/BookReader/BookReaderImages.php?zip={zipPath}&file={filePath}&scale={scale}&rotate={rotate}
        // e.g. http://ia311213.us.archive.org/BookReader/BookReaderImages.php?zip=/0/items/coloritsapplicat00andriala/coloritsapplicat00andriala_jp2.zip&file=coloritsapplicat00andriala_jp2/coloritsapplicat00andriala_0009.jp2&scale=8&rotate=0
        
    
        $filePath = $this->imageFilePath($leafNum, $metadata['subPrefix'], $metadata['imageFormat']);
        $url = 'http://' . $metadata['server'] . '/BookReader/BookReaderImages.php?zip=' . $metadata['zip'] . '&file=' . $filePath;
        
        if ($scale !== null) {
            $url .= '&scale=' . $scale;
        }
        if ($rotate !== null) {
            $url .= '&rotate=' . $rotate;
        }
        
        return $url;
    }
    
    // $$$ move inside BookReaderPreview
    function previewURL($page, $metadata) {
        $query = array(
            'id' => $metadata['itemId'],
            'subPrefix' => $metadata['subPrefix'],
            'itemPath' => $metadata['itemPath'],
            'server' => $metadata['server'],
            'page' => $page,
        );
        
        return 'http://' . $metadata['server'] . '/BookReader/BookReaderPreview.php?' . http_build_query($query, '', '&');
    }
    
    function imageFilePath($leafNum, $subPrefix, $format) {
        $pathParts = pathinfo($subPrefix);
        $almostIdentifier = $pathParts['basename'];
        return sprintf("%s_%s/%s_%04d.%s", $almostIdentifier, $format, $almostIdentifier, intval($leafNum), $format);
    }
    
    // Parse date from _meta.xml to integer
    function parseYear($dateFromMetaXML) {
        // grab the first run of digits
        if (preg_match('|(\d+)|', $dateFromMetaXML, $matches)) {
            return (int)$matches[1];
        }
        return null;
    }
    
    function processRequest($requestEnv) {
        $id = $requestEnv['itemId']; // $$$ renamed
        $itemPath = $requestEnv['itemPath'];
        $subPrefix = $requestEnv['subPrefix']; // $$$ renamed
        $server = $requestEnv['server'];
        
        // Check if we're on a dev vhost and point to JSIA in the user's public_html on the datanode
        // $$$ TODO consolidate this logic
        $devHosts = array('testflip', 'rkumar', 'mang');
        foreach ($devHosts as $host) {
            if (strpos($_SERVER["REQUEST_URI"], '/~' . $host) === 0) { // Serving out of home dir
                $server .= ':80/' . $host;
            }
        }
        
        $this->emitResponse( $this->buildMetadata($id, $itemPath, $subPrefix, $server) );
    }
    
    function checkPrivs($filename) {
        if (!is_readable($filename)) {
            header('HTTP/1.1 403 Forbidden');
            exit(0);
        }
    }

}

?>
