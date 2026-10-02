/**
 * Text segmentation for the audio reader.
 *
 * Issue #1580 asks that a paragraph never be rendered "all at once" when the patron
 * lands on it (initial load, or a next/previous jump). Instead it is emitted as a
 * priority-ordered sequence of small units:
 *
 *   1. the first 3 words   -- the "landmark", enough for the patron to tell whether
 *                             they are in the right place
 *   2. the rest of that first sentence
 *   3. the rest of the paragraph
 *
 * We take (3) one step further and split the remainder by sentence rather than
 * emitting it as a single blob. The priority order the issue asks for is unchanged,
 * but synthesis units stay small, which matters for a slow engine like PocketTTS:
 * the queue can be abandoned mid-paragraph on a seek without throwing away much work.
 */

/**
 * @typedef {Object} Segment
 * @property {string} text the words to speak
 * @property {SegmentKind} kind
 * @property {number} index position within the paragraph
 * @property {number} charOffset offset of `text` within the normalized paragraph
 */

/**
 * @typedef {'landmark'|'sentence-tail'|'sentence'} SegmentKind
 * - `landmark`: the first few words of the paragraph
 * - `sentence-tail`: the remainder of the sentence the landmark was taken from
 * - `sentence`: a whole sentence from the rest of the paragraph
 */

/** Words in the leading "landmark" chunk. */
export const LANDMARK_WORD_COUNT = 3;

/**
 * Abbreviations that end in a period but do not end a sentence. Lowercased,
 * without the trailing period.
 */
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'jr', 'sr', 'rev', 'hon', 'capt', 'gen',
  'lt', 'col', 'sgt', 'messrs', 'mt', 'fig', 'no', 'vol', 'ed', 'pp', 'ch',
  'etc', 'vs', 'viz', 'cf', 'al', 'ibid', 'op', 'e.g', 'i.e', 'a.d', 'b.c',
]);

/**
 * OCR text arrives with runs of spaces (from the djvu word boxes) and stray
 * whitespace around line breaks. Speech engines read that fine, but it makes
 * offsets and tests unpleasant, so normalize before segmenting.
 * @param {string} text
 * @return {string}
 */
export function normalizeOcrText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/**
 * @private
 * True if a period at `index` is ending a sentence rather than an abbreviation
 * or a decimal point.
 * @param {string} text normalized text
 * @param {number} index index of the '.' character
 * @return {boolean}
 */
function isSentenceEndingPeriod(text, index) {
  // A digit on both sides means a decimal number, not a sentence end.
  if (/\d/.test(text[index - 1] || '') && /\d/.test(text[index + 1] || '')) return false;

  // Grab the token immediately before the period.
  const preceding = text.slice(0, index);
  const token = (preceding.match(/[^\s]+$/) || [''])[0].toLowerCase();
  if (ABBREVIATIONS.has(token)) return false;

  // A single letter before the period is almost always an initial ("J. Smith").
  if (/^[a-z]$/.test(token)) return false;

  return true;
}

/**
 * Split text into sentences. Deliberately forgiving: OCR text is messy, and a
 * wrong split costs us a slightly odd pause, not a bug.
 * @param {string} text
 * @return {string[]} sentences, in order, with no empty entries
 */
export function splitSentences(text) {
  const normalized = normalizeOcrText(text);
  if (!normalized) return [];

  const sentences = [];
  let start = 0;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char !== '.' && char !== '!' && char !== '?') continue;
    if (char === '.' && !isSentenceEndingPeriod(normalized, i)) continue;

    // Consume any run of terminators plus trailing quotes/brackets ("Stop!" she said).
    let end = i;
    while (end + 1 < normalized.length && '.!?'.includes(normalized[end + 1])) end++;
    while (end + 1 < normalized.length && `"')]`.includes(normalized[end + 1])) end++;

    // Only break if whitespace follows; otherwise we are mid-token.
    if (end + 1 < normalized.length && normalized[end + 1] !== ' ') {
      i = end;
      continue;
    }

    // A lowercase word after the terminator means the sentence is still going:
    // this is a dialogue tag -- `"Stop!" she said.` -- not two sentences.
    if (/^[a-z]/.test(normalized.slice(end + 1).trimStart())) {
      i = end;
      continue;
    }

    sentences.push(normalized.slice(start, end + 1).trim());
    start = end + 1;
    i = end;
  }

  const tail = normalized.slice(start).trim();
  if (tail) sentences.push(tail);

  return sentences;
}

/**
 * Split a paragraph into the priority-ordered segments described at the top of
 * this file.
 * @param {string} paragraphText
 * @param {{landmarkWords?: number}} [opts]
 * @return {Segment[]} empty if the paragraph has no speakable text
 */
export function segmentParagraph(paragraphText, opts = {}) {
  const landmarkWords = opts.landmarkWords ?? LANDMARK_WORD_COUNT;
  const normalized = normalizeOcrText(paragraphText);
  if (!normalized) return [];

  const sentences = splitSentences(normalized);
  if (!sentences.length) return [];

  const [firstSentence, ...restSentences] = sentences;
  const words = firstSentence.split(' ');

  /** @type {Segment[]} */
  const segments = [];
  const push = (text, kind) => {
    if (!text) return;
    segments.push({
      text,
      kind,
      index: segments.length,
      charOffset: normalized.indexOf(text, segments.length ? charCursor(segments, normalized) : 0),
    });
  };

  if (words.length > landmarkWords) {
    push(words.slice(0, landmarkWords).join(' '), 'landmark');
    push(words.slice(landmarkWords).join(' '), 'sentence-tail');
  } else {
    // Sentence is already shorter than the landmark; splitting it would just
    // add a pointless pause.
    push(firstSentence, 'landmark');
  }

  restSentences.forEach(sentence => push(sentence, 'sentence'));

  return segments;
}

/**
 * @private
 * Where in the paragraph the previously-emitted segment ended, so that
 * `indexOf` for the next segment does not match an earlier repeat of the
 * same words.
 * @param {Segment[]} segments already-emitted segments
 * @param {string} normalized
 * @return {number}
 */
function charCursor(segments, normalized) {
  const last = segments[segments.length - 1];
  if (!last || last.charOffset < 0) return 0;
  return Math.min(last.charOffset + last.text.length, normalized.length);
}
