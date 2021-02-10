import { LitElement, html, css } from 'lit-element';

import '../ItemNavigator/ItemNavigator.js'
import '../BookNavigator/BookNavigator.js'

export class BookReaderTemplate extends LitElement {

  static get properties() {
    return {
      base64Json: { type: String },
    };
  }

  static get styles() {
    return css`
      #theatre-ia-wrap {
        background-color: #000000;
        position: relative;
        width: 100vw;
        height: auto;
      }

      item-navigator {
        display: block;
        width: 100%;
        --menuButtonLabelDisplay: block;
        --menuSliderBg: #151515;
        --subpanelRightBorderColor: #999;
        --activeButtonBg: #282828;
        --primaryTextColor: #fff;
        --menuWidth: 32rem;
        --animationTiming: 100ms;
        --iconFillColor: #fff;
        --iconStrokeColor: #fff;
        --menuSliderHeaderIconHeight: 2rem;
        --menuSliderHeaderIconWidth: 2rem;
        --iconWidth: 2.4rem;
        --iconHeight: 2.4rem;
        --searchResultText: #adaedc;
        --searchResultBg: #272958;
        --searchResultBorder: #fff;
        --downloadButtonColor: #fff;
        --downloadButtonBg: #194880;
        --downloadButtonBorderColor: #c5d1df;
        --externalButtonColor: #fff;
        --externalButtonBg: #333;
        --externalButtonBorderColor: #999;
        --shareLinkColor: #fff;
        --shareIconBorder: #fff;
        --shareIconBg: #151515;
        --activityIndicatorLoadingDotColor: #fff;
        --activityIndicatorLoadingRingColor: #fff;
        --activeBorderWidth: 2px;
        --activeBookmark: #538bc5;
        --defaultBookmarkColor: #282828;
        --blueBookmarkColor: #428bca;
        --redBookmarkColor: #eb3223;
        --greenBookmarkColor: #75ef4c;
        --yellowBookmarkColor: #fffd54;
        --bookmarkThumbWidth: 37px;
        --bookmarkListSeparatorColor: #151515;
        --loadingPagePlaceholder: #fefdeb;
        --createButtonColor: #194880;
        --createButtonBorderColor: #c5d1df;
        --saveButtonColor: #194880;
        --saveButtonBorderColor: #c5d1df;
        --deleteButtonColor: #e51c26;
        --deleteButtonBorderColor: #f8c6c8;
      }
    `;
  }

  constructor() {
    super();
    this.base64Json = '';
  }

  firstUpdated() {
    this.fetchData();
  }

  async fetchData() {
    const ocaid = location.href.match(/ocaid=([^&#]+)/i)[1];
    const url = 'https://archive.org/metadata/' + ocaid;
    const response = await fetch(url);
    const bookMetadata = await response.json()
    const jsonBtoa = btoa(JSON.stringify(bookMetadata))
    this.setBaseJSON(jsonBtoa)
  }

  setBaseJSON(value) {
    this.base64Json = value
  }

  render() {
    return html`
      <div id="theatre-ia-wrap" class="container container-ia width-max">
        <div id="theatre-ia" class="width-max">
          <div class="row">
            <div id="IABookReaderMessageWrapper" style="display:none;"></div>
            <item-navigator itemType="bookreader" basehost="archive.org" item=${this.base64Json}>
              <div slot="bookreader">
                <slot name="bookreader"></slot>
              </div>
            </item-navigator>
          </div>
        </div>
      </div>
    `;
  }
}
