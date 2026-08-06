import PageChunk from '../plugins/tts/PageChunk.js';

/** @typedef {import('./ParagraphSource.js').ParagraphCursor} ParagraphCursor */

/**
 * @typedef {Object} TocEntry
 * @property {string} title
 * @property {string} [label]
 * @property {number} [level]
 * @property {string|number} [pagenum]
 * @property {number|null} leafIndex resolved index into the leaf array, or null
 */

/**
 * Everything the audio reader needs to know about an archive.org item, and
 * nothing else.
 *
 * Notably absent: page images. The normal BookReader path builds a full page
 * model with a `BookReaderImages.php` URI per leaf; issue #1580 asks for a mode
 * that "doesn't fetch any book page images at all". The only image this class
 * exposes is the cover thumbnail.
 */
export default class IaAudioBook {
  /**
   * @param {Object} fields
   * @param {string} fields.identifier
   * @param {string} fields.title
   * @param {string} [fields.author]
   * @param {string} fields.language ISO 639-1
   * @param {string} fields.coverUrl
   * @param {string} fields.server
   * @param {string} fields.bookPath
   * @param {Array<{leafNum: number, pageNum: string|number|null}>} fields.leaves
   */
  constructor(fields) {
    Object.assign(this, fields);
    /** @type {TocEntry[]} */
    this.toc = [];
  }

  get numLeafs() {
    return this.leaves.length;
  }

  /**
   * Where the book proper starts, so playback does not open on the cover, a
   * flyleaf, or -- in this era of scans -- several pages of the publisher's
   * advertisements, all of which are real OCR text and so indistinguishable from
   * prose by length alone.
   *
   * The table of contents is the best signal available: its first entry points at
   * the first thing the book itself considers content. Failing that, fall back to
   * just past the title page, then to the beginning.
   * @return {number}
   */
  get startLeafIndex() {
    const firstTocEntry = this.toc[0];
    if (firstTocEntry?.leafIndex != null) return firstTocEntry.leafIndex;
    if (this.titleLeafIndex != null) return this.titleLeafIndex + 1;
    return 0;
  }

  /**
   * Load an item by identifier.
   * @param {string} identifier
   * @param {Object} [opts]
   * @param {typeof fetch} [opts.fetchFn] injectable for tests
   * @return {Promise<IaAudioBook>}
   */
  static async load(identifier, { fetchFn = fetch } = {}) {
    const metadata = await fetchJson(fetchFn, `https://archive.org/metadata/${identifier}`);
    if (!metadata?.metadata) {
      throw new Error(`AudioReader: no such archive.org item "${identifier}"`);
    }

    const jp2 = (metadata.files || []).find(file => file.name.endsWith('_jp2.zip'));
    const params = new URLSearchParams({
      format: 'jsonp',
      itemPath: metadata.dir,
      id: metadata.metadata.identifier,
      server: metadata.server,
      ...(jp2 ? { subPrefix: jp2.name.replace('_jp2.zip', '') } : {}),
    });
    const manifest = await fetchJson(
      fetchFn,
      `https://${metadata.server}/BookReader/BookReaderJSIA.php?${params}`,
    );
    const brOptions = manifest?.data?.brOptions;
    if (!brOptions) {
      throw new Error(`AudioReader: "${identifier}" has no BookReader manifest (not a book?)`);
    }

    const leaves = (brOptions.data || []).flat().map(page => ({
      leafNum: page.leafNum,
      pageNum: page.pageNum ?? null,
    }));

    const book = new IaAudioBook({
      identifier,
      title: brOptions.bookTitle || metadata.metadata.title || identifier,
      author: firstOf(metadata.metadata.creator),
      language: toIso6391(brOptions.bookLanguage || metadata.metadata.language),
      coverUrl: `https://archive.org/services/img/${identifier}`,
      server: brOptions.server || metadata.server,
      bookPath: brOptions.bookPath,
      leaves,
      // `titleLeaf` is a 1-based leaf number in the manifest.
      titleLeafIndex: typeof brOptions.titleLeaf === 'number' ? brOptions.titleLeaf - 1 : null,
    });

    // A missing or malformed TOC is cosmetic -- never let it stop playback.
    try {
      book.toc = await book._loadToc(fetchFn);
    } catch (error) {
      console.warn('AudioReader: could not load table of contents', error);
    }

    return book;
  }

  /**
   * The endpoint the read-aloud plugin uses, with this book's path filled in.
   * @return {string}
   */
  get pageTextUrl() {
    const path = encodeURIComponent(`${this.bookPath}_djvu.xml`);
    return `https://${this.server}/BookReader/BookReaderGetTextWrapper.php?path=${path}&page={pageIndex}&callback=false`;
  }

  /**
   * Fetch the paragraphs of one leaf.
   * @param {number} leafIndex
   * @param {Object} [opts]
   * @param {typeof fetch} [opts.fetchFn]
   * @return {Promise<PageChunk[]>}
   */
  async fetchPageChunks(leafIndex, { fetchFn = fetch } = {}) {
    const url = this.pageTextUrl.replace('{pageIndex}', String(leafIndex));
    const response = await fetchFn(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching text for leaf ${leafIndex}`);
    const chunks = await response.json();
    // Reuse the read-aloud plugin's parser: it already fixes the djvu rect quirks
    // and strips the dangling hyphens that make TTS stutter across line breaks.
    return PageChunk._fromTextWrapperResponse(leafIndex, chunks || []);
  }

  /**
   * Resolve a printed page number ("vii", "12") to a leaf index.
   * @param {string|number} pageNum
   * @return {number|null}
   */
  leafIndexForPageNum(pageNum) {
    if (pageNum == null) return null;
    const wanted = String(pageNum).trim().toLowerCase();
    const index = this.leaves.findIndex(leaf =>
      leaf.pageNum != null && String(leaf.pageNum).trim().toLowerCase() === wanted);
    return index === -1 ? null : index;
  }

  /**
   * @private
   * BookReader gets chapter markers from the Open Library edition for the item;
   * do the same, so the TOC in audio mode matches the TOC in normal mode.
   * @param {typeof fetch} fetchFn
   * @return {Promise<TocEntry[]>}
   */
  async _loadToc(fetchFn) {
    const editions = await fetchJson(
      fetchFn,
      `https://openlibrary.org/query.json?type=/type/edition&*=&ocaid=${encodeURIComponent(this.identifier)}`,
    );
    const rawToc = editions?.[0]?.table_of_contents;
    if (!rawToc?.length) return [];

    return rawToc
      .map(entry => ({
        title: (entry.title || '').trim(),
        label: (entry.label || '').trim(),
        level: entry.level ?? 0,
        pagenum: entry.pagenum,
        leafIndex: typeof entry.page_index === 'number' ? entry.page_index
          : typeof entry.leaf === 'number' ? entry.leaf
            : this.leafIndexForPageNum(entry.pagenum),
      }))
      // An entry we cannot jump to is worse than no entry: it looks clickable
      // and does nothing.
      .filter(entry => (entry.title || entry.label) && entry.leafIndex != null);
  }
}

/**
 * @param {typeof fetch} fetchFn
 * @param {string} url
 * @return {Promise<any>}
 */
async function fetchJson(fetchFn, url) {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
  return response.json();
}

/** @param {string|string[]|undefined} value */
function firstOf(value) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Item metadata says "eng"; voice selection wants "en".
 * @param {string|string[]|undefined} language
 * @return {string}
 */
function toIso6391(language) {
  const name = (firstOf(language) || 'eng').toLowerCase();
  const KNOWN = {
    eng: 'en', english: 'en', fre: 'fr', fra: 'fr', french: 'fr', ger: 'de', deu: 'de',
    german: 'de', spa: 'es', spanish: 'es', ita: 'it', italian: 'it', por: 'pt',
    portuguese: 'pt', dut: 'nl', nld: 'nl', rus: 'ru', jpn: 'ja', chi: 'zh', zho: 'zh',
  };
  return KNOWN[name] || (name.length === 2 ? name : 'en');
}
