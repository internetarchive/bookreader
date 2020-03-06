import * as utils from '../utils.js';
/** @typedef {import("../../BookReader.js").default} BookReader */

/**
 * @param {BookReader} BookReader 
 */
export function extendWithToolbar(BookReader) {
  /**
   * This method builds the html for the toolbar. It can be decorated to extend
   * the toolbar.
   * @return {JQuery}
   */
  BookReader.prototype.buildToolbarElement = function() {
    const logoHtml = !this.showLogo ? '' : `
      <span class="BRtoolbarSection BRtoolbarSectionLogo">
        <a class="logo" href="${this.logoURL}"></a>
      </span>`;

    // Add large screen navigation
    this.refs.$BRtoolbar = $(`
      <div class="BRtoolbar header">
        <div class="BRtoolbarbuttons">
          <div class="BRtoolbarLeft">
            ${logoHtml}
            <span class="BRtoolbarSection BRtoolbarSectionTitle"></span>
          </div>
          <div class="BRtoolbarRight">
            <span class="BRtoolbarSection BRtoolbarSectionInfo">
              <button class="BRpill info js-tooltip">Info</button>
              <button class="BRpill share js-tooltip">Share</button>
            </span>
          </div>
        </div>
      </div>`);
    // TODO actual hamburger menu
    // <span class="BRtoolbarSection BRtoolbarSectionMenu">
    //   <button class="BRpill BRtoolbarHamburger">
    //     <img src="${this.imagesBaseURL}icon_hamburger.svg" />
    //     <div class="BRhamburgerDrawer"><ul><li>hi</li></ul></div>
    //   </button>
    // </span>

    const $titleSectionEl = this.refs.$BRtoolbar.find('.BRtoolbarSectionTitle');

    if (this.bookUrl && this.options.enableBookTitleLink) {
      $titleSectionEl.append(
        $('<a>')
          .attr({href: this.bookUrl, title: this.bookUrlTitle})
          .addClass('BRreturn')
          .html(this.bookUrlText || this.bookTitle)
      )
    } else if (this.bookTitle) {
      $titleSectionEl.append(this.bookUrlText || this.bookTitle);
    }

    // const $hamburger = this.refs.$BRtoolbar.find('BRtoolbarHamburger');
    return this.refs.$BRtoolbar;
  };

  /**
   * Initializes the toolbar (top)
   * @param {string} mode
   * @param {string} ui
   */
  BookReader.prototype.initToolbar = function(mode, ui) {
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

    $('<div style="display: none;"></div>')
      .append(this.blankShareDiv())
      .append(this.blankInfoDiv())
      .appendTo(this.refs.$br);

    this.$('.BRinfo .BRfloatTitle a')
      .attr({href: this.bookUrl})
      .text(this.bookTitle)
      .addClass('title');

    // These functions can be overridden
    this.buildInfoDiv(this.$('.BRinfo'));
    this.buildShareDiv(this.$('.BRshare'));


    this.$('.share').colorbox({
      inline: true,
      opacity: "0.5",
      href: this.$('.BRshare'),
      onLoad: () => {
        this.trigger(BookReader.eventNames.stop);
        this.$('.BRpageviewValue').val(window.location.href);
      }
    });
    this.$('.info').colorbox({
      inline: true,
      opacity: "0.5",
      href: this.$('.BRinfo'),
      onLoad: () => {
        this.trigger(BookReader.eventNames.stop);
      }
    });
  };

  BookReader.prototype.blankInfoDiv = function() {
    // FIXME the <button> el is closed with a </a>
    return $(`
      <div class="BRfloat BRinfo">
        <div class="BRfloatHead">About this book
          <button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>
        </div>
        <div class="BRfloatBody">
          <div class="BRfloatCover"></div>
          <div class="BRfloatMeta">
            <div class="BRfloatTitle">
              <h2><a /></h2>
            </div>
          </div>
        </div>
        <div class="BRfloatFoot">
          <a href="https://openlibrary.org/dev/docs/bookreader">About the BookReader</a>
        </div>
      </div>`);
  };

  BookReader.prototype.blankShareDiv = function() {
    // FIXME the <button> el is closed with a </a>
    return $(`
      <div class="BRfloat BRshare">
        <div class="BRfloatHead">
          Share
          <button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="shift">Close</span></a>
        </div>
      </div>`);
  };

  /**
   * @todo .BRzoom doesn't exist anywhere, so this is likely dead code
   * Update the displayed zoom factor based on reduction factor
   * @param {number} reduce
   */
  BookReader.prototype.updateToolbarZoom = function(reduce) {
    // $$$ TODO preserve zoom/fit for each mode
    const autofit = this.mode == this.constMode2up ? this.twoPage.autofit : this.onePage.autofit;
    /** @type {string} */
    let value;
    if (autofit) {
      value = autofit.slice(0,1).toUpperCase() + autofit.slice(1);
    } else {
      value = (100 / reduce)
        .toFixed(2)
        // Strip trailing zeroes and decimal if all zeroes
        .replace(/0+$/,'')
        .replace(/\.$/,'')
        + '%';
    }
    this.$('.BRzoom').text(value);
  };

  /**
   * @param {JQuery} $shareDiv
   */
  BookReader.prototype.buildShareDiv = function($shareDiv) {
    const pageView = document.location + '';
    const bookView = (pageView + '').replace(/#.*/,'');

    const embedHtml = !this.getEmbedCode ? '' : `
      <div class="share-embed">
        <p class="share-embed-prompt">Copy and paste one of these options to share this book elsewhere.</p>
        <form method="post" action="">
          <fieldset class="fieldset-share-pageview">
            <label for="pageview">Link to this page view</label>
            <input type="text" name="pageview" class="BRpageviewValue" value="${pageView}"/>
          </fieldset>
          <fieldset class="fieldset-share-book-link">
            <label for="booklink">Link to the book</label>
            <input type="text" name="booklink" class="booklink" value="${bookView}"/>
          </fieldset>
          <fieldset class="fieldset-embed">
            <label for="iframe">Embed a mini Book Reader</label>
            <fieldset class="sub">
              <label class="sub">
                <input type="radio" name="pages" value="${this.constMode1up}" checked="checked"/>
                1 page
              </label>
              <label class="sub">
                <input type="radio" name="pages" value="${this.constMode2up}"/>
                2 pages
              </label>
              <label class="sub">
                <input type="checkbox" name="thispage" value="thispage"/>
                Open to this page?
              </label>
            </fieldset>
            <textarea cols="30" rows="4" name="iframe" class="BRframeEmbed"></textarea>
          </fieldset>
        </form>
      </div>`;

    const $form = $(`
      <div class="share-title">Share this book</div>
      <div class="share-social">
        <label class="sub open-to-this-page">
          <input class="thispage-social" type="checkbox" />
          Open to this page?
        </label>
        <div><button class="BRaction share facebook-share-button"><i class="BRicon fb" /> Facebook</button></div>
        <div><button class="BRaction share twitter-share-button"><i class="BRicon twitter" /> Twitter</button></div>
        <div><button class="BRaction share email-share-button"><i class="BRicon email" /> Email</button></div>
      </div>
      ${embedHtml}
      <div class="BRfloatFoot">
        <button class="share-finished" type="button" onclick="$.fn.colorbox.close();">Finished</button>
      </div>`);

    $form.appendTo($shareDiv);

    $form.find('.fieldset-embed input').on('change', event => {
      const form = $(event.target).parents('form:first');
      const params = {};
      params.mode = $(form.find('.fieldset-embed input[name=pages]:checked')).val();
      if (form.find('.fieldset-embed input[name=thispage]').prop('checked')) {
        params.page = this.getPageNum(this.currentIndex());
      }

      if (this.getEmbedCode) {
        // $$$ changeable width/height to be added to share UI
        const frameWidth = "480px";
        const frameHeight = "430px";
        form.find('.BRframeEmbed').val(this.getEmbedCode(frameWidth, frameHeight, params));
      }
    });

    $form.find('input, textarea').on('focus', event => event.target.select());

    // Bind share buttons

    // Use url without hashes
    $form.find('.facebook-share-button').click(() => {
      const params = $.param({ u: this._getSocialShareUrl() });
      const url = 'https://www.facebook.com/sharer.php?' + params;
      this.createPopup(url, 600, 400, 'Share');
    });
    $form.find('.twitter-share-button').click(() => {
      const params = $.param({
        url: this._getSocialShareUrl(),
        text: this.bookTitle
      });
      const url = 'https://twitter.com/intent/tweet?' + params;
      this.createPopup(url, 600, 400, 'Share');
    });
    $form.find('.email-share-button').click(() => {
      const body = `${this.bookTitle}\n\n${this._getSocialShareUrl()}`;
      window.location.href = `mailto:?subject=${encodeURI(this.bookTitle)}&body=${encodeURI(body)}`;
    });

    $form.find('input[name=thispage]').trigger('change');

    $form.appendTo($shareDiv);
  };

  BookReader.prototype._getSocialShareUrl = function() {
    const shareThisPage = this.$('.thispage-social').prop('checked');
    if (shareThisPage) {
      return window.location.href;
    } else {
      return `${document.location.protocol}//${window.location.hostname}${window.location.pathname}`;
    }
  };

  /**
   * @param {JQuery} $infoDiv DOM element. Appends info to this element
   * Can be overridden or extended
   */
  BookReader.prototype.buildInfoDiv = function($infoDiv) {
    // Remove these legacy elements
    $infoDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

    const $leftCol = $(`<div class="BRinfoLeftCol"></div>`);
    if (this.thumbnail) {
      $leftCol.append($(`
        <div class="BRimageW">
          <img src="${this.thumbnail}" alt="${utils.escapeHTML(this.bookTitle)}" />
        </div>`));
    }

    const $rightCol = $(`<div class="BRinfoRightCol">`);

    // A loop to build fields
    for (let {extraValueClass='', label, value} of this.metadata) {
      $rightCol.append($(`
        <div class="BRinfoValueWrapper">
          <div class="BRinfoLabel">${label}</div>
          <div class="BRinfoValue ${extraValueClass}">${value}</div>
        </div>`));
    }

    const moreInfoText = this.bookUrlMoreInfo ? this.bookUrlMoreInfo : this.bookTitle;
    if (moreInfoText && this.bookUrl) {
      $rightCol.append($(`
        <div class="BRinfoValueWrapper">
          <div class="BRinfoMoreInfoWrapper">
            <a class="BRinfoMoreInfo" href="${this.bookUrl}">
              ${moreInfoText}
            </a>
          </div>
        </div>`));
    }

    const $footer = $(`<div class="BRfloatFoot BRinfoFooter"></div>`);
    const $children = $('<div class="BRinfoW mv20-lg">').append([
      $leftCol,
      $rightCol,
      '<br style="clear:both"/>'
    ]);

    $infoDiv
      .append($children, $footer)
      .addClass('wide');
  };

  /**
   * Helper opens a popup window. On mobile it only opens a new tab. Used for share.
   * @param {string} href
   * @param {number} width
   * @param {number} height
   * @param {string} name
   */
  BookReader.prototype.createPopup = function(href, width, height, name) {
    // Fixes dual-screen position
    const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    const win_w = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const win_h = window.innerHeight || document.documentElement.clientHeight || screen.height;

    const left = ((win_w / 2) - (width / 2)) + dualScreenLeft;
    const top = ((win_h / 2) - (height / 2)) + dualScreenTop;
    const opts = `status=1,width=${width},height=${height},top=${top},left=${left}`;

    window.open(href, name, opts);
  };

  /**
   * @return {number} (in pixels) of the toolbar height. 0 if no toolbar.
   */
  BookReader.prototype.getToolBarHeight = function() {
    const { $BRtoolbar } = this.refs;
    if ($BRtoolbar && $BRtoolbar.css('display') === 'block') {
      return ($BRtoolbar.outerHeight() + parseInt($BRtoolbar.css('top')));
    } else {
      return 0;
    }
  }
}
