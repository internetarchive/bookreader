import { css, html, LitElement } from 'lit-element';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import SearchProvider from './search/search-provider.js';
import DownloadProvider from './downloads/downloads-provider.js';
import VisualAdjustmentProvider from './visual-adjustments/visual-adjustments-provider.js';
import BookmarksProvider from './bookmarks/bookmarks-provider.js';
import SharingProvider from './sharing.js';
import VolumesProvider from './volumes/volumes-provider.js';
import BRFullscreenMgr from './br-fullscreen-mgr.js';
import { Book } from './BookModel.js';

const events = {
  menuUpdated: 'menuUpdated',
  updateSideMenu: 'updateSideMenu',
  PostInit: 'PostInit',
  ViewportInFullScreen: 'ViewportInFullScreen',
};
export class BookNavigator extends LitElement {
  static get properties() {
    return {
      book: { type: Object },
      pageContainerSelector: { type: String },
      brWidth: { type: Number },
      bookReaderLoaded: { type: Boolean },
      bookreader: { type: Object },
      downloadableTypes: { type: Array },
      isAdmin: { type: Boolean },
      lendingInitialized: { type: Boolean },
      lendingStatus: { type: Object },
      menuProviders: { type: Object },
      menuShortcuts: { type: Array },
      sideMenuOpen: { type: Boolean },
      signedIn: { type: Boolean },
      sharedObserver: { reflect: false }
    };
  }

  constructor() {
    super();
    this.book = {};
    this.pageContainerSelector = '.BRcontainer';
    this.brWidth = 0;
    this.bookReaderCannotLoad = false;
    this.bookReaderLoaded = false;
    this.bookreader = null;
    this.downloadableTypes = [];
    this.isAdmin = false;
    this.lendingInitialized = false;
    this.lendingStatus = {};
    this.menuProviders = {};
    this.menuShortcuts = [];
    this.sideMenuOpen = false;
    this.signedIn = false;
    this.modal = undefined;
    this.sharedObserver = undefined;

    // Untracked properties
    this.fullscreenMgr = null;
    this.sharedObserver = null;
    this.model = new Book();
    this.shortcutOrder = ['volumes', 'search', 'bookmarks'];
  }

  firstUpdated() {
    this.model.setMetadata(this.book);
    this.bindEventListeners();
    this.emitPostInit();
  }

  updated(changed) {
    if (!this.bookreader) {
      return;
    }
    if (changed.has('signedIn') || changed.has('isAdmin')) {
      /** redraw book submenus to propagate property update */
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
   * Instantiates books submenus & their update callbacks
   *
   * NOTE: we are doing our best to scope bookreader's instance.
   * If your submenu provider uses a bookreader instance to read, manually
   * manipulate BookReader, please update the navigator's instance of it
   * to keep it in sync.
   */
  initializeBookSubmenus() {
    const isBookProtected = this.bookreader.options.protected;

    // const baseProviderConfig = {
    //   modal: this.modal,
    //   sharedObserver: this.sharedObserver,
    //   bookreader: this.bookreader,
    //   signedIn: this.signedIn,
    //   isAdmin: this.isAdmin,
    // };

    this.menuProviders = {
      search: new SearchProvider(
        /**
         * Search specific menu updates
         * @param {BookReader} brInstance
         * @param {{ searchCanceled: boolean }} searchUpdates
         */
        (brInstance = null, searchUpdates = {}) => {
          if (brInstance) {
            /* refresh br instance reference */
            this.bookreader = brInstance;
          }
          this.updateMenuContents();
          const wideEnoughToOpenMenu = this.brWidth >= 640;
          if (wideEnoughToOpenMenu && !searchUpdates?.searchCanceled) {
            /* open side search menu */
            this.updateSideMenu('search', 'open');
          }
        },
        this.bookreader,
      ),
      downloads: new DownloadProvider(isBookProtected),
      visualAdjustments: new VisualAdjustmentProvider({
        onOptionChange: (event, brInstance = null) => {
          if (brInstance) {
            /* refresh br instance reference */
            this.bookreader = brInstance;
          }
          this.updateMenuContents();
        },
        bookContainerSelector: this.pageContainerSelector,
        bookreader: this.bookreader,
      }),
      share: new SharingProvider(this.book.metadata, this.baseHost, this.itemType, this.bookreader.options.subPrefix),
      bookmarks: new BookmarksProvider(this.bookmarksOptions),
    };

    // add shortcut for volumes if multipleBooksList exists
    if (this.bookreader.options.enableMultipleBooks) {
      this.menuProviders.volumes = new VolumesProvider(this.baseHost, this.bookreader, (brInstance) => {
        if (brInstance) {
          /* refresh br instance reference */
          this.bookreader = brInstance;
        }
        this.updateMenuContents();
        this.updateSideMenu('volumes', 'open');
      });
      this.addMenuShortcut('volumes');
    }

    this.addMenuShortcut('search'); /* start with search as a shortcut */
    this.updateMenuContents();
  }

  /** gets element that houses the bookreader in light dom */
  get mainBRContainer() {
    return document.querySelector(this.bookreader.el);
  }

  get bookmarksOptions() {
    const referrerStr = `referer=${encodeURIComponent(location.href)}`;
    return {
      loginUrl: `https://${this.baseHost}/account/login?${referrerStr}`,
      signedIn: this.signedIn,
      isAdmin: this.isAdmin,
      modal: this.modal,
      sharedObserver: this.sharedObserver,
      bookreader: this.bookreader,
      onBookmarksChanged: (bookmarks, showSidePanel = false) => {
        console.log('booknav on bkch', bookmarks, showSidePanel);
        if (showSidePanel) {
          this.updateSideMenu('bookmarks', 'open');
        }
        const method = Object.keys(bookmarks).length ? 'add' : 'remove';
        this[`${method}MenuShortcut`]('bookmarks');
        this.updateMenuContents();
      },
    };
  }

  /**
   * Open side menu
   * @param {string} menuId
   * @param {('open'|'close'|'toggle')} action
   */
  updateSideMenu(menuId = '', action = 'open') {
    if (!menuId || !action) {
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
      search, downloads, visualAdjustments, share, bookmarks, volumes
    } = this.menuProviders;
    const availableMenus = [volumes, search, bookmarks, visualAdjustments, share].filter((menu) => !!menu);

    if (this.shouldShowDownloadsMenu()) {
      downloads?.update(this.downloadableTypes);
      availableMenus.splice(1, 0, downloads);
    }

    const event = new CustomEvent(
      events.menuUpdated, {
        detail: availableMenus,
      },
    );
    this.dispatchEvent(event);
  }

  /**
   * Confirms if we should show the downloads menu
   * @returns {bool}
   */
  shouldShowDownloadsMenu() {
    if (this.model.isRestricted === false) { return true; }
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
    if (this.menuShortcuts.find((m) => m.id === menuId)) { return; }

    this.menuShortcuts.push(this.menuProviders[menuId]);
    this.sortMenuShortcuts();
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
  sortMenuShortcuts() {
    this.menuShortcuts = this.shortcutOrder.reduce((shortcuts, id) => {
      const menu = this.menuShortcuts.find((m) => m.id === id);
      if (menu) { shortcuts.push(menu); }
      return shortcuts;
    }, []);
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
      this.bookReaderLoaded = true;
      this.bookReaderCannotLoad = false;
      this.fullscreenMgr = new BRFullscreenMgr(this.bookreader.el);

      this.initializeBookSubmenus();
      this.startResizeObserver();
      this.emitLoadingStatusUpdate(true);
    });
    window.addEventListener('BookReader:fullscreenToggled', (event) => {
      const { detail: { props: brInstance = null } } = event;
      if (brInstance) {
        this.bookreader = brInstance;
      }
      this.manageFullScreenBehavior(event);
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
    });
    window.addEventListener('BRJSIA:PostInit', ({ detail }) => {
      const { isRestricted, downloadURLs } = detail;
      this.bookReaderLoaded = true;
      this.downloadableTypes = downloadURLs;
      this.model.setRestriction(isRestricted);
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
    const { animating } = this.bookreader;

    if (target === this.mainBRContainer) {
      this.brWidth = contentRect.width;
    }

    setTimeout(() => {
      if (startBrWidth && !animating) {
        this.bookreader.resize();
      }
    }, 0);
  }

  async startResizeObserver() {
    if (!this.sharedObserver) {
      this.sharedObserver = new SharedResizeObserver();
    }

    this.sharedObserver?.addObserver({
      handler: this,
      target: this.mainBRContainer,
    });
  }

  /**
   * Manages Fullscreen behavior
   * This makes sure that controls are _always_ in view
   * We need this to accommodate LOAN BAR during fullscreen
   */
  manageFullScreenBehavior() {
    this.emitFullScreenState();
    if (!this.bookreader.isFullscreen()) {
      this.fullscreenMgr.teardown();
    } else {
      this.fullscreenMgr.setup(this.bookreader);
    }
  }

  /**
   * Intercepts and relays fullscreen toggle events
   */
  emitFullScreenState() {
    const isFullScreen = this.bookreader.isFullscreen();
    const event = new CustomEvent('ViewportInFullScreen', {
      detail: { isFullScreen },
    });
    this.dispatchEvent(event);
  }

  get loadingClass() {
    return !this.bookReaderLoaded ? 'loading' : '';
  }

  get itemImage() {
    const url = `https://${this.baseHost}/services/img/${this.book.metadata.identifier}`;
    return html`<img class="cover-img" src="${url}" alt="cover image for ${this.book.metadata.identifier}">`;
  }

  render() {
    const placeholder = this.bookReaderCannotLoad ? this.itemImage : this.loader;
    return html`<div id="book-navigator" class="${this.loadingClass}">
      ${placeholder}
      <slot name="bookreader"></slot>
    </div>
  `;
  }

  static get styles() {
    return css`
    .cover-img {
      max-height: 300px;
    }
  `;
  }
}

customElements.define('book-navigator', BookNavigator);
