<?

class BookReader
{

  // Returns true if can display the book in item with a given prefix (typically the item identifier)
  public static function canDisplay($item, $prefix, $checkOldScandata = false)
  {
    
    // A "book" is an image stack and scandata.
    // 1. Old items may have scandata.xml or scandata.zip and itemid_{imageformat}.{zip,tar}
    // 2. Newer items may have multiple {arbitraryname}_scandata.xml and {arbitraryname}_{imageformat}.{zip,tar}
        
    $foundScandata = false;
    $foundImageStack = false;
    
    $targetScandata = $prefix . "_scandata.xml";
        
    // $$$ TODO add support for jpg and tar stacks
    // https://bugs.edge.launchpad.net/gnubook/+bug/323003
    // https://bugs.edge.launchpad.net/gnubook/+bug/385397
    $imageFormatRegex = '@' . preg_quote($prefix, '@') . '_(jp2|tif|jpg)\.(zip|tar)$@';
    
    $baseLength = strlen($item->metadataGrabber->mainDir . '/');
    foreach ($item->getFiles() as $location => $fileInfo) {
        $filename = substr($location, $baseLength);
        
        if ($checkOldScandata) {
            if ($filename == 'scandata.xml' || $filename == 'scandata.zip') {
                $foundScandata = $filename;
            }
        }
        
        if ($filename == $targetScandata) {
            $foundScandata = $filename;
        }
        
        if (preg_match($imageFormatRegex, $filename)) {
            $foundImageStack = $filename;
        }
    }
    
    if ($foundScandata && $foundImageStack) {
        return true;
    }
    
    return false;
  }
  
  // Finds the prefix to use for the book given the part of the URL trailing after /stream/
  public static function findPrefix($urlPortion)
  {
    if (!preg_match('#[^/&?]+#', $urlPortion, $matches)) {
        return false;
    }
    
    $prefix = $matches[0]; // identifier
    
    // $$$ Currently swallows the rest of the URL.
    //     If we want to support e.g. /stream/itemid/subdir/prefix/page/23 will need to adjust.
    if (preg_match('#[^/&?]+/([^&?]+)#', $urlPortion, $matches)) {
        $prefix = $matches[1]; // sub prefix
    }
    
    return $prefix;
  }

  // $$$ would be cleaner to use different templates instead of the uiMode param
  // 
  // @param subprefix Optional prefix to display a book inside an item (e.g. if does not match identifier)
  public static function draw($server, $mainDir, $identifier, $subPrefix, $title,
                              $coverLeaf=null, $titleStart='Internet Archive', $uiMode='full')
  {
    // Set title to default if not set
    if (!$title) {
        $title = 'BookReader';
    }
    
    $id = $identifier;
    
    // manually update with Launchpad version number at each checkin so that browsers
    // do not use old cached version
    // see https://bugs.launchpad.net/gnubook/+bug/330748
    $version = "r25";
    
    if (BookReader::getDevHost($server)) {
        // on dev host - add time to force reload
        $version .= '_' . time();
    }
    
    if ("" == $id) {
        echo "No identifier specified!";
        die(-1);
    }
    
    $metaURL = BookReader::jsMetadataURL($server, $identifier, $mainDir, $subPrefix);
    
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta name="viewport" content="width=device-width, maximum-scale=1.0" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title><? echo $title; ?></title>
<!--[if lte IE 6]>
    <meta http-equiv="refresh" content="2; URL=/bookreader/browserunsupported.php?id=<? echo($id); ?>">
<![endif]-->
    <link rel="stylesheet" type="text/css" href="/bookreader/BookReader.css?v=<? echo($version); ?>">
<? if ($uiMode == "embed") { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/BookReaderEmbed.css?v=<? echo($version); ?>">
<? } elseif ($uiMode == "touch") { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/touch/BookReaderTouch.css?v=<? echo($version); ?>">
<? } /* uiMode */ ?>
    <script src="/includes/jquery-1.4.2.min.js" type="text/javascript"></script>
    <script type="text/javascript" src="/bookreader/jquery-ui-1.8.1.custom.min.js"></script>
    <script type="text/javascript" src="/bookreader/dragscrollable.js?v=<? echo($version); ?>"></script>
    <script type="text/javascript" src="/bookreader/BookReader.js?v=<? echo($version); ?>"></script>
</head>
<body style="background-color: #FFFFFF;">

<? if ($uiMode == 'full') { ?>
<div id="BookReader" style="left:10px; right:200px; top:10px; bottom:2em;">Internet Archive BookReader <noscript>requires JavaScript to be enabled.</noscript></div>
<? } else { ?>
<div id="BookReader" style="left:0; right:0; top:0; bottom:0; border:0">Internet Archive Bookreader <noscript>requires JavaScript to be enabled.</noscript></div>
<? } /* uiMode*/ ?>

<script type="text/javascript">
  // Set some config variables -- $$$ NB: Config object format has not been finalized
  var brConfig = {};
<? if ($uiMode == 'embed') { ?>
  brConfig["mode"] = 1;
  brConfig["reduce"] = 8;
  brConfig["ui"] = "embed";
<? } else { ?>
  brConfig["mode"] = 2;
<? } ?>
</script>
<!-- The script included below is dynamically generated JavaScript that includes the book metadata and page image access functions -->
<script type="text/javascript" src="<? echo($metaURL); ?>"></script>

<? if ($uiMode == 'full') { ?>
<div id="BookReaderSearch" style="width:190px; right:0px; top:10px; bottom:2em;">
    <form action='javascript:' onsubmit="br.search($('#BookReaderSearchBox').val());">
        <p style="display: inline">
            <input id="BookReaderSearchBox" type="text" size="20" value="search..." onfocus="if('search...'==this.value)this.value='';" /><input type="submit" value="go" />
        </p>
    </form>
    <div id="BookReaderSearchResults">
        Search results
    </div>
</div>


<div id="BRfooter">
    <div class="BRlogotype">
        <a href="http://archive.org/" class="BRblack">Internet Archive</a>
    </div>
    <div class="BRnavlinks">
        <!-- <a class="BRblack" href="http://openlibrary.org/dev/docs/bookreader">About the Bookreader</a> | -->
        <a class="BRblack" href="http://www.archive.org/about/faqs.php#Report_Item">Content Problems</a> |
        <a class="BRblack" href="https://bugs.launchpad.net/bookreader/+filebug">Report Bugs</a> |
        <a class="BRblack" href="http://www.archive.org/details/texts">Texts Collection</a> |
        <a class="BRblack" href="http://www.archive.org/about/contact.php">Contact Us</a>
    </div>
</div>
<? } /* uiMode */ ?>

<script type="text/javascript">
    // $$$ hack to workaround sizing bug when starting in two-up mode
    $(document).ready(function() {
        $(window).trigger('resize');
    });
</script>
  <?
    exit;
  }
  
  // Returns the user part of dev host from URL, or null
  public static function getDevHost($server)
  {
      if (preg_match("/^www-(\w+)/", $_SERVER["SERVER_NAME"], $match)) {
        return $match[1];
      }
      
      return null;
  }

  
  public static function serverBaseURL($server)
  {
      // Check if we're on a dev vhost and point to JSIA in the user's public_html
      // on the datanode
      // $$$ the remapping isn't totally automatic yet and requires user to
      //     ln -s ~/petabox/www/datanode/BookReader ~/public_html/BookReader
      //     so we enable it only for known hosts
      $devhost = BookReader::getDevHost($server);
      $devhosts = array('mang', 'testflip', 'rkumar');
      if (in_array($devhost, $devhosts)) {
        $server = $server . "/~" . $devhost;
      }
      return $server;
  }
  
  
  public static function jsMetadataURL($server, $identifier, $mainDir, $subPrefix = '')
  {
    $serverBaseURL = BookReader::serverBaseURL($server);

    $params = array( 'id' => $identifier, 'itemPath' => $mainDir, 'server' => $server );
    if ($subPrefix) {
        $params['subPrefix'] = $subPrefix;
    }
    
    $keys = array_keys($params);
    $lastParam = end($keys);
    $url = "http://{$serverBaseURL}/BookReader/BookReaderJSIA.php?";
    foreach($params as $param=>$value) {
        $url .= $param . '=' . $value;
        if ($param != $lastParam) {
            $url .= '&';
        }
    }
    
    return $url;
  }
  
  // Return the URL for the requested /download/$path, or null
  public static function getURL($path, $item) {
    // $path should look like {itemId}/{operator}/{filename}
    // Other operators may be added
    
    $parts = preg_split('#/#', $path, 3);
    if (count($parts) != 3) {
        return null;
    }
    $identifier = $parts[0];
    $operator = $parts[1];
    $filename = $parts[2];
    
    $serverBaseURL = BookReader::serverBaseURL($item->getServer());
            
    switch ($operator) {
        case 'page':
            // Find bookId and which page was requested
            $pathParts = pathinfo($filename);
            
            // Look for preview request
            if (preg_match('/^(.*)_(cover|title|preview)$/', $pathParts['filename'], $matches) === 0) {
                return null;
            }
            $bookId = $matches[1];
            $page = $matches[2];
            $query = array(
                'id' => $identifier,
                'bookId' => $bookId,
                'itemPath' => $item->getMainDir(),
                'server' => $serverBaseURL,
                'page' => $page,
            );
            return 'http://' . $serverBaseURL . '/BookReader/BookReaderPreview.php?' . http_build_query($query, '', '&');
        
        default:
            return null;            
    }
      
    return null; // was not handled
  }
  
  // $$$ Ideally we will not rely on user agent, but for the moment we do
  public static function paramsFromUserAgent($userAgent) {
      $browserParams = array(
          'ipad' => array( 'ui' => 'touch' ),
          'iphone' => array( 'ui' => 'embed', 'mode' => '1up'),
      );
  
      $browser = BookReader::browserFromUserAgent($userAgent);
      if ($browser) {
          return $browserParams[$browser];
      }
      return array();
  }
  
  public static function browserFromUserAgent($userAgent) {
      $browserPatterns = array(
          'ipad' => '/iPad/',
          'iphone' => '/iPhone/', // Also cover iPod Touch
      );
      
      foreach ($browserPatterns as $browser => $pattern) {
          if (preg_match($pattern, $userAgent)) {
              return $browser;
          }
      }
      return null;
  }
  
}

?>