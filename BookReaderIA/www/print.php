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

BookReaderPrint.php exists to get around the same-origin policy that prevents
us from calling print() on an iframe that comes from a cluster datanode.
*/

$id     = $_REQUEST['id'];
$server = $_REQUEST['server'];
$zip    = $_REQUEST['zip'];
$file  = $_REQUEST['file'];
$format = $_REQUEST['format'];
//$imgAspect = $_REQUEST['aspect'];
$width = floatval($_REQUEST['width']);
$height = floatval($_REQUEST['height']);
$title = $_REQUEST['title'];

/* We assume that the print aspect ratio is somewhat close to US Letter in portrait orientation */
$paperAspect = 8.5/11;

// $$$ may want to adjust this if two page with foldout looks strange
$allowRotate = true;

// Returns (url, attrs)
function imageURL($paperAspect, $file, $format, $width, $height, $allowRotate) {
    global $server, $id, $zip;
    
    $rotate = "0";
    $imgAspect = $width / $height;
    
    if ('jp2' == $format && $allowRotate) {
        // Rotation is possible
        if ($imgAspect > $paperAspect && $imgAspect > 1) {
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
    
    $queryParams = array(
        'id' => $id, // global
        'format' => $format,
        'index' => $index,
        'file' => $file,
        'zip' => $zip, // global
        'rotate' => $rotate,
        'scale' => 1
    );

    $_server = htmlspecialchars($server);
    return "<img src='http://{$_server}/BookReader/BookReaderImages.php?" . http_build_query($queryParams) . "' " . $htmlAttrs . " />";
}

echo "<html><head>";
echo '<link rel="stylesheet" type="text/css" href="BookReader.css" />';
echo "<style type='text/css'>";
echo "  @media print { .noprint { font-size: 40pt; display: none; } }";
echo "</style>";
echo "<script type='text/javascript'>";
echo "  function conditionalPrint() {";
echo "    var doPrint = true; var agent = navigator.userAgent.toLowerCase();";
echo "    if (agent.indexOf('safari') != -1) { doPrint = false; }";
echo "    if (doPrint) { print(); }";
echo "  }";
echo "</script>";
echo "<title>" . htmlspecialchars($title) . "</title><body onload='conditionalPrint(); return false;'>";
echo   "<p class='noprint' style='text-align: right'>";
echo     "<button class='BRicon rollover print' title='Print' onclick='print(); return false;'></button> <a href='#' onclick='print(); return false;'>Print</a></p>";
echo   "<p style='text-align:center;'>";
echo     imageURL($paperAspect, $file, $format, $width, $height, $allowRotate);
echo   "</p>";

if (isset($_REQUEST['file2'])) {    
    $file2 = $_REQUEST['file2'];
    $width2 = floatval($_REQUEST['width2']);
    $height2 = floatval($_REQUEST['height2']);
    
    
    echo "<p style='text-align: center;'>";
    echo imageURL($paperAspect, $file2, $format, $width2, $height2, $allowRotate);
    echo "</p>";
}
echo  "</body></html>";

?>
