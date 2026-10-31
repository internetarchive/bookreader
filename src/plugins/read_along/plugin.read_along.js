// @ts-check
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { toISO6391 } from '../tts/utils.js';
import { ReadAlongAligner, normalizeWord, tokenize } from './aligner.js';
import { SoundscapeView } from './soundscape_view.js';
import { MAX_CUE_JUMP, SoundscapePlayer, classStateAt, compareCueToWord, loopStateAt, resolveCues } from './soundscape.js';

const BookReader = /** @type {typeof import('../../BookReader').default} */(window.BookReader);

/** @typedef {{ l: number, r: number, b: number, t: number }} Box */

/**
 * @typedef {object} BookWord
 * @property {string} norm normalized text used for matching
 * @property {string} text
 * @property {number} pageIndex
 * @property {number} indexInPage
 * @property {string} lineKey unique per OCR line
 * @property {Box[]} boxes more than one when hyphenated across lines
 */

/** Seconds to fade sounds in/out when the reader jumps */
const SEEK_FADE = 1.5;

/** How far past the displayed pages to look for the next page with text */
const MAX_LOOKAHEAD_PAGES = 4;
/** Pages with fewer words (e.g. chapter titles, captions) don't end the lookahead */
const MIN_LOOKAHEAD_WORDS = 20;

// In Chromium these are the same constructor
const SpeechRecognitionImpl = window.SpeechRecognition || /** @type {any} */(window).webkitSpeechRecognition;

/** Recognition events worth logging, besides result/error/end which are handled */
const LIFECYCLE_EVENTS = ['start', 'audiostart', 'soundstart', 'speechstart', 'speechend', 'soundend', 'audioend', 'nomatch'];

/** Errors that just mean "nothing heard yet"; recognition ends and is restarted */
const ROUTINE_ERRORS = ['no-speech', 'aborted'];

/** After this many sessions in a row without results, tell the user */
const EMPTY_SESSIONS_WARNING = 3;

/**
 * Highlights the line and word being read aloud by the user, using the
 * browser's speech recognition and the OCR text layer.
 */
export class ReadAlongPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /** Show the recognized text, match details and recognition events while listening */
    debug: /[?&]readAlongDebug\b/.test(location.search),
    /** Ask the browser to recognize on-device, where supported */
    processLocally: false,
    /** URL of a soundscape JSON for the book (see soundscape.js); sound cues fire as the reader reads past them */
    soundscapeUrl: null,
  }

  active = false;
  /** @type {any} */
  recognition = null;
  aligner = new ReadAlongAligner();
  /** @type {BookWord[]} The loaded pages' words, in reading order */
  words = [];
  /** @type {Map<number, BookWord[]>} */
  pageWords = new Map();
  /** @type {BookWord | null} */
  currentWord = null;
  /** @type {{ [pageIndex: number]: { lines: Box[], words: Box[] } }} */
  _boxesByIndex = {};
  /** Recognized text of the recognition sessions before the current one */
  _priorTranscript = '';
  /** Main status message, shown above the recognition diagnostics */
  _statusHtml = '';
  /** @type {string[]} Recent recognition events, for debugging */
  _recEvents = [];
  _recInfo = '';
  /** Recognition sessions in a row that ended without any result */
  _emptySessions = 0;
  /** @type {ReturnType<typeof setTimeout>} */
  _restartTimer = null;
  /** @type {string | null} Language to recognize, after the preferred one was rejected */
  _langOverride = null;
  /** @type {import('./soundscape.js').SoundscapeSpec | null} */
  soundscape = null;
  /** @type {SoundscapePlayer | null} */
  soundscapePlayer = null;
  /** @type {SoundscapeView | null} */
  soundscapeView = null;
  /** @type {Map<number, Promise<BookWord[]>>} Words of pages loaded for the soundscape view */
  _wordsCache = new Map();
  /** @type {import('./soundscape.js').ResolvedCue[]} Cues on the loaded pages */
  cues = [];
  _lastCueText = '';

  static isSupported() {
    return !!SpeechRecognitionImpl;
  }

  /** @override */
  init() {
    if (!this.options.enabled) return;
    if (this.options.soundscapeUrl) this.loadSoundscape(this.options.soundscapeUrl);
    this.br.on(BookReader.eventNames.pageChanged, () => {
      if (this.active) this.loadPages();
    });
  }

  /**
   * @override
   * @param {JQuery<HTMLElement>} $navBar
   */
  extendNavBar($navBar) {
    if (!this.options.enabled || !ReadAlongPlugin.isSupported()) return;
    this.$button = $(`<li>
        <button class="BRicon read-along js-tooltip" title="Read along">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/>
          </svg>
          <span class="BRtooltip">Read along</span>
        </button>
      </li>`);
    this.$button.find('button').on('click', () => {
      this.toggle();
      return false;
    });
    // Shown once a soundscape has loaded
    this.$viewButton = $(`<li${this.soundscape ? '' : ' style="display: none"'}>
        <button class="BRicon read-along-view js-tooltip" title="Show soundscape">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="currentColor" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
          </svg>
          <span class="BRtooltip">Show soundscape</span>
        </button>
      </li>`);
    this.$viewButton.find('button').on('click', () => {
      this.soundscapeView?.toggle();
      this.$viewButton.find('button').toggleClass('active', !!this.soundscapeView?.active);
      return false;
    });
    const $zoomOut = $navBar.find('.BRcontrols .BRicon.zoom_out').closest('li');
    if ($zoomOut.length) this.$button.add(this.$viewButton).insertBefore($zoomOut);
    else $navBar.find('.BRcontrols').append(this.$button, this.$viewButton);
  }

  /**
   * @override
   * @param {import('../../BookReader/PageContainer.js').PageContainer} pageContainer
   */
  _configurePageContainer(pageContainer) {
    const boxes = pageContainer.page && this._boxesByIndex[pageContainer.page.index];
    if (this.active && boxes) {
      this._renderBoxes(pageContainer.page, pageContainer.$container[0], boxes);
    }
    if (this.soundscapeView?.active && pageContainer.page) {
      this.soundscapeView.render(pageContainer.$container[0]);
    }
  }

  /**
   * Words of any page, whether or not read-along has it loaded
   * @param {number} pageIndex
   * @returns {Promise<BookWord[]>}
   */
  async getPageWords(pageIndex) {
    if (this.pageWords.has(pageIndex)) return this.pageWords.get(pageIndex);
    if (!this._wordsCache.has(pageIndex)) this._wordsCache.set(pageIndex, this._loadPageWords(pageIndex));
    return this._wordsCache.get(pageIndex);
  }

  /**
   * @param {string} url
   */
  async loadSoundscape(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      this.soundscape = await res.json();
      this.soundscapePlayer = new SoundscapePlayer(this.soundscape, this.br.refs.$br[0]);
      this.soundscapeView = new SoundscapeView(this);
      this.$viewButton?.show();
    } catch (e) {
      console.warn('ReadAlong: failed to load soundscape', url, e);
    }
  }

  toggle() {
    if (this.active) this.stop();
    else this.start();
  }

  async start() {
    if (this.active) return;
    // Still synchronous with the click, so audio is allowed to start
    this.soundscapePlayer?.unlock();
    this.br.plugins.tts?.ttsEngine?.playing && this.br.plugins.tts.stop();
    this.br.plugins.autoplay?.stop();
    if (this.br.mode == this.br.constModeThumb) this.br.switchMode(this.br.constMode1up);

    this.active = true;
    this.$button?.find('button').addClass('active');
    this._renderStatus('Loading text…');
    this.aligner.pos = -1;
    this.currentWord = null;
    await this.loadPages();
    this._startRecognition();
  }

  stop() {
    this.active = false;
    this.$button?.find('button').removeClass('active');
    clearTimeout(this._restartTimer);
    this.recognition?.abort();
    this.recognition = null;
    this.soundscapePlayer?.stopAll(1);
    this.soundscapePlayer?.applyClassState(new Set());
    this._removeHighlights();
    this.$status?.remove();
    this.$status = null;
    this._statusHtml = '';
    this._recInfo = '';
  }

  _startRecognition() {
    const rec = new SpeechRecognitionImpl();
    rec.lang = this._recognitionLang();
    rec.continuous = true;
    rec.interimResults = true;
    if (this.options.processLocally && 'processLocally' in rec) rec.processLocally = true;
    this._priorTranscript = '';
    this._emptySessions = 0;
    this._recEvents = [];
    this._recInfo = `${SpeechRecognitionImpl.name}, lang ${rec.lang}` + (rec.processLocally ? ', on-device' : '');
    console.log(`ReadAlong: using ${this._recInfo}`);

    let sessionTranscript = '';
    let sessionHasResults = false;
    for (const type of LIFECYCLE_EVENTS) {
      rec.addEventListener(type, () => this._logRecEvent(type));
    }
    rec.onstart = () => {
      sessionTranscript = '';
      sessionHasResults = false;
    };
    this._renderStatus('Listening…');
    rec.onresult = (/** @type {any} */ ev) => {
      if (!sessionHasResults) this._logRecEvent('result');
      sessionHasResults = true;
      if (this._emptySessions >= EMPTY_SESSIONS_WARNING) this._renderStatus('Listening…');
      this._emptySessions = 0;
      const results = Array.from(ev.results);
      sessionTranscript = results.map((/** @type {any} */ r) => r[0].transcript).join(' ');
      const lastIsPartial = results.length > 0 && !results[results.length - 1].isFinal;
      this.onSpeech(`${this._priorTranscript} ${sessionTranscript}`, lastIsPartial);
    };
    rec.onerror = (/** @type {any} */ ev) => {
      this._logRecEvent(`error: ${ev.error}`, ev.message);
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        this._renderStatus(`Microphone access was denied (${ev.error}).`);
        this.active = false;
        this.$button?.find('button').removeClass('active');
      } else if (ev.error === 'language-not-supported' && rec.lang.includes('-')) {
        // Retry with just the language, e.g. en-CA -> en
        this._langOverride = rec.lang.split('-')[0];
        rec.lang = this._langOverride;
      } else if (!ROUTINE_ERRORS.includes(ev.error)) {
        this._renderStatus(`Speech recognition error: ${escapeHtml(ev.error)}` +
          (ev.error === 'network' ? ' (couldn\'t reach the browser\'s speech service)' : '') +
          (ev.message ? ` – ${escapeHtml(ev.message)}` : ''));
      }
    };
    // Recognition stops on its own after silence or a time limit, so keep
    // restarting it while active. Back off when sessions keep coming back
    // empty, so a dead microphone doesn't spin.
    rec.onend = () => {
      this._logRecEvent('end');
      if (!this.active || this.recognition !== rec) return;
      this._priorTranscript = `${this._priorTranscript} ${sessionTranscript}`.split(/\s+/).slice(-20).join(' ');
      if (!sessionHasResults) this._emptySessions++;
      if (this._emptySessions >= EMPTY_SESSIONS_WARNING) this._renderStatus(this._notHearingMessage());
      const delay = this._emptySessions ? Math.min(250 * 2 ** (this._emptySessions - 1), 5000) : 0;
      this._restartTimer = setTimeout(() => {
        if (!this.active || this.recognition !== rec) return;
        this._logRecEvent('restart', delay ? `after ${delay}ms` : '');
        try {
          rec.start();
        } catch (e) {
          console.log('ReadAlong: failed to restart speech recognition', e);
        }
      }, delay);
    };
    this.recognition = rec;
    rec.start();
  }

  /**
   * Explains repeated empty recognition sessions, based on how far the
   * recent ones got
   */
  _notHearingMessage() {
    const seen = (/** @type {string} */ type) => this._recEvents.some(e => e.startsWith(type));
    const hint = !seen('audiostart') ? 'the microphone never started' :
      !seen('soundstart') ? 'the microphone is on but silent; check which one the browser uses' :
        !seen('speechstart') ? 'sound but no speech detected' :
          'speech detected but nothing recognized';
    return `Not hearing anything (${hint}). Check the site's microphone in the address bar, ` +
      `or chrome://settings/content/microphone.`;
  }

  /**
   * @param {string} type
   * @param {string} [detail]
   */
  _logRecEvent(type, detail = '') {
    console.log(`ReadAlong: recognition ${type}`, detail);
    this._recEvents = [...this._recEvents, detail ? `${type} (${detail})` : type].slice(-8);
    if (this.options.debug) this._renderStatus();
  }

  /**
   * Prefer the user's locale variant of the book's language (e.g. en-GB),
   * since accents matter to the recognizer.
   */
  _recognitionLang() {
    if (this._langOverride) return this._langOverride;
    const bookLang = toISO6391(this.br.options.bookLanguage);
    const userLangs = navigator.languages || [navigator.language];
    if (!bookLang) return userLangs[0];
    return userLangs.find(l => l.split('-')[0] == bookLang) || bookLang;
  }

  /**
   * @param {string} transcript all recently recognized text
   * @param {boolean} lastIsPartial
   */
  onSpeech(transcript, lastIsPartial) {
    const spoken = tokenize(transcript);
    if (!spoken.length || !this.words.length) return;
    const match = this.aligner.update(spoken, { lastIsPartial });
    if (match) this.setCurrentWord(this.words[match.end]);
    if (!this.options.debug) {
      // Out of the way once it's following along
      if (match) this._renderStatus('');
    } else {
      const query = spoken.slice(-this.aligner.queryLength).join(' ');
      this._renderStatus(
        `<div class="BRreadAlong__heard">${escapeHtml(query)}</div>` +
        `<div class="BRreadAlong__match">${match ?
          `→ "${escapeHtml(this.words[match.end].text)}" (p${this.words[match.end].pageIndex}, matched ${match.matched}, score ${match.score.toFixed(1)})` :
          'no confident match'}</div>` +
        (this._lastCueText ? `<div class="BRreadAlong__cue">♪ ${escapeHtml(this._lastCueText)}</div>` : ''),
      );
    }
  }

  /**
   * @param {BookWord} word
   */
  setCurrentWord(word) {
    const prevWord = this.currentWord;
    if (prevWord === word) return;
    this.currentWord = word;
    if (!this.br._isIndexDisplayed(word.pageIndex)) {
      this.br.jumpToIndex(word.pageIndex, { ariaLive: false });
    }

    const lineBoxes = this.words.filter(w => w.lineKey === word.lineKey).flatMap(w => w.boxes);
    this._boxesByIndex = {
      [word.pageIndex]: {
        lines: [boundingBox(lineBoxes)],
        words: word.boxes,
      },
    };
    this._removeHighlights(false);
    for (const [pageIndex, boxes] of Object.entries(this._boxesByIndex)) {
      const page = this.br.book.getPage(parseFloat(pageIndex));
      for (const container of this.br.getActivePageContainerElementsForIndex(page.index)) {
        this._renderBoxes(page, container, boxes);
      }
    }
    if (prevWord?.lineKey !== word.lineKey) this._maybeScrollToLine();
    this._fireCues(prevWord, word);
  }

  /**
   * Fire the cues read past going from `prevWord` to `word`. If that's a jump
   * rather than reading, instead fade the looping sounds to what they'd be at
   * `word` had everything before it been read.
   * @param {BookWord | null} prevWord
   * @param {BookWord} word
   */
  _fireCues(prevWord, word) {
    if (!this.soundscapePlayer || !this.cues.length) return;
    const index = this.words.indexOf(word);
    const prevIndex = prevWord ? this.words.indexOf(prevWord) : -1;
    const isReading = prevIndex != -1 && index > prevIndex && index - prevIndex <= MAX_CUE_JUMP;
    if (isReading) {
      this._runCues(this.words[prevIndex], word, () => true);
      return;
    }

    const state = loopStateAt(this.soundscape, this.cues, word.pageIndex, word.indexInPage);
    this.soundscapePlayer.applyLoopState(state, SEEK_FADE);
    this.soundscapePlayer.applyClassState(classStateAt(this.cues, word.pageIndex, word.indexInPage));
    this._lastCueText = `jumped; looping ${[...state].map(([name, v]) => `${name}@${v}`).join(', ') || 'nothing'}`;
    // The words that located the position were just read, so their one-shots
    // should still play
    const from = this.words[Math.max(index - this.aligner.queryLength, 0)];
    this._runCues(from, word, action =>
      (action.action == 'play' && !this.soundscape.sounds[action.sound]?.loop) ||
      (action.action == 'css' && !!action.duration));
  }

  /**
   * Run the actions of cues after `from`, up to and including `to`
   * @param {BookWord} from
   * @param {BookWord} to
   * @param {(action: import('./soundscape.js').SoundAction) => boolean} filter
   */
  _runCues(from, to, filter) {
    for (const cue of this.cues) {
      if (compareCueToWord(cue, from.pageIndex, from.indexInPage) <= 0) continue;
      if (compareCueToWord(cue, to.pageIndex, to.indexInPage) > 0) break;
      const actions = cue.spec.actions.filter(filter);
      for (const action of actions) this.soundscapePlayer.run(action);
      if (actions.length) {
        this._lastCueText = `"${cue.spec.at.quote}": ${actions.map(a => `${a.action} ${a.sound ?? a.class ?? ''}`.trim()).join(', ')}`;
      }
    }
  }

  /**
   * @param {import('../../BookReader/BookModel.js').PageModel} page
   * @param {HTMLElement} container
   * @param {{ lines: Box[], words: Box[] }} boxes
   */
  _renderBoxes(page, container, { lines, words }) {
    renderBoxesInPageContainerLayer('readAlongLineLayer', lines, page, container);
    renderBoxesInPageContainerLayer('readAlongWordLayer', words, page, container);
  }

  _maybeScrollToLine() {
    if (this.br.mode == this.br.constModeThumb) return;
    const lineRect = this.br.$('.readAlongLineLayer rect')[0];
    const scrollEl = this.br.refs.$brContainer[0];
    if (!lineRect) return;
    const lineBounds = lineRect.getBoundingClientRect();
    const viewBounds = scrollEl.getBoundingClientRect();
    const relTop = (lineBounds.top - viewBounds.top) / viewBounds.height;
    if (relTop < 0.1 || relTop > 0.7) {
      this.br.scrollIntoView(lineRect, { block: 'center', inline: 'center', behavior: 'smooth' });
    }
  }

  /**
   * Make sure the displayed pages, and the page after them, are loaded,
   * keeping the reading position.
   */
  async loadPages() {
    const displayed = this.br.displayedIndices?.length ? this.br.displayedIndices : [this.br.currentIndex()];
    const wanted = new Set(displayed);
    // Keep the page being read even if the user scrolled away
    if (this.currentWord) wanted.add(this.currentWord.pageIndex);
    const loadWanted = () => Promise.all([...wanted].filter(i => !this.pageWords.has(i)).map(async i => {
      this.pageWords.set(i, await this._loadPageWords(i));
    }));
    await loadWanted();

    // Also load up to the next page of running text, skipping e.g. illustration
    // plates and chapter title pages
    const lastIndex = this.br.book.getNumLeafs() - 1;
    for (let i = Math.max(...displayed) + 1; i <= Math.min(lastIndex, Math.max(...displayed) + MAX_LOOKAHEAD_PAGES); i++) {
      wanted.add(i);
      await loadWanted();
      if ((this.pageWords.get(i)?.length ?? 0) >= MIN_LOOKAHEAD_WORDS) break;
    }
    for (const i of this.pageWords.keys()) {
      if (!wanted.has(i)) this.pageWords.delete(i);
    }

    this.words = [...this.pageWords.keys()].sort((a, b) => a - b).flatMap(i => this.pageWords.get(i));
    const pos = this.currentWord ? this.words.indexOf(this.currentWord) : -1;
    this.aligner.setWords(this.words.map(w => w.norm), pos);
    if (this.soundscape) {
      const normsByPage = new Map([...this.pageWords].map(([i, words]) => [i, words.map(w => w.norm)]));
      this.cues = resolveCues(this.soundscape, normsByPage);
    }
  }

  /**
   * @param {number} pageIndex
   * @returns {Promise<BookWord[]>}
   */
  async _loadPageWords(pageIndex) {
    const ocrPage = await this.br.plugins.textSelection?.getPageText(pageIndex);
    if (!ocrPage) return [];

    /** @type {BookWord[]} */
    const words = [];
    /** @type {BookWord | null} */
    let hyphenated = null;
    const paragraphs = Array.from(ocrPage.querySelectorAll('PARAGRAPH'))
      // Running headers, footers and page numbers aren't read aloud
      .filter(p => !p.getAttribute('x-role'));
    for (const [paragraphIndex, paragraph] of paragraphs.entries()) {
      for (const [lineIndex, line] of Array.from(paragraph.querySelectorAll('LINE')).entries()) {
        const lineKey = `${pageIndex}/${paragraphIndex}/${lineIndex}`;
        const wordEls = Array.from(line.querySelectorAll('WORD'));
        for (const wordEl of wordEls) {
          const text = wordEl.textContent.trim();
          const [l, b, r, t] = wordEl.getAttribute('coords').split(',').map(parseFloat);
          const box = { l, r, b, t };
          if (hyphenated) {
            hyphenated.text = hyphenated.text.slice(0, -1) + text;
            hyphenated.norm = normalizeWord(hyphenated.text);
            hyphenated.boxes.push(box);
            hyphenated = null;
            continue;
          }
          const norm = normalizeWord(text);
          if (!norm) continue;
          const word = { norm, text, pageIndex, indexInPage: words.length, lineKey, boxes: [box] };
          words.push(word);
          if (text.endsWith('-') && wordEl === wordEls[wordEls.length - 1]) {
            hyphenated = word;
          }
        }
      }
      hyphenated = null;
    }
    return words;
  }

  /**
   * @param {boolean} [clearBoxes]
   */
  _removeHighlights(clearBoxes = true) {
    $(this.br.getActivePageContainerElements()).find('.readAlongLineLayer, .readAlongWordLayer').remove();
    if (clearBoxes) this._boxesByIndex = {};
  }

  /**
   * @param {string} [html] main message; keeps the current one if omitted
   */
  _renderStatus(html = this._statusHtml) {
    if (!this.$status) {
      this.$status = $('<div class="BRreadAlong__status" aria-live="polite"></div>').appendTo(this.br.refs.$br);
    }
    this._statusHtml = html;
    const diagnostics = this.options.debug && this._recInfo ?
      `<div class="BRreadAlong__diag">${escapeHtml(this._recInfo)}<br>${escapeHtml(this._recEvents.join(' → '))}</div>` : '';
    this.$status.html(html + diagnostics);
  }
}

/**
 * @param {Box[]} boxes
 * @returns {Box}
 */
function boundingBox(boxes) {
  return {
    l: Math.min(...boxes.map(b => b.l)),
    r: Math.max(...boxes.map(b => b.r)),
    t: Math.min(...boxes.map(b => b.t)),
    b: Math.max(...boxes.map(b => b.b)),
  };
}

/**
 * @param {string} s
 */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

BookReader?.registerPlugin('readAlong', ReadAlongPlugin);
