// eslint-disable-next-line no-unused-vars
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
// eslint-disable-next-line no-unused-vars
import { ModalManager } from '@internetarchive/modal-manager';
import { css, html, LitElement, nothing } from 'lit';
import SearchProvider from './search/search-provider.js';
import DownloadProvider from './downloads/downloads-provider.js';
import VisualAdjustmentProvider from './visual-adjustments/visual-adjustments-provider.js';
import BookmarksProvider from './bookmarks/bookmarks-provider.js';
import SharingProvider from './sharing.js';
import ViewableFilesProvider from './viewable-files.js';
import iaLogo from './assets/ia-logo.js';

const events = {
  menuUpdated: 'menuUpdated',
  updateSideMenu: 'updateSideMenu',
  PostInit: 'PostInit',
  ViewportInFullScreen: 'ViewportInFullScreen',
};
export class BookNavigator extends LitElement {
  static get properties() {
    return {
      itemMD: { type: Object },
      bookReaderLoaded: { type: Boolean },
      bookreader: { type: Object },
      bookIsRestricted: { type: Boolean },
      downloadableTypes: { type: Array },
      isAdmin: { type: Boolean },
      lendingInitialized: { type: Boolean },
      lendingStatus: { type: Object },
      menuProviders: { type: Object },
      menuShortcuts: { type: Array },
      signedIn: { type: Boolean },
      loaded: { type: Boolean },
      sharedObserver: { type: Object, attribute: false },
      modal: { type: Object, attribute: false },
      fullscreenBranding: { type: Object },
    };
  }

  constructor() {
    super();
    this.itemMD = undefined;
    this.loaded = false;
    this.bookReaderCannotLoad = false;
    this.bookReaderLoaded = false;
    this.bookreader = null;
    this.bookIsRestricted = false;
    this.downloadableTypes = [];
    this.isAdmin = false;
    this.lendingInitialized = false;
    this.lendingStatus = {};
    this.menuProviders = {};
    this.menuShortcuts = [];
    this.signedIn = false;
    /** @type {ModalManager} */
    this.modal = undefined;
    /** @type {SharedResizeObserver} */
    this.sharedObserver = undefined;
    this.fullscreenBranding = iaLogo;
    // Untracked properties
    this.sharedObserverHandler = undefined;
    this.brWidth = 0;
    this.brHeight = 0;
    this.shortcutOrder = [
      /**
       * sets exit FS button (`this.fullscreenBranding1)
       * when `br.options.enableFSLogoShortcut`
       */
      'fullscreen',
      'volumes',
      'chapters',
      'search',
      'downloads',
      'bookmarks',
      'visualAdjustments',
      'share'
    ];
  }

  disconnectedCallback() {
    this.sharedObserver.removeObserver({
      target: this.mainBRContainer,
      handler: this.sharedObserverHandler
    });
  }

  firstUpdated() {
    this.bindEventListeners();
    this.emitPostInit();
    this.loaded = true;
  }

  updated(changed) {
    if (!this.bookreader || !this.itemMD || !this.bookReaderLoaded) {
      return;
    }

    const reload = changed.has('loaded') && this.loaded;
    if (reload
      || changed.has('itemMD')
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

  /**
   * Global event emitter for when Book Navigator loads
   */
  emitPostInit() {
    // emit global event when book nav has loaded with current bookreader selector
    this.dispatchEvent(new CustomEvent(`BrBookNav:${events.PostInit}`, {
      detail: { brSelector: this.bookreader?.el },
      bubbles: true,
      composed: true,
    }));
  }

  /**
   *  @typedef {{
   *  baseHost: string,
   *  modal: ModalManager,
   *  sharedObserver: SharedResizeObserver,
   *  bookreader: BookReader,
   *  item: Item,
   *  signedIn: boolean,
   *  isAdmin: boolean,
   *  onProviderChange: (BookReader, object) => void,
   *  }} baseProviderConfig
   *
   * @return {baseProviderConfig}
   */
  get baseProviderConfig() {
    return  {
      baseHost: this.baseHost,
      modal: this.modal,
      sharedObserver: this.sharedObserver,
      bookreader: this.bookreader,
      item: this.itemMD,
      signedIn: this.signedIn,
      isAdmin: this.isAdmin,
      onProviderChange: () => {}
    };
  }

  get isWideEnoughToOpenMenu() {
    return this.brWidth >= 640;
  }
  /**
   * Instantiates books submenus & their update callbacks
   *
   * NOTE: we are doing our best to scope bookreader's instance.
   * If your submenu provider uses a bookreader instance to read, manually
   * manipulate BookReader, please update the navigator's instance of it
   * to keep it in sync.
   */
  initializeBookSubmenus() {
    const providers = {
      share: new SharingProvider(this.baseProviderConfig),
      visualAdjustments: new VisualAdjustmentProvider({
        ...this.baseProviderConfig,
        /** Update menu contents */
        onProviderChange: () => {
          this.updateMenuContents();
        },
      }),
    };

    if (this.shouldShowDownloadsMenu()) {
      providers.downloads = new DownloadProvider(this.baseProviderConfig);
    }

    if (this.bookreader.options.enableSearch) {
      providers.search = new SearchProvider({
        ...this.baseProviderConfig,
        /**
         * Search specific menu updates
         * @param {BookReader} brInstance
         * @param {{ searchCanceled: boolean }} searchUpdates
         */
        onProviderChange: (brInstance = null, searchUpdates = {}) => {
          if (brInstance) {
            /* refresh br instance reference */
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
        }
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
        }
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

  /** Fullscreen Shortcut */
  addFullscreenShortcut() {
    const closeFS = {
      icon: this.fullscreenShortcut,
      id: 'fullscreen',
    };
    this.menuShortcuts.push(closeFS);
    this.menuShortcuts = this.sortMenuShortcuts(this.menuShortcuts);
    this.emitMenuShortcutsUpdated();
  }

  deleteFullscreenShortcut() {
    const updatedShortcuts = this.menuShortcuts.filter(({ id }) => {
      return id !== 'fullscreen';
    });
    this.menuShortcuts = updatedShortcuts;
    this.menuShortcuts = this.sortMenuShortcuts(this.menuShortcuts);
    this.emitMenuShortcutsUpdated();
  }

  closeFullscreen() {
    this.bookreader.exitFullScreen();
  }

  get fullscreenShortcut() {
    return html`
      <button
        @click=${() => this.closeFullscreen()}
        title="Exit fullscreen view"
      >${this.fullscreenBranding}</button>
    `;
  }
  /** End Fullscreen Shortcut */

  /**
   * Open side menu
   * @param {string} menuId
   * @param {('open'|'close'|'toggle')} action
   */
  updateSideMenu(menuId = '', action = 'open') {
    if (!menuId) {
      return;
    }
    const event = new CustomEvent(
      events.updateSideMenu, {
        detail: { menuId, action },
      },
    );
    this.dispatchEvent(event);
  }

  /**
   * Sets order of menu and emits custom event when done
   */
  updateMenuContents() {
    const {
      search, downloads, visualAdjustments, share, bookmarks, volumes, chapters
    } = this.menuProviders;
    const availableMenus = [volumes, chapters, search, bookmarks, visualAdjustments, share].filter((menu) => !!menu);

    if (this.shouldShowDownloadsMenu()) {
      downloads?.update(this.downloadableTypes);
      availableMenus.splice(1, 0, downloads);
    }

    const arrangedMenus = this.sortMenuShortcuts(availableMenus);
    const event = new CustomEvent(
      events.menuUpdated, {
        detail: arrangedMenus,
      },
    );
    this.dispatchEvent(event);
  }

  /**
   * Confirms if we should show the downloads menu
   * @returns {bool}
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
   * already added. menuShortcuts are then sorted by shortcutOrder and
   * a menuShortcutsUpdated event is emitted.
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
    this.menuShortcuts = this.sortMenuShortcuts(this.menuShortcuts);
    this.emitMenuShortcutsUpdated();
  }

  /**
   * Removes a provider object from the menuShortcuts array and emits a
   * menuShortcutsUpdated event.
   *
   * @param {string} menuId - a string matching the id property of a provider
   */
  removeMenuShortcut(menuId) {
    this.menuShortcuts = this.menuShortcuts.filter((m) => m.id !== menuId);
    this.emitMenuShortcutsUpdated();
  }

  /**
   * Sorts the menuShortcuts property by comparing each provider's id to
   * the id in each iteration over the shortcutOrder array.
   */
  sortMenuShortcuts(menuShortcuts) {
    const sortedMenu = this.shortcutOrder.reduce((shortcuts, id) => {
      const menu = menuShortcuts.find((m) => m.id === id);
      if (menu) { shortcuts.push(menu); }
      return shortcuts;
    }, []);
    return sortedMenu;
  }

  emitMenuShortcutsUpdated() {
    const event = new CustomEvent('menuShortcutsUpdated', {
      detail: this.menuShortcuts,
    });
    this.dispatchEvent(event);
  }

  emitLoadingStatusUpdate(loaded) {
    const event = new CustomEvent('loadingStateUpdated', {
      detail: { loaded },
    });
    this.dispatchEvent(event);
  }

  /**
   * Core bookreader event handler registry
   *
   * NOTE: we are trying to keep bookreader's instance in scope
   * Please update Book Navigator's instance reference of it to keep it current
   */
  bindEventListeners() {
    window.addEventListener('BookReader:PostInit', (e) => {
      this.bookreader = e.detail.props;
      this.bookreader.shell = this;
      this.bookReaderLoaded = true;
      this.bookReaderCannotLoad = false;
      this.emitLoadingStatusUpdate(true);
      this.loadSharedObserver();
      setTimeout(() => {
        this.bookreader.resize();
      }, 0);
    });
    window.addEventListener('BookReader:fullscreenToggled', (event) => {
      const { detail: { props: brInstance = null } } = event;
      if (brInstance) {
        this.bookreader = brInstance;
      }
      this.manageFullScreenBehavior();
    }, { passive: true });
    window.addEventListener('BookReader:ToggleSearchMenu', (event) => {
      this.dispatchEvent(new CustomEvent(events.updateSideMenu, {
        detail: { menuId: 'search', action: 'toggle' },
      }));
    });
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
    window.addEventListener('BRJSIA:PostInit', ({ detail }) => {
      const { isRestricted, downloadURLs } = detail;
      this.bookReaderLoaded = true;
      this.downloadableTypes = downloadURLs;
      this.bookIsRestricted = isRestricted;
    });
    window.addEventListener('contextmenu', (e) => this.manageContextMenuVisibility(e), { capture: true });
  }

  /** Display an element's context menu */
  manageContextMenuVisibility(e) {
    window.archive_analytics?.send_event(
      'BookReader',
      `contextmenu-${this.bookIsRestricted ? 'restricted' : 'unrestricted'}`,
      e.target?.classList?.value
    );
    if (!this.bookIsRestricted) {
      return;
    }

    const imagePane = e.target.classList.value.match(/BRscreen|BRpageimage/g);
    if (!imagePane) {
      return;
    }

    e.preventDefault();
    return false;
  }

  loadSharedObserver() {
    this.sharedObserverHandler = { handleResize: this.handleResize.bind(this) };
    this.sharedObserver?.addObserver({
      target: this.mainBRContainer,
      handler: this.sharedObserverHandler
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
    const startBrWidth = this.brWidth;
    const startBrHeight = this.brHeight;
    const { animating } = this.bookreader;

    if (target === this.mainBRContainer) {
      this.brWidth = contentRect.width;
      this.brHeight = contentRect.height;
    }

    if (!startBrWidth && this.brWidth) {
      // loading up, let's update side menus
      this.initializeBookSubmenus();
    }

    const widthChange = startBrWidth !== this.brWidth;
    const heightChange = startBrHeight !== this.brHeight;

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
    this.emitFullScreenState();

    if (!this.bookreader.options.enableFSLogoShortcut) {
      return;
    }

    const isFullScreen = this.bookreader.isFullscreen();
    if (isFullScreen) {
      this.addFullscreenShortcut();
    } else {
      this.deleteFullscreenShortcut();
    }
  }

  /**
   * Relays fullscreen toggle events
   */
  emitFullScreenState() {
    const isFullScreen = this.bookreader.isFullscreen();
    const event = new CustomEvent('ViewportInFullScreen', {
      detail: { isFullScreen },
    });
    this.dispatchEvent(event);
  }

  get itemImage() {
    const identifier = this.itemMD?.metadata.identifier;
    const url = `https://${this.baseHost}/services/img/${identifier}`;
    return html`<img class="cover-img" src=${url} alt="cover image for ${identifier}">`;
  }

  get placeholder() {
    return html`<div class="placeholder">${this.itemImage}</div>`;
  }

  render() {
    return html`<div id="book-navigator__root">
      ${this.bookReaderCannotLoad ? this.placeholder : nothing}
      ${!this.bookReaderCannotLoad ? html`<slot name="main"></slot>` : nothing}
    </div>
  `;
  }

  static get styles() {
    return css`
    :host,
    #book-navigator__root,
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
  `;
  }
}

customElements.define('book-navigator', BookNavigator);
