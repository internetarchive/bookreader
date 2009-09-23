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
//$imgAspect = $_REQUEST['aspect'];
$width = $_REQUEST['width'];
$height = $_REQUEST['height'];

// $$$ escape the values

/* We assume that the print aspect ratio is somewhat close to US Letter in portrait orientation */
$paperAspect = 8.5/11;
$imgAspect = $width / $height;

// Returns (url, attrs)
function imageURL($paperAspect, $index, $format, $width, $height) {
    global $server, $id, $zip;
    
    $rotate = "0";
    $imgAspect = $width / $height;
    
    if ('jp2' == $format) {
        // Rotation is possible
        if ($imgAspect > $paperAspect) {
            $rotate = "90";
            $imgAspect = 1 / $imgAspect;
        }
    }
    
    if ($imgAspect > $paperAspect) {
        // wider than paper, fit width
        $htmlAttrs = "width='95%'";
    } else {
        // taller than paper, fit height
        $htmlAttrs = "height='95%'";
    }

    $file = sprintf("%s_%s/%s_%04d.%s", $id, $format, $id, $index, $format);
    
    $queryParams = array(
        'id' => $id, // global
        'format' => $format,
        'index' => $index,
        'file' => $file,
        'zip' => $zip, // global
        'rotate' => $rotate,
        'scale' => 1
    );

    return "<img src='http://{$server}/GnuBook/GnuBookImages.php?" . http_build_query($queryParams) . "' " . $htmlAttrs . " />";
}

echo "<html><head>";
echo '<link rel="stylesheet" type="text/css" href="GnuBook.css" />';
echo "<style type='text/css'>";
echo "  @media print { .noprint { font-size: 40pt; display: none; } }";
echo "</style>";
echo "<title>" . $id . "</title><body onload='print(); return false;'>";
echo   "<p class='noprint' style='text-align: right'><button class='GBicon rollover print' title='Print' onclick='print(); return false;'></button> <a href='#' onclick='print(); return false;'>Print</a></p>";
echo   "<p style='text-align:center;'>";
echo     imageURL($paperAspect, $index, $format, $width, $height);
echo   "</p>";

if (isset($_REQUEST['index2'])) {    
    $index2 = $_REQUEST['index2'];
    $width2 = $_REQUEST['width2'];
    $height2 = $_REQUST['height2'];
    
    
    echo "<p style='text-align: center;'>";
    echo imageURL($paperAspect, $index2, $format, $width2, $height2);
    echo "</p>";
}
echo  "</body></html>";

?>
