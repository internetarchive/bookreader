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
    _tick: { type: Number, state: true },
  };

  constructor() {
    super();
    this.book = null;
    this.player = null;
    this.debug = false;
    this.showText = false;
    /** Bumped to re-render on player state changes. */
    this._tick = 0;
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

  /** @return {string} e.g. "p. 12", or "leaf 4" when the page is unnumbered */
  get _locationLabel() {
    const cursor = this.player?.cursor;
    if (!cursor) return '';
    const leaf = this.book?.leaves[cursor.leafIndex];
    return leaf?.pageNum != null ? `p. ${leaf.pageNum}` : `leaf ${cursor.leafIndex + 1}`;
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
          ${this._renderCover()}
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
        <button
          class="rate"
          title="Playback speed"
          aria-label="Playback speed"
          @click=${() => { player.engine.setRate?.(nextRate()); this._tick++; }}
        >${player.engine.rate ?? 1}×</button>
      </header>
    `;
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

    return html`
      <div class="scrubber" title=${bufferTitle}>
        <div class="track">
          <div class="track-fill" style="width:${this._progressPercent}%"></div>
          <div class="knob" style="left:${this._progressPercent}%"></div>
        </div>
        <div class="times">
          <span>${this._locationLabel}</span>
          <span>${this.book.numLeafs} leaves</span>
        </div>
      </div>
    `;
  }

  _renderTransport() {
    const player = this.player;
    return html`
      <div class="transport">
        <button class="skip" title="Previous paragraph" aria-label="Previous paragraph"
          @click=${() => player.prev()}>↺</button>

        <button class="play" aria-label=${player.playing ? 'Pause' : 'Play'}
          ?disabled=${player.finished}
          @click=${() => player.togglePlayPause()}>
          <span class="play-glyph">${player.playing ? '❚❚' : '▶'}</span>
        </button>

        <button class="skip" title="Next paragraph" aria-label="Next paragraph"
          @click=${() => player.next()}>↻</button>
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

    .track-fill {
      position: absolute;
      inset: 0 auto 0 0;
      border-radius: 999px;
      background: var(--control);
    }

    .knob {
      position: absolute;
      top: 50%;
      width: 0.6rem;
      height: 0.6rem;
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
      gap: 2.25rem;
      margin: 1.35rem 0 1.75rem;
    }

    .skip {
      border: 0;
      background: transparent;
      color: var(--ink);
      font-size: 1.5rem;
      line-height: 1;
      padding: 0.4rem;
      cursor: pointer;
    }
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
