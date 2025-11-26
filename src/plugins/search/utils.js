// @ts-check
import { escapeHTML, escapeRegExp } from '../../BookReader/utils.js';
/** @typedef {import('@/src/plugins/search/plugin.search.js').SearchInsideResults} SearchInsideResults */
/** @typedef {import('@/src/plugins/search/plugin.search.js').LeafNum} LeafNum */
/** @typedef {import('@/src/plugins/search/plugin.search.js').PageNumString} PageNumString */

/**
 * @param {string} match
 * @param {string} preTag
 * @param {string} postTag
 * @returns {string}
 */
export function renderMatch(match, preTag, postTag) {
  // Search results are returned as a text blob with the hits wrapped in
  // triple mustaches. Hits occasionally include text beyond the search
  // term, so everything within the staches is captured and wrapped.
  const preTagRe = escapeRegExp(escapeHTML(preTag));
  const postTagRe = escapeRegExp(escapeHTML(postTag));
  // [^] matches any character, including line breaks
  const regex = new RegExp(`${preTagRe}([^]+?)${postTagRe}`, 'g');
  return escapeHTML(match)
    .replace(regex, '<mark>$1</mark>')
    // Fix trailing hyphens. This over-corrects but is net useful.
    .replace(/(\b)- /g, '$1');
}

/**
 * Attach some fields to search inside results
 * @param {SearchInsideResults} results
 * @param {(pageNum: LeafNum) => PageNumString} displayPageNumberFn
 * @param {string} preTag
 * @param {string} postTag
 * @param {string | null} bookLanguage The ISO 639-1 language code of the book
 */
export function marshallSearchResults(results, displayPageNumberFn, preTag, postTag, bookLanguage) {
  // Attach matchIndex to a few things to make it easier to identify
  // an active/selected match

  for (const [index, match] of results.matches.entries()) {
    match.matchIndex = index;
    match.displayPageNumber = displayPageNumberFn(match.par[0].page);
    match.html = renderMatch(match.text, preTag, postTag);
    match.lang = bookLanguage;
    for (const par of match.par) {
      for (const box of par.boxes) {
        box.matchIndex = index;
      }
    }
  }
}
