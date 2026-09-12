import { LitElement, html, css, nothing } from 'lit';
import AudioReaderPlayer from './AudioReaderPlayer.js';
import ParagraphSource from './ParagraphSource.js';
import { cursorKey } from './ParagraphSource.js';

/** @typedef {import('./IaAudioBook.js').default} IaAudioBook */

/**
 * The minimal audio-first reading view of issue #1580: cover, table of contents,
 * playback controls. No page images, no page turning, no BookReader chrome.
 *
 * Layout follows the mobile prototype screenshotted in the issue -- cover art
 * centred over the title, transport controls pinned to the bottom -- with the
 * paragraph being read shown between them, so the progressive chunk rendering is
 * visible rather than merely audible.
 */
export class AudioReaderView extends LitElement {
  static properties = {
    book: { type: Object },
    /** @type {AudioReaderPlayer} */
    player: { type: Object },
    showToc: { type: Boolean, state: true },
    debug: { type: Boolean },
    _tick: { type: Number, state: true },
  };

  constructor() {
    super();
    this.book = null;
    this.player = null;
    this.showToc = false;
    this.debug = false;
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

  /** @return {string} e.g. "p. 12" or "leaf 4" when the page is unnumbered */
  get _locationLabel() {
    const cursor = this.player?.cursor;
    if (!cursor) return '';
    const leaf = this.book?.leaves[cursor.leafIndex];
    return leaf?.pageNum != null ? `p. ${leaf.pageNum}` : `leaf ${cursor.leafIndex + 1}`;
  }

  _onTocJump(entry) {
    this.showToc = false;
    this.player.jumpToLeaf(entry.leafIndex);
  }

  render() {
    if (!this.book || !this.player) {
      return html`<div class="loading-screen"><div class="spinner"></div><p>Loading book…</p></div>`;
    }
    return html`
      <div class="reader">
        ${this._renderHeader()}
        ${this.showToc ? this._renderToc() : this._renderNowReading()}
        ${this._renderControls()}
        ${this.debug ? this._renderDebug() : nothing}
      </div>
    `;
  }

  _renderHeader() {
    return html`
      <header>
        <div class="book-meta">
          <div class="title" title=${this.book.title}>${this.book.title}</div>
          ${this.book.author ? html`<div class="author">${this.book.author}</div>` : nothing}
        </div>
        ${this.book.toc.length ? html`
          <button
            class="toc-toggle ${this.showToc ? 'active' : ''}"
            aria-pressed=${this.showToc}
            title="Table of contents"
            @click=${() => { this.showToc = !this.showToc; }}
          >☰</button>
        ` : nothing}
      </header>
    `;
  }

  _renderToc() {
    const currentLeaf = this.player.cursor?.leafIndex ?? 0;
    // The entry whose chapter we are inside: the last one at or before us.
    const activeIndex = this.book.toc.reduce(
      (best, entry, i) => (entry.leafIndex <= currentLeaf ? i : best), -1);

    return html`
      <nav class="toc" aria-label="Table of contents">
        <ol>
          ${this.book.toc.map((entry, i) => html`
            <li>
              <button
                class="toc-entry ${i === activeIndex ? 'current' : ''}"
                style="padding-left: ${0.75 + (entry.level || 0) * 0.75}rem"
                @click=${() => this._onTocJump(entry)}
              >
                <span class="toc-title">${[entry.label, entry.title].filter(Boolean).join(' ')}</span>
                ${entry.pagenum != null ? html`<span class="toc-page">${entry.pagenum}</span>` : nothing}
              </button>
            </li>
          `)}
        </ol>
      </nav>
    `;
  }

  _renderNowReading() {
    const player = this.player;
    const segments = player.segments;
    const waiting = player.loading || player.seeking;

    return html`
      <div class="now-reading">
        <img class="cover" src=${this.book.coverUrl} alt="Cover of ${this.book.title}" />

        <div class="paragraph ${waiting ? 'waiting' : ''}">
          ${waiting ? html`<div class="spinner" role="status" aria-label="Loading audio"></div>` : nothing}
          ${segments.length ? segments.map(segment => html`<span
                class="segment ${this._segmentClass(segment)}"
                data-kind=${segment.kind}
                data-index=${segment.index}
              >${segment.text} </span>`)
      : html`<span class="segment placeholder">…</span>`}
        </div>
      </div>
    `;
  }

  /**
   * Segments are styled by state so the progressive rendering is legible at a
   * glance: what has been read, what is being read, what is buffered and ready,
   * and what is still being synthesized.
   * @param {import('./textSegments.js').Segment} segment
   */
  _segmentClass(segment) {
    const player = this.player;
    if (segment.index < player.segmentIndex) return 'read';
    if (segment.index === player.segmentIndex) return player.loading ? 'pending current' : 'current';
    const key = `${cursorKey(player.cursor)}#${segment.index}`;
    return player.queue.isReady(key) ? 'buffered' : 'pending';
  }

  _renderControls() {
    const player = this.player;
    const buffer = player.bufferState;
    const bufferPercent = buffer.total ? Math.round((buffer.ready / buffer.total) * 100) : 0;

    return html`
      <footer>
        <div class="status">
          <span class="location">${this._locationLabel}</span>
          <span class="buffer" title="${buffer.ready} of ${buffer.total} buffered segments ready">
            <span class="buffer-bar"><span class="buffer-fill" style="width:${bufferPercent}%"></span></span>
            buffer
          </span>
        </div>

        <div class="transport">
          <button class="skip" title="Previous paragraph" aria-label="Previous paragraph"
            @click=${() => player.prev()}>⏮</button>

          <button class="play" aria-label=${player.playing ? 'Pause' : 'Play'}
            ?disabled=${player.finished}
            @click=${() => player.togglePlayPause()}>
            ${player.playing ? '❚❚' : '▶'}
          </button>

          <button class="skip" title="Next paragraph" aria-label="Next paragraph"
            @click=${() => player.next()}>⏭</button>
        </div>

        <div class="rate">
          ${[0.75, 1, 1.25, 1.5].map(rate => html`
            <button
              class="rate-option ${player.engine.rate === rate ? 'active' : ''}"
              @click=${() => { player.engine.setRate?.(rate); this._tick++; }}
            >${rate}×</button>
          `)}
        </div>
      </footer>
    `;
  }

  _renderDebug() {
    const player = this.player;
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
      display: block;
      height: 100%;
      color: #f2f2f4;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(120% 90% at 50% 0%, #2c3140 0%, #16181f 55%, #0e0f14 100%);
    }

    .reader {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-width: 30rem;
      margin: 0 auto;
      padding: 1rem 1rem 1.25rem;
      box-sizing: border-box;
      gap: 0.75rem;
    }

    header {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      flex: none;
    }

    .book-meta { min-width: 0; flex: 1; }

    .title {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .author { font-size: 0.8rem; color: #a5a8b5; margin-top: 0.15rem; }

    .toc-toggle {
      flex: none;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.6rem;
      border: 1px solid #ffffff26;
      background: #ffffff0f;
      color: inherit;
      font-size: 1rem;
      cursor: pointer;
    }
    .toc-toggle.active { background: #4c8dff; border-color: #4c8dff; }

    .now-reading {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .cover {
      flex: none;
      max-height: 40%;
      max-width: 62%;
      object-fit: contain;
      border-radius: 0.5rem;
      box-shadow: 0 1.25rem 2.5rem #0009;
      background: #ffffff14;
    }

    .paragraph {
      position: relative;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      width: 100%;
      padding: 0.9rem;
      box-sizing: border-box;
      border-radius: 0.75rem;
      background: #ffffff0a;
      border: 1px solid #ffffff14;
      font-size: 1rem;
      line-height: 1.65;
    }
    .paragraph.waiting { color: #8f93a3; }

    /* Progressive rendering states. */
    .segment { transition: color 120ms ease, background-color 120ms ease; }
    .segment.read { color: #7e8394; }
    .segment.current {
      color: #fff;
      background: #4c8dff33;
      box-shadow: 0 0 0 0.15rem #4c8dff33;
      border-radius: 0.2rem;
    }
    .segment.buffered { color: #cdd0da; }
    .segment.pending { color: #5f6373; font-style: italic; }
    .segment.placeholder { color: #5f6373; }

    .spinner {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff33;
      border-top-color: #4c8dff;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .toc {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      border-radius: 0.75rem;
      background: #ffffff0a;
      border: 1px solid #ffffff14;
    }
    .toc ol { list-style: none; margin: 0; padding: 0.35rem; }
    .toc-entry {
      display: flex;
      gap: 0.5rem;
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: 0.9rem;
      text-align: left;
      cursor: pointer;
    }
    .toc-entry:hover { background: #ffffff12; }
    .toc-entry.current { background: #4c8dff26; color: #cfe0ff; }
    .toc-title { flex: 1; }
    .toc-page { color: #8f93a3; font-variant-numeric: tabular-nums; }

    footer { flex: none; display: flex; flex-direction: column; gap: 0.6rem; }

    .status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #8f93a3;
    }
    .buffer { display: flex; align-items: center; gap: 0.4rem; }
    .buffer-bar {
      display: inline-block;
      width: 4.5rem;
      height: 0.25rem;
      border-radius: 0.25rem;
      background: #ffffff1f;
      overflow: hidden;
    }
    .buffer-fill { display: block; height: 100%; background: #4c8dff; transition: width 160ms ease; }

    .transport {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }

    .transport button {
      border: 0;
      background: transparent;
      color: #f2f2f4;
      cursor: pointer;
      font-size: 1.35rem;
      line-height: 1;
      padding: 0.4rem;
    }
    .transport button:hover { color: #fff; }

    .play {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50% !important;
      background: #4c8dff !important;
      font-size: 1.2rem !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .play:disabled { background: #3a3f4d !important; color: #7e8394; cursor: default; }

    .rate { display: flex; justify-content: center; gap: 0.4rem; }
    .rate-option {
      border: 1px solid #ffffff1f;
      background: transparent;
      color: #a5a8b5;
      border-radius: 0.4rem;
      padding: 0.15rem 0.45rem;
      font-size: 0.7rem;
      cursor: pointer;
    }
    .rate-option.active { background: #ffffff1f; color: #fff; }

    .debug {
      flex: none;
      max-height: 11rem;
      overflow-y: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.65rem;
      color: #9aa0b0;
      background: #0008;
      border: 1px solid #ffffff14;
      border-radius: 0.5rem;
      padding: 0.5rem;
    }
    .debug-row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
    .debug .warn { color: #ffcc66; }
    .debug-plan { list-style: none; margin: 0; padding: 0; }
    .debug-plan li { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .debug-plan li.ready::before { content: "● "; color: #6ee7a0; }
    .debug-plan li.pending::before { content: "○ "; color: #6b7080; }

    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 1rem;
      color: #a5a8b5;
    }
    .loading-screen .spinner { position: static; width: 1.5rem; height: 1.5rem; }
  `;
}

customElements.define('ia-audio-reader', AudioReaderView);
