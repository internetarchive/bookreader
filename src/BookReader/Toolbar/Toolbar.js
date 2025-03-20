import 'jquery-colorbox';
import { escapeHTML } from '../utils.js';
import { EVENTS } from '../events.js';
/** @typedef {import("../../BookReader.js").default} BookReader */

export class Toolbar {
  /**
   * @param {BookReader} br
   */
  constructor(br) {
    this.br = br;
  }

  /**
   * This method builds the html for the toolbar. It can be decorated to extend
   * the toolbar.
   * @return {JQuery}
   */
  buildToolbarElement() {
    const { br } = this;
    const logoHtml = !br.showLogo ? '' : `
      <span class="BRtoolbarSection BRtoolbarSectionLogo">
        <a class="logo" href="${br.logoURL}"></a>
      </span>`;

    // Add large screen navigation
    br.refs.$BRtoolbar = $(`
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
    //     <img src="${br.imagesBaseURL}icon_hamburger.svg" />
    //     <div class="BRhamburgerDrawer"><ul><li>hi</li></ul></div>
    //   </button>
    // </span>

    const $titleSectionEl = br.refs.$BRtoolbar.find('.BRtoolbarSectionTitle');
    if (br.bookUrl && br.options.enableBookTitleLink) {
      $titleSectionEl.append(
        $('<a>')
          .attr({href: br.bookUrl, title: br.bookUrlTitle})
          .addClass('BRreturn')
          .html(br.bookUrlText || br.bookTitle),
      );
    } else if (br.bookTitle) {
      $titleSectionEl.append(br.bookUrlText || br.bookTitle);
    }

    // const $hamburger = br.refs.$BRtoolbar.find('BRtoolbarHamburger');
    return br.refs.$BRtoolbar;
  }

  /**
   * Initializes the toolbar (top)
   * @param {string} mode
   * @param {string} ui
   */
  initToolbar(mode, ui) {
    const { br } = this;
    br.refs.$br.append(this.buildToolbarElement());

    br.$('.BRnavCntl').addClass('BRup');
    br.$('.pause').hide();

    // We build in mode 2
    br.refs.$BRtoolbar.append();

    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !br.canSwitchToMode(br.constMode2up) ) {
      br.$('.two_page_mode, .play, .pause').hide();
    }
    if ( !br.canSwitchToMode(br.constModeThumb) ) {
      br.$('.thumbnail_mode').hide();
    }

    // Hide one page button if it is the only mode available
    if ( ! (br.canSwitchToMode(br.constMode2up) || br.canSwitchToMode(br.constModeThumb)) ) {
      br.$('.one_page_mode').hide();
    }

    $('<div style="display: none;"></div>')
      .append(blankShareDiv())
      .append(blankInfoDiv())
      .appendTo(br.refs.$br);

    br.$('.BRinfo .BRfloatTitle a')
      .attr({href: br.bookUrl})
      .text(br.bookTitle)
      .addClass('title');

    // These functions can be overridden
    this.buildInfoDiv(br.$('.BRinfo'));
    this.buildShareDiv(br.$('.BRshare'));

    br.$('.share').colorbox({
      inline: true,
      opacity: "0.5",
      href: br.$('.BRshare'),
      onLoad: () => {
        br.trigger(EVENTS.stop);
        br.$('.BRpageviewValue').val(window.location.href);
      },
    });
    br.$('.info').colorbox({
      inline: true,
      opacity: "0.5",
      href: br.$('.BRinfo'),
      onLoad: () => {
        br.trigger(EVENTS.stop);
      },
    });
  }

  /**
   * @param {JQuery} $shareDiv
   */
  buildShareDiv($shareDiv) {
    const { br } = this;
    const pageView = document.location + '';
    const bookView = (pageView + '').replace(/#.*/,'');

    const embedHtml = !br.getEmbedCode ? '' : `
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
                <input type="radio" name="pages" value="${br.constMode1up}" checked="checked"/>
                1 page
              </label>
              <label class="sub">
                <input type="radio" name="pages" value="${br.constMode2up}"/>
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
        <div><button class="BRaction share facebook-share-button"><i class="BRicon fb"></i>Facebook</button></div>
        <div><button class="BRaction share twitter-share-button"><i class="BRicon twitter"></i>Twitter</button></div>
        <div><button class="BRaction share email-share-button"><i class="BRicon email"></i>Email</button></div>
      </div>
      ${embedHtml}
      <div class="BRfloatFoot">
        <button class="share-finished" type="button" onclick="$.fn.colorbox.close();">Finished</button>
      </div>`);

    $form.appendTo($shareDiv);

    $form.find('.fieldset-embed input').on('change', event => {
      const form = $(event.target).parents('form').first();
      const params = {};
      params.mode = $(form.find('.fieldset-embed input[name=pages]:checked')).val();
      if (form.find('.fieldset-embed input[name=thispage]').prop('checked')) {
        params.page = br.book.getPageNum(br.currentIndex());
      }

      if (br.getEmbedCode) {
        // $$$ changeable width/height to be added to share UI
        const frameWidth = "480px";
        const frameHeight = "430px";
        form.find('.BRframeEmbed').val(br.getEmbedCode(frameWidth, frameHeight, params));
      }
    });

    $form.find('input, textarea').on('focus', event => event.target.select());

    // Bind share buttons

    // Use url without hashes
    $form.find('.facebook-share-button').on("click", () => {
      const params = $.param({ u: this._getSocialShareUrl() });
      const url = 'https://www.facebook.com/sharer.php?' + params;
      createPopup(url, 600, 400, 'Share');
    });
    $form.find('.twitter-share-button').on("click", () => {
      const params = $.param({
        url: this._getSocialShareUrl(),
        text: br.bookTitle,
      });
      const url = 'https://twitter.com/intent/tweet?' + params;
      createPopup(url, 600, 400, 'Share');
    });
    $form.find('.email-share-button').on("click", () => {
      const body = `${br.bookTitle}\n\n${this._getSocialShareUrl()}`;
      window.location.href = `mailto:?subject=${encodeURI(br.bookTitle)}&body=${encodeURI(body)}`;
    });

    $form.find('input[name=thispage]').trigger('change');

    $form.appendTo($shareDiv);
  }

  _getSocialShareUrl() {
    const { br } = this;
    const shareThisPage = br.$('.thispage-social').prop('checked');
    if (shareThisPage) {
      return window.location.href;
    } else {
      return `${document.location.protocol}//${window.location.hostname}${window.location.pathname}`;
    }
  }

  /**
   * @param {JQuery} $infoDiv DOM element. Appends info to this element
   * Can be overridden or extended
   */
  buildInfoDiv($infoDiv) {
    const { br } = this;
    // Remove these legacy elements
    $infoDiv.find('.BRfloatBody, .BRfloatCover, .BRfloatFoot').remove();

    const $leftCol = $(`<div class="BRinfoLeftCol"></div>`);
    if (br.thumbnail) {
      $leftCol.append($(`
        <div class="BRimageW">
          <img src="${br.thumbnail}" alt="${escapeHTML(br.bookTitle)}" />
        </div>`));
    }

    const $rightCol = $(`<div class="BRinfoRightCol">`);

    // A loop to build fields
    for (const {extraValueClass = '', label, value} of br.metadata) {
      const escapedValue = label === 'Title' ? escapeHTML(value) : value;
      $rightCol.append($(`
        <div class="BRinfoValueWrapper">
          <div class="BRinfoLabel">${label}</div>
          <div class="BRinfoValue ${extraValueClass}">${escapedValue}</div>
        </div>`));
    }

    const moreInfoText = br.bookUrlMoreInfo ? br.bookUrlMoreInfo : br.bookTitle;
    if (moreInfoText && br.bookUrl) {
      $rightCol.append($(`
        <div class="BRinfoValueWrapper">
          <div class="BRinfoMoreInfoWrapper">
            <a class="BRinfoMoreInfo" href="${br.bookUrl}">
              ${escapeHTML(moreInfoText)}
            </a>
          </div>
        </div>`));
    }

    const $footer = $(`<div class="BRfloatFoot BRinfoFooter"></div>`);
    const $children = $('<div class="BRinfoW mv20-lg">').append([
      $leftCol,
      $rightCol,
      $('<br style="clear:both"/>'),
    ]);

    $infoDiv
      .append($children, $footer)
      .addClass('wide');
  }

  /**
   * @return {number} (in pixels) of the toolbar height. 0 if no toolbar.
   */
  getToolBarHeight() {
    const { $BRtoolbar } = this.br.refs;
    if ($BRtoolbar && $BRtoolbar.css('display') === 'block') {
      return ($BRtoolbar.outerHeight() + parseInt($BRtoolbar.css('top')));
    } else {
      return 0;
    }
  }
}

function blankInfoDiv() {
  return $(`
    <div class="BRfloat BRinfo">
      <div class="BRfloatHead">About this book
        <button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="br-colorbox-shift">Close</span></button>
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
}

function blankShareDiv() {
  return $(`
    <div class="BRfloat BRshare">
      <div class="BRfloatHead">
        Share
        <button class="floatShut" href="javascript:;" onclick="$.fn.colorbox.close();"><span class="br-colorbox-shift">Close</span></button>
      </div>
    </div>`);
}

/**
 * Helper opens a popup window. On mobile it only opens a new tab. Used for share.
 * @param {string} href
 * @param {number} width
 * @param {number} height
 * @param {string} name
 */
export function createPopup(href, width, height, name) {
  // Fixes dual-screen position
  const dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
  const dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

  const win_w = window.innerWidth || document.documentElement.clientWidth || screen.width;
  const win_h = window.innerHeight || document.documentElement.clientHeight || screen.height;

  const left = ((win_w / 2) - (width / 2)) + dualScreenLeft;
  const top = ((win_h / 2) - (height / 2)) + dualScreenTop;
  const opts = `status=1,width=${width},height=${height},top=${top},left=${left}`;

  window.open(href, name, opts);
}
