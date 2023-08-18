/* global BookReader */
import { css, html, LitElement } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import '@internetarchive/icon-toc/icon-toc';
/** @typedef {import('@/src/BookNavigator/book-navigator.js').BookNavigator} BookNavigator */

/**
 * Plugin for chapter markers in BookReader. Fetches from openlibrary.org
 * Could be forked, or extended to alter behavior
 */

jQuery.extend(BookReader.defaultOptions, {
  olHost: 'https://openlibrary.org',
  enableChaptersPlugin: true,
  bookId: '',
});

/** @override Extend to call Open Library for TOC */
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);
    if (this.options.enableChaptersPlugin && this.ui !== 'embed') {
      this.getOpenLibraryRecord(this.options.olHost, this.options.bookId).then((olEdition) => {
        if (olEdition?.table_of_contents?.length) {
          this._tocEntries = olEdition.table_of_contents.map(rawTOCEntry => (
            Object.assign({}, rawTOCEntry, {pageIndex: this.book.getPageIndex(rawTOCEntry.pagenum)})
          ));
          this._chaptersRender(this._tocEntries);
          this.bind(BookReader.eventNames.pageChanged, () => this._chaptersUpdateCurrent());
        }
      });
    }
  };
})(BookReader.prototype.init);

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
  shell.updateMenuContents();
  for (const tocEntry of this._tocEntries) {
    this._chaptersRenderMarker(tocEntry);
  }
};

/**
 * @typedef {Object} TocEntry
 * Table of contents entry as defined by Open Library, with some extra values for internal use
 * @property {string} pagenum
 * @property {number} level
 * @property {string} label
 * @property {string} title
 * @property {number} pageIndex - Added
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
 */
BookReader.prototype._chaptersRenderMarker = function(tocEntry) {
  if (tocEntry.pageIndex == undefined) return;

  //creates a string with non-void tocEntry.label and tocEntry.title
  const chapterStr = [tocEntry.label, tocEntry.title]
    .filter(x => x)
    .join(' ');

  const percentThrough = BookReader.util.cssPercentage(tocEntry.pageIndex, this.book.getNumLeafs() - 1);
  $(`<div></div>`)
    .append(
      $('<div />')
        .text(chapterStr)
        .append($('<div class="BRchapterPage" />').text(`Page ${tocEntry.pagenum}`))
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
      data-event-click-tracking="${ifDefined(clickable ? "BRTOCPanel|GoToChapter" : undefined)}"
      @click="${() => this.jumpToPage(tocEntry.pageIndex)}"
    >
      ${chapterTitle}
      <br />
      <span class="BRTOCElementPage">Page ${tocEntry.pagenum}</span>
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
