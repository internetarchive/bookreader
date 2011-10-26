<?

/*
 * Copyright(c) 2008-2010 Internet Archive. Software license AGPL version 3.
 *
 * This file is part of BookReader.  The full source code can be found at GitHub:
 * http://github.com/openlibrary/bookreader
 *
 * Note: Edits to this file must pass through github.  To submit a patch to this
 *       file please contact mang via http://github.com/mangtronix or mang at archive dot org
 *       Direct changes to this file may get clobbered when the code is synchronized
 *       from github.
 */

class BookReader
{


  // Operators recognized in BookReader download URLs
  public static $downloadOperators = array('page');

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
    
    $baseLength = strlen($item->getMainDir() . '/');
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
        // URL portion was empty or started with /, &, or ? -- no item identifier
        return false;
    }
    
    $prefix = $matches[0]; // item identifier
    
    // $$$ Currently swallows the rest of the URL.
    //     If we want to support e.g. /stream/itemid/subdir/prefix/page/23 will need to adjust.
    if (preg_match('#[^/&?]+/([^&?]+)#', $urlPortion, $matches)) {
        // Match is everything after item identifier and slash, up to end or ? or &
        // e.g. itemid/{match/these/parts}?foo=bar
        $prefix = $matches[1]; // sub prefix -- 
    }
    
    return $prefix;
  }

  // $$$ would be cleaner to use different templates instead of the uiMode param
  // 
  // @param subprefix Optional prefix to display a book inside an item (e.g. if does not match identifier)
  public static function draw($server, $mainDir, $identifier, $subPrefix, $title,
                              $coverLeaf=null, $titleStart='Internet Archive', $uiMode='full', $protected = false, $isAdmin=false)
  {
    // Set title to default if not set
    if (!$title) {
        $title = 'BookReader';
    }
    
    $id = $identifier;
    
    // manually update with Launchpad version number at each checkin so that browsers
    // do not use old cached version
    // see https://bugs.launchpad.net/gnubook/+bug/330748
    $version = "3.0.9";
    
    if (BookReader::getDevHost($server)) {
        // On dev host - add time to force reload
        // If debugging on IE, remove this line otherwise breakpoints will be invalid after reload
        $version .= '_' . time();
    }
    
    if ("" == $id) {
        echo "No identifier specified!";
        die(-1);
    }
    
    $metaURL = BookReader::jsMetadataURL($server, $identifier, $mainDir, $subPrefix);
    $metaURL .= "&version=" . $version;
    $locateURL = BookReader::jsLocateURL($identifier, $subPrefix);
    $coverThumb = 'http://www.archive.org/download/' . $identifier . '/'. $subPrefix . '/page/cover_w114.jpg';
    // startup-up-image must be exactly 320x460
    //$startupImage = 'http://www.archive.org/download/' . $identifier . '/'. $subPrefix . '/page/cover_w512.jpg';
    
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta name="viewport" content="width=device-width, maximum-scale=1.0" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <link rel="apple-touch-icon" href="<? echo($coverThumb); ?>" />
    <title><? echo $title; ?></title>
    
    <!--[if lte IE 6]>
    <meta http-equiv="refresh" content="2; URL=/bookreader/browserunsupported.php?id=<? echo($id); ?>">
    <![endif]-->

    <!-- THIS ALLOWS BEAUTYTIPS TO WORK ON IE -->
    <!--[if lt IE 9]>
    <script type="text/javascript" src="/includes/excanvas.compiled.js"></script>
    <![endif]-->

<!--[if !IE 7]><![IGNORE[--><![IGNORE[]]>
    <link rel="stylesheet" type="text/css" href="/bookreader/BookReader.css?v=<? echo($version); ?>">
<? if ($uiMode == "embed") { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/BookReaderEmbed.css?v=<? echo($version); ?>">
<? } elseif ($uiMode == "touch") { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/touch/BookReaderTouch.css?v=<? echo($version); ?>">
<? } /* uiMode */ ?>
<? if ($protected) { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/BookReaderLending.css?v=<? echo($version); ?>">
<? } ?>
    <script src="/includes/jquery-1.4.2.min.js" type="text/javascript"></script>
    <script type="text/javascript" src="/bookreader/jquery-ui-1.8.5.custom.min.js?v=<? echo($version); ?>"></script>
    <script type="text/javascript" src="http://www.archive.org/includes/analytics.js?v=2"></script>
    <script type="text/javascript" src="/bookreader/dragscrollable.js?v=<? echo($version); ?>"></script>
    <script type="text/javascript" src="/bookreader/jquery.colorbox-min.js"></script>
    <script type="text/javascript" src="/bookreader/jquery.ui.ipad.js"></script>

    <script type="text/javascript" src="/bookreader/jquery.bt.min.js"></script>
    <script type="text/javascript" src="/bookreader/BookReader.js?v=<? echo($version); ?>"></script>
<? if ( !preg_match("/mobile/i", $_SERVER['HTTP_USER_AGENT']) ) { ?>
    <script type="text/javascript" src="/bookreader/soundmanager/soundmanager2-ia.js?v=<? echo($version); ?>"></script>
    <script>
        soundManager.debugMode = false;
        soundManager.url = '/bookreader/soundmanager/swf/';       
        soundManager.useHTML5Audio = true;
        soundManager.flashVersion = 9; //flash 8 version of swf is buggy when calling play() on a sound that is still loading
    </script>
<? } /* mobile user agent */ ?>
</head>
<body style="background-color: ##939598;">

<div id="BookReader">
    Internet Archive BookReader - <? echo $title; ?>
    <br/>
    
    <noscript>
    <p>
        The BookReader requires JavaScript to be enabled. Please check that your browser supports JavaScript and that it is enabled in the browser settings.  You can also try one of the <a href="http://www.archive.org/details/<? echo $identifier; ?>"> other formats of the book</a>.
    </p>
    </noscript>
</div>

<script type="text/javascript">
  // Set some config variables -- $$$ NB: Config object format has not been finalized
  var brConfig = {};
<? if ($uiMode == 'embed') { ?>
  brConfig["mode"] = 1;
  brConfig["ui"] = "embed";
<? } else { ?>
  brConfig["mode"] = 2;
<? } ?>
<? if ($isAdmin == true) {
     echo '  brConfig["isAdmin"] = true;';
   } ?>   
</script>
<script type="text/javascript">
// The URL in the script tag below is dynamically generated JavaScript that includes the book metadata and page image access functions.
// The ia{number}.us.archive.org server for the book can and does change, so this URL should NOT be used for permanent access.
// Use the JSLocate URL below instead for stable access - it will find the item and redirect to the correct server
// <? echo($locateURL); ?>

</script>
<script type="text/javascript" src="<? echo($metaURL); ?>"></script>

<script type="text/javascript">
    // Usage stats
    if(window.archive_analytics) { window.archive_analytics.values['bookreader'] = 'open'};
</script>
<!--<![endif]-->

<!--[if IE 7]>
<? BookReader::emitForIE7($server, $mainDir, $identifier, $subPrefix, $title, $coverLeaf, $titleStart, $uiMode); ?>
<![endif]-->


</body>
</html>
  <?
    exit;
  }
  
  

  
  // Emit the HTML for the version of the BookReader for IE7
  public static function emitForIE7($server, $mainDir, $identifier, $subPrefix, $title,
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
    $version = "ie7";
    
    if (BookReader::getDevHost($server)) {
        // on dev host - add time to force reload
        $version .= '_' . time();
    }
    
    if ("" == $id) {
        echo "No identifier specified!";
        die(-1);
    }
    
    $metaURL = BookReader::jsMetadataURLForIE7($server, $identifier, $mainDir, $subPrefix);
    
    
?>
    <link rel="stylesheet" type="text/css" href="/bookreader/ie7/BookReader.css?v=<? echo($version); ?>">
<? if ($uiMode == "embed") { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/ie7/BookReaderEmbed.css?v=<? echo($version); ?>">
<? } elseif ($uiMode == "touch") { ?>
    <link rel="stylesheet" type="text/css" href="/bookreader/ie7/touch/BookReaderTouch.css?v=<? echo($version); ?>">
<? } /* uiMode */ ?>
    <script src="/includes/jquery-1.4.2.min.js" type="text/javascript"></script>
    <script type="text/javascript" src="http://www.archive.org/includes/analytics.js?v=2"></script>
    <script type="text/javascript" src="/bookreader/ie7/jquery-ui-1.8.1.custom.min.js?v=<? echo($version); ?>"></script>
    <script type="text/javascript" src="/bookreader/ie7/dragscrollable.js?v=<? echo($version); ?>"></script>
    <script type="text/javascript" src="/bookreader/ie7/BookReader.js?v=<? echo($version); ?>"></script>
</head>
<body style="background-color: #FFFFFF;">

<? if ($uiMode == 'full') { ?>
<div id="BookReader" style="left:10px; right:200px; top:10px; bottom:2em;">Internet Archive BookReader <noscript>requires JavaScript to be enabled.</noscript></div>
<? } else { ?>
<div id="BookReader" style="left:0; right:0; top:0; bottom:0; border:0">Internet Archive BookReader <noscript>requires JavaScript to be enabled.</noscript></div>
<? } /* uiMode*/ ?>

<script type="text/javascript">
  // Set some config variables - $$$ NB: Config object format has not been finalized
  var brConfig = {};
<? if ($uiMode == 'embed') { ?>
  brConfig["mode"] = 1;
  brConfig["reduce"] = 8;
  brConfig["ui"] = "embed";
<? } else { ?>
  brConfig["mode"] = 2;
<? } ?>
</script>
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
    
    // Usage stats
    if(window.archive_analytics) { window.archive_analytics.values['bookreader'] = 'open'};
</script>
  <?
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
  
    public static function jsMetadataURLForIE7($server, $identifier, $mainDir, $subPrefix = '')
  {
    $serverBaseURL = BookReader::serverBaseURL($server);

    $params = array( 'id' => $identifier, 'itemPath' => $mainDir, 'server' => $server );
    if ($subPrefix) {
        $params['subPrefix'] = $subPrefix;
    }
    
    $keys = array_keys($params);
    $lastParam = end($keys);
    $url = "http://{$serverBaseURL}/BookReader/ie7/BookReaderJSIA.php?";
    foreach($params as $param=>$value) {
        $url .= $param . '=' . $value;
        if ($param != $lastParam) {
            $url .= '&';
        }
    }
    
    return $url;
  }

  
  // This returns a URL that finds the item then returns a redirect to BookReaderJSIA.php
  // on the item's server.
  public static function jsLocateURL($identifier, $subPrefix = '')
  {
    $locateURL = 'http://www.archive.org/bookreader/BookReaderJSLocate.php?id=' . $identifier;
    if ($subPrefix) {
        $locateURL .= '&subPrefix=' . $subPrefix;
    }
    return $locateURL;
  }
  
  // Return the URL for the requested /download/$path, or null
  public static function getURL($path, $item) {
    // $path should look like {itemId}/{operator}/{filename}
    // Other operators may be added
    
    $urlParts = BookReader::parsePath($path);
    
    // Check for non-handled cases
    $required = array('identifier', 'operator', 'operand');
    foreach ($required as $key) {
        if (!array_key_exists($key, $urlParts)) {
            return null;
        }
    }
    
    $identifier = $urlParts['identifier'];
    $operator = $urlParts['operator'];
    $filename = $urlParts['operand'];
    $subPrefix = $urlParts['subPrefix'];
    
    $serverBaseURL = BookReader::serverBaseURL($item->getServer());
    
    // Baseline query params
    $query = array(
        'id' => $identifier,
        'itemPath' => $item->getMainDir(),
        'server' => $serverBaseURL
    );
    if ($subPrefix) {
        $query['subPrefix'] = $subPrefix;
    }
    
    switch ($operator) {
        case 'page':
            
            // Look for old-style preview request - e.g. {identifier}_cover.jpg
            if (preg_match('/^(.*)_((cover|title|preview).*)/', $filename, $matches) === 1) {
                // Serve preview image
                $page = $matches[2];
                $query['page'] = $page;
                return 'http://' . $serverBaseURL . '/BookReader/BookReaderPreview.php?' . http_build_query($query, '', '&');
            }
            
            // New-style preview request - e.g. cover_thumb.jpg
            if (preg_match('/^(cover|title|preview)/', $filename, $matches) === 1) {
                $query['page'] = $filename;
                return 'http://' . $serverBaseURL . '/BookReader/BookReaderPreview.php?' . http_build_query($query, '', '&');
            }
            
            // Asking for a non-preview page
            $query['page'] = $filename;
            return 'http://' . $serverBaseURL . '/BookReader/BookReaderImages.php?' . http_build_query($query, '', '&');
        
        default:
            // Unknown operator
            return null;            
    }
      
    return null; // was not handled
  }
  
  public static function browserFromUserAgent($userAgent) {
      $browserPatterns = array(
          'ipad' => '/iPad/',
          'iphone' => '/iPhone/', // Also covers iPod Touch
          'android' => '/Android/',
      );
      
      foreach ($browserPatterns as $browser => $pattern) {
          if (preg_match($pattern, $userAgent)) {
              return $browser;
          }
      }
      return null;
  }

  
  // $$$ Ideally we will not rely on user agent, but for the moment we do
  public static function paramsFromUserAgent($userAgent) {
      // $$$ using 'embed' here for devices with assumed small screens -- really should just use CSS3 media queries
      $browserParams = array(
          'ipad' => array( 'ui' => 'touch' ),
          'iphone' => array( 'ui' => 'embed', 'mode' => '1up' ),
          'android' => array( ), // Presence of this OS doesn't tell us much about device
      );
  
      $browser = BookReader::browserFromUserAgent($userAgent);
      if ($browser) {
          return $browserParams[$browser];
      }
      return array();
  }
  
  public static function parsePath($path) {
    // Parse the BookReader path and return the parts
    // e.g. itemid/some/sub/dir/page/cover.jpg -> array( 'identifier' => 'itemid', 'subPrefix' => 'some/sub/dir',
    //            'operator' => 'page', 'filename' => 'cover.jpg')
    
    $parts = array();
    
    // Pull off query, e.g. ?foo=bar
    if (preg_match('#(.*?)(\?.*)#', $path, $matches) === 1) {
        $parts['query'] = $matches[2];
        $path = $matches[1];
    }
    
    // Pull off identifier
    if (preg_match('#[^/&?]+#', $path, $matches) === 0) {
        // no match
        return $parts;
    }
    $parts['identifier'] = $matches[0];
    $path = substr($path, strlen($matches[0]));
    
    // Look for operators
    // The sub-prefix can be arbitrary, so we match up until the first operator
    $operators = '(' . join('|', self::$downloadOperators) . ')';
    $pattern = '#(?P<subPrefix>.*?)/(?P<operator>' . $operators . ')/(?P<operand>.*)#';
    if (preg_match($pattern, $path, $matches) === 1) {
        $parts['subPrefix'] = substr($matches['subPrefix'], 1); // remove leading '/'
        $parts['operator'] = $matches['operator'];
        $parts['operand'] = $matches['operand'];
    } else {
        $parts['subPrefix'] = $path;
    }
    
    return $parts;
  }
    
}

?>
