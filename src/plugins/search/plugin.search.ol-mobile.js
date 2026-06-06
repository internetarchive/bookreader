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

  // ── DOM refs (set during _buildHeader / _buildResultNav) ──────────────────
  /** @type {HTMLElement|null} */      _header = null;
  /** @type {HTMLElement|null} */      _wrapper = null;
  /** @type {HTMLButtonElement|null} */ _chromeHandle = null;
  /** @type {HTMLElement|null} */      _resultsPanel = null;
  /** @type {HTMLElement|null} */      _searchRow = null;
  /** @type {HTMLInputElement|null} */ _searchInput = null;
  /** @type {HTMLButtonElement|null} */ _clearBtn = null;
  /** @type {HTMLButtonElement|null} */ _searchBtn = null;
  // Nav bar and its children (cached to avoid per-call querySelector)
  /** @type {HTMLElement|null} */      _navBar = null;
  /** @type {HTMLButtonElement|null} */ _navPrevBtn = null;
  /** @type {HTMLButtonElement|null} */ _navNextBtn = null;
  /** @type {HTMLElement|null} */      _navPosEl = null;
  /** @type {HTMLElement|null} */      _navSnippetEl = null;

  // ── State ──────────────────────────────────────────────────────────────────
  /** @type {SearchInsideMatch[]} */ _matches = [];
  /** @type {number} */  _currentMatchIdx = -1;
  /** @type {boolean} */ _active = false;
  /** @type {string} */  _savedQuery = '';

  init() {
    if (!this._shouldActivate()) return;
    this._active = true;
    this._setupMobileUI();
    this._prefillFromUrl();
  }

  /** If ?q= is in the URL, open the search bar and pre-fill it.
   *  BookReader's search plugin reads ?q= during setup() and stores it in
   *  plugins.search.options.initialSearchTerm before any plugin init() runs.
   *  The search itself is already in-flight by the time we read this value,
   *  so we just need to open the UI and show the loading state. */
  _prefillFromUrl() {
    const term = this.br.plugins.search?.options.initialSearchTerm;
    if (!term) return;
    this._openSearch();
    if (this._searchInput) {
      this._searchInput.value = term;
      if (this._clearBtn) this._clearBtn.hidden = false;
    }
    this._savedQuery = term;
    // Show loading immediately; SearchCallback will replace it with results.
    // (SearchStarted may have fired before our event handler was bound.)
    this._showLoading();
  }

  _shouldActivate() {
    const params = new URLSearchParams(window.location.search);
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

    this._header = this._buildHeader();
    this._resultsPanel = this._buildResultsPanel();
    wrapper.append(this._header, this._resultsPanel);

    const $container = br.refs.$brContainer;
    if ($container?.[0]) {
      $container[0].parentNode.insertBefore(wrapper, $container[0]);
    } else {
      $root[0].prepend(wrapper);
    }

    // Push BRcontainer down so the header doesn't occlude the book.
    // BRcontainer is position:absolute, so normal-flow siblings don't push it.
    // We use a MutationObserver to correct the `top` value each time BookReader
    // overwrites it (BookReader's `element.style.top = value` replaces any prior
    // declaration in the same CSSStyleDeclaration block, including ones set with
    // !important via setProperty — last writer wins). The MutationObserver fires
    // after every style attribute mutation and immediately re-applies our value.
    // A ResizeObserver tracks wrapper height changes (search row open/close, collapse).
    if ($container?.[0]) {
      const container = $container[0];
      let desiredTop = '';

      const applyOffset = () => {
        desiredTop = this._wrapper.offsetHeight + 'px';
        if (container.style.top !== desiredTop) container.style.top = desiredTop;
      };

      // Correct any BookReader override immediately after it sets style
      new MutationObserver(() => {
        if (container.style.top !== desiredTop) container.style.top = desiredTop;
      }).observe(container, { attributes: true, attributeFilter: ['style'] });

      // Update desired value when wrapper height changes (opens search row, collapses)
      new ResizeObserver(applyOffset).observe(this._wrapper);

      $(document).one('BookReader:PostInit', () => requestAnimationFrame(applyOffset));
      applyOffset();
    }

    this._suppressSidebar();
    this._bindSearchEvents();
  }

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

  _suppressSidebar() {
    const br = this.br;

    // Intercept native ToggleSearchMenu event before ia-bookreader handles it.
    window.addEventListener('BookReader:ToggleSearchMenu', (e) => {
      e.stopImmediatePropagation();
    }, /* capture= */ true);

    // Monkey-patch SearchView.toggleSidebar as belt-and-suspenders.
    const patchSearchView = () => {
      const sv = br.plugins.search?.searchView;
      if (sv) sv.toggleSidebar = () => {};
    };
    patchSearchView();
    $(document).one('BookReader:PostInit', patchSearchView);

    // The nav lives in iaux-item-navigator's shadow root (nested inside
    // ia-bookreader's shadow root — two levels deep). Inject a style that
    // hides the <nav> element (shortcuts strip + menu slider) while leaving
    // the #reader (book content) visible.
    const injectNavStyle = () => {
      const itemNav = document.querySelector('ia-bookreader')
        ?.shadowRoot?.querySelector('iaux-item-navigator');
      const root = itemNav?.shadowRoot;
      if (!root) return false;
      if (!root.querySelector('#ol-mobile-nav-ss')) {
        const s = document.createElement('style');
        s.id = 'ol-mobile-nav-ss';
        s.textContent = 'nav { display: none !important; }';
        root.appendChild(s);
      }
      return true;
    };

    // Try immediately; if the component hasn't rendered yet, watch for it.
    if (!injectNavStyle()) {
      const observer = new MutationObserver(() => {
        if (injectNavStyle()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      $(document).one('BookReader:PostInit', () => {
        injectNavStyle();
        setTimeout(injectNavStyle, 500);
        setTimeout(injectNavStyle, 2000);
      });
    }
  }

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
        <button class="BRolMobileActionBtn BRolMobileBookmarkBtn" aria-label="Bookmark this page" type="button">
          <svg class="BRolMobileBookmarkIcon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
        </button>
        <button class="BRolMobileActionBtn BRolMobileSearchBtn" aria-label="Search inside book" aria-pressed="false" type="button">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button class="BRolMobileActionBtn BRolMobileMoreBtn" aria-label="More options" type="button">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5"  cy="12" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="19" cy="12" r="1.5"/>
          </svg>
        </button>
      </div>
    `;

    // Chrome toggle: hide/show header (chevron tab right of logo)
    const chromeToggle = /** @type {HTMLButtonElement} */ (row1.querySelector('.BRolMobileChromeToggle'));
    chromeToggle.addEventListener('click', () => {
      if (this._wrapper?.classList.contains('BRolMobileWrapper--collapsed')) {
        this._showChrome();
      } else {
        this._hideChrome();
      }
    });
    this._chromeHandle = chromeToggle;

    // Bookmark: toggle bookmark for current page.
    // bookmarkButtonClicked() removes the bookmark if it already exists, adds it if not.
    row1.querySelector('.BRolMobileBookmarkBtn').addEventListener('click', () => {
      const iaBookmarks = document.querySelector('ia-bookreader')?.menuProviders?.bookmarks?.component;
      if (!iaBookmarks) return;
      let pageID = this.br.currentIndex();
      if (this.br.mode === this.br.constMode2up) {
        const pagesInView = this.br.displayedIndices;
        pageID = pagesInView[pagesInView.length - 1];
      }
      iaBookmarks.bookmarkButtonClicked(pageID);
    });

    // Search button: proper toggle open ↔ close (preserves input/results state)
    this._searchBtn = /** @type {HTMLButtonElement} */ (row1.querySelector('.BRolMobileSearchBtn'));
    this._searchBtn.addEventListener('click', () => {
      if (this._searchRow?.hasAttribute('hidden')) {
        this._openSearch();
      } else {
        this._closeSearch(); // close but preserve state for next open
      }
    });

    // ── Row 2 ────────────────────────────────────────────────────────────────
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

    // Tapping/focusing the input restores results (hides nav bar first).
    // Also restores the query in case iOS cleared the type=text input on blur.
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
      this._clearResults(); // full clear on explicit X
      input.focus();
    });

    // Cancel closes AND clears everything
    cancelBtn.addEventListener('click', () => this._deactivateSearch());

    this._searchRow = row2;
    this._searchInput = input;

    this._navBar = this._buildResultNav();
    header.append(row1, row2, this._navBar);
    return header;
  }

  _buildResultsPanel() {
    const panel = document.createElement('div');
    panel.className = 'BRolMobileResults';
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-live', 'polite');
    return panel;
  }

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

  /** Navigate to a match by index (used by result clicks and nav arrows). */
  _navigateToMatch(idx) {
    if (idx < 0 || idx >= this._matches.length) return;
    this._currentMatchIdx = idx;
    this.br.plugins.search?.jumpToMatch(idx);
    this._updateNavDisplay();
  }

  /** Show the result navigator bar for the given match, hiding the results panel. */
  _showResultNav(idx) {
    if (!this._navBar) return;
    // Preserve query before iOS might clear the input on focus shift
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

    // Strip HTML tags for a clean single-line plain-text snippet
    const tmp = document.createElement('div');
    tmp.innerHTML = match.html || '';
    _navSnippetEl.textContent = `p. ${match.displayPageNumber} — ${(tmp.textContent || '').trim()}`;

    _navPrevBtn.disabled = (idx === 0);
    _navNextBtn.disabled = (idx === total - 1);
  }

  _openSearch() {
    if (!this._searchRow) return;
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

  /** Close search row + hide results; preserve input value for next open. */
  _closeSearch() {
    this._searchRow?.setAttribute('hidden', '');
    if (this._searchBtn) {
      this._searchBtn.classList.remove('BRolMobileActionBtn--active');
      this._searchBtn.setAttribute('aria-pressed', 'false');
    }
    this._hideResults();
  }

  /** Cancel: close search + clear all state (input, results, nav, matches, book pins). */
  _deactivateSearch() {
    this._savedQuery = '';
    this._closeSearch();
    this._clearResults(); // resets _matches, _currentMatchIdx, hides nav
    if (this._searchInput) {
      this._searchInput.value = '';
      if (this._clearBtn) this._clearBtn.hidden = true;
    }
    // Remove search hilite pins from the book pages
    this.br.plugins.search?.removeSearchResults(/* suppressFragmentChange= */ true);
  }

  _submitSearch(query) {
    if (!query) return;
    this._showLoading();
    this.br.search(query);
  }

  _showLoading() {
    if (!this._resultsPanel) return;
    this._hideResultNav();
    this._matches = [];
    this._currentMatchIdx = -1;
    this._resultsPanel.removeAttribute('hidden');
    this._resultsPanel.innerHTML = `<div class="BRolMobileStatus">Searching…</div>`;
  }

  /** Hide panel but keep HTML (restores on next open / input focus). */
  _hideResults() {
    this._resultsPanel?.setAttribute('hidden', '');
  }

  /** Hide and wipe HTML (used by X button). */
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
        // Navigate + show the single-result nav bar; tap input to return to full list
        this._showResultNav(idx);
      });
    });
  }

  _bindSearchEvents() {
    $(document)
      .on('BookReader:SearchCallback', (e, { results }) => {
        if (!this._active) return;
        this._renderResults(results.matches);
      })
      .on('BookReader:SearchStarted', () => {
        if (!this._active) return;
        this._showLoading();
      })
      .on('BookReader:SearchCallbackEmpty', () => {
        if (!this._active) return;
        this._renderResults([]);
      })
      .on('BookReader:SearchCallbackError', () => {
        if (!this._active) return;
        if (!this._resultsPanel) return;
        this._resultsPanel.removeAttribute('hidden');
        this._resultsPanel.innerHTML = `<div class="BRolMobileStatus BRolMobileStatus--error">Sorry, there was an error with your search. Please try again.</div>`;
      });

    // Click outside the search wrapper while results are visible:
    // collapse results and restore the preview nav bar if a match was selected.
    document.addEventListener('click', (e) => {
      if (!this._active) return;
      const resultsVisible = this._resultsPanel && !this._resultsPanel.hasAttribute('hidden');
      if (!resultsVisible) return;
      if (this._wrapper?.contains(/** @type {Node} */ (e.target))) return;
      // Tap landed on the book (or elsewhere outside the header/results)
      if (this._currentMatchIdx >= 0) {
        this._showResultNav(this._currentMatchIdx);
      } else {
        this._hideResults();
      }
    }, { capture: false });
  }
}

BookReader?.registerPlugin('olMobile', OLMobilePlugin);
