<?
/*

Provides access to preview images of book.

Michael Ang <http://github.com/mangtronix>

Copyright (c) 2010 Internet Archive. Software license AGPL version 3.

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

require_once('BookReaderMeta.inc.php');
require_once('BookReaderImages.inc.php');

function BRfatal($message) {
    header("HTTP/1.0 404 Not Found");
    header("Content-type: text/plain");
    print $message;
    die(-1);
}

$brm = new BookReaderMeta();
try {
    $metadata = $brm->buildMetadata($_REQUEST['id'], $_REQUEST['itemPath'], $_REQUEST['bookId'], $_REQUEST['server']);
} catch (Exception $e) {
    BRfatal($e->getMessage);
}

$knownPages = array('title','cover','preview');
$page = $_REQUEST['page'];
if (! in_array($page, $knownPages) ) {
    BRfatal("Bad or no page specified");
}

// Index of image to return
$imageIndex = null;

switch ($page) {
    case 'title':
        if (! array_key_exists('titleIndex', $metadata)) {
            BRfatal("No title page asserted in book");
        }
        $imageIndex = $metadata['titleIndex'];
        break;
        
    case 'cover':
        if (! array_key_exists('coverIndices', $metadata)) {
            BRfatal("No cover asserted in book");
        }
        $imageIndex = $metadata['coverIndices'][0]; // $$$ TODO add support for other covers
        break;
        
    case 'preview':
        // Preference is:
        //   Cover page if book was published >= 1950
        //   Title page
        //   Cover page
        //   Page 0
        
        /*
        header('Content-type: text/plain');
        print 'Date ' . $metadata['date'];
        print 'Year ' . $brm->parseYear($metadata['date']);
        */
 
        if ( array_key_exists('date', $metadata) && array_key_exists('coverIndices', $metadata) ) {
            if ($brm->parseYear($metadata['date']) >= 1950) {
                $imageIndex = $metadata['coverIndices'][0];                
                break;
            }
        }
        if (array_key_exists('titleIndex', $metadata)) {
            $imageIndex = $metadata['titleIndex'];
            break;
        }
        if (array_key_exists('coverIndices', $metadata)) {
            $imageIndex = $metadata['coverIndices'][0];
            break;
        }
        
        // First page
        $imageIndex = 0;
        break;
        
    default:
        // Shouldn't be possible
        BRfatal("Couldn't find page");
        break;
        
}

$leaf = $brm->leafForIndex($imageIndex, $metadata['leafNums']);

$requestEnv = array(
    'zip' => $metadata['zip'],
    'file' => $brm->imageFilePath($leaf, $metadata['bookId'], $metadata['imageFormat']),
    'ext' => 'jpg',
);

// Return image data - will check privs
$bri = new BookReaderImages();
try {
    $bri->serveRequest($requestEnv);
} catch (Exception $e) {
    header("HTTP/1.0 404 Not Found");
    header("Content-type: text/plain");
    print "Error serving request:";
    print "  " . $e->getMessage();
    print "Debugging information:";
    echo $e->getTraceAsString();
    die(-1);
}

?>