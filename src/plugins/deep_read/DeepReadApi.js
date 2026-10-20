// @ts-check
import { applyVariables } from '../../util/strings.js';
import { BookReaderTextFragment } from '../../util/TextSelectionManager.js';
/** @typedef {import('@/src/BookReader.js').default} BookReader */

/**
 * See ./README.md for the HTTP API these types describe.
 *
 * @typedef {'person' | 'place' | 'organization' | 'work' | 'event' | 'concept'} DeepReadEntityType
 *
 * @typedef {object} DeepReadEntityRef
 * @property {string} id Stable id, e.g. a Wikidata QID like `Q90`
 * @property {string} label
 * @property {DeepReadEntityType} type
 *
 * @typedef {object} DeepReadMention
 * @property {string} entityId Key into the response's `entities`
 * @property {string} fragment BookReader text fragment, as in the `?text=` url
 *   param: `pageNumber:prefix-,quote,-suffix`. See `BookReaderTextFragment`.
 *
 * @typedef {object} DeepReadPageEntitiesResponse
 * @property {string} identifier
 * @property {number} pageIndex
 * @property {DeepReadMention[]} mentions
 * @property {Record<string, DeepReadEntityRef>} entities
 *
 * @typedef {object} DeepReadEntityDetails
 * @property {string} id
 * @property {string} label
 * @property {DeepReadEntityType} type
 * @property {string} [description] Short plain-text summary
 * @property {{ url: string, alt?: string, credit?: string }} [image]
 * @property {{ label: string, value: string }[]} [facts] e.g. born/died, coordinates
 * @property {{ label: string, url: string }[]} [links] e.g. Wikipedia, Open Library
 * @property {string[]} [mentions] Other mentions in this book, as text fragments
 * @property {DeepReadEntityRef[]} [related]
 */

/**
 * @typedef {object} DeepReadApi
 * @property {(pageIndex: number) => Promise<DeepReadPageEntitiesResponse>} getPageEntities
 * @property {(entityId: string) => Promise<DeepReadEntityDetails>} getEntity
 */

/** @implements {DeepReadApi} */
export class HttpDeepReadApi {
  /**
   * @param {object} params
   * @param {import('@/src/util/strings.js').StringWithVars} params.pageEntitiesUrl Also has {{pageIndex}}
   * @param {import('@/src/util/strings.js').StringWithVars} params.entityUrl Also has {{entityId}}
   * @param {Record<string, any>} params.vars
   */
  constructor({ pageEntitiesUrl, entityUrl, vars }) {
    this.pageEntitiesUrl = pageEntitiesUrl;
    this.entityUrl = entityUrl;
    this.vars = vars;
  }

  /** @param {number} pageIndex */
  async getPageEntities(pageIndex) {
    return this._get(applyVariables(this.pageEntitiesUrl, this.vars, { pageIndex }));
  }

  /** @param {string} entityId */
  async getEntity(entityId) {
    return this._get(applyVariables(this.entityUrl, this.vars, { entityId }));
  }

  /** @param {string} url */
  async _get(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`DeepRead API ${resp.status}: ${url}`);
    return resp.json();
  }
}

const NON_ENTITY_WORDS = new Set(`
  A All An And As At But By Chapter Every For From He Her His How I If In Is It Its Mr Mrs Ms Dr
  My No Not Now Of Oh On Once One Or Our Some She So That The Their Then There These They This
  To Was We What When Where Which While Who Why With Yes You Your
`.trim().split(/\s+/));
const PERSON_TITLES = new Set(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Sir', 'Lady', 'Lord', 'King', 'Queen', 'Captain', 'General', 'Saint', 'St']);
const PLACE_PREPOSITIONS = new Set(['in', 'at', 'from', 'to', 'near', 'across']);

/**
 * Stand-in for the real API so the UI can be built against any book: picks
 * capitalized phrases out of the page's OCR and invents details for them.
 * @implements {DeepReadApi}
 */
export class MockDeepReadApi {
  /** @type {Map<number, Promise<DeepReadPageEntitiesResponse>>} */
  _pages = new Map();

  /**
   * @param {BookReader} br
   * @param {{ latencyMs?: number, maxMentionsPerPage?: number }} [options]
   */
  constructor(br, { latencyMs = 300, maxMentionsPerPage = 12 } = {}) {
    this.br = br;
    this.latencyMs = latencyMs;
    this.maxMentionsPerPage = maxMentionsPerPage;
  }

  /** @param {number} pageIndex */
  getPageEntities(pageIndex) {
    if (!this._pages.has(pageIndex)) {
      this._pages.set(pageIndex, this._fetchPageEntities(pageIndex));
    }
    return this._pages.get(pageIndex);
  }

  /** @param {number} pageIndex */
  async _fetchPageEntities(pageIndex) {
    await sleep(this.latencyMs);
    const pageXml = await this.br.plugins.textSelection?.getPageText(pageIndex);
    const words = pageXml ? Array.from(pageXml.querySelectorAll('WORD'), w => w.textContent.trim()).filter(Boolean) : [];
    return {
      identifier: this.br.bookId,
      pageIndex,
      ...extractMockEntities(words, pageIndex, this.maxMentionsPerPage),
    };
  }

  /** @param {string} entityId */
  async getEntity(entityId) {
    await sleep(this.latencyMs);
    const pages = await Promise.all(this._pages.values());
    const ref = pages.map(p => p.entities[entityId]).find(Boolean);
    if (!ref) throw new Error(`Unknown entity ${entityId}`);
    const wikiSearch = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(ref.label)}`;
    return {
      ...ref,
      description: `(Mock) ${ref.label} is a ${ref.type} mentioned in this book. The real API would return a summary from e.g. Wikidata/Wikipedia here.`,
      facts: [
        { label: 'Type', value: ref.type },
        { label: 'Source', value: 'Mock API' },
      ],
      links: [
        { label: 'Search Wikipedia', url: wikiSearch },
        { label: 'Search Open Library', url: `https://openlibrary.org/search?q=${encodeURIComponent(ref.label)}` },
      ],
      mentions: pages.flatMap(p => p.mentions.filter(m => m.entityId === entityId).map(m => m.fragment)),
      related: [],
    };
  }
}

/**
 * @param {string[]} words The page's OCR words, in reading order
 * @param {number} pageIndex
 * @param {number} maxMentions
 * @returns {Pick<DeepReadPageEntitiesResponse, 'mentions' | 'entities'>}
 */
export function extractMockEntities(words, pageIndex, maxMentions) {
  /** @type {DeepReadMention[]} */
  const mentions = [];
  /** @type {Record<string, DeepReadEntityRef>} */
  const entities = {};
  const bare = words.map(w => w.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''));
  const isCapitalized = (/** @type {string} */ w) => /^\p{Lu}\p{Ll}+$/u.test(w) && !NON_ENTITY_WORDS.has(w);

  let i = 0;
  while (i < words.length && mentions.length < maxMentions) {
    if (!isCapitalized(bare[i])) { i++; continue; }

    // Extend over up to 3 capitalized words, stopping at punctuation
    let end = i + 1;
    while (end < words.length && end - i < 3 && isCapitalized(bare[end]) && words[end - 1] === bare[end - 1]) end++;
    const phrase = bare.slice(i, end);
    const prevWord = words[i - 1] || '';
    const sentenceStart = i === 0 || /[.!?"”:]$/.test(prevWord);
    if (sentenceStart && phrase.length === 1) { i = end; continue; }

    const title = bare[i - 1];
    const type = PERSON_TITLES.has(title) || phrase.length > 1 ? 'person'
      : PLACE_PREPOSITIONS.has(prevWord.toLowerCase()) ? 'place'
        : 'concept';
    const label = phrase.join(' ');
    const id = `mock:${label.toLowerCase().replace(/\s+/g, '-')}`;
    entities[id] ??= { id, label, type };
    // toRegExp joins context to the quote with whitespace, so context is only
    // usable on a side where the quote isn't touching punctuation (commas and
    // colons are fine; they're normalized to spaces)
    const leading = words[i].slice(0, words[i].indexOf(bare[i]));
    const trailing = words[end - 1].slice(words[end - 1].indexOf(bare[end - 1]) + bare[end - 1].length);
    const fragment = new BookReaderTextFragment({
      prefix: (!leading && words.slice(Math.max(0, i - 3), i).join(' ')) || null,
      quote: label,
      suffix: (/^[,:]?$/.test(trailing) && words.slice(end, end + 3).join(' ')) || null,
      pageNumber: null,
      pageIndex,
    });
    mentions.push({ entityId: id, fragment: fragment.toNormalizedString() });
    i = end;
  }
  return { mentions, entities };
}

/** @param {number} ms */
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}
