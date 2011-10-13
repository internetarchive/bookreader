<?php

/*
Copyright(c) 2008-2010 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.  The full source code can be found at GitHub:
http://github.com/openlibrary/bookreader

The canonical short name of an image type is the same as in the MIME type.
For example both .jpeg and .jpg are considered to have type "jpeg" since
the MIME type is "image/jpeg".

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

// Include BookReaderImages class definition
require_once('BookReaderImages.inc.php');

// Serve request
$bri = new BookReaderImages();
try {
    if (array_key_exists('page', $_REQUEST) && $_REQUEST['page']) {
        // Need to lookup metadata
        $bri->serveLookupRequest($_REQUEST);
    } else {
        // Request should be fully qualified - no lookup needed
        $bri->serveRequest($_REQUEST);
    }
} catch (Exception $e) {
    header("HTTP/1.0 404 Not Found");
    header("Content-type: text/plain");
    
    print "Error serving request:\n";
    print "  " . $e->getMessage() . "\n\n";
    print "Debugging information:\n";
    echo $e->getTraceAsString();
}

?>