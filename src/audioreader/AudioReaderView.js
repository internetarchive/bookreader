import { LitElement, html, css, nothing } from 'lit';
import AudioReaderPlayer from './AudioReaderPlayer.js';
import ParagraphSource from './ParagraphSource.js';
import { cursorKey } from './ParagraphSource.js';

/** @typedef {import('./IaAudioBook.js').default} IaAudioBook */

/**
 * The minimal audio-first reading view of issue #1580.
 *
 * The layout follows the mobile design screenshotted in that issue (Marc
 * Coquand's native audio reader, as prototyped in reader.archive.org): a warm
 * cream page, a back arrow and title across the top, the cover centred, a scrub
 * bar with position labels, one large dark circular play control flanked by
 * circular-arrow skips, and a white "Chapters" card listing numbered chapters
 * with the current one in bold behind a bullet.
 *
 * Two deliberate departures from that screenshot, both because it was designed
 * for LibriVox recordings rather than text-to-speech:
 *
 * - **The scrub bar shows position in the book, not time.** A recording knows it
 *   is 22:58 long; a book being synthesized on the fly does not know its own
 *   duration without fetching and measuring every page first. Showing a
 *   fabricated total would be worse than showing pages, so the labels are the
 *   printed page and the leaf count.
 * - **Skips move by paragraph**, which is what the issue asks for, rather than by
 *   a fixed number of seconds.
 *
 * No page images are rendered or requested; the only image is the cover.
 */
export class AudioReaderView extends LitElement {
  static properties = {
    book: { type: Object },
    /** @type {AudioReaderPlayer} */
    player: { type: Object },
    debug: { type: Boolean },
    /** Show the paragraph being read. Off by default: it is not in the design. */
    showText: { type: Boolean },
    /** Swap the cover for a "read along" panel showing the current sentence. */
    readAlong: { type: Boolean },
    _tick: { type: Number, state: true },
  };

  constructor() {
    super();
    this.book = null;
    this.player = null;
    this.debug = false;
    this.showText = false;
    this.readAlong = false;
    /** Bumped to re-render on player state changes. */
    this._tick = 0;
    /** While dragging the page bar: the previewed position, 0..100, else null. */
    this._dragPercent = null;
    this._dragging = false;
  }

  /**
   * @param {IaAudioBook} book
   * @param {Object} engine
   * @param {Object} [opts]
   */
  async attach(book, engine, opts = {}) {
    this.book = book;

    const source = new ParagraphSource({
      fetchPageChunks: leafIndex => book.fetchPageChunks(leafIndex),
      numLeafs: book.numLeafs,
    });

    this.player = new AudioReaderPlayer({
      source, engine,
      onChange: () => { this._tick++; },
      ...opts,
    });

    const start = await source.firstSubstantial({ fromLeaf: book.startLeafIndex });
    if (!start) throw new Error(`AudioReader: "${book.identifier}" has no OCR text to read`);
    await this.player.start(start);
    this._tick++;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.player?.destroy();
  }

  /** @return {string} e.g. "p. 12", or "page 4" when the leaf is unnumbered */
  get _locationLabel() {
    const cursor = this.player?.cursor;
    if (!cursor) return '';
    const leaf = this.book?.leaves[cursor.leafIndex];
    return leaf?.pageNum != null ? `p. ${leaf.pageNum}` : `page ${cursor.leafIndex + 1}`;
  }

  /** @return {number} how far through the book we are, 0..100 */
  get _progressPercent() {
    const cursor = this.player?.cursor;
    if (!cursor || !this.book?.numLeafs) return 0;
    return Math.min(100, (cursor.leafIndex / (this.book.numLeafs - 1)) * 100);
  }

  /** @return {number} index of the chapter we are currently inside, or -1 */
  get _currentChapterIndex() {
    const currentLeaf = this.player?.cursor?.leafIndex ?? 0;
    return (this.book?.toc || []).reduce(
      (best, entry, i) => (entry.leafIndex <= currentLeaf ? i : best), -1);
  }

  render() {
    if (!this.book || !this.player) {
      return html`<div class="loading-screen"><div class="spinner"></div><p>Loading book…</p></div>`;
    }

    return html`
      <div class="reader">
        ${this._renderHeader()}
        <div class="scroller">
          ${this.readAlong ? this._renderReadAlong() : this._renderCover()}
          ${this._renderEngineStatus()}
          ${this._renderScrubber()}
          ${this._renderTransport()}
          ${this.showText || this.debug ? this._renderReadingText() : nothing}
          ${this._renderChapters()}
        </div>
        ${this.debug ? this._renderDebug() : nothing}
      </div>
    `;
  }

  _renderHeader() {
    const player = this.player;
    const rates = [0.75, 1, 1.25, 1.5];
    // The design has a history control in this slot. Rather than ship a dead
    // button, it holds the playback rate, which this prototype actually supports.
    const nextRate = () => rates[(rates.indexOf(player.engine.rate ?? 1) + 1) % rates.length];

    return html`
      <header>
        <a
          class="back"
          href="https://archive.org/details/${this.book.identifier}"
          title="Back to the item"
          aria-label="Back to the item"
        >←</a>
        <h1 class="title" title=${this.book.title}>${this.book.title}</h1>
        ${this._renderVoicePicker()}
        <button
          class="icon-toggle ${this.readAlong ? 'active' : ''}"
          title="Read along"
          aria-label="Read along"
          aria-pressed=${this.readAlong ? 'true' : 'false'}
          @click=${() => { this.readAlong = !this.readAlong; }}
        >📖</button>
        <button
          class="rate"
          title="Playback speed"
          aria-label="Playback speed"
          @click=${() => { player.engine.setRate?.(nextRate()); this._tick++; }}
        >${player.engine.rate ?? 1}×</button>
      </header>
    `;
  }

  /**
   * A handful of ungated English voices to clone, from kyutai/tts-voices. Picking
   * one reloads with `?referenceAudio=` set; the model bundle is cached, so the
   * reload re-primes the voice in seconds rather than re-downloading anything.
   * Only shown for the PocketTTS-based engines, which are the ones that clone.
   */
  static VOICES = [
    { label: 'Stuart Bell', url: 'https://huggingface.co/kyutai/tts-voices/resolve/main/voice-zero/stuart_bell.wav' },
    { label: 'Bill Boerst', url: 'https://huggingface.co/kyutai/tts-voices/resolve/main/voice-zero/bill_boerst.wav' },
    { label: 'Peter Yearsley', url: 'https://huggingface.co/kyutai/tts-voices/resolve/main/voice-zero/peter_yearsley.wav' },
    { label: 'Caro Davy', url: 'https://huggingface.co/kyutai/tts-voices/resolve/main/voice-zero/caro_davy.wav' },
  ];

  _renderVoicePicker() {
    // Cloning only applies to the PocketTTS-backed engines.
    if (!/Pocket|Hybrid/.test(this.player.engine.name || '')) return nothing;
    // No `referenceAudio` means the engine default, which is the first voice.
    const current = new URLSearchParams(window.location.search).get('referenceAudio')
      || AudioReaderView.VOICES[0].url;

    return html`
      <select class="voice" title="Voice — switching reloads the page" aria-label="Voice"
        @change=${this._onVoiceChange}>
        ${AudioReaderView.VOICES.map(voice => html`
          <option value=${voice.url} ?selected=${voice.url === current}>${voice.label}</option>`)}
      </select>
    `;
  }

  /** @private @param {Event} event */
  _onVoiceChange(event) {
    const url = new URL(window.location.href);
    const value = /** @type {HTMLSelectElement} */ (event.target).value;
    if (value) url.searchParams.set('referenceAudio', value);
    else url.searchParams.delete('referenceAudio');
    window.location.href = url.toString();
  }

  _renderCover() {
    return html`
      <div class="cover-wrap">
        <img class="cover" src=${this.book.coverUrl} alt="Cover of ${this.book.title}" />
      </div>
      ${this.book.author ? html`<div class="byline">${this.book.author}</div>` : nothing}
    `;
  }

  _renderScrubber() {
    const buffer = this.player.bufferState;
    const bufferTitle = `${buffer.ready} of ${buffer.total} buffered segments ready`;
    // While dragging, the page bar follows the finger; otherwise it tracks position.
    const pagePercent = this._dragPercent ?? this._progressPercent;
    const word = this.player.pageWordProgress;

    return html`
      <div class="scrubber">
        <div
          class="track page ${this._dragging ? 'dragging' : ''}"
          role="slider"
          aria-label="Position in book, by page"
          aria-valuemin="1"
          aria-valuemax=${this.book.numLeafs}
          aria-valuenow=${(this.player.cursor?.leafIndex ?? 0) + 1}
          title="Drag or click to change page"
          @pointerdown=${this._onPagePointerDown}
          @pointermove=${this._onPagePointerMove}
          @pointerup=${this._onPagePointerUp}
          @pointercancel=${this._onPagePointerUp}
        >
          <div class="track-fill" style="width:${pagePercent}%"></div>
          <div class="knob" style="left:${pagePercent}%"></div>
        </div>
        <div
          class="track realtime"
          title=${`Reading progress on this page — ${word.read} of ${word.total} words. ${bufferTitle}`}
        >
          <div class="track-fill realtime-fill" style="width:${word.percent}%"></div>
        </div>
        <div class="times">
          <span>${this._locationLabel}</span>
          <span>${this.book.numLeafs} pages</span>
        </div>
      </div>
    `;
  }

  /**
   * @private
   * @param {PointerEvent} event
   * @return {number} position along the page bar, 0..1
   */
  _pageBarFraction(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return 0;
    return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  }

  /** @private @param {PointerEvent} event */
  _onPagePointerDown(event) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    this._dragging = true;
    this._dragPercent = this._pageBarFraction(event) * 100;
    this._tick++;
  }

  /** @private @param {PointerEvent} event */
  _onPagePointerMove(event) {
    if (!this._dragging) return;
    this._dragPercent = this._pageBarFraction(event) * 100;
    this._tick++;
  }

  /** @private @param {PointerEvent} event */
  _onPagePointerUp(event) {
    if (!this._dragging) return;
    const leaf = Math.round(this._pageBarFraction(event) * (this.book.numLeafs - 1));
    this._dragging = false;
    this._dragPercent = null;
    // Lands on the nearest page at/after `leaf` that has text; keeps play state.
    this.player.jumpToLeaf(leaf);
    this._tick++;
  }

  _renderTransport() {
    const player = this.player;
    return html`
      <div class="transport">
        <button class="skip page" title="Previous page" aria-label="Previous page"
          @click=${() => player.prevPage()}>«</button>
        <button class="skip sentence" title="Previous sentence" aria-label="Previous sentence"
          @click=${() => player.prevSentence()}>‹</button>

        <button class="play" aria-label=${player.playing ? 'Pause' : 'Play'}
          ?disabled=${player.finished}
          @click=${() => player.togglePlayPause()}>
          <span class="play-glyph">${player.playing ? '❚❚' : '▶'}</span>
        </button>

        <button class="skip sentence" title="Next sentence" aria-label="Next sentence"
          @click=${() => player.nextSentence()}>›</button>
        <button class="skip page" title="Next page" aria-label="Next page"
          @click=${() => player.nextPage()}>»</button>
      </div>
    `;
  }

  /**
   * The "read along" panel that replaces the cover: the current paragraph with the
   * sentence being read highlighted, so a patron can follow the text by eye. Word-
   * level highlighting is a separate step; this is sentence-level.
   */
  _renderReadAlong() {
    const player = this.player;
    const waiting = player.loading || player.seeking;

    return html`
      <div class="readalong ${waiting ? 'waiting' : ''}" role="region" aria-label="Read along">
        ${player.segments.length
      ? player.segments.map(segment => html`<span
              class="ra-segment ${this._segmentClass(segment)}"
              data-index=${segment.index}
            >${segment.text} </span>`)
      : html`<span class="ra-segment placeholder">…</span>`}
      </div>
    `;
  }

  /**
   * The chapter list, always visible as in the design, rather than hidden behind
   * a toggle.
   */
  _renderChapters() {
    if (!this.book.toc.length) return nothing;
    const activeIndex = this._currentChapterIndex;

    return html`
      <nav class="chapters" aria-label="Chapters">
        <h2>Chapters</h2>
        <ol>
          ${this.book.toc.map((entry, i) => html`
            <li>
              <button
                class="chapter ${i === activeIndex ? 'current' : ''}"
                aria-current=${i === activeIndex ? 'true' : 'false'}
                @click=${() => this.player.jumpToLeaf(entry.leafIndex)}
              >
                <span class="bullet">${i === activeIndex ? '•' : ''}</span>
                <span class="chapter-number">${String(i + 1).padStart(2, '0')}</span>
                <span class="chapter-dash">-</span>
                <span class="chapter-title">
                  ${[entry.label, entry.title].filter(Boolean).join(' ')}
                </span>
              </button>
            </li>
          `)}
        </ol>
      </nav>
    `;
  }

  /**
   * PocketTTS has to fetch ~146MB of weights before it can say anything, and
   * until it has, every segment falls back to the preview voice. Saying so is the
   * difference between "loading" and "why does it sound like that".
   */
  _renderEngineStatus() {
    const engine = this.player.engine;
    if (engine.status !== 'loading' && engine.status !== 'error') return nothing;

    if (engine.status === 'error') {
      return html`<div class="engine-status error">Voice engine failed: ${engine.error}</div>`;
    }

    const { loaded = 0, total = 1 } = engine.progress || {};
    const percent = Math.min(100, Math.round((loaded / Math.max(total, 1)) * 100));
    const mb = bytes => (bytes / 1024 / 1024).toFixed(0);

    return html`
      <div class="engine-status" role="status">
        <span>Loading voice — ${mb(loaded)} of ${mb(total)} MB${
  engine.fast ? html`. Reading in the preview voice meanwhile.` : nothing}</span>
        <span class="track thin"><span class="track-fill" style="width:${percent}%"></span></span>
      </div>
    `;
  }

  /**
   * The paragraph being read, with each segment styled by state so the
   * progressive chunk rendering is visible. Not part of the design -- enabled
   * with `?text=1` (or `?debug=1`) because it is how the chunking behaviour can
   * be seen rather than only heard.
   */
  _renderReadingText() {
    const player = this.player;
    const waiting = player.loading || player.seeking;

    return html`
      <div class="reading ${waiting ? 'waiting' : ''}">
        ${waiting ? html`<div class="spinner" role="status" aria-label="Loading audio"></div>` : nothing}
        ${player.segments.length
      ? player.segments.map(segment => html`<span
              class="segment ${this._segmentClass(segment)}"
              data-kind=${segment.kind}
              data-index=${segment.index}
            >${segment.text} </span>`)
      : html`<span class="segment placeholder">…</span>`}
      </div>
    `;
  }

  /**
   * @param {import('./textSegments.js').Segment} segment
   * @return {string}
   */
  _segmentClass(segment) {
    const player = this.player;
    if (segment.index < player.segmentIndex) return 'read';
    if (segment.index === player.segmentIndex) return player.loading ? 'pending current' : 'current';
    const key = `${cursorKey(player.cursor)}#${segment.index}`;
    return player.queue.isReady(key) ? 'buffered' : 'pending';
  }

  _renderDebug() {
    const player = this.player;
    const counts = player.engine.counts;

    return html`
      <aside class="debug">
        <div class="debug-row">
          <strong>${player.engine.name || 'engine'}</strong>
          ${player.engine.simulatedLatencyMs
      ? html`<span class="warn">+${player.engine.simulatedLatencyMs}ms simulated</span>` : nothing}
          <span>gen ${player._generation}</span>
          <span>${player.playing ? 'playing' : 'paused'}</span>
          ${player.loading ? html`<span class="warn">loading</span>` : nothing}
          ${player.seeking ? html`<span class="warn">seeking</span>` : nothing}
        </div>
        ${counts ? html`
          <div class="debug-row">
            <span>quality ${counts.quality}</span>
            <span>preview ${counts.preview}</span>
            <span>upgraded ${counts.upgraded}</span>
          </div>
        ` : nothing}
        <div class="debug-row">
          synth ${player.queue.stats.synthesized} ·
          aborted ${player.queue.stats.aborted} ·
          evicted ${player.queue.stats.evicted} ·
          failed ${player.queue.stats.failed}
        </div>
        <ol class="debug-plan">
          ${player._plan.map(job => html`
            <li class=${player.queue.isReady(job.key) ? 'ready' : 'pending'}>
              <code>${job.key}</code> ${job.text.slice(0, 34)}${job.text.length > 34 ? '…' : ''}
            </li>
          `)}
        </ol>
      </aside>
    `;
  }

  static styles = css`
    :host {
      /* Warm paper tones, taken from the design screenshot in issue #1580. */
      --page: #f4f0e8;
      --ink: #241f1b;
      --ink-soft: #6f665c;
      --card: #ffffff;
      --rule: #e8e1d4;
      --control: #2f2621;

      display: block;
      height: 100%;
      background: var(--page);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .reader {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-width: 32rem;
      margin: 0 auto;
      box-sizing: border-box;
    }

    .scroller {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 0 1.25rem 1.5rem;
    }

    header {
      flex: none;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem 1rem;
    }

    .back {
      flex: none;
      font-size: 1.35rem;
      line-height: 1;
      color: var(--ink);
      text-decoration: none;
      padding: 0.25rem;
    }

    .title {
      flex: 1;
      min-width: 0;
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .rate {
      flex: none;
      min-width: 2.5rem;
      height: 1.9rem;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: transparent;
      color: var(--ink-soft);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .rate:hover { color: var(--ink); border-color: #d6ccbb; }

    .icon-toggle {
      flex: none;
      width: 1.9rem;
      height: 1.9rem;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: transparent;
      color: var(--ink-soft);
      font-size: 0.95rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .icon-toggle:hover { border-color: #d6ccbb; }

    .voice {
      flex: none;
      max-width: 7.5rem;
      height: 1.9rem;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: transparent;
      color: var(--ink-soft);
      font: inherit;
      font-size: 0.78rem;
      padding: 0 0.5rem;
      cursor: pointer;
    }
    .voice:hover { color: var(--ink); border-color: #d6ccbb; }
    .icon-toggle.active {
      background: var(--control);
      border-color: var(--control);
      /* The glyph is an emoji; a filled pill is the clearest "on" signal. */
      box-shadow: inset 0 0 0 2px var(--control);
    }

    .cover-wrap { display: flex; justify-content: center; padding: 0.5rem 0 0; }

    .cover {
      /* The design's cover is square because LibriVox art is square. Scanned book
         covers are portrait, so keep the real aspect ratio and bound the height:
         forcing a square crops roughly a third of the cover away. */
      max-width: 62%;
      max-height: 17rem;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 0.15rem;
      box-shadow: 0 0.15rem 0.6rem #0000001f;
      background: #e6ded0;
    }

    .byline {
      text-align: center;
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: var(--ink-soft);
    }

    .scrubber { margin: 1.5rem 0 0; }

    .track {
      position: relative;
      height: 0.15rem;
      border-radius: 999px;
      background: #d9d1c2;
    }
    .track.thin { display: block; margin-top: 0.4rem; }

    /* The page bar is interactive: a bigger hit area and a grab cursor, with the
       thin visible rail centred inside it. */
    .track.page {
      height: 1.1rem;
      background: transparent;
      cursor: pointer;
      touch-action: none;
    }
    .track.page::before {
      content: "";
      position: absolute;
      inset: 50% 0 auto 0;
      height: 0.15rem;
      transform: translateY(-50%);
      border-radius: 999px;
      background: #d9d1c2;
    }
    .track.page.dragging { cursor: grabbing; }

    /* The real-time bar is read-only and subtle, and glides between sentence
       updates so it reads as continuous progress rather than stepping. */
    .track.realtime {
      height: 0.12rem;
      margin-top: 0.3rem;
      background: #e4ddcf;
    }
    .realtime-fill {
      background: #b2a894;
      transition: width 0.35s linear;
    }

    .track-fill {
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: 999px;
      background: var(--control);
    }
    /* On the taller page track, keep the fill as a centred thin rail. */
    .track.page .track-fill {
      inset: 50% auto auto 0;
      height: 0.15rem;
      transform: translateY(-50%);
    }

    .knob {
      position: absolute;
      top: 50%;
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      background: var(--control);
      transform: translate(-50%, -50%);
    }

    .times {
      display: flex;
      justify-content: space-between;
      margin-top: 0.6rem;
      font-size: 0.78rem;
      color: var(--ink-soft);
      font-variant-numeric: tabular-nums;
    }

    .transport {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.15rem;
      margin: 1.35rem 0 1.75rem;
    }

    .skip {
      border: 0;
      background: transparent;
      color: var(--ink);
      line-height: 1;
      padding: 0.4rem;
      cursor: pointer;
    }
    /* Page skips (« ») read as the coarser jump, sentence skips (‹ ›) the finer. */
    .skip.page { font-size: 1.7rem; color: var(--ink-soft); }
    .skip.sentence { font-size: 1.9rem; }
    .skip:hover { color: #000; }

    .play {
      width: 4.4rem;
      height: 4.4rem;
      border: 0;
      border-radius: 50%;
      background: var(--control);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .play:hover { background: #3b302a; }
    .play:disabled { background: #b9b0a4; cursor: default; }
    .play-glyph { font-size: 1.35rem; line-height: 1; }

    .chapters {
      background: var(--card);
      border: 1px solid var(--rule);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .chapters h2 {
      margin: 0;
      padding: 1rem 1.1rem 0.75rem;
      font-size: 0.95rem;
      font-weight: 700;
    }

    .chapters ol { list-style: none; margin: 0; padding: 0; }
    .chapters li + li { border-top: 1px solid #f0ebe0; }

    .chapter {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      width: 100%;
      padding: 0.85rem 1.1rem;
      border: 0;
      background: transparent;
      color: var(--ink);
      font: inherit;
      font-size: 0.92rem;
      text-align: left;
      cursor: pointer;
    }
    .chapter:hover { background: #faf7f0; }
    .chapter.current { font-weight: 700; }

    .bullet {
      flex: none;
      width: 0.6rem;
      color: var(--ink);
      font-size: 1rem;
      line-height: 1;
    }
    .chapter-number { flex: none; font-variant-numeric: tabular-nums; }
    .chapter-dash { flex: none; color: var(--ink-soft); }
    .chapter-title { flex: 1; }

    .engine-status {
      display: flex;
      flex-direction: column;
      margin: 1.25rem 0 0;
      padding: 0.6rem 0.75rem;
      border: 1px solid #e0d6c2;
      border-radius: 0.5rem;
      background: #fbf6ea;
      font-size: 0.78rem;
      color: #6b5c3f;
    }
    .engine-status.error {
      border-color: #e5c4c4;
      background: #fdf1f1;
      color: #8a4141;
    }

    .reading {
      position: relative;
      margin: 0 0 1.25rem;
      padding: 0.9rem 1rem;
      border: 1px solid var(--rule);
      border-radius: 0.6rem;
      background: #fffdf8;
      font-size: 0.95rem;
      line-height: 1.65;
    }
    .segment.read { color: #a49a8c; }
    .segment.current { background: #ffe9a8; border-radius: 0.15rem; }
    .segment.buffered { color: var(--ink); }
    .segment.pending { color: #b3a897; font-style: italic; }
    .segment.placeholder { color: #b3a897; }

    /* Read-along panel: the cover's place, giving the current sentence room to be
       read by eye. Larger type than the debug text view, same state colours. */
    .readalong {
      position: relative;
      min-height: 11rem;
      margin: 0.5rem 0 0;
      padding: 1.1rem 1.15rem;
      border: 1px solid var(--rule);
      border-radius: 0.6rem;
      background: #fffdf8;
      font-size: 1.25rem;
      line-height: 1.7;
    }
    .readalong.waiting { opacity: 0.7; }
    .ra-segment { color: #c3b9a8; transition: color 0.2s; }
    .ra-segment.read { color: #b7ad9d; }
    .ra-segment.current {
      color: var(--ink);
      background: #ffe9a8;
      border-radius: 0.2rem;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    .ra-segment.buffered { color: #6f665c; }
    .ra-segment.placeholder { color: #b3a897; }

    .spinner {
      position: absolute;
      top: 0.55rem;
      right: 0.55rem;
      width: 0.9rem;
      height: 0.9rem;
      border: 2px solid #e3dacb;
      border-top-color: var(--control);
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .debug {
      flex: none;
      max-height: 10rem;
      overflow-y: auto;
      margin: 0 1.25rem 1rem;
      padding: 0.5rem;
      border: 1px solid var(--rule);
      border-radius: 0.4rem;
      background: #fffdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.65rem;
      color: #7b7264;
    }
    .debug-row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .debug .warn { color: #a5761b; }
    .debug-plan { list-style: none; margin: 0; padding: 0; }
    .debug-plan li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .debug-plan li.ready::before { content: "● "; color: #3f8f5d; }
    .debug-plan li.pending::before { content: "○ "; color: #b3a897; }

    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: var(--ink-soft);
    }
    .loading-screen .spinner { position: static; width: 1.4rem; height: 1.4rem; }
  `;
}

customElements.define('ia-audio-reader', AudioReaderView);
