/**
 * BookReaderTemplate to load BookNavigator components
 */

import { LitElement, html, css } from 'lit-element';

import '@internetarchive/ia-item-navigator';
import '../BookNavigator/book-navigator.js';
import '@internetarchive/modal-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
export class BookReader extends LitElement {
  static get properties() {
    return {
      item: { type: String },
      baseHost: { type: String },
      fullscreen: { type: Boolean, reflect: true, attribute: true },
      sharedObserver: { type: Object }
    };
  }

  constructor() {
    super();
    this.item = undefined;
    this.bookreader = undefined;
    this.baseHost = 'https://archive.org';
    this.fullscreen = false;
    this.modal = undefined;
    this.sharedObserver = new SharedResizeObserver();
  }

  firstUpdated() {
    this.createModal();
  }

  /** Creates modal DOM & attaches to `<body>` */
  createModal() {
    this.modal = document.createElement(
      'modal-manager'
    );
    document.body.appendChild(this.modal);
  }
  /* End Modal management */

  manageFullscreen(e) {
    const { detail } = e;
    const fullscreen = !!detail.isFullScreen;
    this.fullscreen = fullscreen;
  }

  render() {
    return html`
      <div class="ia-bookreader">
        <ia-item-navigator
          ?viewportInFullscreen=${this.fullscreen}
          @fullscreenToggled=${this.manageFullscreen}
          .itemType=${'bookreader'}
          .basehost=${this.baseHost}
          .item=${this.item}
          .modal=${this.modal}
          .sharedObserver=${this.sharedObserver}
        >
          <div slot="theater-main">
            <slot name="theater-main"></slot>
          </div>
        </ia-item-navigator>
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

      :host([fullscreen]),
      ia-item-navigator[viewportinfullscreen] {
        position: fixed;
        inset: 0;
        height: 100vh;
        min-height: unset;
      }

      .ia-bookreader {
        background-color: var(--primaryBGColor);
        position: relative;
        min-height: inherit;
        height: inherit;
      }

      ia-item-navigator {
        min-height: var(--br-height, inherit);
        height: var(--br-height, inherit);
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
