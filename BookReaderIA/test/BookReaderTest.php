<?php

/*
Copyright(c) 2010 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.  The full source code can be found at GitHub:
http://github.com/openlibrary/bookreader

Author:
  Michael Ang <http://github.com/mangtronix>

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

require_once('../datanode/BookReaderImages.inc.php');

try {
    switch ($_REQUEST['test']) {
        case 'pageparse':
            $bri = new BookReaderImages();
            ok('text/javascript');
            print( json_encode($bri->parsePageRequest($_REQUEST['value'], $_REQUEST['bookPrefix'])) );
            break;
            
        default:
            ok('text/html');
            print "<html><head><title>BookReader Tests</title></head>";
            print "<body>";
            print "<h1>Available tests</h1>";
            print "<pre>";
            print "<a href='BookReaderTest.php?test=pageparse&value=cover_r4.jpg'>pageparse</a> value bookPrefix";
            print "</body>";
            print "</html>";
            break;
    }
    
} catch (Exception $e) {
    print "Error serving request:\n";
    print "  " . $e->getMessage() . "\n\n";
    print "Debugging information:\n";
    echo $e->getTraceAsString();
}

function ok($type) {
    header('HTTP/1.0 200 OK');
    header('Content-type: ' . $type);
}

?>