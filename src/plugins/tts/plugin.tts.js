// @ts-check

import FestivalTTSEngine from './FestivalTTSEngine.js';
import WebTTSEngine from './WebTTSEngine.js';
import { toISO6391 } from './utils.js';
import './chapter-progress.js';
import { en as tooltips } from './tooltip_dict.js';
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { applyVariables, countWords } from '../../util/strings.js';
/** @typedef {import('./PageChunk.js').default} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").default} AbstractTTSEngine */

const BookReader = /** @type {typeof import('../../BookReader').default} */(window.BookReader);

/**
 * Plugin for Text to Speech in BookReader
 */
export class TtsPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /**
     * @type {import('@/src/util/strings.js').StringWithVars}
     * Cover for the maximized player, used when the chapters plugin finds the
     * book's Open Library edition. Provided variables:
     *  - `coverId` -- the edition's Open Library cover ID
     */
    openLibraryCoverUrl: 'https://covers.openlibrary.org/b/id/{{coverId}}-L.jpg',
    /**
     * @type {import('@/src/util/strings.js').StringWithVars}
     * The URL where to get PageChunk objects for a given page. Expects a var `pageIndex`
     **/
    pageChunkUrl: 'https://{{server}}/BookReader/BookReaderGetTextWrapper.php?path={{bookPath|urlencode}}_djvu.xml&page={{pageIndex}}&callback=false',
    /**
     * @type {import('@/src/util/strings.js').StringWithVars}
     * The URL for converting text to audio if the web SpeechSynthesis API is not supported.
     * Provided variables:
     *  - `text` -- the text to convert to audio
     *  - `format` -- the format of the audio, 'mp3' or 'ogg';
     */
    remoteTtsUrl: 'https://{{server}}/BookReader/BookReaderGetTTS.php?string={{text|urlencode}}&format={{format}}',
  }

  /**
   * @override
   * @param {Partial<TtsPlugin['options']>} options
   **/
  setup(options) {
    super.setup(Object.assign({
      // @deprecated support options specified in global options
      server: this.br.options.server,
      bookPath: this.br.options.bookPath,
    }, options));

    if (!this.options.enabled) return;

    /** @type { {[pageIndex: number]: Array<{ l: number, r: number, t: number, b: number }>} } */
    this._ttsBoxesByIndex = {};

    let TTSEngine = WebTTSEngine.isSupported() ? WebTTSEngine :
      FestivalTTSEngine.isSupported() ? FestivalTTSEngine :
        null;

    if (/_forceTTSEngine=(festival|web)/.test(location.toString())) {
      const engineName = location.toString().match(/_forceTTSEngine=(festival|web)/)[1];
      TTSEngine = { festival: FestivalTTSEngine, web: WebTTSEngine }[engineName];
    }

    if (TTSEngine) {
      /** @type {AbstractTTSEngine} */
      this.ttsEngine = new TTSEngine({
        pageChunkUrl: applyVariables(this.options.pageChunkUrl, this.br.options.vars),
        bookLanguage: toISO6391(this.br.options.bookLanguage),
        onLoadingStart: this.br.showProgressPopup.bind(this.br, 'Loading audio...'),
        onLoadingComplete: this.br.removeProgressPopup.bind(this.br),
        onDone: this.stop.bind(this),
        beforeChunkPlay: this.beforeChunkPlay.bind(this),
        afterChunkPlay: this.sendChunkFinishedAnalyticsEvent.bind(this),
        ...(TTSEngine === FestivalTTSEngine ? {
          festivalUrl: applyVariables(this.options.remoteTtsUrl, this.br.options.vars),
        } : {}),
      });
    }
  }

  /** @override */
  init() {
    if (!this.options.enabled) return;

    this.br.bind(BookReader.eventNames.PostInit, () => {
      this.br.$('.BRicon.read').click(() => {
        this.toggle();
        return false;
      });
      if (this.ttsEngine) {
        this.ttsEngine.init();
        if (/[?&]_autoReadAloud=show/.test(location.toString())) {
          this.start(false); // false flag is to initiate read aloud controls
        }
      }
    });

    // This is fired when the hash changes by one of the other plugins!
    // i.e. it will fire every time the page changes -_-
    // this.br.bind(BookReader.eventNames.stop, function(e, br) {
    //     this.ttsStop();
    // }.bind(this));
  }

  /**
   * @override
   * @param {import ("@/src/BookReader/PageContainer.js").PageContainer} pageContainer
   */
  _configurePageContainer(pageContainer) {
    if (this.options.enabled && pageContainer.page && pageContainer.page.index in this._ttsBoxesByIndex) {
      const pageIndex = pageContainer.page.index;
      renderBoxesInPageContainerLayer('ttsHiliteLayer', this._ttsBoxesByIndex[pageIndex], pageContainer.page, pageContainer.$container[0]);
    }
  }

  /**
   * @override
   * @param {JQuery<HTMLElement>} $navBar
   */
  extendNavBar($navBar) {
    if (!this.options.enabled || !this.ttsEngine) return;

    this.br.refs.$BRReadAloudToolbar = $(`
      <div class="read-aloud">
        <img class="read-aloud-cover" alt="" />
        <div class="read-aloud-chapter">
          <button type="button" class="read-aloud-chapter-name" name="chapters" title="${tooltips.chapters}">
            <ia-icon-toc aria-hidden="true"></ia-icon-toc>
            <span class="read-aloud-chapter-text">
              <span class="read-aloud-chapter-label"></span>
              <span class="read-aloud-chapter-title"></span>
            </span>
          </button>
          <br-tts-chapter-progress></br-tts-chapter-progress>
        </div>
        <ul class="read-aloud-controls">
          <li>
            <button type="button" name="review" title="${tooltips.review}">
              <div class="icon icon-review"></div>
            </button>
          </li>
          <li>
            <button type="button" name="play" title="${tooltips.play}">
              <div class="icon icon-play"></div>
              <div class="icon icon-pause"></div>
            </button>
          </li>
          <li>
            <button type="button" name="advance" title="${tooltips.advance}">
              <div class="icon icon-advance"></div>
            </button>
          </li>
          <li class="read-aloud-size">
            <button type="button" class="read-aloud-size-button" name="toggle-size" title="${tooltips.minimize}">
              <svg class="icon-minimize" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4"/></svg>
              <svg class="icon-expand" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 10l4-4 4 4"/></svg>
            </button>
          </li>
        </ul>
        <ul class="read-aloud-settings">
          <li>
            <select class="playback-speed" name="playback-speed" title="${tooltips.playbackSpeed}">
              <option value="0.25">0.25x</option>
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1.0" selected>1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
            </select>
          </li>
          <li style="display: none">
            <select class="playback-voices" name="playback-voice" title="Change read aloud voices">
            </select>
          </li>
        </ul>
      </div>
    `);

    $navBar.find('.BRcontrols').prepend(this.br.refs.$BRReadAloudToolbar);

    const renderVoiceOption = (voices) => {
      return voices.map(voice =>
        `<option value="${voice.voiceURI}">${voice.lang} - ${voice.name}</option>`).join('');
    };

    const voiceSortOrder = (a,b) => `${a.lang} - ${a.name}`.localeCompare(`${b.lang} - ${b.name}`);

    const renderVoicesMenu = (voicesMenu) => {
      voicesMenu.empty();
      let bookLanguage = this.ttsEngine.opts.bookLanguage;
      if (this.br.plugins.translate?.translationManager?.active) {
        bookLanguage = this.br.plugins.translate.langFromCode;
      }

      const bookLanguages = this.ttsEngine.getVoices().filter(v => v.lang.startsWith(bookLanguage)).sort(voiceSortOrder);
      const otherLanguages = this.ttsEngine.getVoices().filter(v => !v.lang.startsWith(bookLanguage)).sort(voiceSortOrder);

      if (this.ttsEngine.getVoices().length > 1) {
        if (this.br.plugins.translate?.translationManager?.active) {
          // Separate out Other Languages when translation active, not sure if too much / unwieldy
          const toLang = this.br.plugins.translate.langToCode;
          const translatedLanguages = this.ttsEngine.getVoices().filter(v => v.lang.startsWith(toLang)).sort(voiceSortOrder);
          voicesMenu.append($(`<optgroup label="Book Language, Translated From (${bookLanguage})"> ${renderVoiceOption(bookLanguages)} </optgroup>`));
          voicesMenu.append($(`<optgroup label="Book Language, Translated To (${toLang})"> ${renderVoiceOption(translatedLanguages)} </optgroup>`));
          voicesMenu.append($(`<optgroup label="Other Languages"> ${renderVoiceOption(otherLanguages.filter(v => !v.lang.startsWith(toLang)).sort(voiceSortOrder))}`));
        } else {
          voicesMenu.append($(`<optgroup label="Book Language (${bookLanguage})"> ${renderVoiceOption(bookLanguages)} </optgroup>`));
          voicesMenu.append($(`<optgroup label="Other Languages"> ${renderVoiceOption(otherLanguages)} </optgroup>`));
        }

        voicesMenu.val(this.ttsEngine.voice.voiceURI);
        voicesMenu.closest('li').show();
      } else {
        voicesMenu.closest('li').hide();
      }
    };

    const voicesMenu = this.br.refs.$BRReadAloudToolbar.find('[name=playback-voice]');
    renderVoicesMenu(voicesMenu);
    voicesMenu.on("change", ev => this.ttsEngine.setVoice(voicesMenu.val()));
    this.ttsEngine.events.on('pause resume start', () => this.updateState());
    this.ttsEngine.events.on('voiceschanged', () => renderVoicesMenu(voicesMenu));
    this.br.on('translationEnabled', () => renderVoicesMenu(voicesMenu));
    this.br.on('translationDisabled', () => renderVoicesMenu(voicesMenu));
    this.br.refs.$BRReadAloudToolbar.find('[name=play]').on("click", this.playPause.bind(this));
    this.br.refs.$BRReadAloudToolbar.find('[name=advance]').on("click", this.jumpForward.bind(this));
    this.br.refs.$BRReadAloudToolbar.find('[name=review]').on("click", this.jumpBackward.bind(this));
    this.br.refs.$BRReadAloudToolbar.find('[name=toggle-size]')
      .on('click', () => this.setToolbarMode(this.toolbarMode == 'minimized' ? this._expandedMode : 'minimized'));
    this.br.on(BookReader.eventNames.resize, () => {
      if (this.ttsEngine.playing && this.toolbarMode != 'minimized') this.setToolbarMode(this._expandedMode);
    });
    this.br.refs.$BRReadAloudToolbar.find('[name=chapters]').on('click', () => this.toggleChaptersPanel());
    this.br.on('chapterSelected', (_ev, { pageIndex }) => this.onChapterSelected(pageIndex));
    this.br.refs.$BRReadAloudToolbar.find('br-tts-chapter-progress')
      .on('seek', (ev) => this.seekInChapter(ev.originalEvent.detail.value));
    const $rateSelector = this.br.refs.$BRReadAloudToolbar.find('select[name="playback-speed"]');
    $rateSelector.on("change", ev => this.ttsEngine.setPlaybackRate(parseFloat($rateSelector.val())));
    $(`<li>
        <button class="BRicon read js-tooltip" title="${tooltips.readAloud}">
          <div class="icon icon-read-aloud"></div>
          <span class="BRtooltip">${tooltips.readAloud}</span>
        </button>
      </li>`).insertBefore($navBar.find('.BRcontrols .BRicon.zoom_out').closest('li'));
  }

  toggle() {
    this.br.plugins.autoplay?.stop();
    if (this.ttsEngine.playing) {
      this.stop();
    } else {
      this.start();
    }
  }

  start(startTTSEngine = true) {
    const checkVoice = this.br.plugins.translate?.translationManager?.active ? toISO6391(this.br.plugins.translate.langToCode) : "";
    const bookVoice = this.ttsEngine.getBestVoice(checkVoice);

    const voicesMenu = this.br.refs.$BRReadAloudToolbar.find('[name=playback-voice');
    this.ttsEngine.setVoice(bookVoice.voiceURI);
    voicesMenu.val(bookVoice.voiceURI);
    if (this.br.constModeThumb == this.br.mode)
      this.br.switchMode(this.br.constMode1up);

    this.updateChapter(this.br.currentIndex());
    // On mobile the maximized player would hide the book, so start minimized
    this.setToolbarMode(this._expandedMode == 'maximized' ? 'minimized' : 'normal');
    this.br.refs.$BRReadAloudToolbar.addClass('visible');
    this.br.$('.BRicon.read').addClass('unread active');
    this.sendAnalyticsEvent('Start');
    if (startTTSEngine)
      this.ttsEngine.start(this.br.currentIndex(), this.br.book.getNumLeafs());
  }

  jumpForward() {
    if (this.ttsEngine.paused) {
      this.ttsEngine.resume();
    }
    this.ttsEngine.jumpForward();
  }

  jumpBackward() {
    if (this.ttsEngine.paused) {
      this.ttsEngine.resume();
    }
    this.ttsEngine.jumpBackward();
  }

  updateState() {
    const isPlaying = !(this.ttsEngine.paused || !this.ttsEngine.playing);
    this.br.$('.read-aloud [name=play]').toggleClass('playing', isPlaying);
  }

  playPause() {
    if (!this.ttsEngine.playing) {
      this.toggle();
    } else {
      this.ttsEngine.togglePlayPause();
      this.updateState();
    }
  }


  stop() {
    this.br.refs.$BRReadAloudToolbar.removeClass('visible');
    this.br.$('.BRicon.read').removeClass('unread active');
    this.sendAnalyticsEvent('Stop');
    this.ttsEngine.stop();
    this.removeHilites();
    this.br.removeProgressPopup();
  }

  /**
   * @param {PageChunk} chunk
   * Returns once the flip is done
   */
  async beforeChunkPlay(chunk) {
    await this.maybeFlipToIndex(chunk.leafIndex);
    this.updateChapter(chunk.leafIndex, chunk);
    this.highlightChunk(chunk);
    this.scrollToChunk(chunk);
  }

  /**
   * Show the chapter being read, and how far through it we are, in the
   * toolbar; the row hides if there's no TOC
   * @param {number} leafIndex
   * @param {PageChunk} [chunk] the chunk about to be read on that page
   */
  updateChapter(leafIndex, chunk) {
    const chapters = this.br.plugins.chapters;
    const chapter = chapters?.getChapterAt(leafIndex);
    const $chapter = this.br.refs.$BRReadAloudToolbar.find('.read-aloud-chapter');
    $chapter.toggleClass('empty', !chapter);
    if (!chapter) return;

    $chapter.find('.read-aloud-chapter-label').text(chapter.label?.trim() || '');
    $chapter.find('.read-aloud-chapter-title').text(chapter.title?.trim() || '');

    // Each page gets an equal share of the chapter, split evenly between its chunks
    const start = chapter.pageIndex;
    const end = chapters.getChapterEnd(chapter);
    const pagePosition = chunk && this.ttsEngine.getPagePosition(chunk);
    const pageFraction = pagePosition ? pagePosition.index / pagePosition.count : 0;
    const progress = (leafIndex - start + pageFraction) / Math.max(1, end - start);
    /** @type {import('./chapter-progress.js').BRTtsChapterProgress} */
    const $progress = $chapter.find('br-tts-chapter-progress')[0];
    $progress.value = Math.min(1, Math.max(0, progress));
    $progress.pages = end - start;
    $progress.label = `Progress through ${chapter.title || chapter.label || 'chapter'}`;
  }

  /** @type {'normal' | 'minimized' | 'maximized'} */
  toolbarMode = 'normal';

  /**
   * The toolbar only toggles between minimized and one expanded mode: the
   * floating bar on desktop, or the maximized player on mobile, where the
   * floating bar would cover most of the page anyway
   * @type {'normal' | 'maximized'}
   */
  get _expandedMode() {
    // Same phone cutoff as the navbar and the side menu
    return this.br.refs.$br.width() < 640 ? 'maximized' : 'normal';
  }

  /** @type {ResizeObserver | null} */
  _maximizedResizeObserver = null;

  /**
   * Minimized shows just the playback buttons; maximized covers the reader
   * above the footer, hiding the book
   * @param {'normal' | 'minimized' | 'maximized'} mode
   */
  setToolbarMode(mode) {
    this.toolbarMode = mode;
    const $toolbar = this.br.refs.$BRReadAloudToolbar;
    $toolbar
      .toggleClass('minimized', mode == 'minimized')
      .toggleClass('maximized', mode == 'maximized');
    $toolbar.find('[name=toggle-size]')
      .attr('title', mode == 'minimized' ? tooltips.expand : tooltips.minimize);

    // The toolbar is positioned within the footer, so it can't size itself to
    // the space above the footer with CSS alone
    this._maximizedResizeObserver?.disconnect();
    this._maximizedResizeObserver = null;
    if (mode == 'maximized') {
      this._loadCover();
      const footer = $toolbar.closest('.BRfooter')[0];
      this._maximizedResizeObserver = new ResizeObserver(() => {
        $toolbar[0].style.setProperty('--read-aloud-maximized-height', `${footer.offsetTop}px`);
      });
      this._maximizedResizeObserver.observe(this.br.refs.$br[0]);
      this._maximizedResizeObserver.observe(footer);
    }
  }

  /** @type {Promise<void> | null} */
  _coverLoading = null;

  /**
   * Shown in the maximized player. Prefers the Open Library edition's cover,
   * then the book's thumbnail, then the first page, which is the cover for
   * most scanned books.
   */
  _loadCover() {
    this._coverLoading ||= this._getCoverUrl().then(src => {
      const $cover = this.br.refs.$BRReadAloudToolbar.find('.read-aloud-cover');
      $cover
        .one('error', () => $cover.addClass('failed'))
        .attr('src', src);
    });
  }

  /** @returns {Promise<string>} */
  async _getCoverUrl() {
    const olEdition = await this.br.plugins.chapters?.getOpenLibraryRecord().catch(() => null);
    const coverId = olEdition?.covers?.find(id => id > 0);
    if (coverId) {
      return applyVariables(this.options.openLibraryCoverUrl, this.br.options.vars, { coverId });
    }

    let src = this.br.thumbnail;
    if (!src) {
      // Smallest power-of-2 reduction that's still sharp at ~800px tall
      const height = this.br.book.getPageHeight(0);
      const reduce = 2 ** Math.max(0, Math.floor(Math.log2(height / 800)));
      src = this.br.book.getPageURI(0, reduce, 0);
    }
    return src;
  }

  /** Open the table of contents side panel, or close it if it's already showing */
  toggleChaptersPanel() {
    const itemNav = this.br.shell?.itemNav;
    if (itemNav?.menuOpened && itemNav.openMenu == 'chapters') {
      itemNav.toggleMenu(false);
    } else {
      this.br.shell?.updateSideMenu('chapters', 'open');
    }
  }

  /**
   * Restart read aloud at a chapter picked from the table of contents
   * @param {number} pageIndex
   */
  onChapterSelected(pageIndex) {
    if (!this.ttsEngine?.playing) return;
    this.updateChapter(pageIndex);
    // Stay paused if paused; resuming then continues from the new chapter
    this.ttsEngine.jumpTo(pageIndex, 0, !this.ttsEngine.paused);
  }

  /**
   * Jump read aloud to a point in the current chapter
   * @param {number} fraction 0-1
   */
  seekInChapter(fraction) {
    const chapters = this.br.plugins.chapters;
    const chunk = this.ttsEngine.activeSound?.chunk;
    const chapter = chapters?.getChapterAt(chunk?.leafIndex ?? this.br.currentIndex());
    if (!chapter || !this.ttsEngine.playing) return;

    const start = chapter.pageIndex;
    const end = chapters.getChapterEnd(chapter);
    const position = start + fraction * (end - start);
    const leafIndex = Math.min(Math.floor(position), end - 1);
    this.ttsEngine.jumpTo(leafIndex, position - leafIndex);
  }

  /**
   * @param {PageChunk} chunk
   */
  sendChunkFinishedAnalyticsEvent(chunk) {
    this.sendAnalyticsEvent('ChunkFinished-Words', countWords(chunk.text));
  }

  /**
   * Flip the page if the provided leaf index is not visible
   * @param {Number} leafIndex
   */
  async maybeFlipToIndex(leafIndex) {
    if (!this.br._isIndexDisplayed(leafIndex)) {
      // Don't interrupt the read aloud with the page flip update?
      this.br.jumpToIndex(leafIndex, { ariaLive: false });
    }
  }

  /**
   * @param {PageChunk} chunk
   */
  highlightChunk(chunk) {
    // The poorly-named variable leafIndex
    const pageIndex = chunk.leafIndex;

    this.removeHilites();
    if (this.br.plugins.translate?.translationManager.active) {
      const pageContainers = this.br.getActivePageContainerElementsForIndex(pageIndex);
      const paragraphIndex = chunk.chunkIndex;
      pageContainers.forEach(container => {
        const translateElement = container.querySelector('.BRtranslateLayer');
        const containerChildren = Array.from(translateElement.childNodes);
        const paragraphEle = containerChildren[paragraphIndex];
        if (!paragraphEle) { return; }
        const [pOffHeight, pOffTop, pOffWidth, pOffLeft] = [paragraphEle.offsetHeight, paragraphEle.offsetTop, paragraphEle.offsetWidth, paragraphEle.offsetLeft];
        const boxes = {pageIndex: [
          {l: pOffLeft, r: pOffLeft + pOffWidth, b: pOffTop + pOffHeight, t: pOffTop},
        ]};
        renderBoxesInPageContainerLayer('ttsHiliteLayer', boxes.pageIndex, this.br.book.getPage(pageIndex), translateElement);
      });
      return;
    }
    // group by index; currently only possible to have chunks on one page :/
    this._ttsBoxesByIndex = {
      [pageIndex]: chunk.lineRects.map(([l, b, r, t]) => ({l, r, b, t})),
    };

    // update any already created pages
    for (const [pageIndexString, boxes] of Object.entries(this._ttsBoxesByIndex)) {
      const pageIndex = parseFloat(pageIndexString);
      const page = this.br.book.getPage(pageIndex);
      const pageContainers = this.br.getActivePageContainerElementsForIndex(pageIndex);
      pageContainers.forEach(container => renderBoxesInPageContainerLayer('ttsHiliteLayer', boxes, page, container));
    }
  }

  /**
   * @param {PageChunk} chunk
   */
  scrollToChunk(chunk) {
    // It behaves weird if used in thumb mode
    if (this.br.constModeThumb == this.br.mode) return;

    const highlightRect = $(`.pagediv${chunk.leafIndex} .ttsHiliteLayer rect`).last()?.[0];
    this.br.scrollIntoView(highlightRect, {
      block: 'center',
      inline: 'center',
      behavior: 'smooth',
    });
  }

  removeHilites() {
    $(this.br.getActivePageContainerElements()).find('.ttsHiliteLayer').remove();
    this._ttsBoxesByIndex = {};
  }

  /**
   * @private
   * Send an analytics event with an optional value. Also attaches the book's language.
   * @param {string} action
   * @param {number} [value]
   */
  sendAnalyticsEvent(action, value) {
    if (this.br.plugins.archiveAnalytics) {
      const extraValues = {};
      const mediaLanguage = this.ttsEngine.opts.bookLanguage;
      if (mediaLanguage) extraValues.mediaLanguage = mediaLanguage;
      this.br.plugins.archiveAnalytics.sendEvent('BRReadAloud', action, value, extraValues);
    }
  }
}

BookReader?.registerPlugin('tts', TtsPlugin);
