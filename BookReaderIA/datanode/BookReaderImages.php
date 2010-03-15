<?php

/*
Copyright(c) 2008-2010 Internet Archive. Software license AGPL version 3.

This file is part of BookReader.  The full source code can be found at GitHub:
http://github.com/openlibrary/bookreader

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
               
// Paths to command-line tools
$exiftool = '/petabox/sw/books/exiftool/exiftool';
$kduExpand = '/petabox/sw/bin/kdu_expand';

// Process some of the request parameters
$zipPath  = $_REQUEST['zip'];
$file     = $_REQUEST['file'];
if (isset($_REQUEST['ext'])) {
    $ext = $_REQUEST['ext'];
} else {
    // Default to jpg
    $ext = 'jpeg';
}
if (isset($_REQUEST['callback'])) {
    // validate callback is valid JS identifier (only)
    $callback = $_REQUEST['callback'];
    $identifierPatt = '/^[[:alpha:]$_]([[:alnum:]$_])*$/';
    if (! preg_match($identifierPatt, $callback)) {
        BRfatal('Invalid callback');
    }
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
 * Get the image information.  The returned associative array fields will
 * vary depending on the image type.  The basic keys are width, height, type
 * and bits.
 */
function getImageInfo($zipPath, $file)
{
    return getImageInfoFromExif($zipPath, $file); // this is fast
    
    /*
    $fileExt = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    $type = imageExtensionToType($fileExt);
    
    switch ($type) {
        case "jp2":
            return getImageInfoFromJp2($zipPath, $file);
            
        default:
            return getImageInfoFromExif($zipPath, $file);
    }
    */
}

// Get the records of of JP2 as returned by kdu_expand
function getJp2Records($zipPath, $file)
{
    global $kduExpand;
    
    $cmd = getUnarchiveCommand($zipPath, $file)
             . ' | ' . $kduExpand
             . ' -no_seek -quiet -i /dev/stdin -record /dev/stdout';
    exec($cmd, $output);
    
    $records = Array();
    foreach ($output as $line) {
        $elems = explode("=", $line, 2);
        if (1 == count($elems)) {
            // delimiter not found
            continue;
        }
        $records[$elems[0]] = $elems[1];
    }
    
    return $records;
}

/*
 * Get the image width, height and depth using the EXIF information.
 */
function getImageInfoFromExif($zipPath, $file)
{
    global $exiftool;
    
    // We look for all the possible tags of interest then act on the
    // ones presumed present based on the file type
    $tagsToGet = ' -ImageWidth -ImageHeight -FileType'        // all formats
                 . ' -BitsPerComponent -ColorSpace'          // jp2
                 . ' -BitDepth'                              // png
                 . ' -BitsPerSample';                        // tiff
                        
    $cmd = getUnarchiveCommand($zipPath, $file)
        . ' | '. $exiftool . ' -S -fast' . $tagsToGet . ' -';
    exec($cmd, $output);
    
    $tags = Array();
    foreach ($output as $line) {
        $keyValue = explode(": ", $line);
        $tags[$keyValue[0]] = $keyValue[1];
    }
    
    $width = intval($tags["ImageWidth"]);
    $height = intval($tags["ImageHeight"]);
    $type = strtolower($tags["FileType"]);
    
    switch ($type) {
        case "jp2":
            $bits = intval($tags["BitsPerComponent"]);
            break;
        case "tiff":
            $bits = intval($tags["BitsPerSample"]);
            break;
        case "jpeg":
            $bits = 8;
            break;
        case "png":
            $bits = intval($tags["BitDepth"]);
            break;
        default:
            BRfatal("Unsupported image type");
            break;
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
    // $$$ we should determine the output size first based on requested scale
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
// $$$ handle continuous values for scale
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
    // $$$ could be cleaner
    $scale = intval($_REQUEST['scale']);
    if (1 >= $scale) {
        $scale = 1;
        $powReduce = 0;
    } else if (2 > $scale) {
        $powReduce = 0;
        $scale = 1;
    } else if (4 > $scale) {
        $powReduce = 1;
        $scale = 2;
    } else if (8 > $scale) {
        $powReduce = 2;
        $scale = 4;
    } else if (16 > $scale) {
        $powReduce = 3;
        $scale = 8;
    } else if (32 > $scale) {
        $powReduce = 4;
        $scale = 16;
    } else if (64 > $scale) {
        $powReduce = 5;
        $scale = 32;
    } else {
        // $$$ Leaving this in as default though I'm not sure why it is...
        $scale = 8;
        $powReduce = 3;
    }
}

// Override depending on source image format
// $$$ consider doing a 302 here instead, to make better use of the browser cache
// Limit scaling for 1-bit images.  See https://bugs.edge.launchpad.net/bookreader/+bug/486011
if (1 == $imageInfo['bits']) {
    if ($scale > 1) {
        $scale /= 2;
        $powReduce -= 1;
        
        // Hard limit so there are some black pixels to use!
        if ($scale > 4) {
            $scale = 4;
            $powReduce = 2;
        }
    }
}

if (!file_exists($stdoutLink)) 
{  
  system('ln -s /dev/stdout ' . $stdoutLink);  
}


putenv('LD_LIBRARY_PATH=/petabox/sw/lib/kakadu');

$unzipCmd  = getUnarchiveCommand($zipPath, $file);

switch ($imageInfo['type']) {
    case 'jp2':
        $decompressCmd = 
            " | " . $kduExpand . " -no_seek -quiet -reduce $powReduce -rotate $rotate -i /dev/stdin -o " . $stdoutLink;
        if ($decompressToBmp) {
            $decompressCmd .= ' | bmptopnm ';
        }
        break;

    case 'tiff':
        // We need to create a temporary file for tifftopnm since it cannot
        // work on a pipe (the file must be seekable).
        // We use the BookReaderTiff prefix to give a hint in case things don't
        // get cleaned up.
        $tempFile = tempnam("/tmp", "BookReaderTiff");
    
        // $$$ look at bit depth when reducing
        $decompressCmd = 
            ' > ' . $tempFile . ' ; tifftopnm ' . $tempFile . ' 2>/dev/null' . reduceCommand($scale);
        break;
 
    case 'jpeg':
        $decompressCmd = ' | jpegtopnm ' . reduceCommand($scale);
        break;

    case 'png':
        $decompressCmd = ' | pngtopnm ' . reduceCommand($scale);
        break;
        
    default:
        BRfatal('Unknown source file extension: ' . $fileExt);
        break;
}
       
// Non-integer scaling is currently disabled on the cluster
// if (isset($_REQUEST['height'])) {
//     $cmd .= " | pnmscale -height {$_REQUEST['height']} ";
// }

switch ($ext) {
    case 'png':
        $compressCmd = ' | pnmtopng ' . $pngOptions;
        break;
        
    case 'jpeg':
    case 'jpg':
    default:
        $compressCmd = ' | pnmtojpeg ' . $jpegOptions;
        $ext = 'jpeg'; // for matching below
        break;

}

if (($ext == $fileExt) && ($scale == 1) && ($rotate === "0")) {
    // Just pass through original data if same format and size
    $cmd = $unzipCmd;
} else {
    $cmd = $unzipCmd . $decompressCmd . $compressCmd;
}

# print $cmd;


// $$$ investigate how to flush cache when this file is changed
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

