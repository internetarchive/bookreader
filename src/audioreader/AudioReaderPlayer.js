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
  constructor({ source, engine, lookahead = DEFAULT_LOOKAHEAD, seekDebounceMs = DEFAULT_SEEK_DEBOUNCE_MS, onChange, onParagraphChange }) {
    this.source = source;
    this.engine = engine;
    this.lookahead = lookahead;
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
    this._pendingSeek = 0;
    this._seekTimer = null;
    /** @type {AbortController|null} controls the currently playing sound */
    this._playbackAbort = null;

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
      const chunk = await this.source.at(cursor);
      if (generation !== this._generation) return;
      const segments = segmentParagraph(chunk?.text || '');

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
    await this._playLoop(this._generation);
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
  next() { this._seek(+1); }

  /** Move one paragraph back. */
  prev() { this._seek(-1); }

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
   * @param {number} delta paragraphs
   */
  _seek(delta) {
    this._pendingSeek += delta;
    this.seeking = true;

    // Stop the current sound at once. Waiting for the debounce would leave the old
    // paragraph audibly playing while the patron is still pressing the button.
    this._stopPlayback();
    this._onChange();

    if (this._seekTimer) clearTimeout(this._seekTimer);
    this._seekTimer = setTimeout(() => {
      this._seekTimer = null;
      const steps = this._pendingSeek;
      this._pendingSeek = 0;
      this._applySeek(steps);
    }, this.seekDebounceMs);
  }

  /** @private */
  _cancelPendingSeek() {
    if (this._seekTimer) clearTimeout(this._seekTimer);
    this._seekTimer = null;
    this._pendingSeek = 0;
  }

  /**
   * @private
   * Walk `steps` paragraphs and settle there. One rebuild regardless of how many
   * button presses were coalesced into `steps`.
   * @param {number} steps
   */
  async _applySeek(steps) {
    let cursor = this.cursor;
    const step = steps > 0 ? 'next' : 'prev';

    for (let i = 0; i < Math.abs(steps); i++) {
      const candidate = await this.source[step](cursor);
      // Walking off either end of the book just stops there.
      if (!candidate) break;
      cursor = candidate;
    }

    await this._moveTo(cursor);
  }

  /**
   * @private
   * @param {ParagraphCursor} cursor
   */
  async _moveTo(cursor) {
    const wasPlaying = this.playing;
    this._generation++;
    this._stopPlayback();

    const moved = !cursorsEqual(cursor, this.cursor);
    this.cursor = cursor;
    this.segmentIndex = 0;
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
