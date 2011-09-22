/*
Copyright(c)2008-2009 Internet Archive. Software license AGPL version 3.

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
    
    The BookReader source is hosted at http://github.com/openlibrary/bookreader/

*/

// BookReader()
//______________________________________________________________________________
// After you instantiate this object, you must supply the following
// book-specific functions, before calling init().  Some of these functions
// can just be stubs for simple books.
//  - getPageWidth()
//  - getPageHeight()
//  - getPageURI()
//  - getPageSide()
//  - canRotatePage()
//  - getPageNum()
//  - getSpreadIndices()
// You must also add a numLeafs property before calling init().

var listOfPlugins = [];

function BookReader() {
    


    this.reduce  = 4;
    this.padding = 10;          // Padding in 1up
  this.pageHeight =0;
  this.pageWidth =0;
   this.ui = 'full';           // UI mode
    this.uiAutoHide = false;    // Controls whether nav/toolbar will autohide

    this.imgs = {};
    this.prefetchedImgs = {}; //an object with numeric keys cooresponding to page index
   
  
    
    this.firstIndex = null;
    
    
    // Should be overriden (before init) by custom implmentations.
    this.logoURL = 'http://www.archive.org';
    
    // Base URL for UI images - should be overriden (before init) by
    // custom implementations.
    // $$$ This is the same directory as the images referenced by relative
    //     path in the CSS.  Would be better to automagically find that path.
    this.imagesBaseURL = '/bookreader/images/';
    
    
    // Zoom levels
    // $$$ provide finer grained zooming

    /* The autofit code ensures that fit to width and fit to height will be available */
    this.reductionFactors = [ {reduce: 0.5, autofit: null},
                          {reduce: 1, autofit: null},
                          {reduce: 2, autofit: null},
                          {reduce: 3, autofit: null},
                          {reduce: 4, autofit: null},
                          {reduce: 6, autofit: null} ];



    

    
    // This object/dictionary controls which optional features are enabled
    // XXXmang in progress
    this.features = {
        // search
        // read aloud
        // open library entry
        // table of contents
        // embed/share ui
        // info ui
    };

    
    // XXXmang fix to not use global
    //this.plugins = [];
    this.plugins = listOfPlugins;
    
    return this;
};

(function ($) {
// init()
//______________________________________________________________________________
BookReader.prototype.init = function() {

    var startIndex = undefined;
    this.pageScale = this.reduce; // preserve current reduce
    
    this.parentElement = $('#BookReader'); // XXX hardcoded - in the right place
    
    // Find start index and mode if set in location hash
    var params = {};
    if (window.location.hash) {
        // params explicitly set in URL
        params = this.paramsFromFragment(window.location.hash);
    } else {
        // params not explicitly set, use defaults if we have them
        if ('defaults' in this) {
            params = this.paramsFromFragment(this.defaults);
        }
    }
    
    // Sanitize/process parameters


        
    if ('undefined' != typeof(params.index)) {
        startIndex = params.index;
    } else if ('undefined' != typeof(params.page)) {
        startIndex = this.getPageIndex(params.page);
    }

    if ('undefined' == typeof(startIndex)) {
        if ('undefined' != typeof(this.titleLeaf)) {
            // title leaf is known - but only use as default if book has a few pages
            if (this.numLeafs > 2) {
                startIndex = this.leafNumToIndex(this.titleLeaf);
            }
        }
    }
    
    if ('undefined' == typeof(startIndex)) {
        startIndex = 0;
    }
    
    if ('undefined' != typeof(params.mode)) {
        this.mode = params.mode;
    }
    
    // Set document title -- may have already been set in enclosing html for
    // search engine visibility
    document.title = this.shortTitle(50);
    
    $("#BookReader").empty();
    
    this.initToolbar(this.mode, this.ui); // Build inside of toolbar div
    $("#BookReader").append("<div id='BRcontainer' dir='ltr'></div>");
    $("#BRcontainer").append("<div id='BRpageview'></div>");
 
    
    this.setupKeyListeners();
    this.startLocationPolling();

    $(window).bind('resize', this, function(e) {
        //console.log('resize!');

        if (1 == e.data.mode) {
            //console.log('centering 1page view');
            if (e.data.autofit) {
                e.data.resizePageView();
            }
            e.data.centerPageView();
            $('#BRpageview').empty()
            e.data.displayedIndices = [];
            e.data.updateSearchHilites(); //deletes hilights but does not call remove()            
            e.data.loadLeafs();
        } else if (3 == e.data.mode){
            e.data.prepareThumbnailView();
        } else {
            //console.log('drawing 2 page view');
            
            // We only need to prepare again in autofit (size of spread changes)
            if (e.data.twoPage.autofit) {
                e.data.prepareTwoPageView();
            } else {
                // Re-center if the scrollbars have disappeared
                var center = e.data.twoPageGetViewCenter();
                var doRecenter = false;
                if (e.data.twoPage.totalWidth < $('#BRcontainer').attr('clientWidth')) {
                    center.percentageX = 0.5;
                    doRecenter = true;
                }
                if (e.data.twoPage.totalHeight < $('#BRcontainer').attr('clientHeight')) {
                    center.percentageY = 0.5;
                    doRecenter = true;
                }
                if (doRecenter) {
                    e.data.twoPageCenterView(center.percentageX, center.percentageY);
                }
            }
        }
    });
    
    if (this.protected) {
        $('.BRpagediv1up').live('contextmenu dragstart', this, function(e) {
            return false;
        });
        
        $('.BRpageimage').live('contextmenu dragstart', this, function(e) {
            return false;
        });

        $('.BRpagedivthumb').live('contextmenu dragstart', this, function(e) {
            return false;
        });
        
    }
    
    $('.BRpagediv1up').bind('mousedown', this, function(e) {
        // $$$ the purpose of this is to disable selection of the image (makes it turn blue)
        //     but this also interferes with right-click.  See https://bugs.edge.launchpad.net/gnubook/+bug/362626
        return false;
    });

    // $$$ refactor this so it's enough to set the first index and call preparePageView
    //     (get rid of mode-specific logic at this point)

        
    // Enact other parts of initial params
    this.updateFromParams(params);

    // We init the nav bar after the params processing so that the nav slider knows where
    // it should start (doesn't jump after init)
/*
    if (this.ui == "embed") {
        this.initEmbedNavbar();
    } else {
        this.initNavbar();
    }
*/
    this.bindNavigationHandlers();
    
    // Set strings in the UI
    this.initUIStrings();

    // Start AJAX request for OL data
    if (this.getOpenLibraryRecord) {
        this.getOpenLibraryRecord(this.gotOpenLibraryRecord);
    }
    this.instances = {};
    for (plugin in this.plugins){

    	var thePlugin = new this.plugins[plugin]();
    	
    	// XXX Make some div for the view
    	thePlugin.init(this, $('#BRcontainer'));
    	thePlugin.refresh();
    	
    	this.instances[plugin] = thePlugin;

    }


}

BookReader.prototype.getNumPages = function(){
	// user should provide this function 
	// in config
		
	return this.numLeafs;
}


BookReader.prototype.setupKeyListeners = function() {
    var self = this;
    
    var KEY_PGUP = 33;
    var KEY_PGDOWN = 34;
    var KEY_END = 35;
    var KEY_HOME = 36;

    var KEY_LEFT = 37;
    var KEY_UP = 38;
    var KEY_RIGHT = 39;
    var KEY_DOWN = 40;

    // We use document here instead of window to avoid a bug in jQuery on IE7
    $(document).keydown(function(e) {
    
        // Keyboard navigation        
        if (!self.keyboardNavigationIsDisabled(e)) {
            switch(e.keyCode) {
                case KEY_PGUP:
                case KEY_UP:            
                    // In 1up mode page scrolling is handled by browser
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.prev();
                    }
                    break;
                case KEY_DOWN:
                case KEY_PGDOWN:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.next();
                    }
                    break;
                case KEY_END:
                    e.preventDefault();
                    self.last();
                    break;
                case KEY_HOME:
                    e.preventDefault();
                    self.first();
                    break;
                case KEY_LEFT:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.left();
                    }
                    break;
                case KEY_RIGHT:
                    if (2 == self.mode) {
                        e.preventDefault();
                        self.right();
                    }
                    break;
            }
        }
    });
}

// bindGestures(jElement)
//______________________________________________________________________________
BookReader.prototype.bindGestures = function(jElement) {

    jElement.unbind('gesturechange').bind('gesturechange', function(e) {
        e.preventDefault();
        if (e.originalEvent.scale > 1.5) {
            br.zoom(1);
        } else if (e.originalEvent.scale < 0.6) {
            br.zoom(-1);
        }
    });
}

BookReader.prototype.setClickHandler2UP = function( element, data, handler) {
    //console.log('setting handler');
    //console.log(element.tagName);
    
    $(element).unbind('click').bind('click', data, function(e) {
        handler(e);
    });
}



// jumpToPage()
//______________________________________________________________________________
// Attempts to jump to page.  Returns true if page could be found, false otherwise.
BookReader.prototype.jumpToPage = function(pageNum) {

    var pageIndex;
    
    // Check for special "leaf"
    var re = new RegExp('^leaf(\\d+)');
    leafMatch = re.exec(pageNum);
    if (leafMatch) {
        console.log(leafMatch[1]);
        pageIndex = this.leafNumToIndex(parseInt(leafMatch[1],10));
        if (pageIndex === null) {
            pageIndex = undefined; // to match return type of getPageIndex
        }
        
    } else {
        pageIndex = this.getPageIndex(pageNum);
    }

    if ('undefined' != typeof(pageIndex)) {
        var leafTop = 0;
        var h;
        this.jumpToIndex(pageIndex);
        $('#BRcontainer').attr('scrollTop', leafTop);
        return true;
    }
    
    // Page not found
    return false;
}

// jumpToIndex()
//______________________________________________________________________________
BookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
    
    this.willChangeToIndex(index);
	var targetIndex = index;
    this.parentElement.trigger("br_indexUpdated", {"newIndex":targetIndex});
    
}
BookReader.prototype.getMedianPageSize = function() {
    if (this._medianPageSize) {
        return this._medianPageSize;
    }
    
    // A little expensive but we just do it once
    var widths = [];
    var heights = [];
    for (var i = 0; i < this.numLeafs; i++) {
        widths.push(this.getPageWidth(i));
        heights.push(this.getPageHeight(i));
    }
    
    widths.sort();
    heights.sort();
    
    this._medianPageSize = { width: widths[parseInt(widths.length / 2)], height: heights[parseInt(heights.length / 2)] };
    return this._medianPageSize; 
}


// currentIndex()
//______________________________________________________________________________
// Returns the currently active index.
BookReader.prototype.currentIndex = function() {
    // $$$ we should be cleaner with our idea of which index is active in 1up/2up
    if (this.mode == this.constMode1up || this.mode == this.constModeThumb) {
        return this.firstIndex; // $$$ TODO page in center of view would be better
    } else if (this.mode == this.constMode2up) {
        // Only allow indices that are actually present in book
        return BookReader.util.clamp(this.firstIndex, 0, this.numLeafs - 1);    
    } else {
        throw 'currentIndex called for unimplemented mode ' + this.mode;
    }
}

// setCurrentIndex(index)
//______________________________________________________________________________
// Sets the idea of current index without triggering other actions such as animation.
// Compare to jumpToIndex which animates to that index
BookReader.prototype.setCurrentIndex = function(index) {
    this.firstIndex = index;
}


// right()
//______________________________________________________________________________
// Flip the right page over onto the left
BookReader.prototype.right = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.next();
    } else {
        // RTL
        this.prev();
    }
}

// rightmost()
//______________________________________________________________________________
// Flip to the rightmost page
BookReader.prototype.rightmost = function() {
    if ('rl' != this.pageProgression) {
        this.last();
    } else {
        this.first();
    }
}

// left()
//______________________________________________________________________________
// Flip the left page over onto the right.
BookReader.prototype.left = function() {
    if ('rl' != this.pageProgression) {
        // LTR
        this.prev();
    } else {
        // RTL
        this.next();
    }
}

// leftmost()
//______________________________________________________________________________
// Flip to the leftmost page
BookReader.prototype.leftmost = function() {
    if ('rl' != this.pageProgression) {
        this.first();
    } else {
        this.last();
    }
}

// next()
//______________________________________________________________________________
BookReader.prototype.next = function() {
    if (2 == this.mode) {
        this.autoStop();
        this.flipFwdToIndex(null);
    } else {
        if (this.firstIndex < this.lastDisplayableIndex()) {
            this.jumpToIndex(this.firstIndex+1);
        }
    }
}

// prev()
//______________________________________________________________________________
BookReader.prototype.prev = function() {
    if (2 == this.mode) {
        this.autoStop();
        this.flipBackToIndex(null);
    } else {
        if (this.firstIndex >= 1) {
            this.jumpToIndex(this.firstIndex-1);
        }    
    }
}

BookReader.prototype.first = function() {
    this.jumpToIndex(this.firstDisplayableIndex());
}

BookReader.prototype.last = function() {
    this.jumpToIndex(this.lastDisplayableIndex());
}

// scrollDown()
//______________________________________________________________________________
// Scrolls down one screen view
BookReader.prototype.scrollDown = function() {
    if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
            // Whole pages are visible, scroll whole page only
            return this.next();
        }
    
        $('#BRcontainer').animate(
            { scrollTop: '+=' + this._scrollAmount() + 'px'},
            400, 'easeInOutExpo'
        );
        return true;
    } else {
        return false;
    }
}

// scrollUp()
//______________________________________________________________________________
// Scrolls up one screen view
BookReader.prototype.scrollUp = function() {
    if ($.inArray(this.mode, [this.constMode1up, this.constModeThumb]) >= 0) {
        if ( this.mode == this.constMode1up && (this.reduce >= this.onePageGetAutofitHeight()) ) {
            // Whole pages are visible, scroll whole page only
            return this.prev();
        }

        $('#BRcontainer').animate(
            { scrollTop: '-=' + this._scrollAmount() + 'px'},
            400, 'easeInOutExpo'
        );
        return true;
    } else {
        return false;
    }
}

// _scrollAmount()
//______________________________________________________________________________
// The amount to scroll vertically in integer pixels
BookReader.prototype._scrollAmount = function() {
    if (this.constMode1up == this.mode) {
        // Overlap by % of page size
        return parseInt($('#BRcontainer').attr('clientHeight') - this.getPageHeight(this.currentIndex()) / this.reduce * 0.03);
    }
    
    return parseInt(0.9 * $('#BRcontainer').attr('clientHeight'));
}


// flipBackToIndex()
//______________________________________________________________________________
// to flip back one spread, pass index=null
BookReader.prototype.flipBackToIndex = function(index) {
    
    if (1 == this.mode) return;

    var leftIndex = this.twoPage.currentIndexL;
    
    if (this.animating) return;

    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }
    
    if (null == index) {
        index = leftIndex-2;
    }
    //if (index<0) return;
    
    this.willChangeToIndex(index);
    
    var previousIndices = this.getSpreadIndices(index);
    
    if (previousIndices[0] < this.firstDisplayableIndex() || previousIndices[1] < this.firstDisplayableIndex()) {
        return;
    }
    
    this.animating = true;
    
    if ('rl' != this.pageProgression) {
        // Assume LTR and we are going backward    
        this.prepareFlipLeftToRight(previousIndices[0], previousIndices[1]);        
        this.flipLeftToRight(previousIndices[0], previousIndices[1]);
    } else {
        // RTL and going backward
        var gutter = this.prepareFlipRightToLeft(previousIndices[0], previousIndices[1]);
        this.flipRightToLeft(previousIndices[0], previousIndices[1], gutter);
    }
}

// flipLeftToRight()
//______________________________________________________________________________
// Flips the page on the left towards the page on the right
BookReader.prototype.flipLeftToRight = function(newIndexL, newIndexR) {

    var leftLeaf = this.twoPage.currentIndexL;
    
    var oldLeafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    var newLeafEdgeWidthL = this.leafEdgeWidth(newIndexL);    
    var leafEdgeTmpW = oldLeafEdgeWidthL - newLeafEdgeWidthL;
    
    var currWidthL   = this.getPageWidth2UP(leftLeaf);
    var newWidthL    = this.getPageWidth2UP(newIndexL);
    var newWidthR    = this.getPageWidth2UP(newIndexR);

    var top  = this.twoPageTop();
    var gutter = this.twoPage.middle + this.gutterOffsetForIndex(newIndexL);
    
    //console.log('leftEdgeTmpW ' + leafEdgeTmpW);
    //console.log('  gutter ' + gutter + ', scaledWL ' + scaledWL + ', newLeafEdgeWL ' + newLeafEdgeWidthL);
    
    //animation strategy:
    // 0. remove search highlight, if any.
    // 1. create a new div, called leafEdgeTmp to represent the leaf edge between the leftmost edge 
    //    of the left leaf and where the user clicked in the leaf edge.
    //    Note that if this function was triggered by left() and not a
    //    mouse click, the width of leafEdgeTmp is very small (zero px).
    // 2. animate both leafEdgeTmp to the gutter (without changing its width) and animate
    //    leftLeaf to width=0.
    // 3. When step 2 is finished, animate leafEdgeTmp to right-hand side of new right leaf
    //    (left=gutter+newWidthR) while also animating the new right leaf from width=0 to
    //    its new full width.
    // 4. After step 3 is finished, do the following:
    //      - remove leafEdgeTmp from the dom.
    //      - resize and move the right leaf edge (leafEdgeR) to left=gutter+newWidthR
    //          and width=twoPage.edgeWidth-newLeafEdgeWidthL.
    //      - resize and move the left leaf edge (leafEdgeL) to left=gutter-newWidthL-newLeafEdgeWidthL
    //          and width=newLeafEdgeWidthL.
    //      - resize the back cover (twoPage.coverDiv) to left=gutter-newWidthL-newLeafEdgeWidthL-10
    //          and width=newWidthL+newWidthR+twoPage.edgeWidth+20
    //      - move new left leaf (newIndexL) forward to zindex=2 so it can receive clicks.
    //      - remove old left and right leafs from the dom [pruneUnusedImgs()].
    //      - prefetch new adjacent leafs.
    //      - set up click handlers for both new left and right leafs.
    //      - redraw the search highlight.
    //      - update the pagenum box and the url.
    
    
    var leftEdgeTmpLeft = gutter - currWidthL - leafEdgeTmpW;

    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height + 'px',
        left: leftEdgeTmpLeft + 'px',
        top: top+'px',
        zIndex:1000
    }).appendTo('#BRtwopageview');
    
    //$(this.leafEdgeL).css('width', newLeafEdgeWidthL+'px');
    $(this.leafEdgeL).css({
        width: newLeafEdgeWidthL+'px', 
        left: gutter-currWidthL-newLeafEdgeWidthL+'px'
    });   

    // Left gets the offset of the current left leaf from the document
    var left = $(this.prefetchedImgs[leftLeaf]).offset().left;
    // $$$ This seems very similar to the gutter.  May be able to consolidate the logic.
    var right = $('#BRtwopageview').attr('clientWidth')-left-$(this.prefetchedImgs[leftLeaf]).width()+$('#BRtwopageview').offset().left-2+'px';
    
    // We change the left leaf to right positioning
    // $$$ This causes animation glitches during resize.  See https://bugs.edge.launchpad.net/gnubook/+bug/328327
    $(this.prefetchedImgs[leftLeaf]).css({
        right: right,
        left: ''
    });

    $(this.leafEdgeTmp).animate({left: gutter}, this.flipSpeed, 'easeInSine');    
    //$(this.prefetchedImgs[leftLeaf]).animate({width: '0px'}, 'slow', 'easeInSine');
    
    var self = this;

    this.removeSearchHilites();

    //console.log('animating leafLeaf ' + leftLeaf + ' to 0px');
    $(this.prefetchedImgs[leftLeaf]).animate({width: '0px'}, self.flipSpeed, 'easeInSine', function() {
    
        //console.log('     and now leafEdgeTmp to left: gutter+newWidthR ' + (gutter + newWidthR));
        $(self.leafEdgeTmp).animate({left: gutter+newWidthR+'px'}, self.flipSpeed, 'easeOutSine');
        
        $('#BRgutter').css({left: (gutter - self.twoPage.bookSpineDivWidth*0.5)+'px'});        

        //console.log('  animating newIndexR ' + newIndexR + ' to ' + newWidthR + ' from ' + $(self.prefetchedImgs[newIndexR]).width());
        $(self.prefetchedImgs[newIndexR]).animate({width: newWidthR+'px'}, self.flipSpeed, 'easeOutSine', function() {
            $(self.prefetchedImgs[newIndexL]).css('zIndex', 2);

            //jquery adds display:block to the element style, which interferes with our print css
            $(self.prefetchedImgs[newIndexL]).css('display', '');
            $(self.prefetchedImgs[newIndexR]).css('display', '');
            
            $(self.leafEdgeR).css({
                // Moves the right leaf edge
                width: self.twoPage.edgeWidth-newLeafEdgeWidthL+'px',
                left:  gutter+newWidthR+'px'
            });

            $(self.leafEdgeL).css({
                // Moves and resizes the left leaf edge
                width: newLeafEdgeWidthL+'px',
                left:  gutter-newWidthL-newLeafEdgeWidthL+'px'
            });

            // Resizes the brown border div
            $(self.twoPage.coverDiv).css({
                width: self.twoPageCoverWidth(newWidthL+newWidthR)+'px',
                left: gutter-newWidthL-newLeafEdgeWidthL-self.twoPage.coverInternalPadding+'px'
            });            
            
            $(self.leafEdgeTmp).remove();
            self.leafEdgeTmp = null;

            // $$$ TODO refactor with opposite direction flip
            
            self.twoPage.currentIndexL = newIndexL;
            self.twoPage.currentIndexR = newIndexR;
            self.twoPage.scaledWL = newWidthL;
            self.twoPage.scaledWR = newWidthR;
            self.twoPage.gutter = gutter;
            
            self.firstIndex = self.twoPage.currentIndexL;
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();            
            self.animating = false;
            
            self.updateSearchHilites2UP();
            self.updatePageNumBox2UP();
            
            // self.twoPagePlaceFlipAreas(); // No longer used
            self.setMouseHandlers2UP();
            self.twoPageSetCursor();
            
            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });        
    
}

// flipFwdToIndex()
//______________________________________________________________________________
// Whether we flip left or right is dependent on the page progression
// to flip forward one spread, pass index=null
BookReader.prototype.flipFwdToIndex = function(index) {

    if (this.animating) return;
    
    if (null != this.leafEdgeTmp) {
        alert('error: leafEdgeTmp should be null!');
        return;
    }

    if (null == index) {
        index = this.twoPage.currentIndexR+2; // $$$ assumes indices are continuous
    }
    if (index > this.lastDisplayableIndex()) return;

    this.willChangeToIndex(index);

    this.animating = true;
    
    var nextIndices = this.getSpreadIndices(index);
    
    //console.log('flipfwd to indices ' + nextIndices[0] + ',' + nextIndices[1]);

    if ('rl' != this.pageProgression) {
        // We did not specify RTL
        var gutter = this.prepareFlipRightToLeft(nextIndices[0], nextIndices[1]);
        this.flipRightToLeft(nextIndices[0], nextIndices[1], gutter);
    } else {
        // RTL
        var gutter = this.prepareFlipLeftToRight(nextIndices[0], nextIndices[1]);
        this.flipLeftToRight(nextIndices[0], nextIndices[1]);
    }
}

/*
 * Put handlers here for when we will navigate to a new page
 */

BookReader.prototype.willChangeToIndex = function(index)
{
    // Update navbar position icon - leads page change animation
//    this.updateNavIndex(index);
}


// flipRightToLeft(nextL, nextR, gutter)
// $$$ better not to have to pass gutter in
//______________________________________________________________________________
// Flip from left to right and show the nextL and nextR indices on those sides
BookReader.prototype.flipRightToLeft = function(newIndexL, newIndexR) {
    var oldLeafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
    var oldLeafEdgeWidthR = this.twoPage.edgeWidth-oldLeafEdgeWidthL;
    var newLeafEdgeWidthL = this.leafEdgeWidth(newIndexL);  
    var newLeafEdgeWidthR = this.twoPage.edgeWidth-newLeafEdgeWidthL;

    var leafEdgeTmpW = oldLeafEdgeWidthR - newLeafEdgeWidthR;

    var top = this.twoPageTop();
    var scaledW = this.getPageWidth2UP(this.twoPage.currentIndexR);

    var middle = this.twoPage.middle;
    var gutter = middle + this.gutterOffsetForIndex(newIndexL);
    
    this.leafEdgeTmp = document.createElement('div');
    this.leafEdgeTmp.className = 'BRleafEdgeTmp';
    $(this.leafEdgeTmp).css({
        width: leafEdgeTmpW + 'px',
        height: this.twoPage.height + 'px',
        left: gutter+scaledW+'px',
        top: top+'px',    
        zIndex:1000
    }).appendTo('#BRtwopageview');

    //var scaledWR = this.getPageWidth2UP(newIndexR); // $$$ should be current instead?
    //var scaledWL = this.getPageWidth2UP(newIndexL); // $$$ should be current instead?
    
    var currWidthL = this.getPageWidth2UP(this.twoPage.currentIndexL);
    var currWidthR = this.getPageWidth2UP(this.twoPage.currentIndexR);
    var newWidthL = this.getPageWidth2UP(newIndexL);
    var newWidthR = this.getPageWidth2UP(newIndexR);
    
    $(this.leafEdgeR).css({width: newLeafEdgeWidthR+'px', left: gutter+newWidthR+'px' });

    var self = this; // closure-tastic!

    var speed = this.flipSpeed;

    this.removeSearchHilites();
    
    $(this.leafEdgeTmp).animate({left: gutter}, speed, 'easeInSine');    
    $(this.prefetchedImgs[this.twoPage.currentIndexR]).animate({width: '0px'}, speed, 'easeInSine', function() {
        $('#BRgutter').css({left: (gutter - self.twoPage.bookSpineDivWidth*0.5)+'px'});
        $(self.leafEdgeTmp).animate({left: gutter-newWidthL-leafEdgeTmpW+'px'}, speed, 'easeOutSine');    
        $(self.prefetchedImgs[newIndexL]).animate({width: newWidthL+'px'}, speed, 'easeOutSine', function() {
            $(self.prefetchedImgs[newIndexR]).css('zIndex', 2);

            //jquery adds display:block to the element style, which interferes with our print css
            $(self.prefetchedImgs[newIndexL]).css('display', '');
            $(self.prefetchedImgs[newIndexR]).css('display', '');
            
            $(self.leafEdgeL).css({
                width: newLeafEdgeWidthL+'px', 
                left: gutter-newWidthL-newLeafEdgeWidthL+'px'
            });
            
            // Resizes the book cover
            $(self.twoPage.coverDiv).css({
                width: self.twoPageCoverWidth(newWidthL+newWidthR)+'px',
                left: gutter - newWidthL - newLeafEdgeWidthL - self.twoPage.coverInternalPadding + 'px'
            });            
    
            $(self.leafEdgeTmp).remove();
            self.leafEdgeTmp = null;
            
            self.twoPage.currentIndexL = newIndexL;
            self.twoPage.currentIndexR = newIndexR;
            self.twoPage.scaledWL = newWidthL;
            self.twoPage.scaledWR = newWidthR;
            self.twoPage.gutter = gutter;

            self.firstIndex = self.twoPage.currentIndexL;
            self.displayedIndices = [newIndexL, newIndexR];
            self.pruneUnusedImgs();
            self.prefetch();
            self.animating = false;


            self.updateSearchHilites2UP();
            self.updatePageNumBox2UP();
            
            // self.twoPagePlaceFlipAreas(); // No longer used
            self.setMouseHandlers2UP();     
            self.twoPageSetCursor();
            
            if (self.animationFinishedCallback) {
                self.animationFinishedCallback();
                self.animationFinishedCallback = null;
            }
        });
    });    
}

// keyboardNavigationIsDisabled(event)
//   - returns true if keyboard navigation should be disabled for the event
//______________________________________________________________________________
BookReader.prototype.keyboardNavigationIsDisabled = function(event) {
    if (event.target.tagName == "INPUT") {
        return true;
    }   
    return false;
}

// gutterOffsetForIndex
//______________________________________________________________________________
//
// Returns the gutter offset for the spread containing the given index.
// This function supports RTL
BookReader.prototype.gutterOffsetForIndex = function(pindex) {

    // To find the offset of the gutter from the middle we calculate our percentage distance
    // through the book (0..1), remap to (-0.5..0.5) and multiply by the total page edge width
    var offset = parseInt(((pindex / this.numLeafs) - 0.5) * this.twoPage.edgeWidth);
    
    // But then again for RTL it's the opposite
    if ('rl' == this.pageProgression) {
        offset = -offset;
    }
    
    return offset;
}

// leafEdgeWidth
//______________________________________________________________________________
// Returns the width of the leaf edge div for the page with index given
BookReader.prototype.leafEdgeWidth = function(pindex) {
    // $$$ could there be single pixel rounding errors for L vs R?
    if ((this.getPageSide(pindex) == 'L') && (this.pageProgression != 'rl')) {
        return parseInt( (pindex/this.numLeafs) * this.twoPage.edgeWidth + 0.5);
    } else {
        return parseInt( (1 - pindex/this.numLeafs) * this.twoPage.edgeWidth + 0.5);
    }
}

// jumpIndexForLeftEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the left page edge div)
BookReader.prototype.jumpIndexForLeftEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR - flipping backward
        var jumpIndex = this.twoPage.currentIndexL - ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;

        // browser may have resized the div due to font size change -- see https://bugs.launchpad.net/gnubook/+bug/333570        
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexL - 2);
        return jumpIndex;

    } else {
        var jumpIndex = this.twoPage.currentIndexL + ($(this.leafEdgeL).offset().left + $(this.leafEdgeL).width() - pageX) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexL + 2, this.lastDisplayableIndex());
        return jumpIndex;
    }
}

// jumpIndexForRightEdgePageX
//______________________________________________________________________________
// Returns the target jump leaf given a page coordinate (inside the right page edge div)
BookReader.prototype.jumpIndexForRightEdgePageX = function(pageX) {
    if ('rl' != this.pageProgression) {
        // LTR
        var jumpIndex = this.twoPage.currentIndexR + (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.twoPage.currentIndexR + 2, this.lastDisplayableIndex());
        return jumpIndex;
    } else {
        var jumpIndex = this.twoPage.currentIndexR - (pageX - $(this.leafEdgeR).offset().left) * 10;
        jumpIndex = BookReader.util.clamp(Math.round(jumpIndex), this.firstDisplayableIndex(), this.twoPage.currentIndexR - 2);
        return jumpIndex;
    }
}

// initNavbar
//______________________________________________________________________________
// Initialize the navigation bar.
// $$$ this could also add the base elements to the DOM, so disabling the nav bar
//     could be as simple as not calling this function
BookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar
    
    $('#BookReader').append(
        '<div id="BRnav">'
        +     '<div id="BRpage">'   // Page turn buttons
        +         '<button class="BRicon onepg"></button>'
        +         '<button class="BRicon twopg"></button>'
        +         '<button class="BRicon thumb"></button>'
        // $$$ not yet implemented
        //+         '<button class="BRicon fit"></button>'
        +         '<button class="BRicon zoom_in"></button>'
        +         '<button class="BRicon zoom_out"></button>'
        +         '<button class="BRicon book_left"></button>'
        +         '<button class="BRicon book_right"></button>'
        +     '</div>'
        +     '<div id="BRnavpos">' // Page slider and nav line
        //+         '<div id="BRfiller"></div>'
        +         '<div id="BRpager"></div>'  // Page slider
        +         '<div id="BRnavline">'      // Nav line with e.g. chapter markers
        +             '<div class="BRnavend" id="BRnavleft"></div>'
        +             '<div class="BRnavend" id="BRnavright"></div>'
        +         '</div>'     
        +     '</div>'
        +     '<div id="BRnavCntlBtm" class="BRnavCntl BRdn"></div>'
        + '</div>'
    );
    
    var self = this;
    $('#BRpager').slider({    
        animate: true,
        min: 0,
        max: this.numLeafs - 1,
        value: this.currentIndex()
    })
    .bind('slide', function(event, ui) {
        self.updateNavPageNum(ui.value);
        $("#pagenum").show();
        return true;
    })
    .bind('slidechange', function(event, ui) {
        self.updateNavPageNum(ui.value); // hiding now but will show later
        $("#pagenum").hide();
        
        // recursion prevention for jumpToIndex
        if ( $(this).data('swallowchange') ) {
            $(this).data('swallowchange', false);
        } else {
            self.jumpToIndex(ui.value);
        }
        return true;
    })
    .hover(function() {
            $("#pagenum").show();
        },function(){
            // XXXmang not triggering on iPad - probably due to touch event translation layer
            $("#pagenum").hide();
        }
    );
    
    //append icon to handle
    var handleHelper = $('#BRpager .ui-slider-handle')
    .append('<div id="pagenum"><span class="currentpage"></span></div>');
    //.wrap('<div class="ui-handle-helper-parent"></div>').parent(); // XXXmang is this used for hiding the tooltip?
    
    this.updateNavPageNum(this.currentIndex());

    $("#BRzoombtn").draggable({axis:'y',containment:'parent'});
    
    /* Initial hiding
        $('#BRtoolbar').delay(3000).animate({top:-40});
        $('#BRnav').delay(3000).animate({bottom:-53});
        changeArrow();
        $('.BRnavCntl').delay(3000).animate({height:'43px'}).delay(1000).animate({opacity:.25},1000);
    */
}

// initEmbedNavbar
//______________________________________________________________________________
// Initialize the navigation bar when embedded
BookReader.prototype.initEmbedNavbar = function() {
    var thisLink = (window.location + '').replace('?ui=embed',''); // IA-specific
    
    $('#BookReader').append(
        '<div id="BRnav">'
        +   "<span id='BRtoolbarbuttons'>"        
        +         '<button class="BRicon full"></button>'
        +         '<button class="BRicon book_left"></button>'
        +         '<button class="BRicon book_right"></button>'
        +   "</span>"
        +   "<span><a class='logo' href='" + this.logoURL + "' 'target='_blank' ></a></span>"
        +   "<span id='BRembedreturn'><a href='" + thisLink + "' target='_blank' ></a></span>"
        + '</div>'
    );
    $('#BRembedreturn a').text(this.bookTitle);
}

BookReader.prototype.updateNavPageNum = function(index) {
    var pageNum = this.getPageNum(index);
    var pageStr;
    if (pageNum[0] == 'n') { // funny index
        pageStr = index + 1 + ' / ' + this.numLeafs; // Accessible index starts at 0 (alas) so we add 1 to make human
    } else {
        pageStr = 'Page ' + pageNum;
    }
    
    $('#pagenum .currentpage').text(pageStr);
}

/*
 * Update the nav bar display - does not cause navigation.
 */
/*
BookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    $('#BRpager').data('swallowchange', true).slider('value', index);
}
*/

BookReader.prototype.addSearchResult = function(queryString, pageIndex) {
    var pageNumber = this.getPageNum(pageIndex);
    var uiStringSearch = "Search result"; // i18n
    var uiStringPage = "Page"; // i18n
    
    var percentThrough = BookReader.util.cssPercentage(pageIndex, this.numLeafs - 1);
    var pageDisplayString = '';
    if (pageNumber) {
        pageDisplayString = uiStringPage + ' ' + pageNumber;
    }
    
    var re = new RegExp('{{{(.+?)}}}', 'g');    
    queryString = queryString.replace(re, '<a href="#" onclick="br.jumpToIndex('+pageIndex+'); return false;">$1</a>')

    var marker = $('<div class="search" style="top:'+(-$('#BRcontainer').height())+'px; left:' + percentThrough + ';" title="' + uiStringSearch + '"><div class="query">'
        + queryString + '<span>' + uiStringPage + ' ' + pageNumber + '</span></div>')
    .data({'self': this, 'pageIndex': pageIndex })
    .appendTo('#BRnavline').bt({
        contentSelector: '$(this).find(".query")',
        trigger: 'hover',
        closeWhenOthersOpen: true,
        cssStyles: {
            padding: '12px 14px',
            backgroundColor: '#fff',
            border: '4px solid #e2dcc5',
            fontFamily: '"Lucida Grande","Arial",sans-serif',
            fontSize: '13px',
            //lineHeight: '18px',
            color: '#615132'
        },
        shrinkToFit: false,
        width: '230px',
        padding: 0,
        spikeGirth: 0,
        spikeLength: 0,
        overlap: '22px',
        overlay: false,
        killTitle: false, 
        textzIndex: 9999,
        boxzIndex: 9998,
        wrapperzIndex: 9997,
        offsetParent: null,
        positions: ['top'],
        fill: 'white',
        windowMargin: 10,
        strokeWidth: 0,
        cornerRadius: 0,
        centerPointX: 0,
        centerPointY: 0,
        shadow: false
    })
    .hover( function() {
                // remove from other markers then turn on just for this
                // XXX should be done when nav slider moves
                $('.search,.chapter').removeClass('front');
                $(this).addClass('front');
            }, function() {
                $(this).removeClass('front');
            }
    )
    .bind('click', function() {
        $(this).data('self').jumpToIndex($(this).data('pageIndex'));
    });
    
    $(marker).animate({top:'-25px'}, 'slow');

}

BookReader.prototype.removeSearchResults = function() {
    this.removeSearchHilites(); //be sure to set all box.divs to null
    $('#BRnavpos .search').remove();
}

BookReader.prototype.addChapter = function(chapterTitle, pageNumber, pageIndex) {
    var uiStringPage = 'Page'; // i18n

    var percentThrough = BookReader.util.cssPercentage(pageIndex, this.numLeafs - 1);
    
    $('<div class="chapter" style="left:' + percentThrough + ';"><div class="title">'
        + chapterTitle + '<span>|</span> ' + uiStringPage + ' ' + pageNumber + '</div></div>')
    .appendTo('#BRnavline')
    .data({'self': this, 'pageIndex': pageIndex })
    .bt({
        contentSelector: '$(this).find(".title")',
        trigger: 'hover',
        closeWhenOthersOpen: true,
        cssStyles: {
            padding: '12px 14px',
            backgroundColor: '#000',
            border: '4px solid #e2dcc5',
            //borderBottom: 'none',
            fontFamily: '"Arial", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            color: '#fff',
            whiteSpace: 'nowrap'
        },
        shrinkToFit: true,
        width: '200px',
        padding: 0,
        spikeGirth: 0,
        spikeLength: 0,
        overlap: '21px',
        overlay: false,
        killTitle: true, 
        textzIndex: 9999,
        boxzIndex: 9998,
        wrapperzIndex: 9997,
        offsetParent: null,
        positions: ['top'],
        fill: 'black',
        windowMargin: 10,
        strokeWidth: 0,
        cornerRadius: 0,
        centerPointX: 0,
        centerPointY: 0,
        shadow: false
    })
    .hover( function() {
            // remove hover effect from other markers then turn on just for this
            $('.search,.chapter').removeClass('front');
                $(this).addClass('front');
            }, function() {
                $(this).removeClass('front');
            }
    )
    .bind('click', function() {
        $(this).data('self').jumpToIndex($(this).data('pageIndex'));
    });
}

/*
 * Remove all chapters.
 */
BookReader.prototype.removeChapters = function() {
    $('#BRnavpos .chapter').remove();
}

/*
 * Update the table of contents based on array of TOC entries.
 */
BookReader.prototype.updateTOC = function(tocEntries) {
    this.removeChapters();
    for (var i = 0; i < tocEntries.length; i++) {
        this.addChapterFromEntry(tocEntries[i]);
    }
}

/*
 *   Example table of contents entry - this format is defined by Open Library
 *   {
 *       "pagenum": "17",
 *       "level": 1,
 *       "label": "CHAPTER I",
 *       "type": {"key": "/type/toc_item"},
 *       "title": "THE COUNTRY AND THE MISSION"
 *   }
 */
BookReader.prototype.addChapterFromEntry = function(tocEntryObject) {
    var pageIndex = this.getPageIndex(tocEntryObject['pagenum']);
    // Only add if we know where it is
    if (pageIndex) {
        this.addChapter(tocEntryObject['title'], tocEntryObject['pagenum'], pageIndex);
    }
    $('.chapter').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
    $('.search').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
    $('.searchChap').each(function(){
        $(this).hover(function(){
            $(this).addClass('front');
        },function(){
            $(this).removeClass('front');
        });
    });
}

BookReader.prototype.initToolbar = function(mode, ui) {
    if (ui == "embed") {
        return; // No toolbar at top in embed mode
    }

    // $$$mang should be contained within the BookReader div instead of body
    var readIcon = '';
    if (!navigator.userAgent.match(/mobile/i)) {
        readIcon = "<button class='BRicon read modal'></button>";
    }
    
    $("#BookReader").append(
          "<div id='BRtoolbar'>"
        +   "<span id='BRtoolbarbuttons'>"
        +     "<form action='javascript:br.search($(\"#textSrch\").val());' id='booksearch'><input type='search' id='textSrch' name='textSrch' val='' placeholder='Search inside'/><button type='submit' id='btnSrch' name='btnSrch'>GO</button></form>"
        +     "<button class='BRicon play'></button>"
        +     "<button class='BRicon pause'></button>"
        +     "<button class='BRicon info'></button>"
        +     "<button class='BRicon share'></button>"
        +     readIcon
        //+     "<button class='BRicon full'></button>"
        +   "</span>"
        +   "<span><a class='logo' href='" + this.logoURL + "'></a></span>"
        +   "<span id='BRreturn'><a></a></span>"
        +   "<div id='BRnavCntlTop' class='BRnabrbuvCntl'></div>"
        + "</div>"
        /*
        + "<div id='BRzoomer'>"
        +   "<div id='BRzoompos'>"
        +     "<button class='BRicon zoom_out'></button>"
        +     "<div id='BRzoomcontrol'>"
        +       "<div id='BRzoomstrip'></div>"
        +       "<div id='BRzoombtn'></div>"
        +     "</div>"
        +     "<button class='BRicon zoom_in'></button>"
        +   "</div>"
        + "</div>"
        */
        );

    // Browser hack - bug with colorbox on iOS 3 see https://bugs.launchpad.net/bookreader/+bug/686220
    if ( navigator.userAgent.match(/ipad/i) && $.browser.webkit && (parseInt($.browser.version, 10) <= 531) ) {
       $('#BRtoolbarbuttons .info').hide();
       $('#BRtoolbarbuttons .share').hide();
    }

    $('#BRreturn a').attr('href', this.bookUrl).text(this.bookTitle);

    $('#BRtoolbar .BRnavCntl').addClass('BRup');
    $('#BRtoolbar .pause').hide();    
    
 
        
    if (ui == "embed" || ui == "touch") {
        $("#BookReader a.logo").attr("target","_blank");
    }

    // $$$ turn this into a member variable
    var jToolbar = $('#BRtoolbar'); // j prefix indicates jQuery object
    
    // We build in mode 2
    jToolbar.append();
        
    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
   
    // $$$ Don't hardcode ids
    var self = this;
    jToolbar.find('.share').colorbox({inline: true, opacity: "0.5", href: "#BRshare", onLoad: function() { self.autoStop(); self.ttsStop(); } });
    jToolbar.find('.info').colorbox({inline: true, opacity: "0.5", href: "#BRinfo", onLoad: function() { self.autoStop(); self.ttsStop(); } });

    $('<div style="display: none;"></div>').append(this.blankShareDiv()).append(this.blankInfoDiv()).appendTo($('body'));

    $('#BRinfo .BRfloatTitle a').attr( {'href': this.bookUrl} ).text(this.bookTitle).addClass('title');
    
    // These functions can be overridden
  //  this.buildInfoDiv($('#BRinfo'));
  //  this.buildShareDiv($('#BRshare'));
    
    // Switch to requested mode -- binds other click handlers
    //this.switchToolbarMode(mode);
    
}

BookReader.prototype.blankInfoDiv = function() {
    return $([
        '<div class="BRfloat" id="BRinfo">',
            '<div class="BRfloatHead">About this book',
                '<a class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
            '<div class="BRfloatBody">',
                '<div class="BRfloatCover">',
                '</div>',
                '<div class="BRfloatMeta">',
                    '<div class="BRfloatTitle">',
                        '<h2><a/></h2>',
                    '</div>',
                '</div>',
            '</div>',
            '<div class="BRfloatFoot">',
                '<a href="http://openlibrary.org/dev/docs/bookreader">About the BookReader</a>',
            '</div>',
        '</div>'].join('\n')
    );
}

BookReader.prototype.blankShareDiv = function() {
    return $([
        '<div class="BRfloat" id="BRshare">',
            '<div class="BRfloatHead">',
                'Share',
                '<a class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
            '</div>',
        '</div>'].join('\n')
    );
}


// switchToolbarMode
//______________________________________________________________________________
// Update the toolbar for the given mode (changes navigation buttons)
// $$$ we should soon split the toolbar out into its own module
BookReader.prototype.switchToolbarMode = function(mode) { 
    if (1 == mode) {
        // 1-up
        $('#BRtoolbar .BRtoolbarzoom').show().css('display', 'inline');
        $('#BRtoolbar .BRtoolbarmode2').hide();
        $('#BRtoolbar .BRtoolbarmode3').hide();
        $('#BRtoolbar .BRtoolbarmode1').show().css('display', 'inline');
    } else if (2 == mode) {
        // 2-up
        $('#BRtoolbar .BRtoolbarzoom').show().css('display', 'inline');
        $('#BRtoolbar .BRtoolbarmode1').hide();
        $('#BRtoolbar .BRtoolbarmode3').hide();
        $('#BRtoolbar .BRtoolbarmode2').show().css('display', 'inline');
    } else {
        // 3-up    
        $('#BRtoolbar .BRtoolbarzoom').hide();
        $('#BRtoolbar .BRtoolbarmode2').hide();
        $('#BRtoolbar .BRtoolbarmode1').hide();
        $('#BRtoolbar .BRtoolbarmode3').show().css('display', 'inline');
    }
}


// bindNavigationHandlers
//______________________________________________________________________________
// Bind navigation handlers
BookReader.prototype.bindNavigationHandlers = function() {

    var self = this; // closure

    jIcons = $('.BRicon');
/*
    jIcons.filter('.onepg').bind('click', function(e) {
        self.switchMode(self.constMode1up);
    });
    
    jIcons.filter('.twopg').bind('click', function(e) {
        self.switchMode(self.constMode2up);
    });

    jIcons.filter('.thumb').bind('click', function(e) {
        self.switchMode(self.constModeThumb);
    });
    
    jIcons.filter('.fit').bind('fit', function(e) {
        // XXXmang implement autofit zoom
    });

    jIcons.filter('.book_left').click(function(e) {
        self.ttsStop();
        self.left();
        return false;
    });
         
    jIcons.filter('.book_right').click(function(e) {
        self.ttsStop();
        self.right();
        return false;
    });
*/        
    jIcons.filter('.book_up').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollUp();
        } else {
            self.prev();
        }
        return false;
    });        
        
    jIcons.filter('.book_down').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollDown();
        } else {
            self.next();
        }
        return false;
    });

    jIcons.filter('.print').click(function(e) {
        self.printPage();
        return false;
    });
    
    // Note: Functionality has been replaced by .share
    jIcons.filter('.embed').click(function(e) {
        self.showEmbedCode();
        return false;
    });

    jIcons.filter('.bookmark').click(function(e) {
        self.showBookmarkCode();
        return false;
    });

    jIcons.filter('.play').click(function(e) {
        self.autoToggle();
        return false;
    });

    jIcons.filter('.pause').click(function(e) {
        self.autoToggle();
        return false;
    });
    
    jIcons.filter('.book_top').click(function(e) {
        self.first();
        return false;
    });

    jIcons.filter('.book_bottom').click(function(e) {
        self.last();
        return false;
    });
    
    jIcons.filter('.book_leftmost').click(function(e) {
        self.leftmost();
        return false;
    });
  
    jIcons.filter('.book_rightmost').click(function(e) {
        self.rightmost();
        return false;
    });

    jIcons.filter('.read').click(function(e) {
        self.ttsToggle();
        return false;
    });
 /*   
    jIcons.filter('.zoom_in').bind('click', function() {
        self.ttsStop();
        self.zoom(1);
        return false;
    });
    
    jIcons.filter('.zoom_out').bind('click', function() {
        self.ttsStop();
        self.zoom(-1);
        return false;
    });
    
    jIcons.filter('.full').bind('click', function() {
        if (self.ui == 'embed') {
            // $$$ bit of a hack, IA-specific
            var url = (window.location + '').replace("?ui=embed","");
            window.open(url);
        }
        
        // Not implemented
    });
    
    $('.BRnavCntl').click(
        function(){
            if ($('#BRnavCntlBtm').hasClass('BRdn')) {
                $('#BRtoolbar').animate({top:-40});
                $('#BRnav').animate({bottom:-55});
                $('#BRnavCntlBtm').addClass('BRup').removeClass('BRdn');
                $('#BRnavCntlTop').addClass('BRdn').removeClass('BRup');
                $('#BRnavCntlBtm.BRnavCntl').animate({height:'45px'});
                $('.BRnavCntl').delay(1000).animate({opacity:.25},1000);
            } else {
                $('#BRtoolbar').animate({top:0});
                $('#BRnav').animate({bottom:0});
                $('#BRnavCntlBtm').addClass('BRdn').removeClass('BRup');
                $('#BRnavCntlTop').addClass('BRup').removeClass('BRdn');
                $('#BRnavCntlBtm.BRnavCntl').animate({height:'30px'});
                $('.BRvavCntl').animate({opacity:1})
            };
        }
    );
    $('#BRnavCntlBtm').mouseover(function(){
        if ($(this).hasClass('BRup')) {
            $('.BRnavCntl').animate({opacity:1},250);
        };
    });
    $('#BRnavCntlBtm').mouseleave(function(){
        if ($(this).hasClass('BRup')) {
            $('.BRnavCntl').animate({opacity:.25},250);
        };
    });

    $('#BRnavCntlTop').mouseover(function(){
        if ($(this).hasClass('BRdn')) {
            $('.BRnavCntl').animate({opacity:1},250);
        };
    });
    $('#BRnavCntlTop').mouseleave(function(){
        if ($(this).hasClass('BRdn')) {
            $('.BRnavCntl').animate({opacity:.25},250);
        };
    });
*/
    
    this.initSwipeData();
    $('#BookReader').die('mousemove.navigation').live('mousemove.navigation',
        { 'br': this },
        this.navigationMousemoveHandler
    );
    
    $('.BRpageimage').die('mousedown.swipe').live('mousedown.swipe',
        { 'br': this },
        this.swipeMousedownHandler
    );
    
    this.bindMozTouchHandlers();
}

// unbindNavigationHandlers
//______________________________________________________________________________
// Unbind navigation handlers
BookReader.prototype.unbindNavigationHandlers = function() {
    $('#BookReader').die('mousemove.navigation');
}

// navigationMousemoveHandler
//______________________________________________________________________________
// Handle mousemove related to navigation.  Bind at #BookReader level to allow autohide.
BookReader.prototype.navigationMousemoveHandler = function(event) {
    // $$$ possibly not great to be calling this for every mousemove
    
    if (event.data['br'].uiAutoHide) {
        var navkey = $(document).height() - 75;
        if ((event.pageY < 76) || (event.pageY > navkey)) {
            // inside or near navigation elements
            event.data['br'].hideNavigation();
        } else {
            event.data['br'].showNavigation();
        }
    }
}

BookReader.prototype.initSwipeData = function(clientX, clientY) {
    /*
     * Based on the really quite awesome "Today's Guardian" at http://guardian.gyford.com/
     */
    this._swipe = {
        mightBeSwiping: false,
        didSwipe: false,
        mightBeDraggin: false,
        didDrag: false,
        startTime: (new Date).getTime(),
        startX: clientX,
        startY: clientY,
        lastX: clientX,
        lastY: clientY,
        deltaX: 0,
        deltaY: 0,
        deltaT: 0
    }
}

BookReader.prototype.swipeMousedownHandler = function(event) {
    //console.log('swipe mousedown');
    //console.log(event);

    var self = event.data['br'];

    // We should be the last bubble point for the page images
    // Disable image drag and select, but keep right-click
    if (event.which == 3) {
        if (self.protected) {
            return false;
        }
        return true;
    }
    
    $(event.target).bind('mouseout.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mouseup.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mousemove.swipe',
        { 'br': self },
        self.swipeMousemoveHandler
    );    
    
    self.initSwipeData(event.clientX, event.clientY);
    self._swipe.mightBeSwiping = true;
    self._swipe.mightBeDragging = true;
    
    event.preventDefault();
    event.returnValue  = false;  
    event.cancelBubble = true;          
    return false;
}

BookReader.prototype.swipeMousemoveHandler = function(event) {
    //console.log('swipe move ' + event.clientX + ',' + event.clientY);

    var _swipe = event.data['br']._swipe;
    if (! _swipe.mightBeSwiping) {
        return;
    }
    
    // Update swipe data
    _swipe.deltaX = event.clientX - _swipe.startX;
    _swipe.deltaY = event.clientY - _swipe.startY;
    _swipe.deltaT = (new Date).getTime() - _swipe.startTime;
    
    var absX = Math.abs(_swipe.deltaX);
    var absY = Math.abs(_swipe.deltaY);
    
    // Minimum distance in the amount of tim to trigger the swipe
    var minSwipeLength = Math.min($('#BookReader').width() / 5, 80);
    var maxSwipeTime = 400;
    
    // Check for horizontal swipe
    if (absX > absY && (absX > minSwipeLength) && _swipe.deltaT < maxSwipeTime) {
        //console.log('swipe! ' + _swipe.deltaX + ',' + _swipe.deltaY + ' ' + _swipe.deltaT + 'ms');
        
        _swipe.mightBeSwiping = false; // only trigger once
        _swipe.didSwipe = true;
        if (event.data['br'].mode == event.data['br'].constMode2up) {
            if (_swipe.deltaX < 0) {
                event.data['br'].right();
            } else {
                event.data['br'].left();
            }
        }
    }
    
    if ( _swipe.deltaT > maxSwipeTime && !_swipe.didSwipe) {
        if (_swipe.mightBeDragging) {        
            // Dragging
            _swipe.didDrag = true;
            $('#BRcontainer')
            .scrollTop($('#BRcontainer').scrollTop() - event.clientY + _swipe.lastY)
            .scrollLeft($('#BRcontainer').scrollLeft() - event.clientX + _swipe.lastX);            
        }
    }
    _swipe.lastX = event.clientX;
    _swipe.lastY = event.clientY;
    
    event.preventDefault();
    event.returnValue  = false;
    event.cancelBubble = true;         
    return false;
}
BookReader.prototype.swipeMouseupHandler = function(event) {
    var _swipe = event.data['br']._swipe;
    //console.log('swipe mouseup - did swipe ' + _swipe.didSwipe);
    _swipe.mightBeSwiping = false;
    _swipe.mightBeDragging = false;

    $(event.target).unbind('mouseout.swipe').unbind('mouseup.swipe').unbind('mousemove.swipe');
    
    if (_swipe.didSwipe || _swipe.didDrag) {
        // Swallow event if completed swipe gesture
        event.preventDefault();
        event.returnValue  = false;
        event.cancelBubble = true;         
        return false;
    }
    return true;
}
BookReader.prototype.bindMozTouchHandlers = function() {
    var self = this;
    
    // Currently only want touch handlers in 2up
    $('#BookReader').bind('MozTouchDown', function(event) {
        //console.log('MozTouchDown ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY);
        if (this.mode == this.constMode2up) {
            event.preventDefault();
        }
    })
    .bind('MozTouchMove', function(event) {
        //console.log('MozTouchMove - ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY)
        if (this.mode == this.constMode2up) { 
            event.preventDefault();
        }
    })
    .bind('MozTouchUp', function(event) {
        //console.log('MozTouchUp - ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY);
        if (this.mode = this.constMode2up) {
            event.preventDefault();
        }
    });
}

// navigationIsVisible
//______________________________________________________________________________
// Returns true if the navigation elements are currently visible
BookReader.prototype.navigationIsVisible = function() {
    // $$$ doesn't account for transitioning states, nav must be fully visible to return true
    var toolpos = $('#BRtoolbar').offset();
    var tooltop = toolpos.top;
    if (tooltop == 0) {
        return true;
    }
    return false;
}

// hideNavigation
//______________________________________________________________________________
// Hide navigation elements, if visible
BookReader.prototype.hideNavigation = function() {
    // Check if navigation is showing
    if (this.navigationIsVisible()) {
        // $$$ don't hardcode height
        $('#BRtoolbar').animate({top:-60});
        $('#BRnav').animate({bottom:-60});
        //$('#BRzoomer').animate({right:-26});
    }
}

// showNavigation
//______________________________________________________________________________
// Show navigation elements
BookReader.prototype.showNavigation = function() {
    // Check if navigation is hidden
    if (!this.navigationIsVisible()) {
        $('#BRtoolbar').animate({top:0});
        $('#BRnav').animate({bottom:0});
        //$('#BRzoomer').animate({right:0});
    }
}

// changeArrow
//______________________________________________________________________________
// Change the nav bar arrow
function changeArrow(){
    setTimeout(function(){
        $('#BRnavCntlBtm').removeClass('BRdn').addClass('BRup');
    },3000);
};


// firstDisplayableIndex
//______________________________________________________________________________
// Returns the index of the first visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as part of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.firstDisplayableIndex = function() {
    if (this.mode != this.constMode2up) {
        return 0;
    }
    
    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(0) == 'L') {
            return 0;
        } else {
            return -1;
        }
    } else {
        // RTL
        if (this.getPageSide(0) == 'R') {
            return 0;
        } else {
            return -1;
        }
    }
}

// lastDisplayableIndex
//______________________________________________________________________________
// Returns the index of the last visible page, dependent on the mode.
// $$$ Currently we cannot display the front/back cover in 2-up and will need to update
// this function when we can as pa  rt of https://bugs.launchpad.net/gnubook/+bug/296788
BookReader.prototype.lastDisplayableIndex = function() {

    var lastIndex = this.numLeafs - 1;
    
    if (this.mode != this.constMode2up) {
        return lastIndex;
    }

    if ('rl' != this.pageProgression) {
        // LTR
        if (this.getPageSide(lastIndex) == 'R') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    } else {
        // RTL
        if (this.getPageSide(lastIndex) == 'L') {
            return lastIndex;
        } else {
            return lastIndex + 1;
        }
    }
}

// shortTitle(maximumCharacters)
//________
// Returns a shortened version of the title with the maximum number of characters
BookReader.prototype.shortTitle = function(maximumCharacters) {
    if (this.bookTitle.length < maximumCharacters) {
        return this.bookTitle;
    }
    
    var title = this.bookTitle.substr(0, maximumCharacters - 3);
    title += '...';
    return title;
}

// Parameter related functions

// updateFromParams(params)
//________
// Update ourselves from the params object.
//
// e.g. this.updateFromParams(this.paramsFromFragment(window.location.hash))
BookReader.prototype.updateFromParams = function(params) {
    if ('undefined' != typeof(params.mode)) {
        this.switchMode(params.mode);
    }

    // process /search
    if ('undefined' != typeof(params.searchTerm)) {
        if (this.searchTerm != params.searchTerm) {
            this.search(params.searchTerm);
        }
    }
    
    // $$$ process /zoom
    
    // We only respect page if index is not set
    if ('undefined' != typeof(params.index)) {
        if (params.index != this.currentIndex()) {
            this.jumpToIndex(params.index);
        }
    } else if ('undefined' != typeof(params.page)) {
        // $$$ this assumes page numbers are unique
        if (params.page != this.getPageNum(this.currentIndex())) {
            this.jumpToPage(params.page);
        }
    }

    // $$$ process /region
    // $$$ process /highlight
}

// paramsFromFragment(urlFragment)
//________
// Returns a object with configuration parametes from a URL fragment.
//
// E.g paramsFromFragment(window.location.hash)
BookReader.prototype.paramsFromFragment = function(urlFragment) {
    // URL fragment syntax specification: http://openlibrary.org/dev/docs/bookurls

    var params = {};
    
    // For convenience we allow an initial # character (as from window.location.hash)
    // but don't require it
    if (urlFragment.substr(0,1) == '#') {
        urlFragment = urlFragment.substr(1);
    }
    
    // Simple #nn syntax
    var oldStyleLeafNum = parseInt( /^\d+$/.exec(urlFragment) );
    if ( !isNaN(oldStyleLeafNum) ) {
        params.index = oldStyleLeafNum;
        
        // Done processing if using old-style syntax
        return params;
    }
    
    // Split into key-value pairs
    var urlArray = urlFragment.split('/');
    var urlHash = {};
    for (var i = 0; i < urlArray.length; i += 2) {
        urlHash[urlArray[i]] = urlArray[i+1];
    }
    
    // Mode
    if ('1up' == urlHash['mode']) {
        params.mode = this.constMode1up;
    } else if ('2up' == urlHash['mode']) {
        params.mode = this.constMode2up;
    } else if ('thumb' == urlHash['mode']) {
        params.mode = this.constModeThumb;
    }
    
    // Index and page
    if ('undefined' != typeof(urlHash['page'])) {
        // page was set -- may not be int
        params.page = urlHash['page'];
    }
    
    // $$$ process /region
    // $$$ process /search
    
    if (urlHash['search'] != undefined) {
        params.searchTerm = BookReader.util.decodeURIComponentPlus(urlHash['search']);
    }
    
    // $$$ process /highlight
        
    return params;
}

// paramsFromCurrent()
//________
// Create a params object from the current parameters.
BookReader.prototype.paramsFromCurrent = function() {

    var params = {};
    
    var index = this.currentIndex();
    var pageNum = this.getPageNum(index);
    if ((pageNum === 0) || pageNum) {
        params.page = pageNum;
    }
    
    params.index = index;
    params.mode = this.mode;
    
    // $$$ highlight
    // $$$ region

    // search    
    if (this.searchHighlightVisible()) {
        params.searchTerm = this.searchTerm;
    }
    
    return params;
}

// fragmentFromParams(params)
//________
// Create a fragment string from the params object.
// See http://openlibrary.org/dev/docs/bookurls for an explanation of the fragment syntax.
BookReader.prototype.fragmentFromParams = function(params) {
    var separator = '/';

    var fragments = [];
    
    if ('undefined' != typeof(params.page)) {
        fragments.push('page', params.page);
    } else {
        if ('undefined' != typeof(params.index)) {
            // Don't have page numbering but we do have the index
            fragments.push('page', 'n' + params.index);
        }
    }
    
    // $$$ highlight
    // $$$ region
    
    // mode
    if ('undefined' != typeof(params.mode)) {    
        if (params.mode == this.constMode1up) {
            fragments.push('mode', '1up');
        } else if (params.mode == this.constMode2up) {
            fragments.push('mode', '2up');
        } else if (params.mode == this.constModeThumb) {
            fragments.push('mode', 'thumb');
        } else {
            throw 'fragmentFromParams called with unknown mode ' + params.mode;
        }
    }
    
    // search
    if (params.searchTerm) {
        fragments.push('search', params.searchTerm);
    }
    
    return BookReader.util.encodeURIComponentPlus(fragments.join(separator)).replace(/%2F/g, '/');
}

// getPageIndex(pageNum)
//________
// Returns the *highest* index the given page number, or undefined
BookReader.prototype.getPageIndex = function(pageNum) {
    var pageIndices = this.getPageIndices(pageNum);
    
    if (pageIndices.length > 0) {
        return pageIndices[pageIndices.length - 1];
    }

    return undefined;
}

// getPageIndices(pageNum)
//________
// Returns an array (possibly empty) of the indices with the given page number
BookReader.prototype.getPageIndices = function(pageNum) {
    var indices = [];

    // Check for special "nXX" page number
    if (pageNum.slice(0,1) == 'n') {
        try {
            var pageIntStr = pageNum.slice(1, pageNum.length);
            var pageIndex = parseInt(pageIntStr);
            indices.push(pageIndex);
            return indices;
        } catch(err) {
            // Do nothing... will run through page names and see if one matches
        }
    }

    var i;
    for (i=0; i<this.numLeafs; i++) {
        if (this.getPageNum(i) == pageNum) {
            indices.push(i);
        }
    }
    
    return indices;
}

// getPageName(index)
//________
// Returns the name of the page as it should be displayed in the user interface
BookReader.prototype.getPageName = function(index) {
    return 'Page ' + this.getPageNum(index);
}

// updateLocationHash
//________
// Update the location hash from the current parameters.  Call this instead of manually
// using window.location.replace
BookReader.prototype.updateLocationHash = function() {
    var newHash = '#' + this.fragmentFromParams(this.paramsFromCurrent());
    window.location.replace(newHash);
    
    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
}

// startLocationPolling
//________
// Starts polling of window.location to see hash fragment changes
BookReader.prototype.startLocationPolling = function() {
    var self = this; // remember who I am
    self.oldLocationHash = window.location.hash;
    
    if (this.locationPollId) {
        clearInterval(this.locationPollID);
        this.locationPollId = null;
    }
    
    this.locationPollId = setInterval(function() {
        var newHash = window.location.hash;
        if (newHash != self.oldLocationHash) {
            if (newHash != self.oldUserHash) { // Only process new user hash once
                //console.log('url change detected ' + self.oldLocationHash + " -> " + newHash);
                
                self.ttsStop();
                
                // Queue change if animating
                if (self.animating) {
                    self.autoStop();
                    self.animationFinishedCallback = function() {
                        self.updateFromParams(self.paramsFromFragment(newHash));
                    }                        
                } else { // update immediately
                    self.updateFromParams(self.paramsFromFragment(newHash));
                }
                self.oldUserHash = newHash;
            }
        }
    }, 500);
}



// _getPageWidth
//--------
// Returns the page width for the given index, or first or last page if out of range
BookReader.prototype._getPageWidth = function(index) {
    // Synthesize a page width for pages not actually present in book.
    // May or may not be the best approach.
    // If index is out of range we return the width of first or last page
    index = BookReader.util.clamp(index, 0, this.numLeafs - 1);
    return this.getPageWidth(index);
}

// _getPageHeight
//--------
// Returns the page height for the given index, or first or last page if out of range
BookReader.prototype._getPageHeight= function(index) {
    index = BookReader.util.clamp(index, 0, this.numLeafs - 1);
    return this.getPageHeight(index);
}

// _getPageURI
//--------
// Returns the page URI or transparent image if out of range
BookReader.prototype._getPageURI = function(index, reduce, rotate, pageHeight) {
    if (index < 0 || index >= this.numLeafs) { // Synthesize page
        return this.imagesBaseURL + "transparent.png";
    }
    
    if ('undefined' == typeof(reduce)) {
        // reduce not passed in
        // $$$ this probably won't work for thumbnail mode
        var ratio = this.getPageHeight(index) / ( pageHeight || this.pageHeight );
        var scale;
        // $$$ we make an assumption here that the scales are available pow2 (like kakadu)
        if (ratio < 2) {
            scale = 1;
        } else if (ratio < 4) {
            scale = 2;
        } else if (ratio < 8) {
            scale = 4;
        } else if (ratio < 16) {
            scale = 8;
        } else  if (ratio < 32) {
            scale = 16;
        } else {
            scale = 32;
        }
        reduce = scale;
    }
    
    return this.getPageURI(index, reduce, rotate);
}

// Library functions
BookReader.util = {
    disableSelect: function(jObject) {        
        // Bind mouse handlers
        // Disable mouse click to avoid selected/highlighted page images - bug 354239
        jObject.bind('mousedown', function(e) {
            // $$$ check here for right-click and don't disable.  Also use jQuery style
            //     for stopping propagation. See https://bugs.edge.launchpad.net/gnubook/+bug/362626
            return false;
        });
        // Special hack for IE7
        jObject[0].onselectstart = function(e) { return false; };
    },
    
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Given value and maximum, calculate a percentage suitable for CSS
    cssPercentage: function(value, max) {
        return (((value + 0.0) / max) * 100) + '%';
    },
    
    notInArray: function(value, array) {
        // inArray returns -1 or undefined if value not in array
        return ! (jQuery.inArray(value, array) >= 0);
    },

    getIFrameDocument: function(iframe) {
        // Adapted from http://xkr.us/articles/dom/iframe-document/
        var outer = (iframe.contentWindow || iframe.contentDocument);
        return (outer.document || outer);
    },
    
    escapeHTML: function (str) {
        return(
            str.replace(/&/g,'&amp;').
                replace(/>/g,'&gt;').
                replace(/</g,'&lt;').
                replace(/"/g,'&quot;')
        );
    },
    
    decodeURIComponentPlus: function(value) {
        // Decodes a URI component and converts '+' to ' '
        return decodeURIComponent(value).replace(/\+/g, ' ');
    },
    
    encodeURIComponentPlus: function(value) {
        // Encodes a URI component and converts ' ' to '+'
        return encodeURIComponent(value).replace(/%20/g, '+');
    }
    // The final property here must NOT have a comma after it - IE7
}




// Can be overriden
BookReader.prototype.initUIStrings = function()
{
    // Navigation handlers will be bound after all UI is in place -- makes moving icons between
    // the toolbar and nav bar easier
        
    // Setup tooltips -- later we could load these from a file for i18n
    var titles = { '.logo': 'Go to Archive.org', // $$$ update after getting OL record
                   '.zoom_in': 'Zoom in',
                   '.zoom_out': 'Zoom out',
                   '.onepg': 'One-page view',
                   '.twopg': 'Two-page view',
                   '.thumb': 'Thumbnail view',
                   '.print': 'Print this page',
                   '.embed': 'Embed BookReader',
                   '.link': 'Link to this book (and page)',
                   '.bookmark': 'Bookmark this page',
                   '.read': 'Read this book aloud',
                   '.share': 'Share this book',
                   '.info': 'About this book',
                   '.full': 'Show fullscreen',
                   '.book_left': 'Flip left',
                   '.book_right': 'Flip right',
                   '.book_up': 'Page up',
                   '.book_down': 'Page down',
                   '.play': 'Play',
                   '.pause': 'Pause',
                   '.BRdn': 'Show/hide nav bar', // Would have to keep updating on state change to have just "Hide nav bar"
                   '.BRup': 'Show/hide nav bar',
                   '.book_top': 'First page',
                   '.book_bottom': 'Last page'
                  };
    if ('rl' == this.pageProgression) {
        titles['.book_leftmost'] = 'Last page';
        titles['.book_rightmost'] = 'First page';
    } else { // LTR
        titles['.book_leftmost'] = 'First page';
        titles['.book_rightmost'] = 'Last page';
    }
                  
    for (var icon in titles) {
        if (titles.hasOwnProperty(icon)) {
            $('#BookReader').find(icon).attr('title', titles[icon]);
        }
    }
}
BookReader.prototype.registerPlugin = function(PluginClass){
	this.plugins.push(PluginClass);
}
}
)(jQuery);
