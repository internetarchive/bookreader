/* global BookReader */
import { css, html, LitElement } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
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

/** @override Extend the constructor to add search properties */
BookReader.prototype.setup = (function (super_) {
  return function (options) {
    super_.call(this, options);

    this.olHost = options.olHost;
    this.enableChaptersPlugin = options.enableChaptersPlugin;
    this.bookId = options.bookId;
  };
})(BookReader.prototype.setup);

/** @override Extend to call Open Library for TOC */
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);
    if (this.enableChaptersPlugin && this.ui !== 'embed') {
      this.getOpenLibraryRecord().then((olEdition) => {
        if (olEdition?.table_of_contents?.length) {
          this._tocEntries = olEdition.table_of_contents.map(rawTOCEntry => (
            Object.assign({}, rawTOCEntry, {pageIndex: this.book.getPageIndex(rawTOCEntry.pagenum)})
          ));
          this._chaptersRender(this._tocEntries);
          this.bind(BookReader.eventNames.pageChanged, () => this.updateTOCState());
        }
      });
    }
  };
})(BookReader.prototype.init);

/**
 * Adds chapter marker to navigation scrubber
 *
 * @param {string} chapterTitle
 * @param {string} pageNumber
 * @param {number} pageIndex
 */
BookReader.prototype.addChapter = function(chapterTitle, pageNumber, pageIndex) {
  const percentThrough = BookReader.util.cssPercentage(pageIndex, this.book.getNumLeafs() - 1);

  //adds .BRchapters to the slider only if pageIndex exists
  if (pageIndex != undefined) {
    $(`<div></div>`)
      .append(
        $('<div />')
          .text(chapterTitle)
          .append($('<div class="BRchapterPage" />').text(`Page ${pageNumber}`))
      )
      .addClass('BRchapter')
      .css({ left: percentThrough })
      .appendTo(this.$('.BRnavline'))
      .data({ pageIndex })
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
      .on('click', this.jumpToIndex.bind(this, pageIndex));
  }

};

/*
 * Remove all chapters.
 */
BookReader.prototype.removeChapters = function() {
  this.$('.BRnavpos .BRchapter').remove();
};

/**
 * Update the table of contents based on array of TOC entries.
 */
BookReader.prototype._chaptersRender = function() {
  this.removeChapters();
  const shell = /** @type {BookNavigator} */(this.shell);
  shell.menuProviders['chapters'] = {
    id: 'chapters',
    icon: html`X`,
    label: 'Table of Contents',
    component: html`<br-chapters-panel
      .contents="${this._tocEntries}"
      .jumpToPage="${this.jumpToIndex.bind(this)}"
      @connected="${(e) => {
      this._chaptersPanel = e.target;
      this.updateTOCState();
    }}"
    />`,
  };
  shell.updateMenuContents();
  for (let i = 0; i < this._tocEntries.length; i++) {
    this.addChapterFromEntry(this._tocEntries[i]);
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
 * @param {TocEntry} tocEntryObject
 */
BookReader.prototype.addChapterFromEntry = function(tocEntryObject) {
  //creates a string with non-void tocEntryObject.label and tocEntryObject.title
  const chapterStr = [tocEntryObject.label, tocEntryObject.title]
    .filter(x => x)
    .join(' ');
  this.addChapter(chapterStr, tocEntryObject['pagenum'], tocEntryObject.pageIndex);
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
 */
BookReader.prototype.getOpenLibraryRecord = async function () {
  // Try looking up by ocaid first, then by source_record
  const baseURL = `${this.olHost}/query.json?type=/type/edition&*=`;
  const fetchUrlByBookId = `${baseURL}&ocaid=${this.bookId}`;

  let data = await $.ajax({ url: fetchUrlByBookId, dataType: 'jsonp' });

  if (!data || !data.length) {
    // try sourceid
    data = await $.ajax({ url: `${baseURL}&source_records=ia:${this.bookId}`, dataType: 'jsonp' });
  }

  return data?.[0];
};

/**
 * highlights the current chapter based on current page
 * @private
 * @param {number} tocEntries
 */
BookReader.prototype.updateTOCState = function() {
  const tocEntriesIndexed = this._tocEntries.filter((el) => el.pageIndex != undefined).reverse();
  const curIndex = this.mode == 2 ? Math.max(...this.displayedIndices) : this.firstIndex;
  const currChapter = tocEntriesIndexed[
    // subtract one so that 2up shows the right label
    tocEntriesIndexed.findIndex((chapter) => chapter.pageIndex <= curIndex)
  ];
  if (this._chaptersPanel) {
    this._chaptersPanel.currentChapter = currChapter;
  }
};

@customElement('br-chapters-panel')
class BRChaptersPanel extends LitElement {
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
