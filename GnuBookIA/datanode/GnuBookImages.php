<?php

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
*/

$MIMES = array('jpg' => 'image/jpeg',
               'png' => 'image/png');

$zipPath  = $_REQUEST['zip'];
$file     = $_REQUEST['file'];

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

if (isset($_REQUEST['ext'])) {
  $ext = $_REQUEST['ext'];
} else {
  // Default to jpg
  $ext = 'jpg';
}

$fileExt = strtolower(pathinfo($file, PATHINFO_EXTENSION));

// Image conversion options
$pngOptions = '';
$jpegOptions = '-quality 65';

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
    } else {
        // $$$ why do we default to such a small scale?
        $scale = 8;
        $powReduce = 3;
    }
}

if (!file_exists($stdoutLink)) 
{  
  system('ln -s /dev/stdout ' . $stdoutLink);  
}


putenv('LD_LIBRARY_PATH=/petabox/sw/lib/kakadu');

$unzipCmd  = 'unzip -p ' . 
        escapeshellarg($zipPath) .
        ' ' . escapeshellarg($file);
        
if ('jp2' == $fileExt) {
    $decompressCmd = 
        " | /petabox/sw/bin/kdu_expand -no_seek -quiet -reduce $powReduce -i /dev/stdin -o " . $stdoutLink;
    if ($decompressToBmp) {
        $decompressCmd .= ' | bmptopnm ';
    }
} else if ('tif' == $fileExt) {
    // We need to create a temporary file for tifftopnm since it cannot
    // work on a pipe (the file must be seekable).
    // We use the GnuBookTiff prefix to give a hint in case things don't
    // get cleaned up.
    $tempFile = tempnam("/tmp", "GnuBookTiff");
    
    if (1 != $scale) {
        if (onPowerNode()) {
            $pbmReduce = ' | pnmscale -reduce ' . $scale;
        } else {
            $pbmReduce = ' | pnmscale -nomix -reduce ' . $scale;
        }
    } else {
        $pbmReduce = '';
    }
    
    $decompressCmd = 
        ' > ' . $tempFile . ' ; tifftopnm ' . $tempFile . ' 2>/dev/null' . $pbmReduce;

} else {
    GBfatal('Unknown source file extension: ' . $fileExt);
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

$cmd = $unzipCmd . $decompressCmd . $compressCmd;

//print $cmd;

header('Content-type: ' . $MIMES[$ext]);
header('Cache-Control: max-age=15552000');

passthru ($cmd);

if (isset($tempFile)) {
  unlink($tempFile);
}

function GBFatal($string) {
    echo "alert('$string')\n";
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


?>

