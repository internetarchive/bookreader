<?

/*
Copyright(c)2008-2010 Internet Archive. Software license AGPL version 3.

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
    
    The BookReader source is hosted at http://github.com/openlibrary/bookreader/
*/

//$env = 'LD_LIBRARY_PATH=/petabox/sw/lib/lxml/lib PYTHONPATH=/petabox/sw/lib/lxml/lib/python2.5/site-packages:$PYTHONPATH';

checkPrivs($_GET['path']);

$path     = escapeshellarg($_GET['path']);
$page     = escapeshellarg($_GET['page']);
$callback = escapeshellarg($_GET['callback']);

header('Content-Type: application/javascript');
passthru("python BookReaderGetText.py $path $page $callback");

function checkPrivs($filename) {
    if (!is_readable($filename)) {        
        header('HTTP/1.1 403 Forbidden');
        exit(0);
    }
}
?>
