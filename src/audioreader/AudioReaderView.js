import { LitElement, html, css, nothing } from 'lit';
import AudioReaderPlayer from './AudioReaderPlayer.js';
import ParagraphSource from './ParagraphSource.js';
import { cursorKey } from './ParagraphSource.js';

/** @typedef {import('./IaAudioBook.js').default} IaAudioBook */

/** The Internet Archive "pantheon" mark, from @internetarchive/icon-ia-logo. */
const IA_LOGO_PATH = 'M26.6666667,28.6046512 L26.6666667,30 L0,30 L0.000283687943,28.6046512 L26.6666667,28.6046512 Z M25.6140351,26.5116279 L25.6140351,28.255814 L1.05263158,28.255814 L1.05263158,26.5116279 L25.6140351,26.5116279 Z M3.62469203,7.6744186 L3.91746909,7.82153285 L4.0639977,10.1739544 L4.21052632,13.9963932 L4.21052632,17.6725617 L4.0639977,22.255044 L4.03962296,25.3421929 L3.62469203,25.4651163 L2.16024641,25.4651163 L1.72094074,25.3421929 L1.55031755,22.255044 L1.40350877,17.6970339 L1.40350877,14.0211467 L1.55031755,10.1739544 L1.68423854,7.80887484 L1.98962322,7.6744186 L3.62469203,7.6744186 Z M24.6774869,7.6744186 L24.9706026,7.82153285 L25.1168803,10.1739544 L25.2631579,13.9963932 L25.2631579,17.6725617 L25.1168803,22.255044 L25.0927809,25.3421929 L24.6774869,25.4651163 L23.2130291,25.4651163 L22.7736357,25.3421929 L22.602418,22.255044 L22.4561404,17.6970339 L22.4561404,14.0211467 L22.602418,10.1739544 L22.7369262,7.80887484 L23.0420916,7.6744186 L24.6774869,7.6744186 Z M9.94042303,7.6744186 L10.2332293,7.82153285 L10.3797725,10.1739544 L10.5263158,13.9963932 L10.5263158,17.6725617 L10.3797725,22.255044 L10.3556756,25.3421929 L9.94042303,25.4651163 L8.47583122,25.4651163 L8.0362015,25.3421929 L7.86556129,22.255044 L7.71929825,17.6970339 L7.71929825,14.0211467 L7.86556129,10.1739544 L8.00005604,7.80887484 L8.30491081,7.6744186 L9.94042303,7.6744186 Z M18.0105985,7.6744186 L18.3034047,7.82153285 L18.449948,10.1739544 L18.5964912,13.9963932 L18.5964912,17.6725617 L18.449948,22.255044 L18.425851,25.3421929 L18.0105985,25.4651163 L16.5460067,25.4651163 L16.1066571,25.3421929 L15.9357367,22.255044 L15.7894737,17.6970339 L15.7894737,14.0211467 L15.9357367,10.1739544 L16.0702315,7.80887484 L16.3753664,7.6744186 L18.0105985,7.6744186 Z M25.6140351,4.53488372 L25.6140351,6.97674419 L1.05263158,6.97674419 L1.05263158,4.53488372 L25.6140351,4.53488372 Z M13.0806755,0 L25.9649123,2.93331338 L25.4484139,3.8372093 L0.771925248,3.8372093 L0,3.1041615 L13.0806755,0 Z';

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
    /** Dark theme; reflected to the host so CSS can flip the palette. */
    darkMode: { type: Boolean, reflect: true },
    _tick: { type: Number, state: true },
    /** Which header popover is open: 'overflow' | 'sleep' | null. */
    _openMenu: { state: true },
    /** Active sleep timer: {pages, startLeaf}, or null. */
    _sleep: { state: true },
    /** Positions the patron marked with the clap button. */
    _likes: { state: true },
  };

  /** Sleep-timer presets, in pages. */
  static SLEEP_OPTIONS = [1, 2, 5, 10, 20];
  /** Playback-speed presets. */
  static RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

  constructor() {
    super();
    this.book = null;
    this.player = null;
    this.debug = false;
    this.showText = false;
    this.readAlong = false;
    this.darkMode = readStore('audioreader:dark', false) === true;
    /** Bumped to re-render on player state changes. */
    this._tick = 0;
    /** While dragging the page bar: the previewed position, 0..100, else null. */
    this._dragPercent = null;
    this._dragging = false;
    this._openMenu = null;
    this._sleep = null;
    /** @type {Array<{id: string, leafIndex: number, wordPercent: number}>} */
    this._likes = [];
    /** Segment key last scrolled into view, so we scroll once per change. */
    this._lastScrolledKey = null;
  }

  /**
   * @param {IaAudioBook} book
   * @param {Object} engine
   * @param {Object} [opts]
   */
  async attach(book, engine, opts = {}) {
    this.book = book;
    // Older marks were stored without a count; treat them as a single clap.
    this._likes = (readStore(`audioreader:likes:${book.identifier}`, []) || [])
      .map(like => ({ count: 1, ...like }));

    const source = new ParagraphSource({
      fetchPageChunks: leafIndex => book.fetchPageChunks(leafIndex),
      numLeafs: book.numLeafs,
    });

    this.player = new AudioReaderPlayer({
      source, engine,
      onChange: () => { this._tick++; },
      onParagraphChange: cursor => this._checkSleepTimer(cursor),
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

  updated() {
    // Follow the reading: when the segment being read changes, bring it into view
    // in the read-along (or reading) panel so the highlight never scrolls off.
    const key = this.player?.currentKey;
    if (key && key !== this._lastScrolledKey) {
      this._lastScrolledKey = key;
      this._scrollCurrentIntoView();
    }
  }

  /** @private Centre the current sentence within its fixed-height scroll panel. */
  _scrollCurrentIntoView() {
    const current = this.renderRoot?.querySelector('.ra-segment.current, .segment.current');
    const panel = current?.closest('.readalong, .reading');
    if (!current || !panel) return;
    const target = current.offsetTop - (panel.clientHeight - current.offsetHeight) / 2;
    panel.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }

  /**
   * @private
   * Stop playback once the sleep timer's page budget is used up. Fired on every
   * paragraph change, so it catches both continuous reading and seeks.
   * @param {{leafIndex: number}} cursor
   */
  _checkSleepTimer(cursor) {
    if (!this._sleep) return;
    if (cursor.leafIndex - this._sleep.startLeaf >= this._sleep.pages) {
      this.player.pause();
      this._sleep = null;
    }
    this._tick++;
  }

  /** @private Toggle dark theme and remember the choice. */
  _toggleDark() {
    this.darkMode = !this.darkMode;
    writeStore('audioreader:dark', this.darkMode);
  }

  /** @private @param {'overflow'|'sleep'} menu */
  _toggleMenu(menu) {
    this._openMenu = this._openMenu === menu ? null : menu;
  }

  /** @private @param {number} rate */
  _setRate(rate) {
    this.player.engine.setRate?.(rate);
    this._tick++;
  }

  /** @private @param {number|null} pages null clears the timer */
  _setSleep(pages) {
    this._sleep = pages ? { pages, startLeaf: this.player.cursor?.leafIndex ?? 0 } : null;
    this._openMenu = null;
  }

  /** @return {string|null} a stable id for the segment being read, or null */
  get _likeIdHere() {
    return this.player?.currentKey ?? null;
  }

  /** @return {number} how many claps the current spot already has */
  get _clapsHere() {
    const id = this._likeIdHere;
    return (id && this._likes.find(like => like.id === id)?.count) || 0;
  }

  /**
   * @private
   * Add a clap at the current reading position -- additive, like Medium: every
   * press bumps the count. Marks are kept per book in localStorage and drawn as
   * ticks on both scrubbers, heavier where a spot has more claps.
   */
  _addClap() {
    const id = this._likeIdHere;
    if (!id) return;

    const index = this._likes.findIndex(like => like.id === id);
    let count;
    if (index >= 0) {
      count = (this._likes[index].count || 1) + 1;
      this._likes = this._likes.map((like, i) => (i === index ? { ...like, count } : like));
    } else {
      count = 1;
      this._likes = [...this._likes, {
        id,
        leafIndex: this.player.cursor.leafIndex,
        wordPercent: this.player.pageWordProgress.percent,
        count,
      }];
    }
    writeStore(`audioreader:likes:${this.book.identifier}`, this._likes);
    this._tick++;
    this._playClapAnimation();
  }

  /**
   * @private
   * Pop the glyph and send a clap bursting upward on every press. No count is
   * shown -- the feedback is the loudness of the motion, not a number.
   */
  _playClapAnimation() {
    this.updateComplete.then(() => {
      // Pop the glyph (not the button, whose transform holds its vertical centering).
      restartAnimation(this.renderRoot?.querySelector('.clap-glyph'), 'pop');
      restartAnimation(this.renderRoot?.querySelector('.clap-float'), 'run');
    });
  }

  /** @return {number} a like's position along the whole-book page bar, 0..100 */
  _likePagePercent(like) {
    if (!this.book?.numLeafs || this.book.numLeafs < 2) return 0;
    return Math.min(100, (like.leafIndex / (this.book.numLeafs - 1)) * 100);
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
        ${this._renderMenu()}
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
    const sleepActive = !!this._sleep;
    const clones = /Pocket|Hybrid/.test(this.player.engine.name || '');

    return html`
      <header>
        <a
          class="back"
          href="https://archive.org/details/${this.book.identifier}"
          title="Back to the item"
          aria-label="Back to the item"
        >
          <svg class="ia-logo" viewBox="0 0 27 30" aria-hidden="true">
            <path d=${IA_LOGO_PATH}></path>
          </svg>
        </a>
        ${this.readAlong
    ? html`<img class="mini-cover" src=${this.book.coverUrl} alt="Cover of ${this.book.title}" />`
    : nothing}
        <h1 class="title" title=${this.book.title}>${this.book.title}</h1>
        <button
          class="icon-toggle ${this.readAlong ? 'active' : ''}"
          title="Read along"
          aria-label="Read along"
          aria-pressed=${this.readAlong ? 'true' : 'false'}
          @click=${() => { this.readAlong = !this.readAlong; }}
        >📖</button>
        <button
          class="icon-toggle ${sleepActive ? 'active' : ''}"
          title=${sleepActive ? `Stops in ${this._sleepPagesLeft} page(s)` : 'Sleep timer'}
          aria-label="Sleep timer"
          aria-pressed=${sleepActive ? 'true' : 'false'}
          @click=${() => this._toggleMenu('sleep')}
        >🕐${sleepActive ? html`<span class="badge">${this._sleepPagesLeft}</span>` : nothing}</button>
        <button
          class="icon-toggle ${this.darkMode ? 'active' : ''}"
          title="Dark mode"
          aria-label="Dark mode"
          aria-pressed=${this.darkMode ? 'true' : 'false'}
          @click=${() => this._toggleDark()}
        >${this.darkMode ? '☀️' : '🌙'}</button>
        ${clones ? html`
          <button
            class="icon-toggle ${this._openMenu === 'overflow' ? 'active' : ''}"
            title="Voice"
            aria-label="Voice"
            aria-haspopup="true"
            aria-expanded=${this._openMenu === 'overflow' ? 'true' : 'false'}
            @click=${() => this._toggleMenu('overflow')}
          >⋯</button>` : nothing}
      </header>
    `;
  }

  /** @return {number} pages remaining before the sleep timer fires */
  get _sleepPagesLeft() {
    if (!this._sleep) return 0;
    const used = (this.player?.cursor?.leafIndex ?? 0) - this._sleep.startLeaf;
    return Math.max(0, this._sleep.pages - used);
  }

  /**
   * The header popovers: the overflow menu (voice + speed) and the sleep-timer
   * menu. A transparent backdrop closes whichever is open on an outside click.
   */
  _renderMenu() {
    if (!this._openMenu) return nothing;
    const panel = this._openMenu === 'overflow'
      ? this._renderOverflowPanel()
      : this._renderSleepPanel();

    return html`
      <div class="menu-backdrop" @click=${() => { this._openMenu = null; }}></div>
      <div class="menu ${this._openMenu}" role="menu">${panel}</div>
    `;
  }

  _renderOverflowPanel() {
    // Speed lives in the transport now; the overflow menu holds just the voice.
    return html`
      <div class="menu-group">
        <div class="menu-label">Voice</div>
        ${this._renderVoicePicker()}
      </div>
    `;
  }

  _renderSleepPanel() {
    const current = this._sleep?.pages ?? 0;
    return html`
      <div class="menu-group">
        <div class="menu-label">Stop after…</div>
        <div class="menu-rates">
          <button class="menu-rate ${current === 0 ? 'current' : ''}"
            @click=${() => this._setSleep(null)}>Off</button>
          ${AudioReaderView.SLEEP_OPTIONS.map(pages => html`
            <button
              class="menu-rate ${current === pages ? 'current' : ''}"
              @click=${() => this._setSleep(pages)}
            >${pages} pg</button>`)}
        </div>
      </div>
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
          ${this._renderLikeMarks('page')}
          <div class="knob" style="left:${pagePercent}%"></div>
        </div>
        <div
          class="track realtime"
          title=${`Reading progress on this page — ${word.read} of ${word.total} words. ${bufferTitle}`}
        >
          <div class="track-fill realtime-fill" style="width:${word.percent}%"></div>
          ${this._renderLikeMarks('realtime')}
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
  async _onPagePointerUp(event) {
    if (!this._dragging) return;
    const fraction = this._pageBarFraction(event);
    this._dragging = false;
    // Hold the knob at the chosen spot through the async jump. Clearing it now
    // would snap the knob back to the old page until jumpToLeaf resolved, then
    // forward again -- the glitch a plain click used to show.
    this._dragPercent = fraction * 100;
    this._tick++;
    await this._seekPageToFraction(fraction);
    this._dragPercent = null;
    this._tick++;
  }

  /**
   * Jump to the page at `fraction` through the book. Extracted from the pointer
   * handler so the click-to-page mapping is unit-testable without a layout.
   * @param {number} fraction 0..1 along the page bar
   * @return {Promise<void>}
   */
  _seekPageToFraction(fraction) {
    const clamped = Math.min(1, Math.max(0, fraction));
    const leaf = Math.round(clamped * (this.book.numLeafs - 1));
    // Lands on the nearest page at/after `leaf` that has text; keeps play state.
    return this.player.jumpToLeaf(leaf);
  }

  _renderTransport() {
    const player = this.player;
    const rate = player.engine.rate ?? 1;
    return html`
      <div class="transport">
        <button
          class="rate"
          title="Reading speed"
          aria-label="Reading speed"
          @click=${() => this._cycleRate()}
        >${rate}×</button>

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

        <button
          class="clap ${this._clapsHere ? 'active' : ''}"
          title="Clap for this spot"
          aria-label="Clap for this spot"
          @click=${() => this._addClap()}
        >
          <span class="clap-glyph">👏</span>
          <span class="clap-float" aria-hidden="true">👏</span>
        </button>
      </div>
    `;
  }

  /** @private Advance the reading speed to the next preset, wrapping around. */
  _cycleRate() {
    const rates = AudioReaderView.RATES;
    const current = this.player.engine.rate ?? 1;
    const index = rates.indexOf(current);
    this._setRate(rates[(index + 1) % rates.length]);
  }

  /**
   * Ticks on a scrubber marking clapped-for spots, heavier where a spot has more
   * claps (taller and more opaque, Medium-style weighting).
   */
  _renderLikeMarks(which) {
    if (!this._likes.length) return nothing;
    const currentLeaf = this.player?.cursor?.leafIndex;
    const marks = which === 'page'
      ? this._likes.map(like => ({ percent: this._likePagePercent(like), count: like.count || 1 }))
      // The real-time bar only spans the current page, so only this page's marks.
      : this._likes
        .filter(like => like.leafIndex === currentLeaf)
        .map(like => ({ percent: like.wordPercent, count: like.count || 1 }));

    return marks.map(({ percent, count }) => {
      const strength = Math.min(count, 6);
      const opacity = Math.min(1, 0.4 + strength * 0.1);
      const height = 0.5 + strength * 0.08;
      return html`<div
        class="like-mark"
        title=${`${count} clap${count === 1 ? '' : 's'}`}
        style="left:${percent}%; opacity:${opacity}; height:${height}rem"
      ></div>`;
    });
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
    // After the bytes land there is still real work -- building the ONNX sessions,
    // encoding the voice, a warm-up pass -- so at 100% say "preparing", and keep a
    // spinner going the whole time so a stalled-looking bar never reads as done.
    const downloaded = percent >= 100;

    return html`
      <div class="engine-status" role="status">
        <div class="status-head">
          <span class="status-spinner" aria-hidden="true"></span>
          <span class="status-text">${downloaded
    ? html`Preparing voice…`
    : html`Loading voice — ${mb(loaded)} of ${mb(total)} MB`}${
  engine.fast ? html`. Reading in the preview voice meanwhile.` : nothing}</span>
        </div>
        <span class="track thin ${downloaded ? 'indeterminate' : ''}">
          <span class="track-fill" style=${downloaded ? '' : `width:${percent}%`}></span>
        </span>
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
      --on-control: #ffffff;
      --track: #d9d1c2;
      --track-soft: #e4ddcf;
      --highlight: #ffe9a8;
      --highlight-ink: #241f1b;
      --hover-border: #d6ccbb;
      --hover-bg: #faf7f0;

      display: block;
      height: 100%;
      background: var(--page);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* Dark theme: a warm-neutral dark palette, flipped when the host carries the
       reflected darkmode attribute. The control tone inverts (light button on a
       dark page), so its text token inverts with it. */
    :host([darkmode]) {
      --page: #15171c;
      --ink: #e9e6e0;
      --ink-soft: #988f82;
      --card: #1e2128;
      --rule: #2a2e36;
      --control: #e7e2d8;
      --on-control: #15171c;
      --track: #2b2f37;
      --track-soft: #23262d;
      --highlight: #46391c;
      --highlight-ink: #efe4c9;
      --hover-border: #3a3f49;
      --hover-bg: #20242b;
    }

    .reader {
      position: relative;
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
      gap: 0.4rem;
      padding: 0.75rem 1.25rem 1rem;
    }
    .title { margin-right: 0.35rem; }

    .back {
      flex: none;
      display: inline-flex;
      align-items: center;
      color: var(--ink);
      text-decoration: none;
      padding: 0.25rem;
      opacity: 0.85;
    }
    .back:hover { opacity: 1; }
    .ia-logo {
      width: 1.1rem;
      height: 1.25rem;
      display: block;
      fill: currentColor;
    }

    /* The small cover shown beside the title while reading along. */
    .mini-cover {
      flex: none;
      width: 1.9rem;
      height: 2.5rem;
      object-fit: cover;
      border-radius: 0.15rem;
      box-shadow: 0 0.1rem 0.3rem #00000022;
      background: #e6ded0;
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

    /* Reading speed sits at the left edge of the transport, mirroring the clap. */
    .rate {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      min-width: 2.6rem;
      height: 1.9rem;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: transparent;
      color: var(--ink-soft);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .rate:hover { color: var(--ink); border-color: var(--hover-border); }

    .icon-toggle {
      position: relative;
      flex: none;
      width: 1.9rem;
      height: 1.9rem;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: transparent;
      color: var(--ink-soft);
      font-size: 0.9rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
    }
    .icon-toggle:hover { border-color: var(--hover-border); }

    /* Small count badge on the sleep-timer button. */
    .badge {
      position: absolute;
      top: -0.35rem;
      right: -0.35rem;
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.2rem;
      box-sizing: border-box;
      border-radius: 999px;
      background: var(--control);
      color: var(--on-control);
      font-size: 0.6rem;
      line-height: 1rem;
      font-variant-numeric: tabular-nums;
    }

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
    .voice:hover { color: var(--ink); border-color: var(--hover-border); }
    /* "On" is a soft tinted pill with a stronger border and full-contrast glyph --
       not a hard dark fill, which read as a black box behind the emoji. */
    .icon-toggle.active {
      background: var(--hover-bg);
      border-color: var(--control);
      color: var(--ink);
    }

    /* Header popovers (overflow = voice + speed; sleep = page budget). */
    .menu-backdrop {
      position: fixed;
      inset: 0;
      z-index: 5;
    }
    .menu {
      position: absolute;
      z-index: 6;
      top: 3.2rem;
      right: 1.25rem;
      min-width: 12rem;
      max-width: calc(100% - 2.5rem);
      padding: 0.6rem;
      border: 1px solid var(--rule);
      border-radius: 0.6rem;
      background: var(--card);
      box-shadow: 0 0.4rem 1.2rem #00000026;
    }
    .menu-group + .menu-group { margin-top: 0.7rem; }
    .menu-label {
      margin: 0 0 0.4rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ink-soft);
    }
    .menu .voice { max-width: 100%; width: 100%; }
    .menu-rates { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .menu-rate {
      flex: none;
      padding: 0.3rem 0.55rem;
      border: 1px solid var(--rule);
      border-radius: 999px;
      background: transparent;
      color: var(--ink);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .menu-rate:hover { border-color: var(--hover-border); }
    .menu-rate.current {
      background: var(--control);
      border-color: var(--control);
      color: var(--on-control);
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
      background: var(--track);
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
      background: var(--track);
    }
    .track.page.dragging { cursor: grabbing; }

    /* The real-time bar is read-only and subtle, and glides between sentence
       updates so it reads as continuous progress rather than stepping. */
    .track.realtime {
      height: 0.12rem;
      margin-top: 0.3rem;
      background: var(--track-soft);
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
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.15rem;
      margin: 1.35rem 0 1.75rem;
    }

    /* The clap/mark control sits at the right edge so the play control stays
       centred. Greyed out until the current spot is marked. */
    .clap {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      border: 0;
      background: transparent;
      font-size: 1.4rem;
      line-height: 1;
      padding: 0.3rem;
      cursor: pointer;
      /* Default to what used to be the hover state -- the control was too faint. */
      opacity: 0.85;
    }
    .clap:hover { opacity: 1; }
    .clap.active { opacity: 1; }

    .clap-glyph { display: inline-block; }
    /* A loud pop: overshoots hard and recoils, with a little twist. */
    .clap-glyph.pop { animation: clap-pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1); }
    @keyframes clap-pop {
      0% { transform: scale(1) rotate(0); }
      25% { transform: scale(1.75) rotate(-12deg); }
      50% { transform: scale(0.8) rotate(8deg); }
      75% { transform: scale(1.25) rotate(-3deg); }
      100% { transform: scale(1) rotate(0); }
    }

    /* A clap bursting upward on every press -- feedback by motion, not a number. */
    .clap-float {
      position: absolute;
      left: 50%;
      top: -0.1rem;
      transform: translate(-50%, 0);
      font-size: 1.1rem;
      opacity: 0;
      pointer-events: none;
    }
    .clap-float.run { animation: clap-float 0.7s ease-out; }
    @keyframes clap-float {
      0% { opacity: 0; transform: translate(-50%, 0) scale(0.7); }
      25% { opacity: 0.9; }
      100% { opacity: 0; transform: translate(-50%, -2.1rem) scale(1.3) rotate(12deg); }
    }

    /* Faint ticks on the scrubbers marking clapped-for spots. */
    .like-mark {
      position: absolute;
      top: 50%;
      width: 2px;
      height: 0.7rem;
      transform: translate(-50%, -50%);
      border-radius: 1px;
      background: #e0a44a;
      opacity: 0.6;
      pointer-events: none;
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
      color: var(--on-control);
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
    .chapters li + li { border-top: 1px solid var(--rule); }

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
    .chapter:hover { background: var(--hover-bg); }
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
    .status-head { display: flex; align-items: center; gap: 0.45rem; }
    .status-spinner {
      flex: none;
      width: 0.8rem;
      height: 0.8rem;
      border: 2px solid #e0d6c2;
      border-top-color: #9a7b3f;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }
    /* Once the bytes are in, the work left has no measurable percentage, so the
       bar sweeps instead of filling -- it must not look parked at 100%. */
    .track.thin.indeterminate { overflow: hidden; }
    .track.thin.indeterminate .track-fill {
      width: 40%;
      animation: indeterminate 1.1s ease-in-out infinite;
    }
    @keyframes indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    .reading {
      position: relative;
      margin: 0 0 1.25rem;
      padding: 0.9rem 1rem;
      border: 1px solid var(--rule);
      border-radius: 0.6rem;
      background: var(--card);
      font-size: 0.95rem;
      line-height: 1.65;
    }
    .segment.read { color: #a49a8c; }
    .segment.current { background: var(--highlight); color: var(--highlight-ink); border-radius: 0.15rem; }
    .segment.buffered { color: var(--ink); }
    .segment.pending { color: #b3a897; font-style: italic; }
    .segment.placeholder { color: #b3a897; }

    /* Read-along panel: the cover's place, giving the current sentence room to be
       read by eye. Larger type than the debug text view, same state colours. */
    .readalong {
      position: relative;
      /* Fixed height so switching into read-along -- or a sentence changing length
         -- does not shift the controls below it. Overflows scroll. */
      height: 13rem;
      box-sizing: border-box;
      overflow-y: auto;
      margin: 0.5rem 0 0;
      padding: 1.1rem 1.15rem;
      border: 1px solid var(--rule);
      border-radius: 0.6rem;
      background: var(--card);
      font-size: 1.25rem;
      line-height: 1.7;
    }
    .readalong.waiting { opacity: 0.7; }
    .ra-segment { color: var(--ink-soft); opacity: 0.65; transition: color 0.2s, opacity 0.2s; }
    .ra-segment.read { color: var(--ink-soft); opacity: 0.85; }
    .ra-segment.current {
      color: var(--highlight-ink);
      background: var(--highlight);
      opacity: 1;
      border-radius: 0.2rem;
      box-decoration-break: clone;
      -webkit-box-decoration-break: clone;
    }
    .ra-segment.buffered { color: var(--ink-soft); opacity: 1; }
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

/**
 * Retrigger a one-shot CSS animation on an element by removing its class, forcing
 * a reflow, and adding it back -- the standard way to replay an animation.
 * @param {Element|null} el
 * @param {string} cls
 */
function restartAnimation(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

/**
 * Read a JSON value from localStorage, tolerating private-mode and quota errors.
 * @param {string} key
 * @param {*} fallback
 * @return {*}
 */
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {*} value
 */
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota: a remembered preference is a convenience, not
    // something worth throwing over.
  }
}

customElements.define('ia-audio-reader', AudioReaderView);
