<?php

/**
 * This here puppy is a bandaid ontop of the existing flip book ajax
 * javascript/php implementation to incorporate the ability to exclude
 * add-to-access=false pages from the flip book and still allow search
 * functionality to work properly.
 *
 * We anticipate a bigger and better flip reader to come around soon so we
 * didn't jump in and re-engineer the internals at this juncture
 *
 * The basic idea is we build a map between the new indexes of a sequential
 * ordering of all add-to-access=true pages and the existing indices
 * associated with the actual image, scandata, and djvu.xml pages. We use said
 * map when we (1) construct (an thus renumber and restructure) the flip.zip
 * image sequence and (2) when we associate search results with one such flip
 * book image
 *
 *
 **/

class FlipSearchMap {

  private $flipToLeafMap;
  private $leafToFlipMap;
  private $identifier;
  private $count;
  private $startIndex;
  private $useScandata;
  # $scandata is a DomDocument object
  public function __construct($scandata=null,$identifier=null) {
    $this->useScandata = isset($scandata);
    if (!$this->useScandata) return;

    $this->identifier = $identifier;
    $xpath = new DOMXPath($scandata);
    $xpath->registerNamespace("s", "http://archive.org/scribe/xml");
    $squery = '//s:book/s:pageData/s:page';
    $query = '//book/pageData/page';
    $pages = $xpath->query($squery);

    if($pages->length == 0) {
      $pages = $xpath->query($query);//Hack, xmlns not always supplied in scandata
    }
    $index = null;
    foreach ($pages as $page) { // Find the first access format page

      $access = strtolower(trim($page->getElementsByTagName('addToAccessFormats')->item(0)->nodeValue));

      if("true" != $access) {
	continue;
      }

      $elems = $page->getElementsByTagName('handSide');
      $hand = (($elems->length == 0) ? 'none' : strtolower(trim($elems->item(0)->nodeValue)));
  
      if     ("left" == $hand)
	{ $index = 0; break; }	
      elseif ("right" == $hand)
	{ $index = 1; break; }	
      else
	{ $index = 0; break;
	}
    }

    if(!isset($index)) {
      //echo "Warning: No addToAccessFormats=true in scandata, using all leafs\n";
      $index = 2;//The javascript bookreader must start at 2
    }
    $this->startIndex = $index;
    $this->flipToLeafMap = array(null,null,null);
    $this->leafToFlipMap = array();

    foreach ($pages as $page) {
      $access = strtolower(trim($page->getElementsByTagName('addToAccessFormats')->item(0)->nodeValue));
      $this->leafToFlipMap[$page->getAttribute('leafNum')] = null;
      if("true" == $access) {
	//echo "Flip $index is leaf {$page->getAttribute('leafNum')} on {$page->getElementsByTagName('handSide')->item(0)->nodeValue}\n";
	$this->leafToFlipMap[$page->getAttribute('leafNum')] = sprintf("%04d", $index);
	$this->flipToLeafMap[$index++] = intval($page->getAttribute('leafNum'));
	$this->count++;
	//echo "Pagecount {$this->getPageCount()}\n";
      }
    }
  }

  function useScandata() {return   $this->useScandata;}
  function getPageCount() {return $this->count;}
  function getStartIndex() {return $this->startIndex;}  
  function getAllMappedLeaves() {
    // array_slice to skip non-access pages at the beginning, array_filter to remove any nulls
    // that remain from initialization of the map, and array_values to resequence the keys
    return array_values(array_filter(array_slice($this->flipToLeafMap, $this->startIndex),
                                     'is_numeric'));
  }

  function flipToLeaf($i) {
    if($i < $this->startIndex || $i > $this->getPageCount() + $this->startIndex)
      throw new Exception("Flip map index $i out of bounds");
    return $this->flipToLeafMap[$i];
  }

  /**
   * This takes the result of the flipbook_search.php call, and drops
   * non-access pages and remaps the page indexes
   **/
  function remapSearch($result) {
    if(!$this->useScandata) return $result;
    $naming = new Naming($this->identifier);
    $dom = new DomDocument();
    $dom->loadXML($result);
    $xpath = new DOMXPath($dom);
    $query = '//PAGE';
    $pages = $xpath->query($query);
    foreach($pages as $page) {
      $name = $page->getAttribute('file');
      $leaf = intval($naming->imageIndex('DJVU_XML',$name));
      $idx = $this->leafToFlipMap[$leaf];
      if(isset($idx)) {
	//echo "Reverse mapping $leaf as $idx\n";
	$page->setAttribute('file',"_$idx");//The flipbook js regex looks for the "_"
      }
      else {
	$page->parentNode->removeChild($page);	
      }
    }
    return $dom->saveXML();

  }
  /**
   * A utility for creating the FlipSearchMap from within flipbook_search.php.
   * $searchUrl is provided to flipbook_search.php by the flipbook.php ajax
   * interface. We decode it, find the scandata, and create a FlipSearchMap
   * from it.
   **/
  static function buildSearchMap($searchUrl) {
    $unzip    = configGetValue('bin-unzip');
    $url = urldecode($searchUrl);
    //Another way is for the javascript code to pass in server, itemdir, and identifier directly
    //For now we'll parse the $url passed us.
    #if (!preg_match('|http://\w+.archive.org(/[0-9]+/items/\w+)/(\w+)_djvu.xml$|', $url, $match))
    #if (!preg_match('|(\w+)/(\w+)_djvu.xml$|', $url, $match))      
    if (!preg_match('|(/[0-9]+/items/[\w-]+)/([\w-]+)_djvu.xml$|', $url, $match))
      fatal("Can't get server and identifier from url $url");
    $bookDir = $match[1];
    $identifier = $match[2];
    //Look for the marker indicating a "new" flipbook with scandata usage.
    $naming = new Naming($identifier);
    $zipName = $naming->zipName('FLIP_JPG');
    $handle = popen("$unzip -p $bookDir/$zipName config.xml",'r');
    $config = fgets($handle);
    pclose($handle);
    if("" != $config) {
      $dom = Scandata::getScandataDomDocument($bookDir,$identifier);
      return new FlipSearchMap($dom,$identifier);
    }
    else {
      return new FlipSearchMap();
    }
}

}

?>