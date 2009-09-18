<?
/*
Copyright(c)2008 Internet Archive. Software license AGPL version 3.

This file is part of GnuBook.

    GnuBook is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    GnuBook is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with GnuBook.  If not, see <http://www.gnu.org/licenses/>.

GnuBookPrint.php exists to get around the same-origin policy that prevents
us from calling print() on an iframe that comes from a cluster datanode.
*/

$id     = $_REQUEST['id'];
$server = $_REQUEST['server'];
$zip    = $_REQUEST['zip'];
$index  = $_REQUEST['index'];
$format = $_REQUEST['format'];
$imgAspect = $_REQUEST['aspect'];

/* We assume that the print aspect ratio is somewhat close to US Letter in portrait orientation */
$paperAspect = 8.5/11;

$rotate = "0";
if ('jp2' == $format) {
    // Rotation is possible
    if ($imgAspect > $paperAspect) {
        $rotate = "90";
        $imgAspect = 1 / $imgAspect;
    }
}

$file = sprintf("%s_%s/%s_%04d.%s", $id, $format, $id, $index, $format);

if ($imgAspect > $paperAspect) {
    // wider than paper, fit width
    $imgAttrs = "width='100%'";
} else {
    // taller than paper, fit height
    $imgAttrs = "height='100%'";
}

echo "<p style='text-align:center;'>";
echo "<img src='http://{$server}/GnuBook/GnuBookImages.php?zip={$zip}&file={$file}&scale=1&rotate=$rotate' " . $imgAttrs . " />";
echo "</p>";

?>