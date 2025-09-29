// @ts-check

import FestivalTTSEngine from './FestivalTTSEngine.js';
import WebTTSEngine from './WebTTSEngine.js';
import { toISO6391, approximateWordCount } from './utils.js';
import { en as tooltips } from './tooltip_dict.js';
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { applyVariables } from '../../util/strings.js';
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
      <ul class="read-aloud">
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
        <li>
          <select class="playback-voices" name="playback-voice" style="display: none" title="Change read aloud voices">
          </select>
        </li>
        <li class="volume-control">
          <button type="button" name="volume" title="Adjust volume">
            <div class="icon icon-volume"></div>
          </button>
          <div class="volume-slider-container" style="display: none;">
            <input type="range" min="0" max="1" step="0.1" value="1" class="volume-slider" title="Volume">
          </div>
        </li>
      </ul>
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
        voicesMenu.show();
      } else {
        voicesMenu.hide();
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
    // Volume control setup
    const $volumeButton = this.br.refs.$BRReadAloudToolbar.find('[name=volume]');
    const $volumeSliderContainer = this.br.refs.$BRReadAloudToolbar.find('.volume-slider-container');
    const $volumeSlider = this.br.refs.$BRReadAloudToolbar.find('.volume-slider'); 
    // Toggle volume slider visibility
    $volumeButton.on("click", () => {
      $volumeSliderContainer.toggle();
    });
    // Hide volume slider when clicking outside
    $(document).on("click", (e) => {
      if (!$(e.target).closest('.volume-control').length) {
        $volumeSliderContainer.hide();
      }
    });
    // Set volume when slider is changed
    $volumeSlider.on("input change", () => {
      const volume = parseFloat($volumeSlider.val());
      this.setVolume(volume);
    });
    // Initialize volume
    if (this.ttsEngine.setVolume) {
      $volumeSlider.val(this.ttsEngine.volume || 1);
    }
    const $rateSelector = this.br.refs.$BRReadAloudToolbar.find('select[name="playback-speed"]');
    $rateSelector.on("change", ev => this.ttsEngine.setPlaybackRate(parseFloat($rateSelector.val())));
    $(`<li>
        <button class="BRicon read js-tooltip" title="${tooltips.readAloud}">
          <div class="icon icon-read-aloud"></div>
          <span class="BRtooltip">${tooltips.readAloud}</span>
        </button>
      </li>`).insertBefore($navBar.find('.BRcontrols .BRicon.zoom_out').closest('li'));
  }

  /**
   * Sets the volume for the TTS engine
   * @param {number} volume - Volume level between 0 and 1
   */
  setVolume(volume) {
    if (this.ttsEngine && typeof this.ttsEngine.setVolume === 'function') {
      this.ttsEngine.setVolume(volume);
    } else if (this.ttsEngine && typeof SpeechSynthesisUtterance !== 'undefined') {
      // For web speech API, we'll need to set volume on the current utterance
      if (!this.ttsEngine.volume) {
        this.ttsEngine.volume = volume;
      } else {
        this.ttsEngine.volume = volume;
      }
    }
    this.sendAnalyticsEvent('VolumeChange', Math.round(volume * 100));
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
    this.highlightChunk(chunk);
    this.scrollToChunk(chunk);
  }

  /**
   * @param {PageChunk} chunk
   */
  sendChunkFinishedAnalyticsEvent(chunk) {
    this.sendAnalyticsEvent('ChunkFinished-Words', approximateWordCount(chunk.text));
  }

  /**
   * Flip the page if the provided leaf index is not visible
   * @param {Number} leafIndex
   */
  async maybeFlipToIndex(leafIndex) {
    if (!this.br._isIndexDisplayed(leafIndex)) {
      this.br.jumpToIndex(leafIndex);
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

    $(`.pagediv${chunk.leafIndex} .ttsHiliteLayer rect`).last()?.[0]?.scrollIntoView({
      // Only vertically center the highlight if we're in 1up or in full screen. In
      // 2up, if we're not fullscreen, the whole body gets scrolled around to try to
      // center the highlight 🙄 See:
      // https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move/11041376
      // Note: nearest doesn't quite work great, because the ReadAloud toolbar is now
      // full-width, and covers up the last line of the highlight.
      block: this.br.constMode1up == this.br.mode || this.br.isFullscreenActive ? 'center' : 'nearest',
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
