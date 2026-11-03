// @ts-check

/**
 * Lowercases, strips diacritics and drops anything that isn't a letter or
 * number, so OCR punctuation/hyphenation and recognizer formatting don't
 * affect matching (e.g. "To-day," -> "today").
 * @param {string} word
 */
export function normalizeWord(word) {
  return word
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * @param {string} text
 * @returns {string[]} normalized, non-empty words
 */
export function tokenize(text) {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

/**
 * @param {string} a
 * @param {string} b
 */
export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * A crude sound-alike key, so homophone-ish recognizer substitutions
 * ("their"/"there", "colour"/"color") still count as matches.
 * @param {string} word normalized word
 */
export function phoneticKey(word) {
  if (word.length < 3) return word;
  const rest = word.slice(1)
    .replace(/ph/g, 'f')
    .replace(/ck|q/g, 'k')
    .replace(/[aeiouyhw]/g, '')
    .replace(/(.)\1+/g, '$1');
  return word[0] + rest;
}

/** Score for aligning a spoken word to a book word; positive means match */
export const SCORES = {
  /** Spoken word with no counterpart in the book (filler, misrecognition) */
  spokenGap: -0.6,
  /** Book word that was never spoken (skipped word, OCR junk) */
  bookGap: -0.5,
  mismatch: -1,
};

/**
 * @param {string} spoken normalized
 * @param {string} book normalized
 * @param {boolean} [isPartial] spoken word may be cut off (end of an interim result)
 * @returns {number}
 */
export function wordScore(spoken, book, isPartial = false) {
  // Short words are frequent, so they're weak evidence and must match exactly
  const weight = Math.min(book.length, 6) / 3;
  if (spoken === book) return 0.5 + weight;
  if (book.length <= 2 || spoken.length <= 2) return SCORES.mismatch;
  if (isPartial && spoken.length >= 3 && book.startsWith(spoken)) return 0.5 + weight * 0.75;
  const sim = 1 - levenshtein(spoken, book) / Math.max(spoken.length, book.length);
  if (sim >= 0.65) return (0.5 + weight) * sim;
  if (phoneticKey(spoken) === phoneticKey(book)) return (0.5 + weight) * 0.7;
  return SCORES.mismatch;
}

/**
 * @typedef {object} AlignmentMatch
 * @property {number} end Index into the book words of the last matched word
 * @property {number} score Alignment score, after the position prior
 * @property {number} rawScore Alignment score, before the position prior
 * @property {number} matched Number of word pairs that matched
 */

/**
 * Tracks a reading position within a stream of book words, given a rolling
 * window of recognized speech.
 *
 * Each update locally aligns (Smith-Waterman) the last few spoken words
 * against the book words, then picks the best alignment end under a position
 * prior: moving forward is nearly free, moving backward is penalized, and
 * moving far requires more matched words. Re-aligning from the tail every
 * time (instead of consuming words incrementally) makes it robust to the
 * recognizer revising interim results.
 */
export class ReadAlongAligner {
  /** How many trailing spoken words to align */
  queryLength = 8;
  /** Forward words that are free before the prior starts charging */
  forwardSlack = 15;
  forwardCostPerWord = 0.03;
  backwardCost = 1;
  backwardCostPerWord = 0.08;

  /**
   * @param {string[]} words normalized book words
   */
  constructor(words = []) {
    this.words = words;
    /** Index of the last word read; -1 when unknown */
    this.pos = -1;
  }

  /**
   * Replace the book words, keeping the position
   * @param {string[]} words
   * @param {number} pos
   */
  setWords(words, pos) {
    this.words = words;
    this.pos = pos;
  }

  /**
   * @param {string[]} spoken normalized spoken words, oldest first
   * @param {object} [opts]
   * @param {boolean} [opts.lastIsPartial] last spoken word may be cut off
   * @returns {AlignmentMatch | null} the new position, if confident
   */
  update(spoken, { lastIsPartial = false } = {}) {
    const match = this.bestMatch(spoken.slice(-this.queryLength), lastIsPartial);
    if (match) this.pos = match.end;
    return match;
  }

  /**
   * @param {string[]} query
   * @param {boolean} lastIsPartial
   * @returns {AlignmentMatch | null}
   */
  bestMatch(query, lastIsPartial) {
    const book = this.words;
    const K = query.length, N = book.length;
    if (!K || !N) return null;

    // H[i][j]: best local alignment score ending at query[i-1], book[j-1]
    // M[i][j]: matched pairs along that alignment
    let prevH = new Float64Array(N + 1), prevM = new Int32Array(N + 1);
    /** @type {AlignmentMatch | null} */
    let best = null;
    for (let i = 1; i <= K; i++) {
      const H = new Float64Array(N + 1), M = new Int32Array(N + 1);
      const isPartial = lastIsPartial && i === K;
      // Trailing spoken words that didn't land anywhere still cost a bit,
      // so an alignment ending on the latest word is preferred.
      const unmatchedTail = (K - i) * Math.abs(SCORES.spokenGap) * 0.5;
      for (let j = 1; j <= N; j++) {
        const s = wordScore(query[i - 1], book[j - 1], isPartial);
        const diag = prevH[j - 1] + s;
        const up = prevH[j] + SCORES.spokenGap;
        const left = H[j - 1] + SCORES.bookGap;
        let h = 0, m = 0;
        if (diag > h) { h = diag; m = prevM[j - 1] + (s > 0 ? 1 : 0); }
        if (up > h) { h = up; m = prevM[j]; }
        if (left > h) { h = left; m = M[j - 1]; }
        H[j] = h; M[j] = m;

        // Only alignments whose last step is a match define a position
        if (s > 0 && diag === h) {
          const end = j - 1;
          const score = h - unmatchedTail - this.prior(end);
          if (m >= this.requiredMatches(end) && (!best || score > best.score)) {
            best = { end, score, rawScore: h, matched: m };
          }
        }
      }
      prevH = H; prevM = M;
    }
    return best;
  }

  /**
   * Cost of moving the position to `end`
   * @param {number} end
   */
  prior(end) {
    if (this.pos < 0) return 0;
    const d = end - this.pos;
    if (d >= 0) return Math.max(0, d - this.forwardSlack) * this.forwardCostPerWord;
    return this.backwardCost + -d * this.backwardCostPerWord;
  }

  /**
   * Matched word pairs needed to trust a move to `end`. Nearby forward moves
   * need little evidence; jumps (or finding the position from scratch) need
   * more, since short common phrases recur all over a page.
   * @param {number} end
   */
  requiredMatches(end) {
    if (this.pos < 0) return 4;
    const d = end - this.pos;
    if (d >= 0 && d <= 3) return 1;
    if (d >= 0 && d <= this.forwardSlack) return 2;
    if (d < 0 && d >= -this.forwardSlack) return 3;
    return 4;
  }
}
