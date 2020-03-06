import * as utils from '../utils.js';
/** @typedef {import("../../BookReader.js").default} BookReader */

/**
 * @param {BookReader} BookReader 
 */
export function extendWithToolbar(BookReader) {
  /**
   * This method builds the html for the toolbar. It can be decorated to extend
   * the toolbar.
   * @return {jqueryElement}
   */
  BookReader.prototype.buildToolbarElement = function() {
    var logoHtml = '';
    if (this.showLogo) {
      logoHtml = "<span class='BRtoolbarSection BRtoolbarSectionLogo'>"
      +  "<a class='logo' href='" + this.logoURL + "'></a>"
      + "</span>";
    }

    // Add large screen navigation
    this.refs.$BRtoolbar = $(
      "<div class='BRtoolbar header'>"
      +   "<div class='BRtoolbarbuttons'>"
      +     "<div class='BRtoolbarLeft'>"
      +       logoHtml
      +       "<span class='BRtoolbarSection BRtoolbarSectionTitle'></span>"
      +    "</div>"

      +     "<div class='BRtoolbarRight'>"
      +       "<span class='BRtoolbarSection BRtoolbarSectionInfo'>"
      +         "<button class='BRpill info js-tooltip'>Info</button>"
      +         "<button class='BRpill share js-tooltip'>Share</button>"
      +       "</span>"
      // +       "<span class='BRtoolbarSection BRtoolbarSectionMenu'>"
      // TODO actual hamburger menu
      // +         "<button class='BRpill BRtoolbarHamburger'>"
      // +           "<img src='"+this.imagesBaseURL+"icon_hamburger.svg' />"
      // +           "<div class='BRhamburgerDrawer'><ul><li>hi</li></ul></div>"
      // +         "</button>"
      // +       "</span>"
      +     "</div>" // end BRtoolbarRight
      +   "</div>"
      + "</div>"
    );

    var $titleSectionEl = this.refs.$BRtoolbar.find('.BRtoolbarSectionTitle');

    if (this.bookUrl && this.options.enableBookTitleLink) {
      $titleSectionEl.append(
        $('<a>')
          .attr({'href': this.bookUrl, 'title': this.bookUrlTitle})
          .addClass('BRreturn')
          .html(this.bookUrlText || this.bookTitle)
      )
    } else if (this.bookTitle) {
      $titleSectionEl.append(this.bookUrlText || this.bookTitle);
    }

    // var $hamburger = this.refs.$BRtoolbar.find('BRtoolbarHamburger');
    return this.refs.$BRtoolbar;
  };

  /**
  * Initializes the toolbar (top)
  * @param {string} mode
  * @param {string} ui
  */
  // eslint-disable-next-line no-unused-vars
  BookReader.prototype.initToolbar = function(mode, ui) {
    var self = this;

    this.refs.$br.append(this.buildToolbarElement());

    this.$('.BRnavCntl').addClass('BRup');
    this.$('.pause').hide();

    this.updateToolbarZoom(this.reduce); // Pretty format

    // We build in mode 2
    this.refs.$BRtoolbar.append();

    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
      this.$('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
      this.$('.thumbnail_mode').hide();
    }

    // Hide one page button if it is the only mode available
    if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
      this.$('.one_page_mode').hide();
    }

    $('<div style="display: none;"></div>').append(
      this.blankShareDiv()
    ).append(
      this.blankInfoDiv()
    ).appendTo(this.refs.$br);

    this.$('.BRinfo .BRfloatTitle a')
      .attr({'href': this.bookUrl})
      .text(this.bookTitle)
      .addClass('title');

    // These functions can be overridden
    this.buildInfoDiv(this.$('.BRinfo'));
    this.buildShareDiv(this.$('.BRshare'));


    this.$('.share').colorbox({
      inline: true,
      opacity: "0.5",
      href: this.$('.BRshare'),
      onLoad: function() {
        self.trigger(BookReader.eventNames.stop);
        self.$('.BRpageviewValue').val(window.location.href);
      }
    });
    this.$('.info').colorbox({
      inline: true,
      opacity: "0.5",
      href: this.$('.BRinfo'),
      onLoad: function() {
        self.trigger(BookReader.eventNames.stop);
      }
    });
  };

  BookReader.prototype.blankInfoDiv = function() {
    return $([
      '<div class="BRfloat BRinfo">',
      '<div class="BRfloatHead">About this book',
      '<button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
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
      '<a href="https://openlibrary.org/dev/docs/bookreader">About the BookReader</a>',
      '</div>',
      '</div>'].join('\n')
    );
  };

  BookReader.prototype.blankShareDiv = function() {
    return $([
      '<div class="BRfloat BRshare">',
      '<div class="BRfloatHead">',
      'Share',
      '<button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>',
      '</div>',
      '</div>'].join('\n')
    );
  };

  /**
  * Update the displayed zoom factor based on reduction factor
  * @param {number} reduce
  */
  BookReader.prototype.updateToolbarZoom = function(reduce) {
    var value;
    var autofit = null;

    // $$$ TODO preserve zoom/fit for each mode
    if (this.mode == this.constMode2up) {
      autofit = this.twoPage.autofit;
    } else {
      autofit = this.onePage.autofit;
    }

    if (autofit) {
      value = autofit.slice(0,1).toUpperCase() + autofit.slice(1);
    } else {
      value = (100 / reduce).toFixed(2);
      // Strip trailing zeroes and decimal if all zeroes
      value = value.replace(/0+$/,'');
      value = value.replace(/\.$/,'');
      value += '%';
    }
    this.$('.BRzoom').text(value);
  };

  BookReader.prototype.buildShareDiv = function(jShareDiv) {
    var pageView = document.location + '';
    var bookView = (pageView + '').replace(/#.*/,'');
    var self = this;

    var embedHtml = '';
    if (this.getEmbedCode) {
      embedHtml = [
        '<div class="share-embed">',
        '<p class="share-embed-prompt">Copy and paste one of these options to share this book elsewhere.</p>',
        '<form method="post" action="">',
        '<fieldset class="fieldset-share-pageview">',
        '<label for="pageview">Link to this page view</label>',
        '<input type="text" name="pageview" class="BRpageviewValue" value="' + pageView + '"/>',
        '</fieldset>',
        '<fieldset class="fieldset-share-book-link">',
        '<label for="booklink">Link to the book</label>',
        '<input type="text" name="booklink" class="booklink" value="' + bookView + '"/>',
        '</fieldset>',
        '<fieldset class="fieldset-embed">',
        '<label for="iframe">Embed a mini Book Reader</label>',
        '<fieldset class="sub">',
        '<label class="sub">',
        '<input type="radio" name="pages" value="' + this.constMode1up + '" checked="checked"/>',
        '1 page',
        '</label>',
        '<label class="sub">',
        '<input type="radio" name="pages" value="' + this.constMode2up + '"/>',
        '2 pages',
        '</label>',
        '<label class="sub">',
        '<input type="checkbox" name="thispage" value="thispage"/>',
        'Open to this page?',
        '</label>',
        '</fieldset>',
        '<textarea cols="30" rows="4" name="iframe" class="BRframeEmbed"></textarea>',
        '</fieldset>',
        '</form>',
        '</div>'
      ].join('\n');
    }

    var jForm = $([
      '<div class="share-title">Share this book</div>',
      '<div class="share-social">',
      '<label class="sub open-to-this-page">',
      '<input class="thispage-social" type="checkbox" />',
      'Open to this page?',
      '</label>',
      '<div><button class="BRaction share facebook-share-button"><i class="BRicon fb" /> Facebook</button></div>',
      '<div><button class="BRaction share twitter-share-button"><i class="BRicon twitter" /> Twitter</button></div>',
      '<div><button class="BRaction share email-share-button"><i class="BRicon email" /> Email</button></div>',
      '</div>',
      embedHtml,
      '<div class="BRfloatFoot">',
      '<button class="share-finished" type="button" onclick="$.fn.colorbox.close();">Finished</button>',
      '</div>'
    ].join('\n'));

    jForm.appendTo(jShareDiv);

    jForm.find('.fieldset-embed input').bind('change', function() {
      var form = $(this).parents('form:first');
      var params = {};
      params.mode = $(form.find('.fieldset-embed input[name=pages]:checked')).val();
      if (form.find('.fieldset-embed input[name=thispage]').prop('checked')) {
        params.page = self.getPageNum(self.currentIndex());
      }

      if (self.getEmbedCode) {
        // $$$ changeable width/height to be added to share UI
        var frameWidth = "480px";
        var frameHeight = "430px";
        form.find('.BRframeEmbed').val(self.getEmbedCode(frameWidth, frameHeight, params));
      }
    });

    jForm.find('input, textarea').bind('focus', function() {
      this.select();
    });

    // Bind share buttons

    // Use url without hashes
    jForm.find('.facebook-share-button').click(function(){
      var params = $.param({ u: self._getSocialShareUrl() });
      var url = 'https://www.facebook.com/sharer.php?' + params;
      self.createPopup(url, 600, 400, 'Share')
    });
    jForm.find('.twitter-share-button').click(function(){
      var params = $.param({
        url: self._getSocialShareUrl(),
        text: self.bookTitle
      });
      var url = 'https://twitter.com/intent/tweet?' + params;
      self.createPopup(url, 600, 400, 'Share')
    });
    jForm.find('.email-share-button').click(function(){
      var body = self.bookTitle + "\n\n" + self._getSocialShareUrl();
      window.location.href = 'mailto:?subject=' + encodeURI(self.bookTitle) + '&body=' + encodeURI(body);
    });

    jForm.find('input[name=thispage]').trigger('change');

    jForm.appendTo(jShareDiv);
  };

  BookReader.prototype._getSocialShareUrl = function() {
    var shareThisPage = this.$('.thispage-social').prop('checked');
    if (shareThisPage) {
      return window.location.href;
    } else {
      return document.location.protocol + "//" + window.location.hostname + window.location.pathname;
    }
  };

  /**
  * @param JInfoDiv DOM element. Appends info to this element
  * Can be overridden or extended
  */
  BookReader.prototype.buildInfoDiv = function(jInfoDiv) {
    // Remove these legacy elements
    jInfoDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

    var $leftCol = $("<div class=\"BRinfoLeftCol\"></div>");
    if (this.thumbnail) {
      $leftCol.append($("<div class=\"BRimageW\">"
        +"  <img src=\""+this.thumbnail+"\" "
        +"       alt=\""+utils.escapeHTML(this.bookTitle)+"\" />"
        +"</div>"));
    }

    var $rightCol = $("<div class=\"BRinfoRightCol\">");

    // A loop to build fields
    var extraClass;
    for (var i = 0; i < this.metadata.length; i++) {
      extraClass = this.metadata[i].extraValueClass || '';
      $rightCol.append($("<div class=\"BRinfoValueWrapper\">"
        +"  <div class=\"BRinfoLabel\">"
        +     this.metadata[i].label
        +"  </div>"
        +"  <div class=\"BRinfoValue " + extraClass + "\">"
        +     this.metadata[i].value
        +"  </div>"
        +"</div>"));
    }

    var moreInfoText;
    if (this.bookUrlMoreInfo) {
      moreInfoText = this.bookUrlMoreInfo;
    } else if (this.bookTitle) {
      moreInfoText = this.bookTitle;
    }

    if (moreInfoText && this.bookUrl) {
      $rightCol.append($("<div class=\"BRinfoValueWrapper\">"
          +"<div class=\"BRinfoMoreInfoWrapper\">"
          +"  <a class=\"BRinfoMoreInfo\" href=\""+this.bookUrl+"\">"
          +   moreInfoText
          +"  </a>"
          +"</div>"
        +"</div>"));
    }


    var footerEl = "<div class=\"BRfloatFoot BRinfoFooter\"></div>";

    var children = [
      $leftCol,
      $rightCol,
      '<br style="clear:both"/>'
    ];
    var childrenEl = $('<div class="BRinfoW mv20-lg">').append(children);

    jInfoDiv.append(
      childrenEl,
      $(footerEl)
    ).addClass('wide');
  };

  /**
  * Helper opens a popup window. On mobile it only opens a new tab. Used for share.
  */
  BookReader.prototype.createPopup = function(href, width, height, name) {
    // Fixes dual-screen position
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var win_w = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var win_h = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left   = ((win_w / 2) - (width / 2)) + dualScreenLeft,
      top    = ((win_h / 2) - (height / 2)) + dualScreenTop,
      url    = href,
      opts   = 'status=1' +
                ',width='  + width  +
                ',height=' + height +
                ',top='    + top    +
                ',left='   + left;

    window.open(url, name, opts);
  };

  /**
  * @return {number} (in pixels) of the toolbar height. 0 if no toolbar.
  */
  BookReader.prototype.getToolBarHeight = function() {
    if (this.refs.$BRtoolbar && this.refs.$BRtoolbar.css('display') === 'block') {
      return (this.refs.$BRtoolbar.outerHeight() + parseInt(this.refs.$BRtoolbar.css('top')));
    } else {
      return 0;
    }
  }
}
