import { css, html, LitElement } from 'lit-element';
import { nothing } from 'lit-html';
import SearchProvider from './search/search-provider.js';
import DownloadProvider from './downloads/downloads-provider.js';
import VisualAdjustmentProvider from './visual-adjustments/visual-adjustments-provider.js';
import BookmarksProvider from './bookmarks/bookmarks-provider.js';
import SharingProvider from '../ItemNavigator/providers/sharing.js';
import VolumesProvider from './volumes/volumes-provider.js';
import BRFullscreenMgr from './br-fullscreen-mgr.js';
import { Book } from './BookModel.js';
import bookLoader from './assets/book-loader.js';

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

    // Untracked properties
    this.fullscreenMgr = null;
    this.brResizeObserver = null;
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
    const isFirstSideMenuUpdate = changed.has('sideMenuOpen') && (changed.get('sideMenuOpen') === undefined);
    if (!isFirstSideMenuUpdate) {
      // realign image
      if (this.bookreader.animating) {
        return;
      }
      this.bookreader.resize();
      const curIndex = this.bookreader.currentIndex();
      this.bookreader.jumpToIndex(curIndex);
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
      bookmarks: new BookmarksProvider(this.bookmarksOptions, this.bookreader),
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
      displayMode: this.signedIn ? 'bookmarks' : 'login',
      showItemNavigatorModal: this.showItemNavigatorModal.bind(this),
      closeItemNavigatorModal: this.closeItemNavigatorModal.bind(this),
      onBookmarksChanged: (bookmarks) => {
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
      downloads.update(this.downloadableTypes);
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
      setTimeout(() => this.bookreader.resize(), 0);
      this.brResizeObserver = new ResizeObserver((elements) => this.reactToBrResize(elements));
      this.brResizeObserver.observe(this.mainBRContainer);
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
   * @param { Object } entries - resize observer entries
   */
  reactToBrResize(entries = []) {
    const startBrWidth = this.brWidth;
    const { animating } = this.bookreader;

    entries.forEach(({ contentRect, target }) => {
      if (target === this.mainBRContainer) {
        this.brWidth = contentRect.width;
      }
    });
    setTimeout(() => {
      if (startBrWidth && !animating) {
        this.bookreader.resize();
      }
    }, 0);
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

  emitShowItemNavigatorModal(e) {
    this.dispatchEvent(new CustomEvent('showItemNavigatorModal', {
      detail: e.detail,
    }));
  }

  emitCloseItemNavigatorModal() {
    this.dispatchEvent(new CustomEvent('closeItemNavigatorModal'));
  }

  showItemNavigatorModal(e) {
    this.emitShowItemNavigatorModal(e);
  }

  closeItemNavigatorModal() {
    this.emitCloseItemNavigatorModal();
  }

  get loader() {
    const loader = html`
      <div class="book-loader">${bookLoader}<div>
      <h3>Loading viewer</h3>
    `;
    return loader;
    return !this.bookReaderLoaded ? loader : nothing;
  }

  get loadingClass() {
    return !this.bookReaderLoaded ? 'loading' : '';
  }

  get itemImage() {
    const url = `https://${this.baseHost}/services/img/${this.book.metadata.identifier}`;
    return html`<img src="${url}" alt="cover image for ${this.book.metadata.identifier}">`;
  }

  render() {
    const placeholder = this.bookReaderCannotLoad ? this.itemImage : this.loader;
    return html`<div id="book-navigator" class="${this.loadingClass}">
      ${this.loader}
      <div class="book-loader">
        <p>webkit only: </p>
        <svg
        height="100"
        viewBox="0 0 100 100"
        width="100"
        xmlns="http://www.w3.org/2000/svg"
        aria-labelledby="bookreader-loading-2"
        >
          <title id="bookreader-loading-2">Currently loading viewer.</title>
          <desc>Please wait while we load book reader.</desc>
          <g fill="#333" fill-rule="evenodd" class="book-icon">
            <g transform="matrix(1 0 0 -1 28 67.362264)">
              <path d="m44.71698 31.6981124v-29.99320678s-18.0956599.30735848-18.6322637-.7171698c-.0633962-.12226414-1.890566-.59207545-2.9745282-.59207545-1.3228302 0-3.5122641 0-4.1286791.74547168-.9707547 1.17452827-18.82811278.71660375-18.82811278.71660375v30.040754l1.83849052.7867924.29094339-28.48188608s15.94981097.15339622 17.09094297-1.10716978c.8145283-.90056602 4.997547-.91641507 5.3450942-.3526415.9611321 1.55716977 14.7101883 1.31716978 17.6077354 1.45981128l.3266038 28.22830118z"/>
              <path d="m40.1129424 33.5957539h-12.8337733c-1.8690565 0-3.1098112-.7545283-3.9299999-1.6279245v-26.70452764l1.2362264-.00792453c.4584906.72962262 3.0922641 1.39415091 3.0922641 1.39415091h10.1298111s1.0381131.01754717 1.5141509.47377357c.5643396.54056602.7913207 1.36981129.7913207 1.36981129z"/>
              <path d="m17.3354713 33.5957539h-12.8337733v-25.37660316s0-.75283017.49358489-1.14113205c.52867924-.41433961 1.3415094-.42849055 1.3415094-.42849055h10.59905631s2.2075471-.52698112 3.0928301-1.39415091l1.2.00792453v26.74245214c-.8201886.8581132-2.0530188 1.59-3.8932074 1.59"/>
            </g>
            <path
              class="ring-wk"
              d="m17.8618849 11.6970233c18.5864635-15.59603144 45.6875867-15.59603102 64.2740497.000001 1.9271446 1.6170806 2.1785128 4.4902567.5614466 6.4174186-1.6170661 1.9271618-4.4902166 2.1785323-6.4173612.5614517-15.1996922-12.75416882-37.3625282-12.75416916-52.5622206-.000001-15.19969387 12.7541707-19.04823077 34.5805019-9.1273354 51.7641499 9.9208955 17.183646 30.7471499 24.7638499 49.3923323 17.9774983 18.6451823-6.7863521 29.7266014-25.9801026 26.2811129-45.5206248-.436848-2.4775114 1.2174186-4.8400696 3.6949079-5.2769215 2.4774893-.4368518 4.8400264 1.2174296 5.2768744 3.694941 4.2132065 23.8945096-9.3373563 47.3649806-32.137028 55.6634567-22.799672 8.2984758-48.2663986-.9707372-60.39785211-21.9832155-12.1314534-21.012481-7.42539173-47.7021198 11.16107351-63.2981544z"
              fill-rule="nonzero"
            />
          </g>
        </svg>
      </div>
    </div>
  `;
  }

  static get styles() {
    return css`
    #book-navigator.loading {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 30vh;
    }

    #book-navigator .book-loader {
      width: 30%;
      margin: auto;
      text-align: center;
      color: var(--primaryTextColor);
    }

    .book-loader svg {
      display: block;
      width: 60%;
      max-width: 100px;
      height: auto;
      margin: auto;
    }

    svg * {
      fill: var(--primaryTextColor);
    }

    svg .ring {
      animation: rotate 1.3s infinite linear;
      transform-origin: 50px 50px;
      transform-box: fill-box;
    }

    svg .ring-wk {
      -webkit-animation: rotate 1.3s infinite linear;
      animation: rotate 1.3s infinite linear;
      transform-origin: 50px 50px;
      transform-box: fill-box;
    }

    @-webkit-keyframes rotate {
      0% {
        -webkit-transform: rotate(-360deg);
      }
    }

    @keyframes rotate {
      0% {
        transform: rotate(-360deg);
      }
    }
  `;
  }
}

customElements.define('book-navigator', BookNavigator);
