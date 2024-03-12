/* global BookReader */
import { css, html, LitElement, nothing } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import '@internetarchive/icon-toc/icon-toc';
/** @typedef {import('@/src/BookNavigator/book-navigator.js').BookNavigator} BookNavigator */

/**
 * Plugin for chapter markers in BookReader. Fetches from openlibrary.org
 * Could be forked, or extended to alter behavior
 */

jQuery.extend(BookReader.defaultOptions, {
  olHost: 'https://openlibrary.org',
  enableChaptersPlugin: false,
  bookId: '',
});

/** @override Extend to call Open Library for TOC */
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);
    if (this.options.enableChaptersPlugin && this.ui !== 'embed') {
      this._chapterInit();
    }
  };
})(BookReader.prototype.init);

BookReader.prototype._chapterInit = async function() {
  let rawTableOfContents = null;
  // Prefer IA TOC for now, until we update the second half to check for
  // `openlibrary_edition` on the IA metadata instead of making a bunch of
  // requests to OL.
  if (this.options.table_of_contents?.length) {
    rawTableOfContents = this.options.table_of_contents;
  } else {
    const olEdition = await this.getOpenLibraryRecord(this.options.olHost, this.options.bookId);
    if (olEdition?.table_of_contents?.length) {
      rawTableOfContents = olEdition.table_of_contents;
    }
  }

  if (rawTableOfContents) {
    this._tocEntries = rawTableOfContents
      .map(rawTOCEntry => (Object.assign({}, rawTOCEntry, {
        pageIndex: (
          typeof(rawTOCEntry.leaf) == 'number' ? this.book.leafNumToIndex(rawTOCEntry.leaf) :
            rawTOCEntry.pagenum ? this.book.getPageIndex(rawTOCEntry.pagenum) :
              undefined
        ),
      })));
    this._chaptersRender(this._tocEntries);
    this.bind(BookReader.eventNames.pageChanged, () => this._chaptersUpdateCurrent());
  }
};

/**
 * Update the table of contents based on array of TOC entries.
 */
BookReader.prototype._chaptersRender = function() {
  const shell = /** @type {BookNavigator} */(this.shell);
  shell.menuProviders['chapters'] = {
    id: 'chapters',
    icon: html`<ia-icon-toc style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-toc>`,
    label: 'Table of Contents',
    component: html`<br-chapters-panel
      .contents="${this._tocEntries}"
      .jumpToPage="${(pageIndex) => {
      this._chaptersUpdateCurrent(pageIndex);
      this.jumpToIndex(pageIndex);
    }}"
      @connected="${(e) => {
      this._chaptersPanel = e.target;
      this._chaptersUpdateCurrent();
    }}"
    />`,
  };
  shell.addMenuShortcut('chapters');
  shell.updateMenuContents();
  this._tocEntries.forEach((tocEntry, i) => this._chaptersRenderMarker(tocEntry, i));
};

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

/**
 * @param {TocEntry} tocEntry
 * @param {number} entryIndex
 */
BookReader.prototype._chaptersRenderMarker = function(tocEntry, entryIndex) {
  if (tocEntry.pageIndex == undefined) return;

  //creates a string with non-void tocEntry.label and tocEntry.title
  const chapterStr = [tocEntry.label, tocEntry.title]
    .filter(x => x)
    .join(' ') || `Chapter ${entryIndex + 1}`;

  const percentThrough = BookReader.util.cssPercentage(tocEntry.pageIndex, this.book.getNumLeafs() - 1);
  $(`<div></div>`)
    .append(
      $('<div />')
        .text(chapterStr)
        .append(
          $('<div class="BRchapterPage" />')
            .text(this.book.getPageName(tocEntry.pageIndex))
        )
    )
    .addClass('BRchapter')
    .css({ left: percentThrough })
    .appendTo(this.$('.BRnavline'))
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
      this.$('.BRsearch,.BRchapter').removeClass('front');
      $(event.target).addClass('front');
    })
    .on("mouseleave", event => $(event.target).removeClass('front'))
    .on('click', () => {
      this._chaptersUpdateCurrent(tocEntry.pageIndex);
      this.jumpToIndex(tocEntry.pageIndex);
    });

  this.$('.BRchapter, .BRsearch').each((i, el) => {
    const $el = $(el);
    $el
      .on("mouseenter", () => $el.addClass('front'))
      .on("mouseleave", () => $el.removeClass('front'));
  });
};

/**
 * This makes a call to OL API and calls the given callback function with the
 * response from the API.
 *
 * @param {string} olHost
 * @param {string} ocaid
 */
BookReader.prototype.getOpenLibraryRecord = async function (olHost, ocaid) {
  // Try looking up by ocaid first, then by source_record
  const baseURL = `${olHost}/query.json?type=/type/edition&*=`;
  const fetchUrlByBookId = `${baseURL}&ocaid=${ocaid}`;

  let data = await $.ajax({ url: fetchUrlByBookId, dataType: 'jsonp' });

  if (!data || !data.length) {
    // try sourceid
    data = await $.ajax({ url: `${baseURL}&source_records=ia:${ocaid}`, dataType: 'jsonp' });
  }

  return data?.[0];
};

/**
 * @private
 * Highlights the current chapter based on current page
 * @param {PageIndex} curIndex
 */
BookReader.prototype._chaptersUpdateCurrent = function(
  curIndex = (this.mode == 2 ? Math.max(...this.displayedIndices) : this.firstIndex)
) {
  const tocEntriesIndexed = this._tocEntries.filter((el) => el.pageIndex != undefined).reverse();
  const currChapter = tocEntriesIndexed[
    // subtract one so that 2up shows the right label
    tocEntriesIndexed.findIndex((chapter) => chapter.pageIndex <= curIndex)
  ];
  if (this._chaptersPanel) {
    this._chaptersPanel.currentChapter = currChapter;
  }
};

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
