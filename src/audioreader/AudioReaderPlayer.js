import SynthesisQueue from './SynthesisQueue.js';
import { segmentParagraph } from './textSegments.js';
import { cursorKey, cursorsEqual } from './ParagraphSource.js';

/** @typedef {import('./ParagraphSource.js').ParagraphCursor} ParagraphCursor */
/** @typedef {import('./ParagraphSource.js').default} ParagraphSource */
/** @typedef {import('./textSegments.js').Segment} Segment */

/**
 * @typedef {Object} TTSEngine
 * @property {(text: string, ctx: {signal: AbortSignal}) => Promise<any>} synthesize
 *   produce whatever `play` consumes. Fast engines (WebSpeech) can return immediately.
 * @property {(sound: any, ctx: {signal: AbortSignal}) => Promise<void>} play
 *   resolve when the sound has finished playing
 * @property {() => void} pause
 * @property {() => void} resume
 * @property {() => void} stop
 * @property {(rate: number) => void} [setRate]
 */

/** Paragraphs kept in the buffer, including the one being read. Issue #1580: "up to 5". */
export const DEFAULT_LOOKAHEAD = 5;

/**
 * Segments to synthesize to completion before playback starts (from cold or after
 * a seek). A short pre-roll absorbs model warm-up and the high fixed cost of the
 * first tiny "landmark" segment, so the good voice can then play uninterrupted
 * instead of the engine dropping to a preview whenever synthesis briefly lags.
 */
export const DEFAULT_PREBUFFER_SEGMENTS = 3;

/**
 * How long to wait after the last next/prev press before rebuilding the buffer.
 * Issue #1580 asks that seeking not "queue up more loads every time the button is
 * pressed": presses are coalesced, so a burst of ten costs one rebuild, not ten.
 * Short enough that a single press still feels immediate.
 */
export const DEFAULT_SEEK_DEBOUNCE_MS = 150;

/**
 * Playback state machine for the audio reader.
 *
 * Owns the cursor (which paragraph, which segment within it), drives the engine,
 * and keeps {@link SynthesisQueue} loaded with the right work in the right order.
 */
export default class AudioReaderPlayer {
  /**
   * @param {Object} opts
   * @param {ParagraphSource} opts.source
   * @param {TTSEngine} opts.engine
   * @param {number} [opts.lookahead]
   * @param {number} [opts.seekDebounceMs]
   * @param {() => void} [opts.onChange] fired whenever observable state changes
   * @param {(cursor: ParagraphCursor) => void} [opts.onParagraphChange]
   */
  constructor({ source, engine, lookahead = DEFAULT_LOOKAHEAD, prebufferSegments = DEFAULT_PREBUFFER_SEGMENTS, seekDebounceMs = DEFAULT_SEEK_DEBOUNCE_MS, onChange, onParagraphChange }) {
    this.source = source;
    this.engine = engine;
    this.lookahead = lookahead;
    this.prebufferSegments = prebufferSegments;
    this.seekDebounceMs = seekDebounceMs;
    this._onChange = onChange || (() => {});
    this._onParagraphChange = onParagraphChange || (() => {});

    /** @type {ParagraphCursor|null} */
    this.cursor = null;
    /** Index of the segment within the current paragraph. */
    this.segmentIndex = 0;
    /** @type {Segment[]} segments of the current paragraph */
    this.segments = [];
    this.playing = false;
    /** True while waiting on synthesis of the segment we want to play (spinner). */
    this.loading = false;
    /** True between a seek press and the buffer settling on the new position. */
    this.seeking = false;
    this.finished = false;

    /**
     * Bumped on every seek. The playback loop and any in-flight hydration compare
     * against it and bail out if they are stale, so a seek cannot be overtaken by
     * work started before it.
     */
    this._generation = 0;
    /** Coalesced seek intent, in units; see {@link DEFAULT_SEEK_DEBOUNCE_MS}. */
    this._pendingSeek = { paragraphs: 0, sentences: 0, pages: 0 };
    this._seekTimer = null;
    /**
     * Word accounting for the current leaf, so the real-time progress bar can show
     * how far through the page the reading is. Recomputed on every move/advance.
     */
    this._pageWords = { total: 0, before: 0 };
    /** @type {AbortController|null} controls the currently playing sound */
    this._playbackAbort = null;
    /** Whether a `_playLoop` is currently running (possibly suspended on a sound). */
    this._loopAlive = false;

    this.queue = new SynthesisQueue({
      synthesize: (text, ctx) => this.engine.synthesize(text, ctx),
      onChange: () => this._onChange(),
    });
  }

  /**
   * Position the player and start filling the buffer. Does not play: on first load
   * the issue wants the landmark, the rest of the sentence, then the rest of the
   * paragraph preloaded *before* the patron presses play.
   * @param {ParagraphCursor} cursor
   */
  async start(cursor) {
    this.cursor = cursor;
    this.segmentIndex = 0;
    this.finished = false;
    await this._hydrate();
  }

  /**
   * @return {Segment|null} the segment currently being read (or about to be)
   */
  get currentSegment() {
    return this.segments[this.segmentIndex] || null;
  }

  /** @return {string|null} cache key of the current segment */
  get currentKey() {
    const segment = this.currentSegment;
    return segment ? segmentKey(this.cursor, segment.index) : null;
  }

  /** @return {string} full text of the paragraph being read */
  get paragraphText() {
    return this.segments.map(segment => segment.text).join(' ');
  }

  /**
   * How much of the buffer is hydrated -- drives the buffer indicator in the UI.
   * @return {{ready: number, total: number}}
   */
  get bufferState() {
    const total = this._plan.length;
    return { ready: this.queue.readyKeys().length, total };
  }

  /**
   * How far reading has progressed through the current page, by words. Drives the
   * subtle real-time progress bar: it advances as each sentence is read and resets
   * when the page turns. Unlike {@link _progressPercent}'s leaf position, this is
   * sentence-granular within the page.
   * @return {{read: number, total: number, percent: number}}
   */
  get pageWordProgress() {
    const { total, before } = this._pageWords;
    if (!total) return { read: 0, total: 0, percent: 0 };
    let read = before;
    for (let i = 0; i < this.segmentIndex && i < this.segments.length; i++) {
      read += wordCount(this.segments[i].text);
    }
    read = Math.min(read, total);
    return { read, total, percent: (read / total) * 100 };
  }

  /**
   * Rebuild the synthesis plan around the current cursor.
   * @private
   */
  async _hydrate() {
    const generation = this._generation;
    if (!this.cursor) return;

    const cursors = await this.source.window(this.cursor, this.lookahead);
    if (generation !== this._generation) return; // seeked while fetching

    /** @type {Array<{key: string, text: string}>} */
    const plan = [];
    for (const [position, cursor] of cursors.entries()) {
      const text = await this.source.resolvedText(cursor);
      if (generation !== this._generation) return;
      const segments = segmentParagraph(text);

      if (position === 0) {
        this.segments = segments;
        // A seek can land past the end of a shorter paragraph; clamp.
        if (this.segmentIndex >= segments.length) this.segmentIndex = 0;
      }

      // Segments already read in the current paragraph are not re-planned; the
      // buffer is for what is coming, not what is behind us.
      const from = position === 0 ? this.segmentIndex : 0;
      for (const segment of segments.slice(from)) {
        plan.push({ key: segmentKey(cursor, segment.index), text: segment.text });
      }
    }

    // Word accounting for the current leaf, for the real-time progress bar. The
    // page is already cached from the window walk above, so this is free.
    const pageChunks = await this.source.page(this.cursor.leafIndex);
    if (generation !== this._generation) return;
    let wordsBefore = 0;
    for (let i = 0; i < this.cursor.chunkIndex && i < pageChunks.length; i++) {
      wordsBefore += wordCount(pageChunks[i].text);
    }
    this._pageWords = {
      total: pageChunks.reduce((sum, chunk) => sum + wordCount(chunk.text), 0),
      before: wordsBefore,
    };

    this._plan = plan;
    this.queue.setPlan(plan);
    this._onChange();
  }

  /** @type {Array<{key: string, text: string}>} */
  _plan = [];

  /** Begin (or resume) reading aloud. */
  async play() {
    if (this.playing) return;
    if (this.finished) return;
    this.playing = true;
    this._onChange();
    this.engine.resume();

    // A pause leaves the playback loop suspended on the sound it was awaiting,
    // and resuming that sound lets the existing loop carry on by itself. Starting
    // a second loop here would double-advance the cursor -- two loops each
    // incrementing segmentIndex for the same sound.
    if (this._loopAlive) return;

    this._loopAlive = true;
    try {
      await this._playLoop(this._generation);
    } finally {
      this._loopAlive = false;
    }
  }

  /** Pause without losing position. */
  pause() {
    if (!this.playing) return;
    this.playing = false;
    this.engine.pause();
    this._onChange();
  }

  togglePlayPause() {
    return this.playing ? this.pause() : this.play();
  }

  /**
   * Move one paragraph forward. Presses are coalesced -- see
   * {@link DEFAULT_SEEK_DEBOUNCE_MS}.
   */
  next() { this._queueSeek('paragraphs', +1); }

  /** Move one paragraph back. */
  prev() { this._queueSeek('paragraphs', -1); }

  /** Move forward one sentence, rolling into the next paragraph/page at the end. */
  nextSentence() { this._queueSeek('sentences', +1); }

  /** Move back one sentence, rolling into the previous paragraph/page at the start. */
  prevSentence() { this._queueSeek('sentences', -1); }

  /** Jump to the first text of the next page (leaf) that has any. */
  nextPage() { this._queueSeek('pages', +1); }

  /** Jump to the first text of the previous page (leaf) that has any. */
  prevPage() { this._queueSeek('pages', -1); }

  /**
   * Jump to a specific place in the book, e.g. a table-of-contents entry.
   * @param {number} leafIndex
   */
  async jumpToLeaf(leafIndex) {
    const cursor = await this.source.firstFrom(leafIndex);
    if (!cursor) return;
    this._cancelPendingSeek();
    await this._moveTo(cursor);
  }

  /**
   * @private
   * Record a seek intent and (re)arm the debounce. A burst of presses -- of any
   * mix of units -- coalesces into a single rebuild.
   * @param {'paragraphs'|'sentences'|'pages'} unit
   * @param {number} delta
   */
  _queueSeek(unit, delta) {
    this._pendingSeek[unit] += delta;
    this.seeking = true;

    // Stop the current sound at once. Waiting for the debounce would leave the old
    // paragraph audibly playing while the patron is still pressing the button.
    this._stopPlayback();
    this._onChange();

    if (this._seekTimer) clearTimeout(this._seekTimer);
    this._seekTimer = setTimeout(() => {
      this._seekTimer = null;
      const pending = this._pendingSeek;
      this._pendingSeek = { paragraphs: 0, sentences: 0, pages: 0 };
      this._applySeek(pending);
    }, this.seekDebounceMs);
  }

  /** @private */
  _cancelPendingSeek() {
    if (this._seekTimer) clearTimeout(this._seekTimer);
    this._seekTimer = null;
    this._pendingSeek = { paragraphs: 0, sentences: 0, pages: 0 };
  }

  /**
   * @private
   * Apply a coalesced seek: pages first, then paragraphs, then sentences, so a
   * mixed burst settles somewhere sensible. One rebuild regardless of how many
   * presses were folded together.
   * @param {{paragraphs: number, sentences: number, pages: number}} pending
   */
  async _applySeek({ paragraphs, sentences, pages }) {
    let cursor = this.cursor;
    let segmentIndex = this.segmentIndex;

    if (pages) {
      cursor = await this._walkPages(cursor, pages);
      segmentIndex = 0;
    }

    if (paragraphs) {
      const step = paragraphs > 0 ? 'next' : 'prev';
      for (let i = 0; i < Math.abs(paragraphs); i++) {
        const candidate = await this.source[step](cursor);
        // Walking off either end of the book just stops there.
        if (!candidate) break;
        cursor = candidate;
      }
      segmentIndex = 0;
    }

    if (sentences) {
      ({ cursor, segmentIndex } = await this._walkSentences(cursor, segmentIndex, sentences));
    }

    await this._moveTo(cursor, segmentIndex);
  }

  /**
   * @private
   * Walk `delta` pages (leaves with text) from `cursor`, landing on the first
   * paragraph of each. Stops at either end of the book.
   * @param {ParagraphCursor} cursor
   * @param {number} delta
   * @return {Promise<ParagraphCursor>}
   */
  async _walkPages(cursor, delta) {
    const forward = delta > 0;
    for (let i = 0; i < Math.abs(delta); i++) {
      const target = forward
        ? await this.source.firstFrom(cursor.leafIndex + 1)
        : await this._prevPageCursor(cursor.leafIndex);
      if (!target) break;
      cursor = target;
    }
    return cursor;
  }

  /**
   * @private
   * The first paragraph of the nearest page before `leafIndex` that has text.
   * @param {number} leafIndex
   * @return {Promise<ParagraphCursor|null>}
   */
  async _prevPageCursor(leafIndex) {
    for (let leaf = leafIndex - 1; leaf >= 0; leaf--) {
      const chunks = await this.source.page(leaf);
      if (chunks.length) return { leafIndex: leaf, chunkIndex: 0 };
    }
    return null;
  }

  /**
   * @private
   * Walk `delta` sentences from (cursor, segmentIndex), crossing paragraph and
   * page boundaries. Landing on a previous paragraph lands on its last sentence.
   * @param {ParagraphCursor} cursor
   * @param {number} segmentIndex
   * @param {number} delta
   * @return {Promise<{cursor: ParagraphCursor, segmentIndex: number}>}
   */
  async _walkSentences(cursor, segmentIndex, delta) {
    const forward = delta > 0;
    let segments = segmentParagraph(await this.source.resolvedText(cursor));

    for (let i = 0; i < Math.abs(delta); i++) {
      if (forward) {
        if (segmentIndex + 1 < segments.length) {
          segmentIndex++;
        } else {
          const candidate = await this.source.next(cursor);
          if (!candidate) break;
          cursor = candidate;
          segments = segmentParagraph(await this.source.resolvedText(cursor));
          segmentIndex = 0;
        }
      } else if (segmentIndex > 0) {
        segmentIndex--;
      } else {
        const candidate = await this.source.prev(cursor);
        if (!candidate) break;
        cursor = candidate;
        segments = segmentParagraph(await this.source.resolvedText(cursor));
        segmentIndex = Math.max(0, segments.length - 1);
      }
    }

    return { cursor, segmentIndex };
  }

  /**
   * @private
   * @param {ParagraphCursor} cursor
   * @param {number} [segmentIndex] sentence within the paragraph to land on
   */
  async _moveTo(cursor, segmentIndex = 0) {
    const wasPlaying = this.playing;
    this._generation++;
    this._stopPlayback();

    const moved = !cursorsEqual(cursor, this.cursor) || segmentIndex !== this.segmentIndex;
    this.cursor = cursor;
    this.segmentIndex = segmentIndex;
    this.finished = false;
    this.seeking = false;

    await this._hydrate();
    if (moved) this._onParagraphChange(cursor);
    this._onChange();

    if (wasPlaying) {
      this.playing = false;
      // Deliberately not awaited: play() only resolves when playback *ends* (the
      // book finishes or the patron pauses). Awaiting it here would mean a
      // jumpToLeaf() never returned to its caller while audio was playing.
      this.play();
    }
  }

  /**
   * @private
   * Abort whatever sound is playing right now, leaving the cursor alone.
   */
  _stopPlayback() {
    if (this._playbackAbort) {
      this._playbackAbort.abort();
      this._playbackAbort = null;
    }
    this.engine.stop();
    this.loading = false;
  }

  /**
   * @private
   * Read segments in order until the book ends, the patron pauses, or a seek
   * invalidates this generation.
   * @param {number} generation
   */
  async _playLoop(generation) {
    // Fill a short pre-roll before the first sound, so the good voice plays
    // through rather than yielding to a preview while synthesis warms up.
    await this._prebuffer(generation);
    if (!this.playing || generation !== this._generation) return;

    while (this.playing && generation === this._generation) {
      const segment = this.currentSegment;
      if (!segment) {
        if (!(await this._advanceParagraph(generation))) return;
        continue;
      }

      const key = this.currentKey;

      if (!this.queue.isReady(key)) {
        // The spinner the issue asks for: we are on a paragraph whose audio has
        // not arrived yet.
        this.loading = true;
        this._onChange();
        try {
          await this.queue.waitFor(key);
        } catch {
          // Seeked away, or this segment cannot be synthesized. Either way the
          // loop for this generation is over; a newer one will have taken charge.
          if (generation !== this._generation) return;
          this.segmentIndex++;
          continue;
        } finally {
          this.loading = false;
        }
        if (generation !== this._generation) return;
        this._onChange();
      }

      const abort = new AbortController();
      this._playbackAbort = abort;
      try {
        await this.engine.play(this.queue.get(key), { signal: abort.signal });
      } catch (error) {
        if (!abort.signal.aborted) console.warn('AudioReader: playback error', error);
      }
      this._playbackAbort = null;

      if (abort.signal.aborted || generation !== this._generation || !this.playing) return;

      this.segmentIndex++;
      this._onChange();
    }
  }

  /**
   * @private
   * Wait for the first few planned segments to be synthesized before playback
   * begins. Bails immediately on a seek, a pause, or a segment that will never
   * arrive, so it can only ever delay the start, never block it indefinitely.
   * @param {number} generation
   */
  async _prebuffer(generation) {
    const wanted = this._plan.slice(0, this.prebufferSegments).map(job => job.key);
    if (!wanted.length || wanted.every(key => this.queue.isReady(key))) return;

    this.loading = true;
    this._onChange();
    try {
      for (const key of wanted) {
        if (!this.playing || generation !== this._generation) return;
        if (this.queue.isReady(key)) continue;
        try {
          await this.queue.waitFor(key);
        } catch {
          // Seeked away, or this segment cannot be made: stop pre-rolling and let
          // the play loop deal with whatever is current now.
          return;
        }
      }
    } finally {
      this.loading = false;
      this._onChange();
    }
  }

  /**
   * @private
   * Step to the next paragraph during continuous playback (not a seek), sliding
   * the buffer window forward by one.
   * @param {number} generation
   * @return {Promise<boolean>} false if the book is finished
   */
  async _advanceParagraph(generation) {
    const nextCursor = await this.source.next(this.cursor);
    if (generation !== this._generation) return false;

    if (!nextCursor) {
      this.playing = false;
      this.finished = true;
      this._onChange();
      return false;
    }

    this.cursor = nextCursor;
    this.segmentIndex = 0;
    await this._hydrate();
    if (generation !== this._generation) return false;
    this._onParagraphChange(nextCursor);
    return true;
  }

  /** Tear down: stop audio and drop the buffer. */
  destroy() {
    this._cancelPendingSeek();
    this.playing = false;
    this._generation++;
    this._stopPlayback();
    this.queue.clear();
  }
}

/**
 * @param {ParagraphCursor} cursor
 * @param {number} segmentIndex
 * @return {string}
 */
export function segmentKey(cursor, segmentIndex) {
  return `${cursorKey(cursor)}#${segmentIndex}`;
}

/**
 * Count word-like tokens, matching {@link ParagraphSource}'s own counting so the
 * page progress bar and the "substantial paragraph" heuristic agree.
 * @param {string} text
 * @return {number}
 */
function wordCount(text) {
  const words = (text || '').trim().match(/\p{L}[\p{L}'’-]*/gu);
  return words ? words.length : 0;
}
