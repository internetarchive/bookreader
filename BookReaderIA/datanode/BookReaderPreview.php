<?
/*

Provides access to preview images of book.  It is run with privileges and provides a reduced
access wrapper around BookReaderImages.

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

require_once('BookReaderImages.inc.php');

function BRfatal($message) {
    header("HTTP/1.0 404 Not Found");
    header("Content-type: text/plain");
    print $message;
    die(-1);
}

$allowedPages = array('title','cover','cover0','preview');
$allowedPattern = '#^(' . join('|', $allowedPages) . ')#';

$page = $_REQUEST['page'];

if (preg_match($allowedPattern, $page)) { 
    // Return image data
    $bri = new BookReaderImages();
    
    try {
        $bri->serveLookupRequest($_REQUEST);
    } catch (Exception $e) {
        header("HTTP/1.0 404 Not Found");
        header("Content-type: text/plain");
        
        print "Error serving request:\n";
        print "  " . $e->getMessage() . "\n\n";
        print "Debugging information:\n";
        echo $e->getTraceAsString();
    }
} else {
    BRfatal("Bad or no page specified");
}


?>