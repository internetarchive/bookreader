// @ts-check
/**
 * OL Mobile Search Plugin
 *
 * When ?ref=ol is present and the viewport is mobile-width, injects a
 * native-style header (IA logo + bookmark + search + more) above the book
 * content and renders inline search results below the search bar instead of
 * opening the sidebar drawer.
 *
 * Activation: ?ref=ol AND window.innerWidth <= options.mobileBreakpoint
 */
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
/** @typedef {import('../../BookReader.js').default} BookReader */
/** @typedef {import('../search/plugin.search.js').SearchInsideMatch} SearchInsideMatch */

// Grab the global BookReader class set by BookReader.js (same pattern as other plugins)
const BookReader = /** @type {typeof import('../../BookReader.js').default} */ (window.BookReader);

// ── SVG constants ──────────────────────────────────────────────────────────
const CHEVRON_UP   = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>`;
const CHEVRON_DOWN = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
const CHEVRON_LEFT = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const CHEVRON_RIGHT = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

// ── Real IA logo SVG (from @internetarchive/icon-ia-logo) ──────────────────
const IA_LOGO_SVG = `<svg viewBox="0 0 27 30" xmlns="http://www.w3.org/2000/svg" width="24" height="27" aria-hidden="true">
  <path fill="currentColor" d="M26.6666667,28.6046512 L26.6666667,30 L0,30 L0.000283687943,28.6046512 L26.6666667,28.6046512 Z M25.6140351,26.5116279 L25.6140351,28.255814 L1.05263158,28.255814 L1.05263158,26.5116279 L25.6140351,26.5116279 Z M3.62469203,7.6744186 L3.91746909,7.82153285 L4.0639977,10.1739544 L4.21052632,13.9963932 L4.21052632,17.6725617 L4.0639977,22.255044 L4.03962296,25.3421929 L3.62469203,25.4651163 L2.16024641,25.4651163 L1.72094074,25.3421929 L1.55031755,22.255044 L1.40350877,17.6970339 L1.40350877,14.0211467 L1.55031755,10.1739544 L1.68423854,7.80887484 L1.98962322,7.6744186 L3.62469203,7.6744186 Z M24.6774869,7.6744186 L24.9706026,7.82153285 L25.1168803,10.1739544 L25.2631579,13.9963932 L25.2631579,17.6725617 L25.1168803,22.255044 L25.0927809,25.3421929 L24.6774869,25.4651163 L23.2130291,25.4651163 L22.7736357,25.3421929 L22.602418,22.255044 L22.4561404,17.6970339 L22.4561404,14.0211467 L22.602418,10.1739544 L22.7369262,7.80887484 L23.0420916,7.6744186 L24.6774869,7.6744186 Z M9.94042303,7.6744186 L10.2332293,7.82153285 L10.3797725,10.1739544 L10.5263158,13.9963932 L10.5263158,17.6725617 L10.3797725,22.255044 L10.3556756,25.3421929 L9.94042303,25.4651163 L8.47583122,25.4651163 L8.0362015,25.3421929 L7.86556129,22.255044 L7.71929825,17.6970339 L7.71929825,14.0211467 L7.86556129,10.1739544 L8.00005604,7.80887484 L8.30491081,7.6744186 L9.94042303,7.6744186 Z M18.0105985,7.6744186 L18.3034047,7.82153285 L18.449948,10.1739544 L18.5964912,13.9963932 L18.5964912,17.6725617 L18.449948,22.255044 L18.425851,25.3421929 L18.0105985,25.4651163 L16.5460067,25.4651163 L16.1066571,25.3421929 L15.9357367,22.255044 L15.7894737,17.6970339 L15.7894737,14.0211467 L15.9357367,10.1739544 L16.0702315,7.80887484 L16.3753664,7.6744186 L18.0105985,7.6744186 Z M25.6140351,4.53488372 L25.6140351,6.97674419 L1.05263158,6.97674419 L1.05263158,4.53488372 L25.6140351,4.53488372 Z M13.0806755,0 L25.9649123,2.93331338 L25.4484139,3.8372093 L0.771925248,3.8372093 L0,3.1041615 L13.0806755,0 Z"/>
</svg>`;

export class OLMobilePlugin extends BookReaderPlugin {
  static pluginName = 'olMobile';

  options = {
    mobileBreakpoint: 640,
    olRef: 'ol',
  };

  // ── DOM refs ───────────────────────────────────────────────────────────────
  /** @type {HTMLElement|null} */       _wrapper = null;
  /** @type {HTMLButtonElement|null} */ _chromeHandle = null;
  // Search UI
  /** @type {HTMLElement|null} */       _resultsPanel = null;
  /** @type {HTMLElement|null} */       _searchRow = null;
  /** @type {HTMLInputElement|null} */  _searchInput = null;
  /** @type {HTMLButtonElement|null} */ _clearBtn = null;
  /** @type {HTMLButtonElement|null} */ _searchBtn = null;
  // Search result nav bar
  /** @type {HTMLElement|null} */       _navBar = null;
  /** @type {HTMLButtonElement|null} */ _navPrevBtn = null;
  /** @type {HTMLButtonElement|null} */ _navNextBtn = null;
  /** @type {HTMLElement|null} */       _navPosEl = null;
  /** @type {HTMLElement|null} */       _navSnippetEl = null;
  // Bookmark UI
  /** @type {HTMLButtonElement|null} */ _bookmarkBtn = null;
  /** @type {HTMLElement|null} */       _bookmarkCountBubble = null;
  /** @type {HTMLElement|null} */       _bmNoteBar = null;
  /** @type {HTMLInputElement|null} */  _bmNoteInput = null;
  /** @type {HTMLButtonElement|null} */ _bmSaveBtn = null;
  /** @type {HTMLElement|null} */       _bmListPanel = null;
  // Page nav (injected into BRnavMain scrubber after PostInit)
  /** @type {HTMLElement|null} */ _pageNavBar = null;

  // ── State ──────────────────────────────────────────────────────────────────
  /** @type {SearchInsideMatch[]} */ _matches = [];
  /** @type {number} */  _currentMatchIdx = -1;
  /** @type {boolean} */ _active = false;
  /** @type {string} */  _savedQuery = '';
  /** @type {number[]} */ _bmPageIDs = [];  // sorted leaf indices of all bookmarks
  /** @type {number} */  _targetResultIdx = -1;  // 0-based; set from ?result=N on load

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  init() {
    if (!this._shouldActivate()) return;
    this._active = true;
    this._setupMobileUI();
    this._prefillFromUrl();
  }

  /**
   * If ?q= or #search/ is in the URL, open the search bar and pre-fill it.
   * If ?result=N (1-based) is also present, auto-navigate to that result once
   * search results arrive.
   */
  _prefillFromUrl() {
    const urlParams = new URLSearchParams(this.br.readQueryString());

    // initialSearchTerm is set by BookReader.js from #search/TERM or ?q=TERM
    // before any plugin init runs. Read ?q= directly too as a belt-and-suspenders
    // fallback for embedders that set the param after BookReader reads it.
    const term = this.br.plugins.search?.options.initialSearchTerm
      ?? (urlParams.has('q') ? urlParams.get('q') : null);

    if (term == null) return;  // neither source present — do nothing

    // ?result=N (1-based) → auto-jump to the Nth result once results arrive
    const resultParam = parseInt(urlParams.get('result') ?? '', 10);
    if (!isNaN(resultParam) && resultParam >= 1) {
      this._targetResultIdx = resultParam - 1;  // store 0-based
    }

    this._openSearch();
    if (term && this._searchInput) {
      this._searchInput.value = term;
      if (this._clearBtn) this._clearBtn.hidden = false;
      this._savedQuery = term;
      this._showLoading();
    }
    // term === '' : search UI is open for input, no search submitted yet
  }

  _shouldActivate() {
    // Use br.readQueryString() so params in the URL hash (e.g. #?ref=ol) are
    // also detected — window.location.search misses hash-embedded params.
    const params = new URLSearchParams(this.br.readQueryString());
    return (
      params.get('ref') === this.options.olRef &&
      window.innerWidth <= this.options.mobileBreakpoint
    );
  }

  _setupMobileUI() {
    const br = this.br;
    const $root = br.refs.$br;
    $root[0].classList.add('BRolMobile');
    if (br.refs.$BRtoolbar) br.refs.$BRtoolbar.hide();
    $root.find('.BRtoolbarSectionSearch').hide();

    const wrapper = document.createElement('div');
    wrapper.className = 'BRolMobileWrapper';
    this._wrapper = wrapper;

    const header = this._buildHeader();
    this._resultsPanel = this._buildDropPanel('BRolMobileResults');
    this._bmListPanel = this._buildDropPanel('BRolMobileBookmarkList');
    wrapper.append(header, this._resultsPanel, this._bmListPanel);

    const $container = br.refs.$brContainer;
    if ($container?.[0]) {
      $container[0].parentNode.insertBefore(wrapper, $container[0]);
    } else {
      $root[0].prepend(wrapper);
    }

    // Push BRcontainer down by wrapper height; MutationObserver re-applies
    // when BookReader overwrites style.top; ResizeObserver tracks height changes.
    if ($container?.[0]) {
      const container = $container[0];
      let desiredTop = '';

      // Override BookReader's toolbar-height query so resizeBRcontainer() always
      // uses our wrapper height. This is set here (in plugin.init) rather than
      // PostInit because BookReader calls resizeBRcontainer() at line 692, before
      // plugins are initialized. The PostInit resize below corrects the initial
      // container.style.top that was set while getToolBarHeight still returned 0.
      this.br.getToolBarHeight = () => this._wrapper?.offsetHeight ?? 0;

      const applyOffset = () => {
        desiredTop = this._wrapper.offsetHeight + 'px';
        if (container.style.top !== desiredTop) container.style.top = desiredTop;
      };

      new MutationObserver(() => {
        if (container.style.top !== desiredTop) container.style.top = desiredTop;
      }).observe(container, { attributes: true, attributeFilter: ['style'] });

      new ResizeObserver(applyOffset).observe(this._wrapper);

      // Correct the initial container.style.top (set to 0 before plugins init)
      // synchronously inside PostInit so later handlers see the right layout.
      // The zoom is width-bound so toolbar height changes don't affect page scale;
      // only container.style.top needs to be kept in sync.
      $(document).one('BookReader:PostInit', () => {
        applyOffset();
        window.dispatchEvent(new Event('resize'));
      });
      applyOffset();
    }

    this._suppressSidebar();
    this._bindSearchEvents();
    this._bindBookmarkEvents();
  }

  // ── Collapse/expand chrome ─────────────────────────────────────────────────

  _hideChrome() {
    const handle = this._chromeHandle;
    if (!this._wrapper || !handle) return;
    this._wrapper.classList.add('BRolMobileWrapper--collapsed');
    handle.innerHTML = CHEVRON_DOWN;
    handle.setAttribute('aria-label', 'Show reader controls');
    handle.setAttribute('aria-expanded', 'false');
  }

  _showChrome() {
    const handle = this._chromeHandle;
    if (!this._wrapper || !handle) return;
    this._wrapper.classList.remove('BRolMobileWrapper--collapsed');
    handle.innerHTML = CHEVRON_UP;
    handle.setAttribute('aria-label', 'Hide reader controls');
    handle.setAttribute('aria-expanded', 'true');
  }

  // ── Sidebar suppression ────────────────────────────────────────────────────

  _suppressSidebar() {
    const br = this.br;

    window.addEventListener('BookReader:ToggleSearchMenu', (e) => {
      e.stopImmediatePropagation();
    }, /* capture= */ true);

    const patchSearchView = () => {
      const sv = br.plugins.search?.searchView;
      if (sv) sv.toggleSidebar = () => {};
    };
    patchSearchView();
    $(document).one('BookReader:PostInit', patchSearchView);

    const injectNavStyle = () => {
      const itemNav = document.querySelector('ia-bookreader')
        ?.shadowRoot?.querySelector('iaux-item-navigator');
      const root = itemNav?.shadowRoot;
      if (!root) return false;
      if (!root.querySelector('#ol-mobile-nav-ss')) {
        const s = document.createElement('style');
        s.id = 'ol-mobile-nav-ss';
        s.textContent = 'nav .minimized { display: none !important; }';
        root.appendChild(s);
      }
      return true;
    };

    if (!injectNavStyle()) {
      const observer = new MutationObserver(() => {
        if (injectNavStyle()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      $(document).one('BookReader:PostInit', () => {
        injectNavStyle();
        setTimeout(injectNavStyle, 500);
        setTimeout(injectNavStyle, 2000);
        // In OL production, ia-item-navigator may open its "search" panel
        // automatically when ?q= is present. Close it so our mobile UI is
        // the primary search surface.
        if (br.plugins.search?.options.initialSearchTerm != null) {
          br.shell?.updateSideMenu?.('search', 'close');
        }
      });
    }
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  _buildHeader() {
    const header = document.createElement('div');
    header.className = 'BRolMobileHeader';

    // ── Row 1 ────────────────────────────────────────────────────────────────
    const row1 = document.createElement('div');
    row1.className = 'BRolMobileRow1';
    const logoURL = this.br.options?.logoURL ?? 'https://archive.org';
    row1.innerHTML = `
      <a class="BRolMobileLogo" href="${logoURL}" aria-label="Internet Archive">
        ${IA_LOGO_SVG}
      </a>
      <button class="BRolMobileChromeToggle" aria-label="Hide reader controls" aria-expanded="true" type="button">
        ${CHEVRON_UP}
      </button>
      <div class="BRolMobileActions">
        <button class="BRolMobileBookmarkBubble" aria-label="View all bookmarks" type="button" hidden>0</button>
        <button class="BRolMobileActionBtn BRolMobileBookmarkBtn" aria-label="Bookmark this page" type="button">
          <svg class="BRolMobileBookmarkIcon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
        <button class="BRolMobileActionBtn BRolMobileSearchBtn" aria-label="Search inside book" aria-pressed="false" type="button">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
      </div>
    `;

    // Chrome toggle
    const chromeToggle = /** @type {HTMLButtonElement} */ (row1.querySelector('.BRolMobileChromeToggle'));
    chromeToggle.addEventListener('click', () => {
      if (this._wrapper?.classList.contains('BRolMobileWrapper--collapsed')) {
        this._showChrome();
      } else {
        this._hideChrome();
      }
    });
    this._chromeHandle = chromeToggle;

    // Bookmark button: add bookmark (or remove with confirmation)
    this._bookmarkBtn = /** @type {HTMLButtonElement} */ (row1.querySelector('.BRolMobileBookmarkBtn'));
    this._bookmarkBtn.addEventListener('click', () => {
      const iaBookmarks = this._getIaBookmarks();
      if (!iaBookmarks) return;
      const pageID = this._getCurrentPageID();
      const existing = iaBookmarks.bookmarks?.[pageID] ?? null;

      if (existing) {
        const note = existing.note?.trim();
        if (note) {
          const ok = window.confirm(`Removing this bookmark will also remove note: "${note}"`);
          if (!ok) return;
        }
        // Call deleteBookmark directly — avoids ia-bookmarks' own confirmation modal
        iaBookmarks.deleteBookmark({ detail: { id: String(pageID) } });
      } else {
        iaBookmarks.bookmarkButtonClicked(pageID);
      }
      // bookmarksChanged fires after LitElement's async render; refresh eagerly
      setTimeout(() => this._refreshBookmarkState(), 50);
    });

    // Bookmark count bubble: toggle the bookmark list panel
    this._bookmarkCountBubble = /** @type {HTMLElement} */ (row1.querySelector('.BRolMobileBookmarkBubble'));
    this._bookmarkCountBubble.addEventListener('click', () => {
      if (this._bmListPanel && !this._bmListPanel.hasAttribute('hidden')) {
        this._closeBmList();
      } else {
        this._openBmList();
      }
    });

    // Search button: toggle search row
    this._searchBtn = /** @type {HTMLButtonElement} */ (row1.querySelector('.BRolMobileSearchBtn'));
    this._searchBtn.addEventListener('click', () => {
      if (this._searchRow?.hasAttribute('hidden')) {
        this._openSearch();
      } else {
        this._closeSearch();
      }
    });

    // ── Note bar (shown when current page is bookmarked) ──────────────────
    this._bmNoteBar = this._buildNoteBar();

    // ── Row 2: search field ───────────────────────────────────────────────
    const row2 = document.createElement('div');
    row2.className = 'BRolMobileRow2';
    row2.setAttribute('hidden', '');
    row2.innerHTML = `
      <div class="BRolMobileSearchField">
        <svg class="BRolMobileSearchIcon" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="BRolMobileInput"
          type="text"
          placeholder="Search in book..."
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <button class="BRolMobileClearBtn" aria-label="Clear search" type="button" hidden>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <button class="BRolMobileCancelBtn" type="button">Cancel</button>
    `;

    const input = /** @type {HTMLInputElement} */ (row2.querySelector('.BRolMobileInput'));
    this._clearBtn = /** @type {HTMLButtonElement} */ (row2.querySelector('.BRolMobileClearBtn'));
    const cancelBtn = row2.querySelector('.BRolMobileCancelBtn');
    const clearBtn = this._clearBtn;

    input.addEventListener('input', () => { clearBtn.hidden = !input.value; });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._submitSearch(input.value.trim());
      }
    });

    const restoreResults = () => {
      this._hideResultNav();
      if (!input.value && this._savedQuery) {
        input.value = this._savedQuery;
        if (clearBtn) clearBtn.hidden = false;
      }
      if (this._resultsPanel?.innerHTML.trim() && this._resultsPanel.hasAttribute('hidden')) {
        this._resultsPanel.removeAttribute('hidden');
      }
    };
    input.addEventListener('click', restoreResults);
    input.addEventListener('focus', restoreResults);

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      this._clearResults();
      input.focus();
    });

    cancelBtn.addEventListener('click', () => this._deactivateSearch());

    this._searchRow = row2;
    this._searchInput = input;

    this._navBar = this._buildResultNav();
    header.append(row1, row2, this._navBar, this._bmNoteBar);
    return header;
  }

  // ── Note bar ───────────────────────────────────────────────────────────────

  _buildNoteBar() {
    const bar = document.createElement('div');
    bar.className = 'BRolMobileNoteBar';
    bar.setAttribute('hidden', '');
    bar.innerHTML = `
      <span class="BRolMobileNoteLabel">Page Notes:</span>
      <input class="BRolMobileNoteInput" type="text" placeholder="Add a note…" autocomplete="off" autocorrect="off" />
      <button class="BRolMobileSaveBtn" type="button">Save</button>
      <button class="BRolMobileHideNoteBtn" type="button">Hide</button>
    `;

    this._bmNoteInput = /** @type {HTMLInputElement} */ (bar.querySelector('.BRolMobileNoteInput'));
    this._bmSaveBtn = /** @type {HTMLButtonElement} */ (bar.querySelector('.BRolMobileSaveBtn'));
    const hideNoteBtn = /** @type {HTMLButtonElement} */ (bar.querySelector('.BRolMobileHideNoteBtn'));

    this._bmSaveBtn.addEventListener('click', () => this._saveNote());
    this._bmNoteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._saveNote(); }
    });
    hideNoteBtn.addEventListener('click', () => this._hideNoteBar());

    return bar;
  }

  // ── Page navigation bar ───────────────────────────────────────────────────
  // Self-contained: could be extracted to its own PR. No coupling to search
  // or bookmark state — only BookReader position APIs and fragmentChange.

  _buildPageNav() {
    const bar = document.createElement('div');
    bar.className = 'BRolMobilePageNav';
    // Layout: ‹ [leaf] › [Page X] [: Section ...]
    // ‹ and › bracket only the leaf chip; page+section follow to the right.
    bar.innerHTML = `
      <div class="BRolMobilePageNavPosition">
        <button class="BRolMobilePageNavBtn BRolMobilePageNavPrev" aria-label="Previous page" type="button">${CHEVRON_LEFT}</button>
        <button class="BRolMobilePageNavChip BRolMobilePageNavLeaf" type="button" aria-label="Jump to position"></button>
        <button class="BRolMobilePageNavBtn BRolMobilePageNavNext" aria-label="Next page" type="button">${CHEVRON_RIGHT}</button>
      </div>
      <div class="BRolMobilePageNavSuffix"></div>
    `;

    bar.querySelector('.BRolMobilePageNavPrev')?.addEventListener('click', () => {
      const idx = this.br.currentIndex();
      if (idx > 0) this.br.jumpToIndex(idx - 1);
    });
    bar.querySelector('.BRolMobilePageNavNext')?.addEventListener('click', () => {
      const idx = this.br.currentIndex();
      const numLeafs = this.br.book?.getNumLeafs() ?? 0;
      if (idx < numLeafs - 1) this.br.jumpToIndex(idx + 1);
    });
    bar.querySelector('.BRolMobilePageNavLeaf')?.addEventListener('click', (e) => {
      this._startLeafEdit(/** @type {HTMLButtonElement} */ (e.currentTarget));
    });

    this._pageNavBar = bar;
    return bar;
  }

  _updatePageNav() {
    if (!this._pageNavBar) return;
    const br = this.br;
    const book = br.book;
    if (!book) return;

    const idx = br.currentIndex();
    const numLeafs = book.getNumLeafs();
    const pageNum = book.getPageNum(idx);
    // pageNum can be a string ("215") or a number (215); unasserted = "n{idx}"
    const pageStr = String(pageNum ?? '');
    const isAsserted = pageStr !== '' && pageStr[0] !== 'n';

    // Update leaf chip text (static element — querySelector returns null while input is shown)
    const leafChip = /** @type {HTMLButtonElement|null} */ (this._pageNavBar.querySelector('.BRolMobilePageNavLeaf'));
    if (leafChip) leafChip.textContent = `${idx + 1} / ${numLeafs}`;

    // Update prev/next disabled state
    const prevBtn = /** @type {HTMLButtonElement|null} */ (this._pageNavBar.querySelector('.BRolMobilePageNavPrev'));
    const nextBtn = /** @type {HTMLButtonElement|null} */ (this._pageNavBar.querySelector('.BRolMobilePageNavNext'));
    if (prevBtn) prevBtn.disabled = (idx === 0);
    if (nextBtn) nextBtn.disabled = (idx >= numLeafs - 1);

    // Chapter lookup (best-effort)
    let chapterLabel = '';
    try {
      const entries = /** @type {any[]} */ (br.plugins?.chapters?._tocEntries ?? []);
      const sorted = entries.filter(ch => ch.pageIndex != null).reverse();
      const ch = sorted.find(ch => ch.pageIndex <= idx);
      if (ch) {
        chapterLabel = ((ch.label ?? '') + (ch.title ? ' ' + ch.title : '')).trim();
      }
    } catch (_) { /* chapters plugin absent */ }

    // Suffix: [Page X] [:] [Section] — colon only when both page AND section present
    const suffix = this._pageNavBar.querySelector('.BRolMobilePageNavSuffix');
    if (!suffix) return;

    suffix.innerHTML = `
      ${isAsserted ? `<button class="BRolMobilePageNavChip BRolMobilePageNavPage" type="button" aria-label="Jump to page">Page ${pageStr}</button>` : ''}
      ${isAsserted && chapterLabel ? '<span class="BRolMobilePageNavSep">:</span>' : ''}
      ${chapterLabel ? `<button class="BRolMobilePageNavChip BRolMobilePageNavChapter" type="button" aria-label="Open table of contents">${chapterLabel}</button>` : ''}
    `;

    suffix.querySelector('.BRolMobilePageNavPage')?.addEventListener('click', (e) => {
      this._startPageEdit(/** @type {HTMLButtonElement} */ (e.currentTarget));
    });
    suffix.querySelector('.BRolMobilePageNavChapter')?.addEventListener('click', () => {
      const shell = this.br.shell;
      if (shell?.updateSideMenu) {
        shell.updateSideMenu('chapters', 'open');
      } else {
        // fallback: jump to start of chapter
        const entries = /** @type {any[]} */ (this.br.plugins?.chapters?._tocEntries ?? []);
        const sorted = entries.filter(ch => ch.pageIndex != null).reverse();
        const ch = sorted.find(ch => ch.pageIndex <= idx);
        if (ch) this.br.jumpToIndex(ch.pageIndex);
      }
    });
  }

  /** Retry _updatePageNav every 2s until chapters data arrives (up to ~20s). */
  _retryUpdatePageNav(triesLeft = 10) {
    this._updatePageNav();
    if (triesLeft > 0 && !this.br.plugins?.chapters?._tocEntries?.length) {
      setTimeout(() => this._retryUpdatePageNav(triesLeft - 1), 2000);
    }
  }

  /** Replace the leaf chip with an inline input; Enter navigates, Escape restores. */
  _startLeafEdit(chipEl) {
    const idx = this.br.currentIndex();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'BRolMobilePageNavInput';
    input.value = String(idx + 1);
    input.setAttribute('aria-label', 'Leaf position');

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      if (input.parentNode) input.parentNode.replaceChild(chipEl, input);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = parseInt(input.value, 10);
        const numLeafs = this.br.book?.getNumLeafs() ?? 0;
        if (!isNaN(val) && val >= 1 && val <= numLeafs) this.br.jumpToIndex(val - 1);
        restore();
      } else if (e.key === 'Escape') {
        restore();
      }
    });
    input.addEventListener('blur', () => setTimeout(restore, 150));

    chipEl.parentNode?.replaceChild(input, chipEl);
    input.select();
  }

  /** Replace the page chip with an inline input; Enter navigates, Escape restores. */
  _startPageEdit(chipEl) {
    const idx = this.br.currentIndex();
    const pageNum = this.br.book?.getPageNum(idx) ?? '';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'BRolMobilePageNavInput';
    input.value = String(pageNum);
    input.setAttribute('aria-label', 'Book page number');

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      if (input.parentNode) input.parentNode.replaceChild(chipEl, input);
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        if (val) this.br.jumpToPage(val);
        restore();
      } else if (e.key === 'Escape') {
        restore();
      }
    });
    input.addEventListener('blur', () => setTimeout(restore, 150));

    chipEl.parentNode?.replaceChild(input, chipEl);
    input.select();
  }

  _showNoteBar(pageID) {
    if (!this._bmNoteBar || !this._bmNoteInput) return;
    const bm = this._getBookmarkForPage(pageID);
    this._bmNoteInput.value = bm?.note ?? '';
    this._bmNoteBar.removeAttribute('hidden');
  }

  _hideNoteBar() {
    this._bmNoteBar?.setAttribute('hidden', '');
  }

  _saveNote() {
    const iaBookmarks = this._getIaBookmarks();
    if (!iaBookmarks || !this._bmNoteInput) return;
    const pageID = this._getCurrentPageID();
    const note = this._bmNoteInput.value;
    iaBookmarks.saveBookmark({ detail: { bookmark: { id: pageID, note } } });
    if (this._bmSaveBtn) {
      this._bmSaveBtn.textContent = 'Saved!';
      setTimeout(() => { if (this._bmSaveBtn) this._bmSaveBtn.textContent = 'Save'; }, 1500);
    }
    // If the bookmark list is open, re-render to show updated note
    if (this._bmListPanel && !this._bmListPanel.hasAttribute('hidden')) {
      setTimeout(() => this._renderBmList(), 100);
    }
  }

  // ── Bookmark list panel ────────────────────────────────────────────────────

  /** Creates either the search results or bookmark list drop panel (shared structure). */
  _buildDropPanel(className) {
    const panel = document.createElement('div');
    panel.className = className;
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-live', 'polite');
    return panel;
  }

  _openBmList() {
    if (!this._bmListPanel) return;
    this._closeSearch();
    this._hideResultNav();
    this._closeBmList();
    this._renderBmList();
    this._bmListPanel.removeAttribute('hidden');
  }

  _closeBmList() {
    this._bmListPanel?.setAttribute('hidden', '');
  }

  _renderBmList() {
    if (!this._bmListPanel) return;
    if (this._bmPageIDs.length === 0) {
      this._bmListPanel.innerHTML = `<div class="BRolMobileStatus">No bookmarks yet.</div>`;
      return;
    }

    const iaBookmarks = this._getIaBookmarks();
    const allBm = iaBookmarks?.bookmarks;
    const count = this._bmPageIDs.length;
    const currentPageID = this._getCurrentPageID();

    // Header: [ ‹ ]  N Bookmarks  [ › ]              [ ✕ ]
    const prevBtn = `<button class="BRolMobileBmNavBtn BRolMobileBmNavPrev" aria-label="Previous bookmark" type="button">${CHEVRON_LEFT}</button>`;
    const nextBtn = `<button class="BRolMobileBmNavBtn BRolMobileBmNavNext" aria-label="Next bookmark" type="button">${CHEVRON_RIGHT}</button>`;

    const items = this._bmPageIDs.map((pageID) => {
      const bm = allBm?.[pageID] ?? null;
      const pageNum = this.br.book?.getPageNum(pageID) ?? (pageID + 1);
      const note = bm?.note?.trim();
      const noteSnippet = note ? note.split('\n')[0].substring(0, 60) : '';
      const isCurrent = pageID === currentPageID;
      return `<li>
        <button class="BRolMobileResultItem BRolMobileBookmarkItem${isCurrent ? ' BRolMobileBookmarkItem--current' : ''}" data-page-id="${pageID}" type="button">
          <span class="BRolMobileResultPage">Page ${pageNum}</span>${noteSnippet ? `<span class="BRolMobileResultSnippet"> — ${noteSnippet}</span>` : ''}
        </button>
      </li>`;
    }).join('');

    this._bmListPanel.innerHTML = `
      <div class="BRolMobileResultsHeader BRolMobileBmListHeader">
        <div class="BRolMobileBmNavCenter">
          ${prevBtn}
          <span class="BRolMobileBmCount">${count} Bookmark${count === 1 ? '' : 's'}</span>
          ${nextBtn}
        </div>
        <button class="BRolMobileBmDismissBtn" aria-label="Close bookmark list" type="button">&#x2715;</button>
      </div>
      <ul class="BRolMobileResultsList" role="list">${items}</ul>
    `;

    // prev/next: find where current page sits in the sorted bookmark list,
    // then jump to the neighbouring bookmark
    const prevEl = /** @type {HTMLButtonElement} */ (this._bmListPanel.querySelector('.BRolMobileBmNavPrev'));
    const nextEl = /** @type {HTMLButtonElement} */ (this._bmListPanel.querySelector('.BRolMobileBmNavNext'));
    const dismissEl = /** @type {HTMLButtonElement|null} */ (this._bmListPanel.querySelector('.BRolMobileBmDismissBtn'));
    dismissEl?.addEventListener('click', () => this._closeBmList());

    const updateNavDisabled = (activePageID) => {
      const idx = this._bmPageIDs.indexOf(activePageID);
      if (prevEl) prevEl.disabled = (idx <= 0);
      if (nextEl) nextEl.disabled = (idx < 0 || idx >= this._bmPageIDs.length - 1);
    };
    updateNavDisabled(currentPageID);

    const navigateToBookmark = (pageID) => {
      this.br.jumpToIndex(pageID);
      // Update highlight without full re-render
      this._bmListPanel?.querySelectorAll('.BRolMobileBookmarkItem').forEach((el) => {
        const pid = parseInt(/** @type {HTMLElement} */ (el).dataset.pageId, 10);
        el.classList.toggle('BRolMobileBookmarkItem--current', pid === pageID);
      });
      updateNavDisabled(pageID);
    };

    prevEl?.addEventListener('click', () => {
      const active = /** @type {HTMLElement|null} */ (this._bmListPanel?.querySelector('.BRolMobileBookmarkItem--current'));
      const activePID = active ? parseInt(active.dataset.pageId, 10) : currentPageID;
      const idx = this._bmPageIDs.indexOf(activePID);
      if (idx > 0) navigateToBookmark(this._bmPageIDs[idx - 1]);
    });

    nextEl?.addEventListener('click', () => {
      const active = /** @type {HTMLElement|null} */ (this._bmListPanel?.querySelector('.BRolMobileBookmarkItem--current'));
      const activePID = active ? parseInt(active.dataset.pageId, 10) : currentPageID;
      const idx = this._bmPageIDs.indexOf(activePID);
      if (idx >= 0 && idx < this._bmPageIDs.length - 1) navigateToBookmark(this._bmPageIDs[idx + 1]);
    });

    this._bmListPanel.querySelectorAll('.BRolMobileBookmarkItem').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pageID = parseInt(/** @type {HTMLElement} */ (btn).dataset.pageId, 10);
        navigateToBookmark(pageID);
        this._closeBmList();
      });
    });
  }

  /** Update the current-page highlight in the list without re-rendering. */
  _updateBmListHighlight() {
    if (!this._bmListPanel || this._bmListPanel.hasAttribute('hidden')) return;
    const pageID = this._getCurrentPageID();
    this._bmListPanel.querySelectorAll('.BRolMobileBookmarkItem').forEach((el) => {
      const pid = parseInt(/** @type {HTMLElement} */ (el).dataset.pageId, 10);
      el.classList.toggle('BRolMobileBookmarkItem--current', pid === pageID);
    });
  }

  // ── Bookmark state ─────────────────────────────────────────────────────────

  _getIaBookmarks() {
    return document.querySelector('ia-bookreader')?.menuProviders?.bookmarks?.component ?? null;
  }

  _getCurrentPageID() {
    if (this.br.mode === this.br.constMode2up) {
      const pagesInView = this.br.displayedIndices;
      return pagesInView[pagesInView.length - 1];
    }

    // In 1up mode, BookReader's currentIndex() lags: it still reports the previous
    // page when a sliver of it is visible at the top of the viewport. Instead, find
    // the first page whose top edge has entered the viewport — that's the page the
    // patron is looking at.
    try {
      const brContainer = this.br.refs?.$brContainer?.[0] ?? document.querySelector('.BRcontainer');
      if (brContainer) {
        const viewH = window.innerHeight;
        let bestIdx = -1;
        let bestTop = Infinity;
        for (const el of brContainer.querySelectorAll('.BRpagecontainer')) {
          const cls = [...el.classList].find(c => c.startsWith('pagediv'));
          if (!cls) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < viewH && rect.top < bestTop) {
            bestTop = rect.top;
            bestIdx = parseInt(cls.slice(7), 10);
          }
        }
        if (bestIdx >= 0) return bestIdx;
      }
    } catch (_) { /* fall through */ }
    return this.br.currentIndex();
  }

  _getBookmarkForPage(pageID) {
    return this._getIaBookmarks()?.bookmarks?.[pageID] ?? null;
  }

  _refreshBookmarkState() {
    const iaBookmarks = this._getIaBookmarks();
    if (!iaBookmarks) return;
    const allBm = iaBookmarks.bookmarks ?? {};
    // Object.keys works for both plain objects and arrays-with-numeric-indices
    const keys = Object.keys(allBm).filter(k => allBm[k] != null);
    this._bmPageIDs = keys.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);

    const count = this._bmPageIDs.length;
    if (this._bookmarkCountBubble) {
      this._bookmarkCountBubble.textContent = String(count);
      this._bookmarkCountBubble.hidden = count === 0;
    }

    this._updateBookmarkState();
  }

  /** Update bookmark icon state and note bar for the current page. */
  _updateBookmarkState() {
    const pageID = this._getCurrentPageID();
    const bm = this._getBookmarkForPage(pageID);

    if (this._bookmarkBtn) {
      this._bookmarkBtn.classList.toggle('BRolMobileBookmarkBtn--active', !!bm);
    }

    if (bm) {
      this._showNoteBar(pageID);
    } else {
      this._hideNoteBar();
    }

    // Keep the open bookmark list in sync with the current page
    this._updateBmListHighlight();
  }

  _bindBookmarkEvents() {
    // ia-bookmarks is created via document.createElement() and may not be connected
    // to the DOM. Listeners added directly on the element always fire.
    const bindToComponent = () => {
      const comp = this._getIaBookmarks();
      if (!comp) return false;
      comp.addEventListener('bookmarksChanged', () => {
        this._refreshBookmarkState();
        // Re-render the open list so notes and count stay current
        if (this._bmListPanel && !this._bmListPanel.hasAttribute('hidden')) {
          this._renderBmList();
        }
      });

      // bookmarkButtonClicked fires at the end of createBookmark() / bookmarkEdited().
      // createBookmark() mutates bookmarks[] directly (no reactive prop update),
      // so bookmarksChanged fires asynchronously via LitElement's render cycle.
      // Listening here ensures the topbar refreshes even if bookmarksChanged is delayed.
      comp.addEventListener('bookmarkButtonClicked', () => {
        setTimeout(() => this._refreshBookmarkState(), 50);
      });
      this._refreshBookmarkState();
      // Signal to tests (and any external observers) that bookmark state is live.
      this._wrapper?.setAttribute('data-bookmarks-ready', '');
      return true;
    };

    const injectPageNav = () => {
      // Inject page nav into BRnavMain scrubber, replacing the BRcurrentpage display
      if (!this._pageNavBar) {
        const scrubber = document.querySelector('.BRnavMain .scrubber');
        if (scrubber) {
          const row = this._buildPageNav();
          scrubber.insertBefore(row, scrubber.firstChild);
          const p = scrubber.querySelector('p');
          if (p) /** @type {HTMLElement} */ (p).hidden = true;
        }
      }
      // Hide the duplicate flip buttons in the docked mobile scrubber bar
      document.querySelectorAll('.BRnavMobile .book_left, .BRnavMobile .book_right')
        .forEach(el => { /** @type {HTMLElement} */ (el).style.display = 'none'; });
      // Activate the seek slider by default (toggle_slider starts inactive/docked)
      const toggleBtn = /** @type {HTMLElement|null} */ (document.querySelector('.BRicon.toggle_slider'));
      if (toggleBtn && !toggleBtn.classList.contains('active')) toggleBtn.click();
      this._updatePageNav();
    };

    if (!bindToComponent()) {
      $(document).one('BookReader:PostInit', () => {
        if (!bindToComponent()) setTimeout(bindToComponent, 500);
        injectPageNav();
        // Chapters plugin fetches TOC async after PostInit — keep retrying until
        // _tocEntries has data (slow network can take >3s; mobile can take longer).
        this._retryUpdatePageNav();
      });
    } else {
      $(document).one('BookReader:PostInit', () => {
        injectPageNav();
        this._retryUpdatePageNav();
      });
    }

    // Page navigation: update bookmark state + page nav on every page change
    $(document).on('BookReader:fragmentChange', () => {
      if (!this._active) return;
      this._updateBookmarkState();
      this._updatePageNav();
    });
  }

  // ── Search UI ──────────────────────────────────────────────────────────────

  _buildResultNav() {
    const nav = document.createElement('div');
    nav.className = 'BRolMobileResultNav';
    nav.setAttribute('hidden', '');
    nav.innerHTML = `
      <button class="BRolMobileResultNavBtn BRolMobileResultNavPrev" aria-label="Previous result" type="button">${CHEVRON_LEFT}</button>
      <div class="BRolMobileResultNavCenter">
        <span class="BRolMobileResultNavPos"></span>
        <span class="BRolMobileResultNavSnippet"></span>
      </div>
      <button class="BRolMobileResultNavBtn BRolMobileResultNavNext" aria-label="Next result" type="button">${CHEVRON_RIGHT}</button>
    `;

    this._navPrevBtn = /** @type {HTMLButtonElement} */ (nav.querySelector('.BRolMobileResultNavPrev'));
    this._navNextBtn = /** @type {HTMLButtonElement} */ (nav.querySelector('.BRolMobileResultNavNext'));
    this._navPosEl  = /** @type {HTMLElement} */ (nav.querySelector('.BRolMobileResultNavPos'));
    this._navSnippetEl = /** @type {HTMLElement} */ (nav.querySelector('.BRolMobileResultNavSnippet'));

    this._navPrevBtn.addEventListener('click', () => {
      if (this._currentMatchIdx > 0) this._navigateToMatch(this._currentMatchIdx - 1);
    });
    this._navNextBtn.addEventListener('click', () => {
      if (this._currentMatchIdx < this._matches.length - 1) this._navigateToMatch(this._currentMatchIdx + 1);
    });

    return nav;
  }

  _navigateToMatch(idx) {
    if (idx < 0 || idx >= this._matches.length) return;
    this._currentMatchIdx = idx;
    this.br.plugins.search?.jumpToMatch(idx);
    this._updateNavDisplay();
  }

  _showResultNav(idx) {
    if (!this._navBar) return;
    this._savedQuery = this._searchInput?.value || this._savedQuery;
    this._navigateToMatch(idx);
    this._navBar.removeAttribute('hidden');
    this._hideResults();
  }

  _hideResultNav() {
    this._navBar?.setAttribute('hidden', '');
  }

  _updateNavDisplay() {
    const { _navPosEl, _navSnippetEl, _navPrevBtn, _navNextBtn } = this;
    if (!_navPosEl || !_navSnippetEl || !_navPrevBtn || !_navNextBtn) return;
    const total = this._matches.length;
    const idx = this._currentMatchIdx;
    const match = this._matches[idx];
    if (!match) return;

    _navPosEl.textContent = `(${idx + 1}/${total})`;

    const tmp = document.createElement('div');
    tmp.innerHTML = match.html || '';
    _navSnippetEl.textContent = `p. ${match.displayPageNumber} — ${(tmp.textContent || '').trim()}`;

    _navPrevBtn.disabled = (idx === 0);
    _navNextBtn.disabled = (idx === total - 1);
  }

  _openSearch() {
    if (!this._searchRow) return;
    this._closeBmList();
    // Note bar stays visible — it sits beneath search row and nav bar
    this._searchRow.removeAttribute('hidden');
    if (this._searchBtn) {
      this._searchBtn.classList.add('BRolMobileActionBtn--active');
      this._searchBtn.setAttribute('aria-pressed', 'true');
    }
    if (this._clearBtn) this._clearBtn.hidden = !this._searchInput?.value;
    if (this._resultsPanel?.innerHTML.trim()) {
      this._resultsPanel.removeAttribute('hidden');
    }
    this._searchInput?.focus();
  }

  _closeSearch() {
    this._searchRow?.setAttribute('hidden', '');
    if (this._searchBtn) {
      this._searchBtn.classList.remove('BRolMobileActionBtn--active');
      this._searchBtn.setAttribute('aria-pressed', 'false');
    }
    this._hideResults();
  }

  _deactivateSearch() {
    this._savedQuery = '';
    this._closeSearch();
    this._clearResults();
    if (this._searchInput) {
      this._searchInput.value = '';
      if (this._clearBtn) this._clearBtn.hidden = true;
    }
    this.br.plugins.search?.removeSearchResults(/* suppressFragmentChange= */ true);
  }

  _submitSearch(query) {
    if (!query) return;
    if (!this.br.plugins.search) return;
    this._showLoading();
    this.br.plugins.search.search(query);
  }

  _showLoading() {
    if (!this._resultsPanel) return;
    this._hideResultNav();
    this._matches = [];
    this._currentMatchIdx = -1;
    this._resultsPanel.removeAttribute('hidden');
    this._resultsPanel.innerHTML = `<div class="BRolMobileStatus">Searching…</div>`;
  }

  _hideResults() {
    this._resultsPanel?.setAttribute('hidden', '');
  }

  _clearResults() {
    if (!this._resultsPanel) return;
    this._hideResultNav();
    this._matches = [];
    this._currentMatchIdx = -1;
    this._resultsPanel.setAttribute('hidden', '');
    this._resultsPanel.innerHTML = '';
  }

  /** @param {SearchInsideMatch[]} matches */
  _renderResults(matches) {
    if (!this._resultsPanel) return;
    this._matches = matches;
    this._currentMatchIdx = -1;
    this._hideResultNav();

    if (!matches.length) {
      this._resultsPanel.removeAttribute('hidden');
      this._resultsPanel.innerHTML = `<div class="BRolMobileStatus">No matches were found.</div>`;
      return;
    }

    const count = matches.length;
    const items = matches.map((match, i) => {
      let html = match.html || '';
      if (html.length > 200) {
        const start = Math.max(0, html.indexOf('<mark>') - 100);
        if (start !== 0) html = '…' + html.substring(start).replace(/^\S+/, '');
      }
      return `<li>
        <button class="BRolMobileResultItem" data-match-index="${i}" type="button">
          <span class="BRolMobileResultPage">Page ${match.displayPageNumber}</span>
          <span class="BRolMobileResultSnippet"> — ${html}</span>
        </button>
      </li>`;
    }).join('');

    this._resultsPanel.removeAttribute('hidden');
    this._resultsPanel.innerHTML = `
      <div class="BRolMobileResultsHeader">${count} Result${count === 1 ? '' : 's'}</div>
      <ul class="BRolMobileResultsList" role="list">${items}</ul>
    `;

    this._resultsPanel.querySelectorAll('.BRolMobileResultItem').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(/** @type {HTMLElement} */ (btn).dataset.matchIndex, 10);
        this._showResultNav(idx);
      });
    });

    // Auto-navigate to ?result=N on initial load (consumed once, then cleared)
    if (this._targetResultIdx >= 0) {
      const target = Math.min(this._targetResultIdx, matches.length - 1);
      this._targetResultIdx = -1;
      this._showResultNav(target);
    }
  }

  _bindSearchEvents() {
    const br = this.br;
    $(document)
      .on('BookReader:SearchCallback', (e, { results, instance }) => {
        if (!this._active || instance !== br) return;
        this._renderResults(results.matches);
      })
      .on('BookReader:SearchStarted', (e, { instance }) => {
        if (!this._active || instance !== br) return;
        this._showLoading();
      })
      .on('BookReader:SearchCallbackEmpty', (e, { instance }) => {
        if (!this._active || instance !== br) return;
        this._renderResults([]);
      })
      .on('BookReader:SearchCallbackError', (e, { instance }) => {
        if (!this._active || instance !== br) return;
        if (!this._resultsPanel) return;
        this._resultsPanel.removeAttribute('hidden');
        this._resultsPanel.innerHTML = `<div class="BRolMobileStatus BRolMobileStatus--error">Sorry, there was an error with your search. Please try again.</div>`;
      });

    document.addEventListener('click', (e) => {
      if (!this._active) return;
      const resultsVisible = this._resultsPanel && !this._resultsPanel.hasAttribute('hidden');
      const bmListVisible = this._bmListPanel && !this._bmListPanel.hasAttribute('hidden');
      if (!resultsVisible && !bmListVisible) return;
      if (this._wrapper?.contains(/** @type {Node} */ (e.target))) return;
      if (resultsVisible) {
        if (this._currentMatchIdx >= 0) {
          this._showResultNav(this._currentMatchIdx);
        } else {
          this._hideResults();
        }
      }
      if (bmListVisible) this._closeBmList();
    }, { capture: false });
  }
}

BookReader?.registerPlugin('olMobile', OLMobilePlugin);
