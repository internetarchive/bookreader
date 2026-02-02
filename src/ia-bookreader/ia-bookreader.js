// @ts-check
/**
 * Wrapping web component for Internet Archive's BookReader. Currently operates
 * more as a shell ; requires BookReader to be instantiated independently in the
 * main slot.
 */

import { LitElement, html, css } from 'lit';

import '@internetarchive/ia-item-navigator';
import '@internetarchive/modal-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import '@internetarchive/icon-ia-logo';
import SearchProvider from '../plugins/search/search-provider.js';
import DownloadProvider from './downloads/downloads-provider.js';
import VisualAdjustmentProvider from './visual-adjustments/visual-adjustments-provider.js';
import BookmarksProvider from '../plugins/bookmarks/bookmarks-provider.js';
import SharingProvider from './sharing.js';
import ViewableFilesProvider from './viewable-files.js';
import { sortBy } from '../BookReader/utils.js';
/** @typedef {import('@/src/BookReader.js').default} BookReader */
/** @typedef {import('@internetarchive/modal-manager').ModalManager} ModalManager */


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
      bookReaderLoaded: { type: Boolean },
      bookreader: { type: Object },
      bookIsRestricted: { type: Boolean },
      downloadableTypes: { type: Array },
      isAdmin: { type: Boolean },
      lendingInitialized: { type: Boolean },
      lendingStatus: { type: Object },
      menuProviders: { type: Object },
      fullscreenBranding: { type: Object },
    };
  }

  /** @type {import('@internetarchive/ia-item-navigator').ItemNavigator} */
  get itemNav() {
    return this.shadowRoot.querySelector('iaux-item-navigator');
  }

  constructor() {
    super();
    /** The IA metadata item */
    this.item = undefined;
    /** @type {BookReader} */
    this.bookreader = undefined;
    this.baseHost = 'archive.org';
    this.fullscreen = false;
    this.signedIn = false;
    /** @type {ModalManager} */
    this.modal = undefined;
    /** @type {SharedResizeObserver} */
    this.sharedObserver = undefined;
    this.loaded = false;
    /** @type {Array<{ id: string, icon: string | import('lit').TemplateResult }>} */
    this.menuShortcuts = [];
    this.menuContents = [];
    this.openMenuName = '';

    this.bookReaderCannotLoad = false;
    this.bookReaderLoaded = false;
    this.bookIsRestricted = false;
    this.downloadableTypes = [];
    this.isAdmin = false;
    this.lendingInitialized = false;
    this.lendingStatus = {};
    this.menuProviders = {
      /** @type {BookmarksProvider} */
      bookmarks: null,
      /** @type {SearchProvider} */
      search: null,
      /** @type {DownloadProvider} */
      downloads: null,
      /** @type {VisualAdjustmentProvider} */
      visualAdjustments: null,
      /** @type {SharingProvider} */
      share: null,
      /** @type {ViewableFilesProvider} */
      volumes: null,
    };
    this.signedIn = false;
    this.fullscreenBranding = html`<ia-icon-ia-logo aria-hidden="true"></ia-icon-ia-logo>`;
    // Untracked properties
    this._sharedObserverHandler = { handleResize: this.handleResize.bind(this) };
    this._brWidth = 0;
    this._brHeight = 0;
    this.shortcutOrder = [
      /**
       * sets exit FS button (`this.fullscreenBranding`)
       * when `br.options.enableFSLogoShortcut`
       */
      'fullscreen',
      'volumes',
      'chapters',
      'search',
      'translate',
      'bookmarks',
      'downloads',
      'visualAdjustments',
      'share',
      'experiments',
    ];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unloadSharedObserver();
  }

  firstUpdated() {
    if (!this.modal) {
      this.setModalManager();
    }

    if (!this.sharedObserver) {
      this.sharedObserver = new SharedResizeObserver();
    }

    this._bindEventListeners();
    this.loaded = true;
  }

  /**
   * @param {import('lit').PropertyValues} changed
   */
  updated(changed) {
    if (!this.bookreader || !this.item || !this.bookReaderLoaded) {
      return;
    }

    const reload = changed.has('loaded') && this.loaded;
    if (reload
      || changed.has('item')
      || changed.has('bookreader')
      || changed.has('signedIn')
      || changed.has('isAdmin')
      || changed.has('modal')) {
      this.initializeBookSubmenus();
    }

    if (changed.has('sharedObserver') && this.bookreader) {
      this.loadSharedObserver();
      this.initializeBookSubmenus();
    }

    if (changed.has('downloadableTypes')) {
      this.initializeBookSubmenus();
    }
  }

  loadSharedObserver() {
    this.unloadSharedObserver();
    this.sharedObserver?.addObserver({
      target: this.mainBRContainer,
      handler: this._sharedObserverHandler,
    });
  }

  unloadSharedObserver() {
    this.sharedObserver?.removeObserver({
      target: this.mainBRContainer,
      handler: this._sharedObserverHandler,
    });
  }

  /**
   * Uses resize observer to fire BookReader's `resize` functionality
   * We do not want to trigger resize IF:
   *  - book animation is happening
   *  - book is in fullscreen (fullscreen is handled separately)
   *
   * @param { target: HTMLElement, contentRect: DOMRectReadOnly } entry
   */
  handleResize({ contentRect, target }) {
    const startBrWidth = this._brWidth;
    const startBrHeight = this._brHeight;
    const { animating } = this.bookreader;

    if (target === this.mainBRContainer) {
      this._brWidth = contentRect.width;
      this._brHeight = contentRect.height;
    }

    if (!startBrWidth && this._brWidth) {
      // loading up, let's update side menus
      this.initializeBookSubmenus();
    }

    const widthChange = startBrWidth !== this._brWidth;
    const heightChange = startBrHeight !== this._brHeight;

    if (!animating && (widthChange || heightChange)) {
      this.bookreader?.resize();
    }
  }

  /**
   * Manages Fullscreen behavior
   * This makes sure that controls are _always_ in view
   * We need this to accommodate LOAN BAR during fullscreen
   */
  manageFullScreenBehavior() {
    if (!this.bookreader.options.enableFSLogoShortcut) {
      return;
    }

    this.fullscreen = this.bookreader.isFullscreen();
    this.dispatchEvent(new CustomEvent('fullscreenStateUpdated', { detail: { fullscreen: this.fullscreen }}));
    if (this.fullscreen) {
      this.addFullscreenShortcut();
    } else {
      this.deleteFullscreenShortcut();
    }
  }

  /** Creates modal DOM & attaches to `<body>` */
  setModalManager() {
    /** @type {ModalManager} */
    let modalManager = document.querySelector('modal-manager');
    if (!modalManager) {
      modalManager = /** @type {ModalManager} */(document.createElement('modal-manager'));
      document.body.appendChild(modalManager);
    }

    this.modal = modalManager;
  }

  /**
   * Instantiates books submenus & their update callbacks
   *
   * NOTE: we are doing our best to scope bookreader's instance.
   * If your submenu provider uses a bookreader instance to read, manually
   * manipulate BookReader, please update ia-bookreader's instance of it
   * to keep it in sync.
   */
  initializeBookSubmenus() {
    const providers = {
      visualAdjustments: new VisualAdjustmentProvider({
        ...this.baseProviderConfig,
        /** Update menu contents */
        onProviderChange: () => {
          this.updateMenuContents();
        },
      }),
    };

    if (this.baseProviderConfig.item) {
      // Share options currently rely on IA item metadata
      providers.share = new SharingProvider(this.baseProviderConfig);
    }

    if (this.shouldShowDownloadsMenu()) {
      providers.downloads = new DownloadProvider(this.baseProviderConfig);
    }

    // Note plugins will never be null-ish in runtime, but some of the unit tests
    // stub BR with a nullish value there.
    if (this.bookreader.options.plugins?.search?.enabled) {
      providers.search = new SearchProvider({
        ...this.baseProviderConfig,
        /**
         * Search specific menu updates
         * @param {BookReader} brInstance
         * @param {Partial<{ searchCanceled: boolean, openMenu: boolean }>} searchUpdates
         */
        onProviderChange: (brInstance = null, searchUpdates = {}) => {
          if (brInstance) {
            /** @type {BookReader} refresh br instance reference */
            this.bookreader = brInstance;
          }

          this.updateMenuContents();

          if (searchUpdates.openMenu === false) {
            return;
          }

          if (this.isWideEnoughToOpenMenu && !searchUpdates?.searchCanceled) {
            /* open side search menu */
            setTimeout(() => {
              this.updateSideMenu('search', 'open');
            }, 0);
          }
        },
      });
    }

    if (this.bookreader.options.enableBookmarks) {
      providers.bookmarks = new BookmarksProvider({
        ...this.baseProviderConfig,
        onProviderChange: (bookmarks) => {
          const method = Object.keys(bookmarks).length ? 'add' : 'remove';
          this[`${method}MenuShortcut`]('bookmarks');
          this.updateMenuContents();
        },
      });
    }

    // add shortcut for volumes if multipleBooksList exists
    if (this.bookreader.options.enableMultipleBooks) {
      providers.volumes = new ViewableFilesProvider({
        ...this.baseProviderConfig,
        onProviderChange: (brInstance = null, volumesUpdates = {}) => {
          if (brInstance) {
            /* refresh br instance reference */
            this.bookreader = brInstance;
          }
          this.updateMenuContents();
          if (this.isWideEnoughToOpenMenu) {
            /* open side search menu */
            setTimeout(() => {
              this.updateSideMenu('volumes', 'open');
            });
          }
        },
      });
    }

    Object.assign(this.menuProviders, providers);
    this.addMenuShortcut('search');
    this.addMenuShortcut('volumes');
    this.updateMenuContents();
  }

  /** gets element that houses the bookreader in light dom */
  get mainBRContainer() {
    return document.querySelector(this.bookreader?.el);
  }

  get baseProviderConfig() {
    return  {
      baseHost: this.baseHost,
      modal: this.modal,
      sharedObserver: this.sharedObserver,
      bookreader: this.bookreader,
      item: this.item,
      signedIn: this.signedIn,
      isAdmin: this.isAdmin,
      /** @type {function(BookReader, object): void} */
      onProviderChange: () => {},
    };
  }

  get isWideEnoughToOpenMenu() {
    return this._brWidth >= 640;
  }

  /**
   * Open side menu
   * @param {string} menuId
   * @param {('open'|'close'|'toggle')} action
   */
  updateSideMenu(menuId = '', action = 'open') {
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

  /** Fullscreen Shortcut */
  addFullscreenShortcut() {
    this.menuShortcuts.push({
      icon: this.fullscreenShortcut,
      id: 'fullscreen',
    });
    this._sortMenuShortcuts();
  }

  deleteFullscreenShortcut() {
    this.menuShortcuts = this.menuShortcuts
      .filter(s => s.id !== 'fullscreen');
    this._sortMenuShortcuts();
  }

  get fullscreenShortcut() {
    return html`
      <button
        @click=${() => this.bookreader.exitFullScreen()}
        title="Exit fullscreen view"
      >${this.fullscreenBranding}</button>
    `;
  }
  /** End Fullscreen Shortcut */

  /**
   * Sets order of menu and emits custom event when done
   */
  updateMenuContents() {
    const availableMenus = sortBy(
      Object.entries(this.menuProviders)
        .filter(([id, menu]) => !!menu)
        .filter(([id, menu]) => {
          return id === 'downloads' ? this.shouldShowDownloadsMenu() : true;
        }),
      ([id, menu]) => {
        const index = this.shortcutOrder.indexOf(id);
        return index === -1 ? this.shortcutOrder.length : index;
      },
    ).map(([id, menu]) => menu);

    if (this.shouldShowDownloadsMenu()) {
      this.menuProviders.downloads?.update(this.downloadableTypes);
    }

    this.menuContents = availableMenus;
  }

  /**
   * Confirms if we should show the downloads menu
   * @returns {boolean}
   */
  shouldShowDownloadsMenu() {
    if (!this.downloadableTypes.length) { return false; }
    if (this.bookIsRestricted === false) { return true; }
    if (this.isAdmin) { return true; }
    const { user_loan_record = {} } = this.lendingStatus;
    const hasNoLoanRecord = Array.isArray(user_loan_record); /* (bc PHP assoc. arrays) */

    if (hasNoLoanRecord) { return false; }

    const hasValidLoan = user_loan_record.type && (user_loan_record.type !== 'SESSION_LOAN');
    return hasValidLoan;
  }

  /**
   * Adds a provider object to the menuShortcuts array property if it isn't
   * already added, then sorts menuShortcuts based on shortcutOrder.
   *
   * @param {string} menuId - a string matching the id property of a provider
   */
  addMenuShortcut(menuId) {
    if (this.menuShortcuts.find((m) => m.id === menuId)) {
      // menu is already there
      return;
    }

    if (!this.menuProviders[menuId]) {
      // no provider for this menu
      return;
    }

    this.menuShortcuts.push(this.menuProviders[menuId]);
    this._sortMenuShortcuts();
  }

  /**
   * Sorts the menuShortcuts property by comparing each provider's id to
   * the id in each iteration over the shortcutOrder array.
   */
  _sortMenuShortcuts() {
    this.menuShortcuts = sortBy(
      this.menuShortcuts,
      (shortcut) => {
        const index = this.shortcutOrder.indexOf(shortcut.id);
        return index === -1 ? this.shortcutOrder.length : index;
      },
    );
  }

  /**
   * Core bookreader event handler registry
   *
   * NOTE: we are trying to keep bookreader's instance in scope
   * Please update ia-bookreader's instance reference of it to keep it current
   */
  _bindEventListeners() {
    window.addEventListener('BookReader:PostInit', /** @param {CustomEvent} e */ (e) => {
      this.bookreader = e.detail.props;
      this.bookreader.shell = this;
      this.bookReaderLoaded = true;
      this.bookReaderCannotLoad = false;
      this.loaded = true;
      this.loadSharedObserver();
      setTimeout(() => this.bookreader.resize(), 0);
    });
    window.addEventListener('BookReader:fullscreenToggled', /** @param {CustomEvent} event */  (event) => {
      const brInstance = event.detail.props;
      if (brInstance) {
        this.bookreader = brInstance;
      }
      this.manageFullScreenBehavior();
    }, { passive: true });
    window.addEventListener('BookReader:ToggleSearchMenu', /** @param {CustomEvent} event */ (event) => {
      this.updateSideMenu('search', 'toggle');
    });
    window.addEventListener('LendingFlow:PostInit', /** @param {CustomEvent} detail */ ({ detail }) => {
      const {
        downloadTypesAvailable, lendingStatus, isAdmin, previewType,
      } = detail;
      this.lendingInitialized = true;
      this.downloadableTypes = downloadTypesAvailable;
      this.lendingStatus = lendingStatus;
      this.isAdmin = isAdmin;
      this.bookReaderCannotLoad = previewType === 'singlePagePreview';
      this.loaded = true;
    });
    window.addEventListener('BRJSIA:PostInit', /** @param {CustomEvent} detail */ ({ detail }) => {
      const { isRestricted, downloadURLs } = detail;
      this.bookReaderLoaded = true;
      this.downloadableTypes = downloadURLs;
      this.bookIsRestricted = isRestricted;
    });
    window.addEventListener('contextmenu', (e) => this._manageContextMenuVisibility(e), { capture: true });
  }

  /**
   * @param {PointerEvent} e
   **/
  _manageContextMenuVisibility(e) {
    const target = /** @type {HTMLElement} */(e.target);

    window['archive_analytics']?.send_event(
      'BookReader',
      `contextmenu-${this.bookIsRestricted ? 'restricted' : 'unrestricted'}`,
      target?.classList?.value,
    );
    if (!this.bookIsRestricted) {
      return;
    }

    const imagePane = target.classList.value.match(/BRscreen|BRpageimage/g);
    if (!imagePane) {
      return;
    }

    e.preventDefault();
    return false;
  }

  get itemImage() {
    const identifier = this.item?.metadata.identifier;
    const url = `https://${this.baseHost}/services/img/${identifier}`;
    return html`<img class="cover-img" src=${url} alt="cover image for ${identifier}">`;
  }

  get placeholder() {
    return html`<div class="placeholder">${this.itemImage}</div>`;
  }

  render() {
    return html`
      <iaux-item-navigator
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
          ${this.bookReaderCannotLoad ? this.placeholder : html`<slot name="main"></slot>`}
        </div>
      </iaux-item-navigator>
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
      iaux-item-navigator[viewportinfullscreen] {
        position: fixed;
        inset: 0;
        height: 100%;
        min-height: unset;
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

      slot,
      slot > * {
        display: block;
        height: inherit;
        width: inherit;
      }
      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin: 5%;
      }
      .cover-img {
        max-height: 300px;
      }

      iaux-item-navigator {
        display: block;
        width: 100%;
        min-height: var(--br-height, inherit);
        height: var(--br-height, 100%);
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
