/**
 * BookReaderTemplate to load BookNavigator components
 */

import { LitElement, html, css } from 'lit-element';

import '@internetarchive/ia-item-navigator';
import '../BookNavigator/book-navigator.js';
// eslint-disable-next-line no-unused-vars
import { ModalManager } from '@internetarchive/modal-manager';
import '@internetarchive/modal-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
export class BookReader extends LitElement {
  static get properties() {
    return {
      item: { type: Object },
      baseHost: { type: String },
      fullscreen: { type: Boolean, reflect: true, attribute: true },
      sharedObserver: { type: Object },
      loaded: { type: Boolean },
      menuShortcuts: { type: Array },
      menuContents: { type: Array },
    };
  }

  constructor() {
    super();
    this.item = undefined;
    this.bookreader = undefined;
    this.baseHost = 'https://archive.org';
    this.fullscreen = false;
    /** @type {ModalManager} */
    this.modal = undefined;
    /** @type {SharedResizeObserver} */
    this.sharedObserver = new SharedResizeObserver();
    this.loaded = false;
    this.menuShortcuts = [];
    this.menuContents = [];
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

  loadingStateUpdated(e) {
    const { loaded } = e.detail;
    this.loaded = loaded || null;
  }

  setMenuShortcuts(e) {
    this.menuShortcuts = [...e.detail];
  }

  setMenuContents(e) {
    const updatedContents = [...e.detail];
    this.menuContents = updatedContents;
  }

  manageSideMenuEvents(e) {
    const { menuId, action } = e.detail;
    if (!menuId) {
      return;
    }

    if (action === 'open') {
      this.itemNav.openShortcut(menuId);
      this.openShortcut(menuId);
    } else if (action === 'toggle') {
      this.itemNav.openMenu(menuId);
      this.itemNav.toggleMenu();
    }
  }

  render() {
    return html`
      <div class="ia-bookreader">
        <ia-item-navigator
          ?viewportInFullscreen=${this.fullscreen}
          .itemType=${'open'}
          .basehost=${this.baseHost}
          .item=${this.item}
          .modal=${this.modal}
          .loaded=${this.loaded}
          .sharedObserver=${this.sharedObserver}
          ?signedIn=${this.signedIn}
          .menuShortcuts=${this.menuShortcuts}
          .menuContents=${this.menuContents}
        >
          <div slot="theater-main">
            <book-navigator
              .modal=${this.modal}
              .baseHost=${this.baseHost}
              .itemMD=${this.item}
              ?signedIn=${this.signedIn}
              ?sideMenuOpen=${this.menuOpened}
              .sharedObserver=${this.sharedObserver}
              @ViewportInFullScreen=${this.manageFullscreen}
              @loadingStateUpdated=${this.loadingStateUpdated}
              @updateSideMenu=${this.manageSideMenuEvents}
              @menuUpdated=${this.setMenuContents}
              @menuShortcutsUpdated=${this.setMenuShortcuts}
            >
              <div slot="theater-main">
                <slot name="theater-main"></slot>
              </div>
            </book-navigator>
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
      div[slot="theater-main"] {
        height: inherit;
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
