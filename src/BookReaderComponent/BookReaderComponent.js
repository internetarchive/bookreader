/**
 * BookReaderTemplate to load BookNavigator components
 */

import { LitElement, html, css } from 'lit-element';

import '@internetarchive/ia-item-navigator';
import '../BookNavigator/BookNavigator.js';

export class BookReader extends LitElement {
  static get properties() {
    return {
      base64Json: { type: String },
      baseHost: { type: String },
    };
  }

  constructor() {
    super();
    this.base64Json = '';
    this.baseHost = 'https://archive.org';
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
    const response = await fetch(`${this.baseHost}/metadata/${ocaid}`);
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
      <div class="ia-bookreader">
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

  static get styles() {
    return css`
      :host {
        display: block;
        --primaryBGColor: var(--black, #000);
        --secondaryBGColor: #222;
        --tertiaryBGColor: #333;
        --primaryTextColor: var(--white, #fff);
        --primaryCTAFill: #194880;
        --primaryCTABorder: #c5d1df;
        --secondaryCTAFill: #333;
        --secondaryCTABorder: #999;
        --primaryErrorCTAFill: #e51c26;
        --primaryErrorCTABorder: #f8c6c8;
      }

      .ia-bookreader {
        background-color: var(--primaryBGColor);
        position: relative;
        min-height: inherit;
        height: inherit;
      }

      item-navigator {
        display: block;
        width: 100%;
        color: var(--primaryTextColor);
        --menuButtonLabelDisplay: block;
        --menuWidth: 320px;
        --menuSliderBg: var(--secondaryBGColor);
        --activeButtonBg: var(--tertiaryBGColor);
        --subpanelRightBorderColor: var(--secondaryCTABorder);
        --animationTiming: 100ms;
        --iconFillColor: var(--primaryTextColor);
        --iconStrokeColor: var(--primaryTextColor);
        --menuSliderHeaderIconHeight: 2rem;
        --menuSliderHeaderIconWidth: 2rem;
        --iconWidth: 2.4rem;
        --iconHeight: 2.4rem;
        --shareLinkColor: var(--primaryTextColor);
        --shareIconBorder: var(--primaryTextColor);
        --shareIconBg: var(--secondaryBGColor);
        --activityIndicatorLoadingDotColor: var(--primaryTextColor);
        --activityIndicatorLoadingRingColor: var(--primaryTextColor);
      }
    `;
  }
}

window.customElements.define("ia-bookreader", BookReader);
