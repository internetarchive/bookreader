/*
 * Navbar.js
 * =========
 * BookReader plugin that controls page-based navigation
 * 
 * Author: Mauricio Giraldo mauricio@pingpongestudio.com
 * 
 * version: 0.1
 * 
 */

Navbar = function() {
	$.extend(this, {
		reader : null,
	    container: null,
		_visible : true,
		_currentPage: 0,
		_mode: "normal",
		_position : "bottom"
	});
};

/**
 * Navbar constructor
 * 
 * @param bookreader reference to the BookReader object
 * @param options object with options for the navbar: 
 *    {
 *    visible:true (default)/false
 *    withPage:pageIndexToShowAsCurrent (default=0)
 *    mode:normal (default)/embed
 *    position:top,bottom (default),right,left (only bottom supported so far)
 *    }
 */
Navbar.prototype.init = function (reader, targetElement, options) {
	// reference to bookreader object is required
	this.reader = reader;
	this.container = targetElement;
	// check to see if options present
	if (options!=undefined) {
		this.options = options;
	} else {
		this.options = {};
		this.options.visible = true;
		this.options.withPage = 0;
		this.options.mode = "normal";
		this.options.position = "bottom";
	}
	this._parseOptions();
	if (this._mode=="normal") {
		// regular init
		this._initNormal();
	} else if (this._mode=="embed") {
		// embed init
		this._initEmbedded();
	}
};

/**
 * _parseOptions
 * 
 * Parse the options received from constructor (or defaults) into properties
 * 
 * FYI:
 *    {
 *    visible:true (default)/false
 *    withPage:pageIndexToShowAsCurrent (default=0)
 *    mode:normal (default)/embed
 *    position:top,bottom (default),right,left (only bottom supported so far)
 *    }
 */
Navbar.prototype._parseOptions = function () {
	// parses the options object to convert to nav properties
	var opt = this.options;
	this._visible = opt.visible;
	this._currentPage = opt.withPage;
	this._mode = opt.mode;
	this._position = opt.position;
};

//_initNormal
//______________________________________________________________________________
//Initialize the navigation bar.
//$$$ this could also add the base elements to the DOM, so disabling the nav bar
//   could be as simple as not calling this function
Navbar.prototype._initNormal = function() {
  // Setup nav / chapter / search results bar
  
  $(this.container).append(
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
};

//_initEmbedded
//______________________________________________________________________________
//Initialize the navigation bar when embedded
Navbar.prototype._initEmbedded = function() {
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
};

Navbar.prototype.isVisible = function () {
	// $$$ doesn't account for transitioning states, nav must be fully visible to return true
	var toolpos = $('#BRtoolbar').offset();
	var tooltop = toolpos.top;
	if (tooltop == 0) {
		this._visible = true;
	} else {
		this._visible = false;
	}
	return this._visible;
};

Navbar.prototype.isEmbedded = function () {
	return (this._mode=="embed");
};

Navbar.prototype.show = function () {
	// Check if navigation is hidden
	if (!this.navigationIsVisible()) {
		$('#BRtoolbar').animate({top:0});
		$('#BRnav').animate({bottom:0});
		//$('#BRzoomer').animate({right:0});
	}
};

Navbar.prototype.hide = function () {
	// Check if navigation is showing
	if (this.isVisible()) {
		// $$$ don't hardcode height
		$('#BRtoolbar').animate({top:-60});
		$('#BRnav').animate({bottom:-60});
		//$('#BRzoomer').animate({right:-26});
	}
};

Navbar.prototype.updatePageNum = function (index) {
    var pageNum = this.reader.getPageNum(index);
    var pageStr;
    if (pageNum[0] == 'n') { // funny index
        pageStr = index + 1 + ' / ' + this.numLeafs; // Accessible index starts at 0 (alas) so we add 1 to make human
    } else {
        pageStr = 'Page ' + pageNum;
    }
    
    $('#pagenum .currentpage').text(pageStr);
};

Navbar.prototype.updateIndex = function (index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    $('#BRpager').data('swallowchange', true).slider('value', index);
};

//changeArrow
//______________________________________________________________________________
//Change the nav bar arrow
Navbar.prototype.changeArrow = function (){
	setTimeout(function(){
	    $('#BRnavCntlBtm').removeClass('BRdn').addClass('BRup');
	},3000);
};
