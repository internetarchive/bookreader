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

$useMP3 = true;
if ('.ogg' == $_GET['format']) {
    $useMP3 = false;
}

$cmd = 'echo ' . escapeshellarg($_GET['string']);
$cmd .= ' | /petabox/sw/bin/text2wave';
if ($useMP3) {
    header('Content-Type: audio/mpeg');
    $cmd .= ' |ffmpeg -i - -f mp3 -';
} else {
    header('Content-Type: application/ogg');
    $cmd .= ' |oggenc --quiet -';
}

passthru($cmd);
?>
