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
    print $message;
    exit();
}

$brm = new BookReaderMeta();
$metadata = $brm->buildMetadata($_REQUEST['id'], $_REQUEST['itemPath'], $_REQUEST['bookId'], $_REQUEST['server']);

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
        //   Title page
        //   Cover page
        //   Page 0
        if (array_key_exists('titleIndex', $metadata)) {
            $imageIndex = $metadata['titleIndex'];
        } else if (array_key_exists('coverIndices', $metadata)) {
            $imageIndex = $metadata['coverIndices'][0];
        } else {
            $imageIndex = 0;
        }
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
    'reduce' => 2, // XXX
);

// Return image data - will check privs
$bri = new BookReaderImages();
$bri->serveRequest($requestEnv);

?>