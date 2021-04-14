/**
 * BookReaderTemplate to load BookNavigator components
 */

import { LitElement, html, css } from 'lit-element';

import '../ItemNavigator/ItemNavigator.js'
import '../BookNavigator/BookNavigator.js'

export class BookReader extends LitElement {

  static get properties() {
    return {
      base64Json: { type: String },
    };
  }

  static get styles() {
    return css`
      .book-reader {
        background-color: ${black};
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

  /**
   * Fetch metadata response from public metadata API
   * convert response to base64 data
   * set base64 data to props
   */
  async fetchData() {
    const ocaid = new URLSearchParams(location.search).get('ocaid');
    const response = await fetch(`https://archive.org/metadata/${ocaid}`);
    const bookMetadata = await response.json();
    const jsonBtoa = btoa(JSON.stringify(bookMetadata));
    this.setBaseJSON(jsonBtoa);
  }

  /**
   * Set base64 data to prop
   * @param {string} value - base64 string format
   */
  setBaseJSON(value) {
    this.base64Json = value;
  }

  render() {
    return html`
      <div class="book-reader">
        <item-navigator
          itemType="bookreader"
          basehost=${this.baseHost}
          item=${this.base64Json}>
          <div slot="bookreader">
            <slot name="bookreader"></slot>
          </div>
        </item-navigator>
      </div>
    `;
  }
}

window.customElements.define("book-reader", BookReader);
