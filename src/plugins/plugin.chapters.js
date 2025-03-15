// @ts-check
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import '@internetarchive/icon-toc/icon-toc';
import { BookReaderPlugin } from "../BookReaderPlugin";
import { applyVariables } from "../util/strings.js";
/** @typedef {import('@/src/BookReader/BookModel.js').PageIndex} PageIndex */
/** @typedef {import('@/src/BookReader/BookModel.js').PageString} PageString */
/** @typedef {import('@/src/BookReader/BookModel.js').LeafNum} LeafNum */

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

/**
 * Plugin for chapter markers in BookReader. Fetches from openlibrary.org
 * Could be forked, or extended to alter behavior
 */
export class ChaptersPlugin extends BookReaderPlugin {
  options = {
    enabled: true,

    /**
     * The Open Library host to fetch/query Open Library.
     * @type {import('@/src/util/strings.js').StringWithVars}
     */
    openLibraryHost: 'https://openlibrary.org',

    /**
     * The Open Library edition to fetch the table of contents from.
     * E.g. 'OL12345M'
     *
     * @type {import('@/src/util/strings.js').StringWithVars}
     */
    openLibraryId: '',

    /**
     * The Internet Archive identifier to fetch the Open Library table
     * of contents from.
     * E.g. 'goody'
     *
     * @type {import('@/src/util/strings.js').StringWithVars}
     */
    internetArchiveId: '',

    /**
     * @deprecated
     * Old name for openLibraryHost
     * @type {import('@/src/util/strings.js').StringWithVars}
     */
    olHost: 'https://openlibrary.org',

    /**
     * @deprecated
     * Old name for internetArchiveId
     * @type {import('@/src/util/strings.js').StringWithVars}
     */
    bookId: '{{bookId}}',
  }

  /** @type {TocEntry[]} */
  _tocEntries;

  /** @type {BRChaptersPanel} */
  _chaptersPanel;

  /** @override */
  setup(options) {
    super.setup(options);
    this.options.internetArchiveId = this.options.internetArchiveId || this.options.bookId;
    this.options.openLibraryHost = this.options.openLibraryHost || this.options.olHost;
  }

  /** @override Extend to call Open Library for TOC */
  async init() {
    if (!this.options.enabled || this.br.ui === 'embed') {
      return;
    }

    let rawTableOfContents = null;
    // Prefer explicit TOC if specified
    if (this.br.options.table_of_contents?.length) {
      rawTableOfContents = this.br.options.table_of_contents;
    } else {
      // Otherwise fetch from OL
      const olEdition = await this.getOpenLibraryRecord();
      if (olEdition?.table_of_contents?.length) {
        rawTableOfContents = olEdition.table_of_contents;
      }
    }

    if (rawTableOfContents) {
      this._tocEntries = rawTableOfContents
        .map(rawTOCEntry => (Object.assign({}, rawTOCEntry, {
          pageIndex: (
            typeof(rawTOCEntry.leaf) == 'number' ? this.br.book.leafNumToIndex(rawTOCEntry.leaf) :
              rawTOCEntry.pagenum ? this.br.book.getPageIndex(rawTOCEntry.pagenum) :
                undefined
          ),
        })));
      this._render();
      this.br.bind(BookReader.eventNames.pageChanged, () => this._updateCurrent());
    }
  }

  /**
   * Update the table of contents based on array of TOC entries.
   */
  _render() {
    this.br.shell.menuProviders['chapters'] = {
      id: 'chapters',
      icon: html`<ia-icon-toc style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-toc>`,
      label: 'Table of Contents',
      component: html`<br-chapters-panel
        .contents="${this._tocEntries}"
        .jumpToPage="${(pageIndex) => {
        this._updateCurrent(pageIndex);
        this.br.jumpToIndex(pageIndex);
      }}"
        @connected="${(e) => {
        this._chaptersPanel = e.target;
        this._updateCurrent();
      }}"
      />`,
    };
    this.br.shell.addMenuShortcut('chapters');
    this.br.shell.updateMenuContents();
    this._tocEntries.forEach((tocEntry, i) => this._renderMarker(tocEntry, i));
  }

  /**
   * @param {TocEntry} tocEntry
   * @param {number} entryIndex
   */
  _renderMarker(tocEntry, entryIndex) {
    if (tocEntry.pageIndex == undefined) return;

    //creates a string with non-void tocEntry.label and tocEntry.title
    const chapterStr = [tocEntry.label, tocEntry.title]
      .filter(x => x)
      .join(' ') || `Chapter ${entryIndex + 1}`;

    const percentThrough = BookReader.util.cssPercentage(tocEntry.pageIndex, this.br.book.getNumLeafs() - 1);
    $(`<div></div>`)
      .append(
        $('<div />')
          .text(chapterStr)
          .append(
            $('<div class="BRchapterPage" />')
              .text(this.br.book.getPageName(tocEntry.pageIndex)),
          ),
      )
      .addClass('BRchapter')
      .css({ left: percentThrough })
      .appendTo(this.br.$('.BRnavline'))
      .on("mouseenter", event => {
        // remove hover effect from other markers then turn on just for this
        const marker = event.currentTarget;
        const tooltip = marker.querySelector('div');
        const tooltipOffset = tooltip.getBoundingClientRect();
        const targetOffset = marker.getBoundingClientRect();
        const boxSizeAdjust = parseInt(getComputedStyle(tooltip).paddingLeft) * 2;
        if (tooltipOffset.x - boxSizeAdjust < 0) {
          tooltip.style.setProperty('transform', `translateX(-${targetOffset.left - boxSizeAdjust}px)`);
        }
        this.br.$('.BRsearch,.BRchapter').removeClass('front');
        $(event.target).addClass('front');
      })
      .on("mouseleave", event => $(event.target).removeClass('front'))
      .on('click', () => {
        this._updateCurrent(tocEntry.pageIndex);
        this.br.jumpToIndex(tocEntry.pageIndex);
      });

    this.br.$('.BRchapter, .BRsearch').each((i, el) => {
      const $el = $(el);
      $el
        .on("mouseenter", () => $el.addClass('front'))
        .on("mouseleave", () => $el.removeClass('front'));
    });
  }

  /**
   * This makes a call to OL API and calls the given callback function with the
   * response from the API.
   */
  async getOpenLibraryRecord() {
    const olHost = applyVariables(this.options.openLibraryHost, this.br.options.vars);

    if (this.options.openLibraryId) {
      const openLibraryId = applyVariables(this.options.openLibraryId, this.br.options.vars);
      return await $.ajax({ url: `${olHost}/books/${openLibraryId}.json` });
    }

    if (this.options.internetArchiveId) {
      const ocaid = applyVariables(this.options.internetArchiveId, this.br.options.vars);

      // Try looking up by ocaid first, then by source_record
      const baseQueryUrl = `${olHost}/query.json?type=/type/edition&*=&`;

      let data = await $.ajax({
        url: baseQueryUrl + new URLSearchParams({ ocaid, limit: '1' }),
      });

      if (!data || !data.length) {
        // try source_records
        data = await $.ajax({
          url: baseQueryUrl + new URLSearchParams({ source_records: `ia:${ocaid}`, limit: '1' }),
        });
      }

      return data?.[0];
    }

    return null;
  }

  /**
   * @private
   * Highlights the current chapter based on current page
   * @param {PageIndex} curIndex
   */
  _updateCurrent(
    curIndex = (this.br.mode == 2 ? Math.max(...this.br.displayedIndices) : this.br.firstIndex),
  ) {
    const tocEntriesIndexed = this._tocEntries.filter((el) => el.pageIndex != undefined).reverse();
    const currChapter = tocEntriesIndexed[
      // subtract one so that 2up shows the right label
      tocEntriesIndexed.findIndex((chapter) => chapter.pageIndex <= curIndex)
    ];
    if (this._chaptersPanel) {
      this._chaptersPanel.currentChapter = currChapter;
    }
  }
}
BookReader?.registerPlugin('chapters', ChaptersPlugin);

/**
 * @typedef {Object} TocEntry
 * Table of contents entry as defined by Open Library, with some extra values for internal use
 * @property {number} [level]
 * @property {string} [label]
 * @property {string} [title]
 * @property {PageString} [pagenum]
 * @property {LeafNum} [leaf]
 * @property {number} [pageIndex] - Added
 *
 * @example {
 *   "pagenum": "17",
 *   "level": 1,
 *   "label": "CHAPTER I",
 *   "title": "THE COUNTRY AND THE MISSION"
 * }
 */

@customElement('br-chapters-panel')
export class BRChaptersPanel extends LitElement {
  /** @type {TocEntry[]} */
  @property({ type: Array })
  contents = [];

  /** @type {TocEntry?} */
  @property({ type: Object })
  currentChapter = {};

  /** @type {(pageIndex: PageIndex) => void} */
  jumpToPage = () => {};

  /**
   * @param {TocEntry[]} contents
   */
  constructor(contents) {
    super();
    this.contents = contents;
  }

  render() {
    return html`
    <ol>
      ${this.contents.map(tocEntry => this.renderTOCEntry(tocEntry))}
    </ol>
    `;
  }

  /**
   * @param {TocEntry} tocEntry
   */
  renderTOCEntry(tocEntry) {
    const chapterTitle = [tocEntry.label, tocEntry.title]
      .filter(x => x)
      .join(' ');
    const clickable = tocEntry.pageIndex != undefined;
    // note the click-tracking won't work...
    return html`
    <li
      class="
        BRtable-contents-el
        ${clickable ? 'clickable' : ''}
        ${tocEntry == this.currentChapter ? 'current' : ''}
      "
      style="${styleMap({marginLeft: (tocEntry.level - 1) * 10 + 'px'})}"
      data-event-click-tracking="${ifDefined(clickable ? "BRTOCPanel|GoToChapter" : undefined)}"
      @click="${() => this.jumpToPage(tocEntry.pageIndex)}"
    >
      ${chapterTitle}
      ${tocEntry.pagenum ? html`
        <br />
        <span class="BRTOCElementPage">Page ${tocEntry.pagenum}</span>
      ` : nothing}
    </li>`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.dispatchEvent(new CustomEvent('connected'));
  }

  updated(changedProperties) {
    if (changedProperties.has('currentChapter')) {
      this.shadowRoot.querySelector('li.current')?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }

  static get styles() {
    return css`
      ol {
        padding: 0;
        margin: 0;
        margin-right: 5px;
      }
      li {
        padding: 10px;
        overflow: hidden;
        border-radius: 4px;
      }
      li.clickable {
        font-weight: normal;
        cursor: pointer;
        transition: background-color 0.2s;
      }

      li.clickable:not(.current):hover {
        background-color: rgba(255,255,255, 0.05);
      }

      li.current {
        background-color: rgba(255,255,255,0.9);
        color: #333;
      }

      .BRTOCElementPage {
        font-size: 0.85em;
        opacity: .8;
      }`;
  }
}
