function BookReader2UpView() {
  // should be a better way to do this...
  $.extend(this, {
    reader : null,
    container: null,
    reduce: 1,
    currentIndex : 0,
    currentIndexL : null,
    currentIndexR : null,
    prefetchedImgs : null,
    coverInternalPadding : 0, // Width of cover
    coverExternalPadding : 0, // Padding outside of cover
    bookSpineDivWidth : 64, // Width of book spine  $$$ consider sizing based on book length,
    autofit : 'auto'
  })
}

BookReader2UpView.prototype.init = function(reader, targetElement) {
  
  this.reader = reader;
  this.container = $(targetElement);
  
  this.prefetchedImgs = {};
  
  // subscribe to events
  $(this.reader.parentElement).bind("br_indexUpdated.bookreader2up", { self: this },
    function(e, params) {
      e.data.self.jumpToIndex(params.newIndex);
    }
  );

  $(this.reader.parentElement).bind("br_redraw.bookreader2up", { self: this },
    function(e, params) {
      e.data.self.refresh(params);
    }
  );
    
}

BookReader2UpView.prototype.refresh = function(params) {
  // is this a method or an event?
  $(this.container).empty();
  $(this.container).css('overflow', 'auto');
  
  console.log("REFRESH CALLED");
  
  //var targetLeaf = this.displayedIndices[0];
  var targetLeaf = this.reader.firstIndex;

  if (targetLeaf < this.firstDisplayableIndex()) {
      targetLeaf = this.firstDisplayableIndex();
  }
  
  if (targetLeaf > this.lastDisplayableIndex()) {
      targetLeaf = this.lastDisplayableIndex();
  }
  
  var currentSpreadIndices = this.reader.getSpreadIndices(targetLeaf);
  this.currentIndexL = currentSpreadIndices[0];
  this.currentIndexR = currentSpreadIndices[1];
  //this.firstIndex = this.currentIndexL;
  
  this.calculateSpreadSize(); //sets twoPage.width, twoPage.height and others

  this.pruneUnusedImgs();
  this.prefetch(); // Preload images or reload if scaling has changed
  
  // Add the two page view
  // $$$ Can we get everything set up and then append?
  this.wrapped = $('<div id="BRtwopageview" style="border: 4px solid red"></div>').appendTo($(this.container));
  
  // Attaches to first child, so must come after we add the page view
  //$('#BRcontainer').dragscrollable();
  this.reader.bindGestures(this.container);

  // $$$ calculate first then set
  $(this.wrapped).css( {
      height: this.totalHeight + 'px',
      width: this.totalWidth + 'px',
      position: 'absolute'
      });
  
  var centerPercentageX, centerPercentageY;
  // If there will not be scrollbars (e.g. when zooming out) we center the book
  // since otherwise the book will be stuck off-center
  if (this.totalWidth < $(this.wrapped).attr('clientWidth')) {
      centerPercentageX = 0.5;
  }
  if (this.totalHeight < $(this.wrapped).attr('clientHeight')) {
      centerPercentageY = 0.5;
  }

  this.twoPageCenterView(centerPercentageX, centerPercentageY);

  this.coverDiv = document.createElement('div');
  $(this.coverDiv).attr('id', 'BRbookcover').css({
      width:  this.bookCoverDivWidth + 'px',
      height: this.bookCoverDivHeight+'px',
      visibility: 'visible'
  }).appendTo(this.wrapped);

  this.leafEdgeR = document.createElement('div');
  this.leafEdgeR.className = 'BRleafEdgeR';
  $(this.leafEdgeR).css({
      width: this.leafEdgeWidthR + 'px',
      height: this.height + 'px',
      left: this.gutter+this.scaledWR+'px',
      top: this.bookCoverDivTop+this.coverInternalPadding+'px'
  }).appendTo(this.wrapped);

  this.leafEdgeL = document.createElement('div');
  this.leafEdgeL.className = 'BRleafEdgeL';
  $(this.leafEdgeL).css({
      width: this.leafEdgeWidthL + 'px',
      height: this.height + 'px',
      left: this.bookCoverDivLeft+this.coverInternalPadding+'px',
      top: this.bookCoverDivTop+this.coverInternalPadding+'px'
  }).appendTo(this.wrapped);

  div = document.createElement('div');
  $(div).attr('id', 'BRgutter').css({
      width:           this.bookSpineDivWidth+'px',
      height:          this.bookSpineDivHeight+'px',
      left:            (this.gutter - this.bookSpineDivWidth*0.5)+'px',
      top:             this.bookSpineDivTop+'px'
  }).appendTo(this.wrapped);

  this.prepareTwoPagePopUp();

  this.displayedIndices = [];
  this.draw();

  this.prefetch();
  
}

// lastDisplayableIndex
//______________________________________________________________________________
// Returns the index of the last visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as pa  rt of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader2UpView.prototype.lastDisplayableIndex = function() {

    var lastIndex = this.reader.numLeafs - 1;
    
    if ('rl' != this.pageProgression) {
        // LTR
        if (this.reader.getPageSide(lastIndex) == 'R') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    } else {
        // RTL
        if (this.reader.getPageSide(lastIndex) == 'L') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    }
}

BookReader2UpView.prototype.firstDisplayableIndex = function() {

    if ('rl' != this.reader.pageProgression) {
        // LTR
        if (this.reader.getPageSide(0) == 'L') {
            return 0;
        } else {
            return -1;
        }
    } else {
        // RTL
        if (this.reader.getPageSide(0) == 'R') {
            return 0;
        } else {
            return -1;
        }
    }
}

// calculateSpreadSize()
//______________________________________________________________________________
// Calculates 2-page spread dimensions based on this.currentIndexL and
// this.currentIndexR
// This function sets this.height, twoPage.width

BookReader2UpView.prototype.calculateSpreadSize = function() {

    var firstIndex  = this.currentIndexL;
    var secondIndex = this.currentIndexR;
    //console.log('first page is ' + firstIndex);

    // Calculate page sizes and total leaf width
    var spreadSize;
    if ( this.autofit) {    
        spreadSize = this.reader.getIdealSpreadSize(firstIndex, secondIndex);
    } else {
        // set based on reduction factor
        spreadSize = this.reader.getSpreadSizeFromReduce(firstIndex, secondIndex, this.reduce);
    }
        
    // Both pages together
    this.height = spreadSize.height;
    this.width = spreadSize.width;
    
    // Individual pages
    this.scaledWL = this.getPageWidth2UP(firstIndex);
    this.scaledWR = this.getPageWidth2UP(secondIndex);
    
    // Leaf edges
    this.edgeWidth = spreadSize.totalLeafEdgeWidth; // The combined width of both edges
    this.leafEdgeWidthL = this.leafEdgeWidth(this.currentIndexL);
    this.leafEdgeWidthR = this.edgeWidth - this.leafEdgeWidthL;
    
    this.gutter = this.middle + this.gutterOffsetForIndex(firstIndex);
    
    // Book cover
    // The width of the book cover div.  The combined width of both pages, twice the width
    // of the book cover internal padding (2*10) and the page edges
    this.bookCoverDivWidth = this.twoPageCoverWidth(this.scaledWL + this.scaledWR);
    // The height of the book cover div
    this.bookCoverDivHeight = this.height + 2 * this.coverInternalPadding;
    
    
    // We calculate the total width and height for the div so that we can make the book
    // spine centered
    var leftGutterOffset = this.gutterOffsetForIndex(firstIndex);
    var leftWidthFromCenter = this.scaledWL - leftGutterOffset + this.leafEdgeWidthL;
    var rightWidthFromCenter = this.scaledWR + leftGutterOffset + this.leafEdgeWidthR;
    var largestWidthFromCenter = Math.max( leftWidthFromCenter, rightWidthFromCenter );
    this.totalWidth = 2 * (largestWidthFromCenter + this.coverInternalPadding + this.coverExternalPadding);
    this.totalHeight = this.height + 2 * (this.coverInternalPadding + this.coverExternalPadding);
        
    // We want to minimize the unused space in two-up mode (maximize the amount of page
    // shown).  We give width to the leaf edges and these widths change (though the sum
    // of the two remains constant) as we flip through the book.  With the book
    // cover centered and fixed in the BRcontainer div the page images will meet
    // at the "gutter" which is generally offset from the center.
    this.middle = this.totalWidth >> 1;
    this.gutter = this.middle + this.gutterOffsetForIndex(firstIndex);
    
    // The left edge of the book cover moves depending on the width of the pages
    // $$$ change to getter
    this.bookCoverDivLeft = this.gutter - this.scaledWL - this.leafEdgeWidthL - this.coverInternalPadding;
    // The top edge of the book cover stays a fixed distance from the top
    this.bookCoverDivTop = this.coverExternalPadding;

    // Book spine
    this.bookSpineDivHeight = this.height + 2*this.coverInternalPadding;
    this.bookSpineDivLeft = this.middle - (this.bookSpineDivWidth >> 1);
    this.bookSpineDivTop = this.bookCoverDivTop;


    this.reduce = spreadSize.reduce; // $$$ really set this here?
}

// gutterOffsetForIndex
//______________________________________________________________________________
//
// Returns the gutter offset for the spread containing the given index.
// This function supports RTL
BookReader2UpView.prototype.gutterOffsetForIndex = function(pindex) {

    // To find the offset of the gutter from the middle we calculate our percentage distance
    // through the book (0..1), remap to (-0.5..0.5) and multiply by the total page edge width
    var offset = parseInt(((pindex / this.reader.numLeafs) - 0.5) * this.edgeWidth);
    
    // But then again for RTL it's the opposite
    if ('rl' == this.reader.pageProgression) {
        offset = -offset;
    }
    
    return offset;
}

// leafEdgeWidth
//______________________________________________________________________________
// Returns the width of the leaf edge div for the page with index given
BookReader2UpView.prototype.leafEdgeWidth = function(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.reader.getPageSide(pindex) == 'L') && (this.reader.pageProgression != 'rl')) {
        return parseInt( (pindex/this.reader.numLeafs) * this.edgeWidth + 0.5);
    } else {
        return parseInt( (1 - pindex/this.reader.numLeafs) * this.edgeWidth + 0.5);
    }
}

BookReader2UpView.prototype.jumpToIndex = function(index) {
  // really needs to figure out if params.index is on R or L
  var currentSpreadIndices = this.reader.getSpreadIndices(index);
  this.currentIndexL = currentSpreadIndices[0];
  this.currentIndexR = currentSpreadIndices[1];
  this.draw();
}

BookReader2UpView.prototype.right = function(params) {
  // figure out next index
  if ( this.currentIndexL + 2 > this.reader.numLeafs - 1 ) {
    // noop
    return;
  }
  var index = this.currentIndexL + 2;
  
  // send event
  br.jumpToIndex(index);
}

BookReader2UpView.prototype.left = function(params) {
  // figure out next index
  if ( this.currentIndexR - 2 < 0 ) {
    // noop
    return;
  }
  var index = this.currentIndexL - 2;
  
  br.jumpToIndex(index);
}

// drawLeafsTwoPage()
//______________________________________________________________________________
BookReader2UpView.prototype.draw = function() {
    var scrollTop = $(this.wrapped).attr('scrollTop');
    var scrollBottom = scrollTop + $(this.wrapped).height();
    
    // $$$ we should use calculated values in this.twoPage (recalc if necessary)
    
    var indexL = this.currentIndexL;
        
    var heightL  = this.reader._getPageHeight(indexL); 
    var widthL   = this.reader._getPageWidth(indexL);

    var leafEdgeWidthL = this.leafEdgeWidth(indexL);
    var leafEdgeWidthR = this.edgeWidth - leafEdgeWidthL;
    //var bookCoverDivWidth = this.width*2 + 20 + this.edgeWidth; // $$$ hardcoded cover width
    var bookCoverDivWidth = this.bookCoverDivWidth;
    //console.log(leafEdgeWidthL);

    var middle = this.middle; // $$$ getter instead?
    var top = this.twoPageTop();
    var bookCoverDivLeft = this.bookCoverDivLeft;

    this.scaledWL = this.getPageWidth2UP(indexL);
    this.gutter = this.twoPageGutter();
    
    // $(this.wrapped).empty();
    $(this.wrapped).find(".BRpageimage").remove();
    
    this.prefetchImg(indexL);
    $(this.prefetchedImgs[indexL]).css({
        position: 'absolute',
        left: this.gutter-this.scaledWL+'px',
        right: '',
        top:    top+'px',
        height: this.height +'px', // $$$ height forced the same for both pages
        width:  this.scaledWL + 'px',
        zIndex: 2
    }).appendTo(this.wrapped);
    
    var indexR = this.currentIndexR;
    var heightR  = this.reader._getPageHeight(indexR); 
    var widthR   = this.reader._getPageWidth(indexR);

    // $$$ should use getwidth2up?
    //var scaledWR = this.height*widthR/heightR;
    this.scaledWR = this.getPageWidth2UP(indexR);
    this.prefetchImg(indexR);
    $(this.prefetchedImgs[indexR]).css({
        position: 'absolute',
        left:   this.gutter+'px',
        right: '',
        top:    top+'px',
        height: this.height + 'px', // $$$ height forced the same for both pages
        width:  this.scaledWR + 'px',
        zIndex: 2
    }).appendTo(this.wrapped);
        

    this.displayedIndices = [this.currentIndexL, this.currentIndexR];
    this.setMouseHandlers2UP();
    this.twoPageSetCursor();

}

// setMouseHandlers2UP
//______________________________________________________________________________
BookReader2UpView.prototype.setMouseHandlers2UP = function() {
    this.setClickHandler2UP( this.prefetchedImgs[this.currentIndexL],
        { self: this },
        function(e) {
            if (e.which == 3) {
                // right click
                if (e.data.self.reader.protected) {
                    return false;
                }
                return true;
            }
                        
             if (! e.data.self.twoPageIsZoomedIn()) {
                //e.data.self.reader.ttsStop();
                e.data.self.left();                
            }
            e.preventDefault();
        }
    );
        
    this.setClickHandler2UP( this.prefetchedImgs[this.currentIndexR],
        { self: this },
        function(e) {
            if (e.which == 3) {
                // right click
                if (e.data.self.reader.protected) {
                    return false;
                }
                return true;
            }
            
            if (! e.data.self.twoPageIsZoomedIn()) {
                //e.data.self.ttsStop();
                e.data.self.right();                
            }
            e.preventDefault();
        }
    );
}

BookReader2UpView.prototype.setClickHandler2UP = function( element, data, handler) {
    //console.log('setting handler');
    //console.log(element.tagName);
    
    $(element).unbind('click').bind('click', data, function(e) {
        handler(e);
    });
}

// twoPageIsZoomedIn
//______________________________________________________________________________
// Returns true if the pages extend past the edge of the view
BookReader2UpView.prototype.twoPageIsZoomedIn = function() {
    var autofitReduce = this.twoPageGetAutofitReduce();
    var isZoomedIn = false;
    if (this.autofit != 'auto') {
        if (this.reduce < this.twoPageGetAutofitReduce()) {                
            isZoomedIn = true;
        }
    }
    return isZoomedIn;
}

// twoPageGetAutofitReduce()
//______________________________________________________________________________
// Returns the current ideal reduction factor
BookReader2UpView.prototype.twoPageGetAutofitReduce = function() {
    var spreadSize = this.reader.getIdealSpreadSize(this.currentIndexL, this.currentIndexR);
    return spreadSize.reduce;
}

// twoPageGutter()
//______________________________________________________________________________
// Returns the position of the gutter (line between the page images)
BookReader2UpView.prototype.twoPageGutter = function() {
    return this.middle + this.gutterOffsetForIndex(this.currentIndexL);
}

// twoPageTop()
//______________________________________________________________________________
// Returns the offset for the top of the page images
BookReader2UpView.prototype.twoPageTop = function() {
    return this.coverExternalPadding + this.coverInternalPadding; // $$$ + border?
}

// twoPageCoverWidth()
//______________________________________________________________________________
// Returns the width of the cover div given the total page width
BookReader2UpView.prototype.twoPageCoverWidth = function(totalPageWidth) {
    return totalPageWidth + this.edgeWidth + 2*this.coverInternalPadding;
}

// twoPageGetViewCenter()
//______________________________________________________________________________
// Returns the percentage offset into twopageview div at the center of container div
// { percentageX: float, percentageY: float }
BookReader2UpView.prototype.twoPageGetViewCenter = function() {
    var center = {};

    var containerOffset = $(this.container).offset();
    var viewOffset = $(this.wrapped).offset();
    center.percentageX = (containerOffset.left - viewOffset.left + ($(this.container).attr('clientWidth') >> 1)) / this.totalWidth;
    center.percentageY = (containerOffset.top - viewOffset.top + ($(this.container).attr('clientHeight') >> 1)) / this.totalHeight;
    
    return center;
}

// twoPageCenterView(percentageX, percentageY)
//______________________________________________________________________________
// Centers the point given by percentage from left,top of twopageview
BookReader2UpView.prototype.twoPageCenterView = function(percentageX, percentageY) {
    if ('undefined' == typeof(percentageX)) {
        percentageX = 0.5;
    }
    if ('undefined' == typeof(percentageY)) {
        percentageY = 0.5;
    }

    var viewWidth = $(this.wrapped).width();
    var containerClientWidth = $(this.container).attr('clientWidth');
    var intoViewX = percentageX * viewWidth;
    
    var viewHeight = $(this.wrapped).height();
    var containerClientHeight = $(this.container).attr('clientHeight');
    var intoViewY = percentageY * viewHeight;
    
    if (viewWidth < containerClientWidth) {
        // Can fit width without scrollbars - center by adjusting offset
        $(this.wrapped).css('left', (containerClientWidth >> 1) - intoViewX + 'px');    
    } else {
        // Need to scroll to center
        $(this.wrapped).css('left', 0);
        $(this.container).scrollLeft(intoViewX - (containerClientWidth >> 1));
    }
    
    if (viewHeight < containerClientHeight) {
        // Fits with scrollbars - add offset
        $(this.wrapped).css('top', (containerClientHeight >> 1) - intoViewY + 'px');
    } else {
        $(this.wrapped).css('top', 0);
        $(this.container).scrollTop(intoViewY - (containerClientHeight >> 1));
    }
}

// pruneUnusedImgs()
//______________________________________________________________________________
BookReader2UpView.prototype.pruneUnusedImgs = function() {
    //console.log('current: ' + this.twoPage.currentIndexL + ' ' + this.twoPage.currentIndexR);
    for (var key in this.prefetchedImgs) {
        //console.log('key is ' + key);
        if ((key != this.currentIndexL) && (key != this.currentIndexR)) {
            //console.log('removing key '+ key);
            $(this.prefetchedImgs[key]).remove();
        }
        if ((key < this.currentIndexL-4) || (key > this.currentIndexR+4)) {
            //console.log('deleting key '+ key);
            delete this.prefetchedImgs[key];
        }
    }
}

// prefetch()
//______________________________________________________________________________
BookReader2UpView.prototype.prefetch = function() {

    // $$$ We should check here if the current indices have finished
    //     loading (with some timeout) before loading more page images
    //     See https://bugs.edge.launchpad.net/bookreader/+bug/511391

    // prefetch visible pages first
    this.prefetchImg(this.currentIndexL);
    this.prefetchImg(this.currentIndexR);
        
    var adjacentPagesToLoad = 3;
    
    var lowCurrent = Math.min(this.currentIndexL, this.currentIndexR);
    var highCurrent = Math.max(this.currentIndexL, this.currentIndexR);
        
    var start = Math.max(lowCurrent - adjacentPagesToLoad, 0);
    var end = Math.min(highCurrent + adjacentPagesToLoad, this.numLeafs - 1);
    
    // Load images spreading out from current
    for (var i = 1; i <= adjacentPagesToLoad; i++) {
        var goingDown = lowCurrent - i;
        if (goingDown >= start) {
            this.prefetchImg(goingDown);
        }
        var goingUp = highCurrent + i;
        if (goingUp <= end) {
            this.prefetchImg(goingUp);
        }
    }

    /*
    var lim = this.twoPage.currentIndexL-4;
    var i;
    lim = Math.max(lim, 0);
    for (i = lim; i < this.twoPage.currentIndexL; i++) {
        this.prefetchImg(i);
    }
    
    if (this.numLeafs > (this.twoPage.currentIndexR+1)) {
        lim = Math.min(this.twoPage.currentIndexR+4, this.numLeafs-1);
        for (i=this.twoPage.currentIndexR+1; i<=lim; i++) {
            this.prefetchImg(i);
        }
    }
    */
}

// prefetchImg()
//______________________________________________________________________________
BookReader2UpView.prototype.prefetchImg = function(index) {
    var pageURI = this.reader._getPageURI(index);

    // Load image if not loaded or URI has changed (e.g. due to scaling)
    var loadImage = false;
    if (undefined == this.prefetchedImgs[index]) {
        //console.log('no image for ' + index);
        loadImage = true;
    } else if (pageURI != this.prefetchedImgs[index].uri) {
        //console.log('uri changed for ' + index);
        loadImage = true;
    }
    
    if (loadImage) {
        //console.log('prefetching ' + index);
        var img = document.createElement("img");
        $(img).addClass('BRpageimage').addClass('BRnoselect');
        if (index < 0 || index > (this.reader.numLeafs - 1) ) {
            // Facing page at beginning or end, or beyond
            $(img).css({
                'background-color': '#efefef'
            });
        }
        img.src = pageURI;
        img.uri = pageURI; // browser may rewrite src so we stash raw URI here
        this.prefetchedImgs[index] = img;
    }
}

// getPageWidth2UP()
//______________________________________________________________________________
BookReader2UpView.prototype.getPageWidth2UP = function(index) {
    // We return the width based on the dominant height
    var height  = this.reader._getPageHeight(index); 
    var width   = this.reader._getPageWidth(index);    
    return Math.floor(this.height*width/height); // $$$ we assume width is relative to current spread
}    

// twoPageSetCursor()
//______________________________________________________________________________
// Set the cursor for two page view
BookReader2UpView.prototype.twoPageSetCursor = function() {
    // console.log('setting cursor');
    if ( ($(self.wrapped).width() > $(self.container).attr('clientWidth')) ||
         ($(self.wrapped).height() > $(self.container).attr('clientHeight')) ) {
        $(this.prefetchedImgs[this.currentIndexL]).css('cursor','move');
        $(this.prefetchedImgs[this.currentIndexR]).css('cursor','move');
    } else {
        $(this.prefetchedImgs[this.currentIndexL]).css('cursor','');
        $(this.prefetchedImgs[this.currentIndexR]).css('cursor','');
    }
}

// prepareTwoPagePopUp()
//
// This function prepares the "View Page n" popup that shows while the mouse is
// over the left/right "stack of sheets" edges.  It also binds the mouse
// events for these divs.
//______________________________________________________________________________
BookReader2UpView.prototype.prepareTwoPagePopUp = function() {

    this.twoPagePopUp = document.createElement('div');
    this.twoPagePopUp.className = 'BRtwoPagePopUp';
    $(this.twoPagePopUp).css({
        zIndex: '1000'
    }).appendTo(this.container);
    $(this.twoPagePopUp).hide();
    
    $(this.leafEdgeL).add(this.leafEdgeR).bind('mouseenter', this, function(e) {
        $(e.data.twoPagePopUp).show();
    });

    $(this.leafEdgeL).add(this.leafEdgeR).bind('mouseleave', this, function(e) {
        $(e.data.twoPagePopUp).hide();
    });

    $(this.leafEdgeL).bind('click', this, function(e) { 
        // e.data.autoStop();
        // e.data.ttsStop();
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        $(e.data.container).trigger("bookreader.jumpToIndex", { index : jumpIndex });
        //e.data.jumpToIndex(jumpIndex);
    });

    $(this.leafEdgeR).bind('click', this, function(e) { 
        // e.data.autoStop();
        // e.data.ttsStop();
        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        $(e.data.container).trigger("bookreader.jumpToIndex", { index : jumpIndex });
        // e.data.jumpToIndex(jumpIndex);    
    });

    $(this.leafEdgeR).bind('mousemove', this, function(e) {

        var jumpIndex = e.data.jumpIndexForRightEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View ' + e.data.reader.getPageName(jumpIndex));
        
        // $$$ TODO: Make sure popup is positioned so that it is in view
        // (https://bugs.edge.launchpad.net/gnubook/+bug/327456)        
        $(e.data.twoPagePopUp).css({
            left: e.pageX- $(e.data.container).offset().left + $(e.data.container).scrollLeft() - 100 + 'px',
            top: e.pageY - $(e.data.container).offset().top + $(e.data.container).scrollTop() + 'px'
        });
    });

    $(this.leafEdgeL).bind('mousemove', this, function(e) {
    
        var jumpIndex = e.data.jumpIndexForLeftEdgePageX(e.pageX);
        $(e.data.twoPagePopUp).text('View '+ e.data.reader.getPageName(jumpIndex));

        // $$$ TODO: Make sure popup is positioned so that it is in view
        //           (https://bugs.edge.launchpad.net/gnubook/+bug/327456)        
        $(e.data.twoPagePopUp).css({
            left: e.pageX - $(e.data.container).offset().left + $(e.data.container).scrollLeft() - $(e.data.twoPagePopUp).width() + 100 + 'px',
            top: e.pageY-$(e.data.container).offset().top + $(e.data.container).scrollTop() + 'px'
        });
    });
}

// jumpIndexForLeftEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the left page edge div)
BookReader2UpView.prototype.jumpIndexForLeftEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR - flipping backward
        var jumpIndex = this.currentIndexL - ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;

        // browser may have resized the div due to font size change -- see https://bugs.launchpad.net/gnubook/+bug/333570        
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.currentIndexL - 2);
        return jumpIndex;

    } else {
        var jumpIndex = this.currentIndexL + ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.currentIndexL + 2, this.lastDisplayableIndex());
        return jumpIndex;
    }
}

// jumpIndexForRightEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the right page edge div)
BookReader2UpView.prototype.jumpIndexForRightEdgePageX = function(pageX) {
    if ('rl' != this.reader.pageProgression) {
        // LTR
        var jumpIndex = this.currentIndexR + (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.currentIndexR + 2, this.lastDisplayableIndex());
        return jumpIndex;
    } else {
        var jumpIndex = this.twoPage.currentIndexR - (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.currentIndexR - 2);
        return jumpIndex;
    }
}

// XXX fix to not use global
//BookReader.registerPlugin(BookReader2UpView);
listOfPlugins.push(BookReader2UpView);