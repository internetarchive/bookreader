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
    const black = css`#000`;
    const white = css`#fff`;
    const grey222 = css`#222`;
    const grey333 = css`#333`;
    const grey999 = css`#999`;
    const primaryCTAFill = css`#194880`;
    const primaryCTABorder = css`#c5d1df`;
    const secondaryCTAFill = grey333;
    const secondaryCTABorder = grey999;
    const primaryErrorCTAFill = css`#e51c26`;
    const primaryErrorCTABorder = css`#f8c6c8`;

    return css`
      :host {
        display: block;
        --white: ${white};
        --blackColor: ${black};
        --primaryBGColor: ${black};
        --secondaryBGColor: ${grey222};
        --tertiaryBGColor: ${grey333};
        --primaryTextColor: var(--white);
        --primaryCTAFill: ${primaryCTAFill};
        --primaryCTABorder: ${primaryCTABorder};
        --secondaryCTAFill: ${secondaryCTAFill};
        --secondaryCTABorder: ${secondaryCTABorder};
        --primaryErrorCTAFill: ${primaryErrorCTAFill};
        --primaryErrorCTABorder: ${primaryErrorCTABorder};
        --redBookmarkColor: #eb3223;
        --blueBookmarkColor: #0023f5;
        --greenBookmarkColor: #75ef4c;
      }

      .book-reader {
        background-color: ${black};
        position: relative;
        width: 100vw;
        height: auto;
      }

      item-navigator {
        display: block;
        width: 100%;
        color: var(--primaryTextColor);
        --menuButtonLabelDisplay: block;
        --menuWidth: 320px;
        --menuSliderBg: var(--secondaryBGColor);
        --activeButtonBg: var(--tertiaryBGColor);
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

window.customElements.define("ia-bookreader", BookReader);
