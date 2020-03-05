import * as utils from '../utils.js';

/**
 * Extends BookReader with Navbar prototype
 * @param {typeof BookReader} BookReader 
 */
export function extendWithNavbar(BookReader) {
  /**
   * Initialize the navigation bar (bottom)
   */
  BookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar
    var navbarTitleHtml = '';
    if (this.options.navbarTitle) {
      navbarTitleHtml = "<div class=\"BRnavTitle\">" + this.options.navbarTitle + "</div>";
    }

    this.refs.$BRfooter = $('<div class="BRfooter"></div>');
    this.refs.$BRnav = $(
      "<div class=\"BRnav BRnavDesktop\">"
          +"  <div class=\"BRnavCntl BRnavCntlBtm BRdn js-tooltip\" title=\"Toogle toolbars\"></div>"
          + navbarTitleHtml
          +"  <div class=\"BRnavpos\">"
          +"    <div class=\"BRpager\"></div>"
          +"    <div class=\"BRnavline\">"
          +"    </div>"
          +"  </div>"
          +"  <div class=\"BRpage\">"

          // Note, it's important for there to not be whitespace
          +     "<span class='BRcurrentpage'></span>"
          +     "<button class=\"BRicon book_left js-tooltip\"></button>"
          +     "<button class=\"BRicon book_right js-tooltip\"></button>"
          +     "<button class=\"BRicon onepg desktop-only js-tooltip\"></button>"
          +     "<button class=\"BRicon twopg desktop-only js-tooltip\"></button>"
          +     "<button class=\"BRicon thumb desktop-only js-tooltip\"></button>"

          // zoomx
          +     "<button class='BRicon zoom_out desktop-only js-tooltip'></button>"
          +     "<button class='BRicon zoom_in desktop-only js-tooltip'></button>"
          +     "<button class='BRicon full js-tooltip'></button>"
          +"  </div>"
          +"</div>"
    );
    this.refs.$BRfooter.append(this.refs.$BRnav);
    this.refs.$br.append(this.refs.$BRfooter);

    var self = this;
    this.$('.BRpager').slider({
      animate: true,
      min: 0,
      max: this.getNumLeafs() - 1,
      value: this.currentIndex(),
      range: "min"
    })
      .bind('slide', function(event, ui) {
        self.updateNavPageNum(ui.value);
        return true;
      })
      .bind('slidechange', function(event, ui) {
        self.updateNavPageNum(ui.value);
        // recursion prevention for jumpToIndex
        if ( $(this).data('swallowchange') ) {
          $(this).data('swallowchange', false);
        } else {
          self.jumpToIndex(ui.value);
        }
        return true;
      });

    this.updateNavPageNum(this.currentIndex());

    return this.refs.$BRnav;
  };

  /**
  * Initialize the navigation bar when embedded
  */
  BookReader.prototype.initEmbedNavbar = function() {
    // IA-specific
    var thisLink = (window.location + '')
      .replace('?ui=embed','')
      .replace('/stream/', '/details/')
      .replace('#', '/')
      ;

    var logoHtml = '';
    if (this.showLogo) {
      logoHtml = "<a class='logo' href='" + this.logoURL + "' 'target='_blank' ></a>";
    }

    this.refs.$BRfooter = $('<div class="BRfooter"></div>');
    this.refs.$BRnav = $('<div class="BRnav BRnavEmbed">'
          +   logoHtml
          +   "<span class='BRembedreturn'>"
          +      "<a href='" + thisLink + "' target='_blank'>"+this.bookTitle+"</a>"
          +   "</span>"
          +   "<span class='BRtoolbarbuttons'>"
          +         '<button class="BRicon book_left"></button>'
          +         '<button class="BRicon book_right"></button>'
          +         '<button class="BRicon full"></button>'
          +   "</span>"
          + '</div>');
    this.refs.$BRfooter.append(this.refs.$BRnav);
    this.refs.$br.append(this.refs.$BRfooter);
  };

  /**
  * Returns the textual representation of the current page for the navbar
  * @param {number}
  * @return {string}
  */
  BookReader.prototype.getNavPageNumString = function(index) {
    // Accessible index starts at 0 (alas) so we add 1 to make human
    var pageNum = this.getPageNum(index);
    var pageType = this.getPageProp(index, 'pageType');
    var numLeafs = this.getNumLeafs();

    if (!this.getNavPageNumString.maxPageNum) {
      // Calculate Max page num (used for pagination display)
      var maxPageNum = 0;
      var pageNumVal;
      for (var i = 0; i < numLeafs; i++) {
        pageNumVal = this.getPageNum(i);
        if (!isNaN(pageNumVal) && pageNumVal > maxPageNum) {
          maxPageNum = pageNumVal;
        }
      }
      this.getNavPageNumString.maxPageNum = maxPageNum;
    }

    return this.getNavPageNumHtml(index, numLeafs, pageNum, pageType, this.getNavPageNumString.maxPageNum);
  };

  /**
  * Renders the html for the page string
  * @param {number} index
  * @param {number} numLeafs
  * @param {number} pageNum
  * @param {string} pageType
  */
  BookReader.prototype.getNavPageNumHtml = function(index, numLeafs, pageNum, pageType, maxPageNum) {
    var pageStr;
    if (pageNum[0] != 'n') {
      pageStr = ' Page ' + pageNum;
      if (maxPageNum) {
        pageStr += ' of ' + maxPageNum;
      }
    } else {
      pageStr = (index + 1) + '&nbsp;/&nbsp;' + numLeafs;
    }
    return pageStr;
  };

  /**
  * Renders the navbar string to the DOM
  * @param {number}
  */
  BookReader.prototype.updateNavPageNum = function(index) {
    this.$('.BRcurrentpage').html(this.getNavPageNumString(index));
  };

  /**
  * Update the nav bar display - does not cause navigation.
  * @param {number}
  */
  BookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
    index = index !== undefined ? index : this.currentIndex();
    this.$('.BRpager').data('swallowchange', true).slider('value', index);
  };

  BookReader.prototype.updateNavIndexDebounced = utils.debounce(BookReader.prototype.updateNavIndex, 500);
  BookReader.prototype.updateNavIndexThrottled = utils.throttle(BookReader.prototype.updateNavIndex, 250, false);
}
