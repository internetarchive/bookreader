<?
/*
Copyright(c)2011 Internet Archive. Software license AGPL version 3.

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
$uuid = $_REQUEST['uuid'];
$token = $_REQUEST['token'];
$bookPath = $_REQUEST['bookPath'];

$olHost = "openlibrary.org";
if (isset($_REQUEST['olHost'])) {
    $olHost = $_REQUEST['olHost'];
}

if (!preg_match('/^\d{10}-[0-9a-f]{32}$/', $token)) {
    fatal();
}

//if (!preg_match('/^[0-9a-f]{32}$/', $uuid)) {
if (!preg_match('/^\S{1,128}$/', $uuid)) {
    fatal();
}

if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\.\-_]{1,100}$/', $id)) {
    fatal();
}

if (!preg_match("|^/stream/$id|", $bookPath)) {
    fatal();
}

setcookie('br-loan-' . $id, $uuid, 0, '/', '.archive.org');
setcookie('loan-' . $id, $token, 0, '/', '.archive.org');
setcookie('ol-host', $olHost, 0, '/', '.archive.org');

header('Location: ' . $bookPath);

function fatal() {
    echo "Malformed request.";
    die(-1);
}
?>
