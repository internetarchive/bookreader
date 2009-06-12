<?

class GnuBook
{
  public static function draw($server, $mainDir, $identifier, $title,
                              $coverleaf=null, $titlestart='Internet Archive')
  {
    // Set title to default if not set
    if (!$title) {
        $title = 'Bookreader';
    }
    
    $id = $identifier;
    
    // manually update with Launchpad version number at each checkin so that browsers
    // do not use old cached version
    // see https://bugs.launchpad.net/gnubook/+bug/330748
    $version = "0.9.7";
    
    if ("" == $id) {
        echo "No identifier specified!";
        die(-1);
    }
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <title><? echo $title; ?></title>
<!--[if lte IE 6]>
    <meta http-equiv="refresh" content="2; URL=/bookreader/browserunsupported.php?id=<? echo($id); ?>">
<![endif]-->
    <link rel="stylesheet" type="text/css" href="/bookreader/GnuBook.css?v=<? echo($version); ?>">    
    <script src="http://www.archive.org/includes/jquery-1.2.6.min.js" type="text/javascript"></script>
        <script type="text/javascript" src="/bookreader/GnuBook.js?v=<? echo($version); ?>"></script>
    <script type="text/javascript" src="/bookreader/jquery.easing.1.3.js"></script>
</head>
<body style="background-color: #FFFFFF;">

<div id="GnuBook" style="left:10px; right:200px; top:10px; bottom:2em;">x</div>

<script type="text/javascript">
  // Set some config variables -- $$$ NB: Config object format has not been finalized
  var gbConfig = {};
  gbConfig.mode = 2;
</script>
<script type="text/javascript" src="/bookreader/GnuBookJSLocate.php?id=<?echo $id;?>"></script>

<div id="GnuBookSearch" style="width:190px; right:0px; top:10px; bottom:2em;">
    <form action='javascript:' onsubmit="gb.search($('#GnuBookSearchBox').val());">
        <p style="display: inline">
            <input id="GnuBookSearchBox" type="text" size="20" value="search..." onfocus="if('search...'==this.value)this.value='';" /><input type="submit" value="go" />
        </p>
    </form>
    <div id="GnuBookSearchResults">
        Search results
    </div>
</div>


<div id="GBfooter">
    <div class="GBlogotype">
        <a href="http://archive.org/" class="GBblack">Internet Archive</a>
    </div>
    <div class="GBnavlinks">
        <!-- <a class="GBblack" href="http://openlibrary.org/dev/docs/bookreader">About the Bookreader</a> | -->
        <a class="GBblack" href="https://bugs.launchpad.net/bookserver/+filebug-advanced">Report Errors</a> |
        <a class="GBblack" href="http://www.archive.org/details/texts">Texts Collection</a> |
        <a class="GBblack" href="http://www.archive.org/about/contact.php">Contact Us</a>
    </div>
</div>

<script type="text/javascript">
    // $$$ hack to workaround sizing bug when starting in two-up mode
    $(document).ready(function() {
        $(window).trigger('resize');
    });
</script>
  <?
    exit;
  }
}
  ?>
