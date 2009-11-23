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

require_once '/petabox/setup.inc';

$id = $_REQUEST['id'];

if ("" == $id) {
    echo "No identifier specified!";
    die(-1);
}

$locator      = new Locator();

$results = $locator->locateUDP($id, 1, false);

$serverBaseURL = $results[0][0];

// Check if we're on a dev vhost and point to JSIA in the user's public_html on the datanode
if (preg_match("/^www-(\w+)/", $_SERVER["SERVER_NAME"], $match)) {
    // $$$ the remapping isn't totally automatic yet and requires user to
    //     ln -s ~/petabox/www/datanode/BookReader ~/public_html/BookReader
    //     so we enable it only for known hosts
    $devhosts = array('mang', 'testflip', 'rkumar');
    if (in_array($match[1], $devhosts)) {
        $serverBaseURL = $serverBaseURL . ":81/~" . $match[1];
    }
}

$url = "http://{$serverBaseURL}/BookReader/BookReaderJSIA.php?id={$id}&itemPath={$results[0][1]}&server={$serverBaseURL}";


if (("" != $results[0][0]) && ("" != $results[0][1])) {
    header("Location: $url");
}

?>