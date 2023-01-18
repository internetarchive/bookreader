/**
 * BookReaderTemplate to load BookNavigator components
 */

import { LitElement, html, css } from 'lit';

import '@internetarchive/ia-item-navigator';
import '../BookNavigator/book-navigator.js';
// eslint-disable-next-line no-unused-vars
import { ModalManager } from '@internetarchive/modal-manager';
import '@internetarchive/modal-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';

export class IaBookReader extends LitElement {
  static get properties() {
    return {
      item: { type: Object },
      baseHost: { type: String },
      signedIn: { type: Boolean },
      fullscreen: { type: Boolean, reflect: true, attribute: true },
      sharedObserver: { type: Object, attribute: false },
      modal: { type: Object, attribute: false },
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
    this.signedIn = false;
    /** @type {ModalManager} */
    this.modal = undefined;
    /** @type {SharedResizeObserver} */
    this.sharedObserver = undefined;
    this.loaded = false;
    this.menuShortcuts = [];
    this.menuContents = [];
    this.openMenuName = '';

    this.options = undefined;
    this.pages = undefined;
    this.downloadUrls = []; // * @param {Array} postInitOptions.downloadURLs
    this.isRestricted = false; // * @param {Boolean} postInitOptions.isRestricted
  }

  updated(changed) {
    if (!this.modal) {
      this.setModalManager();
    }

    if (!this.sharedObserver) {
      this.sharedObserver = new SharedResizeObserver();
    }

    if (changed.hash('pages') && this.pages) {
      // repaint bookreader, keep options
    }

    if (changed.has('options') && this.options) {
      // restart bookreader with new options
    }
  }

  get itemNav() {
    return this.shadowRoot.querySelector('ia-item-navigator');
  }

  /** Creates modal DOM & attaches to `<body>` */
  setModalManager() {
    let modalManager = document.querySelector('modal-manager');
    if (!modalManager) {
      modalManager = document.createElement(
        'modal-manager'
      );
      document.body.appendChild(modalManager);
    }

    this.modal = modalManager;
  }

  manageFullscreen(e) {
    const { detail } = e;
    const fullscreen = !!detail.isFullScreen;
    this.fullscreen = fullscreen;
    this.dispatchEvent(new CustomEvent('fullscreenStateUpdated', { detail: { fullscreen }}));

  }

  loadingStateUpdated(e) {
    const { loaded } = e.detail;
    this.loaded = loaded || null;
    this.dispatchEvent(new CustomEvent('loadingStateUpdated', { detail: { loaded }}));
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

    this.openMenuName = menuId;

    if (action === 'open') {
      this.itemNav?.openShortcut(menuId);
    } else if (action === 'toggle') {
      this.itemNav?.toggleMenu();
    }
  }

  bindEventListeners() {
    // manage here so core code can independently run
    window.addEventListener('BookReader:PostInit', (e) => {
      this.bookreader = e.detail.props;
      this.bookReaderLoaded = true;
      this.bookReaderCannotLoad = false;
      this.emitLoadingStatusUpdate(true);
      this.loadSharedObserver();
      setTimeout(() => {
        this.bookreader.resize();
      }, 0);
    });

    // move to properties
    window.addEventListener('LendingFlow:PostInit', ({ detail }) => {
      const {
        downloadTypesAvailable, lendingStatus, isAdmin, previewType,
      } = detail;
      this.lendingInitialized = true;
      this.downloadableTypes = downloadTypesAvailable;
      this.lendingStatus = lendingStatus;
      this.isAdmin = isAdmin;
      this.bookReaderCannotLoad = previewType === 'singlePagePreview';
      this.emitLoadingStatusUpdate(true);
    });

    // move to properties
    window.addEventListener('BRJSIA:PostInit', ({ detail }) => {
      const { isRestricted, downloadURLs } = detail;
      this.bookReaderLoaded = true;
      this.downloadableTypes = downloadURLs;
      this.bookIsRestricted = isRestricted;
    });

  }

  render() {
    return html`
      <div class="main-component">
        <ia-item-navigator
          ?viewportInFullscreen=${this.fullscreen}
          .basehost=${this.baseHost}
          .item=${this.item}
          .modal=${this.modal}
          .loaded=${this.loaded}
          .sharedObserver=${this.sharedObserver}
          ?signedIn=${this.signedIn}
          .menuShortcuts=${this.menuShortcuts}
          .menuContents=${this.menuContents}
          .openMenu=${this.openMenuName}
        >
          <div slot="header">
            <slot name="header"></slot>
          </div>
          <div slot="main">
            <book-navigator
              .bookreader=${this.bookreader}
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
              <div slot="main">
                <slot name="main"></slot>
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
        background-color: var(--primaryBGColor);
        position: relative;
      }

      :host([fullscreen]),
      ia-item-navigator[viewportinfullscreen] {
        position: fixed;
        inset: 0;
        height: 100%;
        min-height: unset;
      }

      .main-component {
        height: 100%;
        width: 100%;
        min-height: inherit;
      }

      div[slot="header"],
      div[slot="main"] {
        display: flex;
        width: 100%;
      }

      slot {
        display: block;
        flex: 1;
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

window.customElements.define("ia-bookreader", IaBookReader);
