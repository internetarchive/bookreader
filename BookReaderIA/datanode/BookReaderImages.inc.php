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

require_once("BookReaderMeta.inc.php");

class BookReaderImages
{
    public static $MIMES = array('gif' => 'image/gif',
                   'jp2' => 'image/jp2',
                   'jpg' => 'image/jpeg',
                   'jpeg' => 'image/jpeg',
                   'png' => 'image/png',
                   'tif' => 'image/tiff',
                   'tiff' => 'image/tiff');
                   
    public static $EXTENSIONS = array('gif' => 'gif',
                        'jp2' => 'jp2',
                        'jpeg' => 'jpeg',
                        'jpg' => 'jpeg',
                        'png' => 'png',
                        'tif' => 'tiff',
                        'tiff' => 'tiff');
    
    // Width when generating thumbnails
    public static $imageSizes = array(
        'thumb' => 100,
        'small' => 256,
        'medium' => 512,
        'large' => 2048,
    );

    // Keys in the image permalink urls, e.g. http://www.archive.org/download/itemid/page/cover_{keyval}_{keyval}.jpg
    public static $imageUrlKeys = array(
        //'r' => 'reduce', // pow of 2 reduction
        's' => 'scale', // $$$ scale is downscaling factor in BookReaderImages but most people call this "reduce"
        'region' => 'region',
        'tile' => 'tile',
        'w' => 'width',
        'h' => 'height',
        'rotate' => 'rotate'
    );
    
    // Paths to command-line tools
    var $exiftool = '/petabox/sw/books/exiftool/exiftool';
    var $kduExpand = '/petabox/sw/bin/kdu_expand';
    
    // Name of temporary files, to be cleaned at exit
    var $tempFiles = array();
    
    /*
     * Serve an image request that requires looking up the book metadata
     *
     * Code path:
     *   - Get book metadata
     *   - Parse the requested page (e.g. cover_t.jpg, n5_r4.jpg) to determine which page type,
     *       size and format (etc) is being requested
     *   - Determine the leaf number corresponding to the page
     *   - Determine scaling values
     *   - Serve image request now that all information has been gathered
     */

    function serveLookupRequest($requestEnv) {
        $brm = new BookReaderMeta();
        try {
            $metadata = $brm->buildMetadata($_REQUEST['id'], $_REQUEST['itemPath'], $_REQUEST['subPrefix'], $_REQUEST['server']);
        } catch (Exception $e) {
            $this->BRfatal($e->getMessage());
        }
        
        $page = $_REQUEST['page'];

        // Index of image to return
        $imageIndex = null;

        // deal with subPrefix
        if ($_REQUEST['subPrefix']) {
            $parts = split('/', $_REQUEST['subPrefix']);
            $bookId = $parts[count($parts) - 1 ];
        } else {
            $bookId = $_REQUEST['id'];
        }
        
        $pageInfo = $this->parsePageRequest($page, $bookId);

        $basePage = $pageInfo['type'];
        
        $leaf = null;
        switch ($basePage) {
        
            case 'title':
                if (! array_key_exists('titleIndex', $metadata)) {
                    $this->BRfatal("No title page asserted in book");
                }
                $imageIndex = $metadata['titleIndex'];
                break;
            
            /* Old 'cover' behaviour where it would show cover 0 if it exists or return 404.
               Could be re-added as cover0, cover1, etc
            case 'cover':
                if (! array_key_exists('coverIndices', $metadata)) {
                    $this->BRfatal("No cover asserted in book");
                }
                $imageIndex = $metadata['coverIndices'][0]; // $$$ TODO add support for other covers
                break;
            */
            
            case 'preview':
            case 'cover': // Show our best guess if cover is requested
                // Preference is:
                //   Cover page if book was published >= 1950
                //   Title page
                //   Cover page
                //   Page 0
                         
                if ( array_key_exists('date', $metadata) && array_key_exists('coverIndices', $metadata) ) {
                    if ($brm->parseYear($metadata['date']) >= 1950) {
                        $imageIndex = $metadata['coverIndices'][0];                
                        break;
                    }
                }
                if (array_key_exists('titleIndex', $metadata)) {
                    $imageIndex = $metadata['titleIndex'];
                    break;
                }
                if (array_key_exists('coverIndices', $metadata)) {
                    $imageIndex = $metadata['coverIndices'][0];
                    break;
                }
                
                // First page
                $imageIndex = 0;
                break;
                
            case 'n':
                // Accessible index page
                $imageIndex = intval($pageInfo['value']);
                break;
                
            case 'page':
                // Named page
                $index = array_search($pageInfo['value'], $metadata['pageNums']);
                if ($index === FALSE) {
                    // Not found
                    $this->BRfatal("Page not found");
                    break;
                }
                
                $imageIndex = $index;
                break;
                
            case 'leaf':
                // Leaf explicitly specified
                $leaf = $pageInfo['value'];
                break;
                
            default:
                // Shouldn't be possible
                $this->BRfatal("Unrecognized page type requested");
                break;
                
        }
        
        if (is_null($leaf)) {
            // Leaf was not explicitly set -- look it up
            $leaf = $brm->leafForIndex($imageIndex, $metadata['leafNums']);
        }
        
        $requestEnv = array(
            'zip' => $metadata['zip'],
            'file' => $brm->imageFilePath($leaf, $metadata['subPrefix'], $metadata['imageFormat']),
            'ext' => 'jpg', // XXX should pass through ext
        );
        
        // remove non-passthrough keys from pageInfo
        unset($pageInfo['type']);
        unset($pageInfo['value']);
        
        // add pageinfo to request
        $requestEnv = array_merge($pageInfo, $requestEnv);

        // Return image data - will check privs        
        $this->serveRequest($requestEnv);
    
    }
    
    /*
     * Returns a page image when all parameters such as the image stack location are
     * passed in.
     * 
     * Approach:
     * 
     * Get info about requested image (input)
     * Get info about requested output format
     * Determine processing parameters
     * Process image
     * Return image data
     * Clean up temporary files
     */
     function serveRequest($requestEnv) {
     
        // Process some of the request parameters
        $zipPath  = $requestEnv['zip'];
        $file     = $requestEnv['file'];
        if (! $ext) {
            $ext = $requestEnv['ext'];
        } else {
            // Default to jpg
            $ext = 'jpeg';
        }
        if (isset($requestEnv['callback'])) {
            // validate callback is valid JS identifier (only)
            $callback = $requestEnv['callback'];
            $identifierPatt = '/^[[:alpha:]$_]([[:alnum:]$_])*$/';
            if (! preg_match($identifierPatt, $callback)) {
                $this->BRfatal('Invalid callback');
            }
        } else {
            $callback = null;
        }

        if ( !file_exists($zipPath) ) {
            $this->BRfatal('Image stack does not exist at ' . $zipPath);
        }
        // Make sure the image stack is readable - return 403 if not
        $this->checkPrivs($zipPath);
        
        
        // Get the image size and depth
        $imageInfo = $this->getImageInfo($zipPath, $file);
        
        // Output json if requested
        if ('json' == $ext) {
            // $$$ we should determine the output size first based on requested scale
            $this->outputJSON($imageInfo, $callback); // $$$ move to BookReaderRequest
            exit;
        }
        
        // Unfortunately kakadu requires us to know a priori if the
        // output file should be .ppm or .pgm.  By decompressing to
        // .bmp kakadu will write a file we can consistently turn into
        // .pnm.  Really kakadu should support .pnm as the file output
        // extension and automatically write ppm or pgm format as
        // appropriate.
        $this->decompressToBmp = true; // $$$ shouldn't be necessary if we use file info to determine output format
        if ($this->decompressToBmp) {
          $stdoutLink = '/tmp/stdout.bmp';
        } else {
          $stdoutLink = '/tmp/stdout.ppm';
        }
        
        $fileExt = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        
        // Rotate is currently only supported for jp2 since it does not add server load
        $allowedRotations = array("0", "90", "180", "270");
        $rotate = $requestEnv['rotate'];
        if ( !in_array($rotate, $allowedRotations) ) {
            $rotate = "0";
        }
        
        // Image conversion options
        $pngOptions = '';
        $jpegOptions = '-quality 75';
        
        // The pbmreduce reduction factor produces an image with dimension 1/n
        // The kakadu reduction factor produces an image with dimension 1/(2^n)
        
        // We interpret the requested size and scale, look at image format, and determine the
        // actual scaling to be returned to the client.  We generally return the largest
        // power of 2 reduction that is larger than the requested size in order to reduce
        // image processing load on our cluster.  The client should then scale to their final
        // needed size.
        
        // Set scale from height or width if set
        if (isset($requestEnv['height'])) {
            $powReduce = $this->nearestPow2Reduce($requestEnv['height'], $imageInfo['height']);
            $scale = pow(2, $powReduce);
        } else if (isset($requestEnv['width'])) {
            $powReduce = $this->nearestPow2Reduce($requestEnv['width'], $imageInfo['width']);
            $scale = pow(2, $powReduce);

        } else {
            // Set scale from named size (e.g. 'large') if set
            $size = $requestEnv['size'];
            if ( $size && array_key_exists($size, self::$imageSizes)) {
                $srcRatio = floatval($imageInfo['width']) / floatval($imageInfo['height']);
                if ($srcRatio > 1) {
                    // wide
                    $dimension = 'width';
                } else {
                    $dimension = 'height';
                }
                $powReduce = $this->nearestPow2Reduce(self::$imageSizes[$size], $imageInfo[$dimension]);
                $scale = pow(2, $powReduce);
                
            } else {
                // No named size - use explicit scale, if given
                $scale = $requestEnv['scale'];
                if (!$scale) {
                    $scale = 1;
                }
                $powReduce = $this->nearestPow2ForScale($scale);
                // ensure integer scale
                $scale = pow(2, $powReduce);
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
        
        $unzipCmd  = $this->getUnarchiveCommand($zipPath, $file);
        
        $decompressCmd = $this->getDecompressCmd($imageInfo['type'], $powReduce, $rotate, $scale, $stdoutLink);
               
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
        
        // print $cmd;
        
        $filenameForClient = $this->filenameForClient($file, $ext);
        
        $headers = array('Content-type: '. self::$MIMES[$ext],
                         'Cache-Control: max-age=15552000',
                         'Content-disposition: inline; filename=' . $filenameForClient);
                          
        
        $errorMessage = '';
        
        if (! $this->passthruIfSuccessful($headers, $cmd, $errorMessage)) { // $$$ move to BookReaderRequest
            // $$$ automated reporting
            trigger_error('BookReader Processing Error: ' . $cmd . ' -- ' . $errorMessage, E_USER_WARNING);
            
            // Try some content-specific recovery
            $recovered = false;
            if ($imageInfo['type'] == 'jp2') {
                $records = $this->getJp2Records($zipPath, $file);
                if (array_key_exists('Clevels', $records)) {
                    $maxReduce = intval($records['Clevels']);
                    trigger_error("BookReader using max reduce $maxReduce from jp2 records");
                } else {
                    $maxReduce = 0;
                }
                
                $powReduce = min($powReduce, $maxReduce);
                $reduce = pow(2, $powReduce);
                
                $cmd = $unzipCmd . $this->getDecompressCmd($imageInfo['type'], $powReduce, $rotate, $scale, $stdoutLink) . $compressCmd;
                trigger_error('BookReader rerunning with new cmd: ' . $cmd, E_USER_WARNING);
                if ($this->passthruIfSuccessful($headers, $cmd, $errorMessage)) { // $$$ move to BookReaderRequest
                    $recovered = true;
                } else {
                    $this->cleanup();
                    trigger_error('BookReader fallback image processing also failed: ' . $errorMessage, E_USER_WARNING);
                }
            }
            
            if (! $recovered) {
                $this->BRfatal('Problem processing image - command failed');
            }
        }
        
        $this->cleanup();
    }    
    
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
                return ' ( 7z e -so '
                    . escapeshellarg($archivePath)
                    . ' ' . escapeshellarg($file) . ' 2>/dev/null ) ';
            } else {
                $this->BRfatal('Incompatible archive format');
            }
    
        } else {
            $this->BRfatal('Bad image stack path');
        }
        
        $this->BRfatal('Bad image stack path or archive format');
        
    }
    
    /*
     * Returns the image type associated with the file extension.
     */
    function imageExtensionToType($extension)
    {
        
        if (array_key_exists($extension, self::$EXTENSIONS)) {
            return self::$EXTENSIONS[$extension];
        } else {
            $this->BRfatal('Unknown image extension');
        }            
    }
    
    /*
     * Get the image information.  The returned associative array fields will
     * vary depending on the image type.  The basic keys are width, height, type
     * and bits.
     */
    function getImageInfo($zipPath, $file)
    {
        return $this->getImageInfoFromExif($zipPath, $file); // this is fast
        
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
        
        $cmd = $this->getUnarchiveCommand($zipPath, $file)
                 . ' | ' . $this->kduExpand
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
        
        // We look for all the possible tags of interest then act on the
        // ones presumed present based on the file type
        $tagsToGet = ' -ImageWidth -ImageHeight -FileType'        // all formats
                     . ' -BitsPerComponent -ColorSpace'          // jp2
                     . ' -BitDepth'                              // png
                     . ' -BitsPerSample';                        // tiff
                            
        $cmd = $this->getUnarchiveCommand($zipPath, $file)
            . ' | '. $this->exiftool . ' -S -fast' . $tagsToGet . ' -';
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
                $this->BRfatal("Unsupported image type $type for file $file in $zipPath");
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
    
    function getDecompressCmd($imageType, $powReduce, $rotate, $scale, $stdoutLink) {
        
        switch ($imageType) {
            case 'jp2':
                $decompressCmd = 
                    " | " . $this->kduExpand . " -no_seek -quiet -reduce $powReduce -rotate $rotate -i /dev/stdin -o " . $stdoutLink;
                if ($this->decompressToBmp) {
                    // We suppress output since bmptopnm always outputs on stderr
                    $decompressCmd .= ' | (bmptopnm 2>/dev/null)';
                }
                break;
        
            case 'tiff':
                // We need to create a temporary file for tifftopnm since it cannot
                // work on a pipe (the file must be seekable).
                // We use the BookReaderTiff prefix to give a hint in case things don't
                // get cleaned up.
                $tempFile = tempnam("/tmp", "BookReaderTiff");
                array_push($this->tempFiles, $tempFile);
            
                // $$$ look at bit depth when reducing
                $decompressCmd = 
                    ' > ' . $tempFile . ' ; tifftopnm ' . $tempFile . ' 2>/dev/null' . $this->reduceCommand($scale);
                break;
         
            case 'jpeg':
                $decompressCmd = ' | ( jpegtopnm 2>/dev/null ) ' . $this->reduceCommand($scale);
                break;
        
            case 'png':
                $decompressCmd = ' | ( pngtopnm 2>/dev/null ) ' . $this->reduceCommand($scale);
                break;
                
            default:
                $this->BRfatal('Unknown image type: ' . $imageType);
                break;
        }
        return $decompressCmd;
    }
    
    // If the command has its initial output on stdout the headers will be emitted followed
    // by the stdout output.  If initial output is on stderr an error message will be
    // returned.
    // 
    // Returns:
    //   true - if command emits stdout and has zero exit code
    //   false - command has initial output on stderr or non-zero exit code
    //   &$errorMessage - error string if there was an error
    //
    // $$$ Tested with our command-line image processing.  May be deadlocks for
    //     other cases.
    function passthruIfSuccessful($headers, $cmd, &$errorMessage)
    {
        $retVal = false;
        $errorMessage = '';
        
        $descriptorspec = array(
           0 => array("pipe", "r"),  // stdin is a pipe that the child will read from
           1 => array("pipe", "w"),  // stdout is a pipe that the child will write to
           2 => array("pipe", "w"),   // stderr is a pipe to write to
        );
        
        $cwd = NULL;
        $env = NULL;
        
        $process = proc_open($cmd, $descriptorspec, $pipes, $cwd, $env);
        
        if (is_resource($process)) {
            // $pipes now looks like this:
            // 0 => writeable handle connected to child stdin
            // 1 => readable handle connected to child stdout
            // 2 => readable handle connected to child stderr
        
            $stdin = $pipes[0];        
            $stdout = $pipes[1];
            $stderr = $pipes[2];
            
            // check whether we get input first on stdout or stderr
            $read = array($stdout, $stderr);
            $write = NULL;
            $except = NULL;
            
            $numChanged = stream_select($read, $write, $except, NULL); // $$$ no timeout
            if (false === $numChanged) {
                // select failed
                $errorMessage = 'Select failed';
                $retVal = false;
                error_log('BookReader select failed!');
            } else {            
                if (in_array($stderr, $read)) {
                    // Either content in stderr, or stderr is closed (could read 0 bytes)
                    $error = stream_get_contents($stderr);
                    if ($error) {
                    
                        $errorMessage = $error;
                        $retVal = false;
                        
                        fclose($stderr);
                        fclose($stdout);
                        fclose($stdin);
                        
                        // It is important that you close any pipes before calling
                        // proc_close in order to avoid a deadlock
                        proc_close($process);
                        return $retVal;             
 
                    }
                }
                
                $output = fopen('php://output', 'w');
                foreach($headers as $header) {
                    header($header);
                }
                stream_copy_to_stream($pipes[1], $output);
                fclose($output); // okay since tied to special php://output
                $retVal = true;
            }
    
            fclose($stderr);
            fclose($stdout);
            fclose($stdin);
    
            
            // It is important that you close any pipes before calling
            // proc_close in order to avoid a deadlock
            $cmdRet = proc_close($process);
            if (0 != $cmdRet) {
                $retVal = false;
                $errorMessage .= "Command failed with result code " . $cmdRet;
            }
        }
        return $retVal;
    }
    
    function BRfatal($string) {
        $this->cleanup();
        throw new Exception("Image error: $string");
    }
    
    // Returns true if using a power node
    // XXX change to "on red box" - not working for new Xeon
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
            if ($this->onPowerNode()) {
                return ' | pnmscale -reduce ' . $scale . ' 2>/dev/null ';
            } else {
                return ' | pnmscale -nomix -reduce ' . $scale . ' 2>/dev/null ';
            }
        } else {
            return '';
        }
    }
    
    function checkPrivs($filename) {
        // $$$ we assume here that requests for the title, cover or preview
        //     come in via BookReaderPreview.php which will be re-run with
        //     privileges after we return the 403
        if (!is_readable($filename)) {
            header('HTTP/1.1 403 Forbidden');
            exit(0);
        }
    }
    
    // Given file path (inside archive) and output file extension, return a filename
    // suitable for Content-disposition header
    function filenameForClient($filePath, $ext) {
        $pathParts = pathinfo($filePath);
        if ('jpeg' == $ext) {
            $ext = 'jpg';
        }
        return $pathParts['filename'] . '.' . $ext;
    }
    
    // Returns the nearest power of 2 reduction factor that results in a larger image
    function nearestPow2Reduce($desiredDimension, $sourceDimension) {
        $ratio = floatval($sourceDimension) / floatval($desiredDimension);
        return $this->nearestPow2ForScale($ratio);
    }
    
    // Returns nearest power of 2 reduction factor that results in a larger image
    function nearestPow2ForScale($scale) {
        $scale = intval($scale);
        if ($scale <= 1) {
            return 0;
        }
        $binStr = decbin($scale); // convert to binary string. e.g. 5 -> '101'
        return strlen($binStr) - 1;
    }
    
    /*
     * Parses a page request like "page5_r2.jpg" or "cover_t.jpg" to corresponding
     * page type, size, reduce, and format
     */
    function parsePageRequest($pageRequest, $bookPrefix) {
    
        // Will hold parsed results
        $pageInfo = array();
        
        // Normalize
        $pageRequest = strtolower($pageRequest);
        
        // Pull off extension
        if (preg_match('#(.*)\.([^.]+)$#', $pageRequest, $matches) === 1) {
            $pageRequest = $matches[1];
            $extension = $matches[2];
            if ($extension == 'jpeg') {
                $extension = 'jpg';
            }
        } else {
            $extension = 'jpg';
        }
        $pageInfo['extension'] = $extension;
        
        // Split parts out
        $parts = explode('_', $pageRequest);

        // Remove book prefix if it was included (historical)
        if ($parts[0] == $bookPrefix) {
            array_shift($parts);
        }
        
        if (count($parts) === 0) {
            $this->BRfatal('No page type specified');
        }
        $page = array_shift($parts);
        
        $pageTypes = array(
            'page' => 'str',
            'n' => 'num',
            'cover' => 'single',
            'preview' => 'single',
            'title' => 'single',
            'leaf' => 'num'
        );
        
        // Look for known page types
        foreach ( $pageTypes as $pageName => $kind ) {
            if ( preg_match('#^(' . $pageName . ')(.*)#', $page, $matches) === 1 ) {
                $pageInfo['type'] = $matches[1];
                switch ($kind) {
                    case 'str':
                        $pageInfo['value'] = $matches[2];
                        break;
                    case 'num':
                        $pageInfo['value'] = intval($matches[2]);
                        break;
                    case 'single':
                        break;
                }
            }
        }
        
        if ( !array_key_exists('type', $pageInfo) ) {
            $this->BRfatal('Unrecognized page type');
        }
        
        // Look for other known parts
        foreach ($parts as $part) {
            if ( array_key_exists($part, self::$imageSizes) ) {
                $pageInfo['size'] = $part;
                continue;
            }
        
            // Key must be alpha, value must start with digit and contain digits, alpha, ',' or '.'
            // Should prevent injection of strange values into the redirect to datanode
            if ( preg_match('#^([a-z]+)(\d[a-z0-9,.]*)#', $part, $matches) === 0) {
                // Not recognized
                continue;
            }
            
            $key = $matches[1];
            $value = $matches[2];
            
            if ( array_key_exists($key, self::$imageUrlKeys) ) {
                $pageInfo[self::$imageUrlKeys[$key]] = $value;
                continue;
            }
            
            // If we hit here, was unrecognized (no action)
        }
        
        return $pageInfo;
    }
    
    // Clean up temporary files and resources
    function cleanup() {
        foreach($this->tempFiles as $tempFile) {
            unlink($tempFile);
        }
        $this->tempFiles = array();
    }
    
}

?>