<?php

/*
Copyright(c)2008 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.

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

$MIMES = array('gif' => 'image/gif',
               'jp2' => 'image/jp2',
               'jpg' => 'image/jpeg',
               'jpeg' => 'image/jpeg',
               'png' => 'image/png',
               'tif' => 'image/tiff',
               'tiff' => 'image/tiff');
               
$EXTENSIONS = array('gif' => 'gif',
                    'jp2' => 'jp2',
                    'jpeg' => 'jpeg',
                    'jpg' => 'jpeg',
                    'png' => 'png',
                    'tif' => 'tiff',
                    'tiff' => 'tiff');
               
$exiftool = '/petabox/sw/books/exiftool/exiftool';

// Process some of the request parameters
$zipPath  = $_REQUEST['zip'];
$file     = $_REQUEST['file'];
if (isset($_REQUEST['ext'])) {
  $ext = $_REQUEST['ext'];
} else {
  // Default to jpg
  $ext = 'jpg';
}
if (isset($_REQUEST['callback'])) {
  // XXX sanitize
  $callback = $_REQUEST['callback'];
} else {
  $callback = null;
}

/*
 * Approach:
 * 
 * Get info about requested image (input)
 * Get info about requested output format
 * Determine processing parameters
 * Process image
 * Return image data
 * Clean up temporary files
 */
 
function getUnarchiveCommand($archivePath, $file)
{
    $lowerPath = strtolower($archivePath);
    if (preg_match('/\.([^\.]+)$/', $lowerPath, $matches)) {
        $suffix = $matches[1];
        
        if ($suffix == 'zip') {
            return 'unzip -p '
                . escapeshellarg($archivePath)
                . ' ' . escapeshellarg($file);
        } else if ($suffix == 'tar') {
            return '7z e -so '
                . escapeshellarg($archivePath)
                . ' ' . escapeshellarg($file);
        } else {
            BRfatal('Incompatible archive format');
        }

    } else {
        BRfatal('Bad image stack path');
    }
    
    BRfatal('Bad image stack path or archive format');
    
}

/*
 * Returns the image type associated with the file extension.
 */
function imageExtensionToType($extension)
{
    global $EXTENSIONS;
    
    if (array_key_exists($extension, $EXTENSIONS)) {
        return $EXTENSIONS[$extension];
    } else {
        BRfatal('Unknown image extension');
    }            
}

/*
 * Get the image width, height and depth from a jp2 file in zip.
 */
function getImageInfo($zipPath, $file)
{
    global $exiftool;
    
    $fileExt = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $type = imageExtensionToType($fileExt);
     
    // $$$ will exiftool work for *all* of our images?
    // BitsPerComponent present in jp2. Not present in jpeg.
    $cmd = getUnarchiveCommand($zipPath, $file)
        . ' | '. $exiftool . ' -s -s -s -ImageWidth -ImageHeight -BitsPerComponent -Colorspace -';
    exec($cmd, $output);
    
    $width = intval($output[0]);
    $height = intval($output[1]);
    preg_match('/^(\d+)/', $output[2], $groups);
    $bits = intval($groups[1]);
    $colorspace = intval($output[3]);
    
    // Format-specific overrides
    if ('jpeg' == $type) {
        // Note: JPEG may be single channel grayscale. jpegtopnm will create PGM in this case.
        $bits = 8;
    }
    
    $retval = Array('width' => $width, 'height' => $height,
        'bits' => $bits, 'type' => $type);
    
    return $retval;
}

/*
 * Output JSON given the imageInfo associative array
 */
function outputJSON($imageInfo, $callback)
{
    header('Content-type: text/plain');
    $jsonOutput = json_encode($imageInfo);
    if ($callback) {
        $jsonOutput = $callback . '(' . $jsonOutput . ');';
    }
    echo $jsonOutput;
}

// Get the image size and depth
$imageInfo = getImageInfo($zipPath, $file);

// Output json if requested
if ('json' == $ext) {
    outputJSON($imageInfo, $callback);
    exit;
}

// Unfortunately kakadu requires us to know a priori if the
// output file should be .ppm or .pgm.  By decompressing to
// .bmp kakadu will write a file we can consistently turn into
// .pnm.  Really kakadu should support .pnm as the file output
// extension and automatically write ppm or pgm format as
// appropriate.
$decompressToBmp = true;
if ($decompressToBmp) {
  $stdoutLink = '/tmp/stdout.bmp';
} else {
  $stdoutLink = '/tmp/stdout.ppm';
}

$fileExt = strtolower(pathinfo($file, PATHINFO_EXTENSION));

// Rotate is currently only supported for jp2 since it does not add server load
$allowedRotations = array("0", "90", "180", "270");
$rotate = $_REQUEST['rotate'];
if ( !in_array($rotate, $allowedRotations) ) {
    $rotate = "0";
}

// Image conversion options
$pngOptions = '';
$jpegOptions = '-quality 75';

// The pbmreduce reduction factor produces an image with dimension 1/n
// The kakadu reduction factor produceds an image with dimension 1/(2^n)

if (isset($_REQUEST['height'])) {
    $ratio = floatval($_REQUEST['origHeight']) / floatval($_REQUEST['height']);
    if ($ratio <= 2) {
        $scale = 2;
        $powReduce = 1;    
    } else if ($ratio <= 4) {
        $scale = 4;
        $powReduce = 2;
    } else {
        //$powReduce = 3; //too blurry!
        $scale = 2;
        $powReduce = 1;
    }

} else {
    $scale = $_REQUEST['scale'];
    if (1 >= $scale) {
        $scale = 1;
        $powReduce = 0;
    } else if (2 == $scale) {
        $powReduce = 1;
    } else if (4 == $scale) {
        $powReduce = 2;
    } else if (8 == $scale) {
        $powReduce = 3;
    } else if (16 == $scale) {
        $powReduce = 4;
    } else if (32 == $scale) {
        $powReduce = 5;
    } else {
        // $$$ Leaving this in as default though I'm not sure why it is...
        $scale = 8;
        $powReduce = 3;
    }
}

if (!file_exists($stdoutLink)) 
{  
  system('ln -s /dev/stdout ' . $stdoutLink);  
}


putenv('LD_LIBRARY_PATH=/petabox/sw/lib/kakadu');

$unzipCmd  = getUnarchiveCommand($zipPath, $file);
        
if ('jp2' == $fileExt) {
    $decompressCmd = 
        " | /petabox/sw/bin/kdu_expand -no_seek -quiet -reduce $powReduce -rotate $rotate -i /dev/stdin -o " . $stdoutLink;
    if ($decompressToBmp) {
        $decompressCmd .= ' | bmptopnm ';
    }
    
} else if ('tif' == $fileExt) {
    // We need to create a temporary file for tifftopnm since it cannot
    // work on a pipe (the file must be seekable).
    // We use the BookReaderTiff prefix to give a hint in case things don't
    // get cleaned up.
    $tempFile = tempnam("/tmp", "BookReaderTiff");

    $pbmReduce = reduceCommand($scale);
    
    $decompressCmd = 
        ' > ' . $tempFile . ' ; tifftopnm ' . $tempFile . ' 2>/dev/null' . $pbmReduce;
        
} else if ('jpg' == $fileExt) {
    $decompressCmd = ' | jpegtopnm ' . reduceCommand($scale);
    
} else {
    BRfatal('Unknown source file extension: ' . $fileExt);
}
       
// Non-integer scaling is currently disabled on the cluster
// if (isset($_REQUEST['height'])) {
//     $cmd .= " | pnmscale -height {$_REQUEST['height']} ";
// }

if ('jpg' == $ext) {
    $compressCmd = ' | pnmtojpeg ' . $jpegOptions;
} else if ('png' == $ext) {
    $compressCmd = ' | pnmtopng ' . $pngOptions;
}

if (($ext == $fileExt) && ($scale == 1) && ($rotate === "0")) {
    // Just pass through original data if same format and size
    $cmd = $unzipCmd;
} else {
    $cmd = $unzipCmd . $decompressCmd . $compressCmd;
}

# print $cmd;


header('Content-type: ' . $MIMES[$ext]);
header('Cache-Control: max-age=15552000');
passthru ($cmd); # cmd returns image data

if (isset($tempFile)) {
  unlink($tempFile);
}

function BRFatal($string) {
    echo "alert('$string');\n";
    die(-1);
}

// Returns true if using a power node
function onPowerNode() {
    exec("lspci | fgrep -c Realtek", $output, $return);
    if ("0" != $output[0]) {
        return true;
    } else {
        exec("egrep -q AMD /proc/cpuinfo", $output, $return);
        if ($return == 0) {
            return true;
        }
    }
    return false;
}

function reduceCommand($scale) {
    if (1 != $scale) {
        if (onPowerNode()) {
            return ' | pnmscale -reduce ' . $scale;
        } else {
            return ' | pnmscale -nomix -reduce ' . $scale;
        }
    } else {
        return '';
    }
}


?>

