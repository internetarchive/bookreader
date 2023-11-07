/* global BookReader */
/**
 * Plugin for Text to Speech in BookReader
 */
import FestivalTTSEngine from './FestivalTTSEngine.js';
import WebTTSEngine from './WebTTSEngine.js';
// import CompositeTTSEngine from './CompositeTTSEngine.js';
import { toISO6391, approximateWordCount } from './utils.js';
import { en as tooltips } from './tooltip_dict.js';
import { renderBoxesInPageContainerLayer } from '../../BookReader/PageContainer.js';
/** @typedef {import('./PageChunk.js').default} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").default} AbstractTTSEngine */

// Default options for TTS
jQuery.extend(BookReader.defaultOptions, {
  server: 'ia600609.us.archive.org',
  bookPath: '',
  enableTtsPlugin: true,
});

// Extend the constructor to add TTS properties
BookReader.prototype.setup = (function (super_) {
  return function (options) {
    super_.call(this, options);

    if (this.options.enableTtsPlugin) {
      /** @type { {[pageIndex: number]: Array<{ l: number, r: number, t: number, b: number }>} } */
      this._ttsBoxesByIndex = {};

      const engineOptions = {
        server: options.server,
        bookPath: options.bookPath,
        bookLanguage: toISO6391(options.bookLanguage),
        onLoadingStart: this.showProgressPopup.bind(this, 'Loading audio...'),
        onLoadingComplete: this.removeProgressPopup.bind(this),
        onDone: this.ttsStop.bind(this),
        beforeChunkPlay: this.ttsBeforeChunkPlay.bind(this),
        afterChunkPlay: this.ttsSendChunkFinishedAnalyticsEvent.bind(this),
      };

      /** @type {AbstractTTSEngine[]} */
      this.ttsEnginesAll = [
        new FestivalTTSEngine(engineOptions),
        new WebTTSEngine(engineOptions),
      ];
      let ttsEngine = this.ttsEnginesAll.find(engine => engine.isSupported());

      if (/_forceTTSEngine=(openai|browser)/.test(location.toString())) {
        const engineName = location.toString().match(/_forceTTSEngine=(openai|browser)/)[1];
        ttsEngine = { openai: this.ttsEnginesAll[0], browser: this.ttsEnginesAll[1] }[engineName];
      }

      if (ttsEngine) {
        /** @type {AbstractTTSEngine} */
        this.ttsEngine = ttsEngine;
      }
    }
  };
})(BookReader.prototype.setup);

BookReader.prototype.init = (function(super_) {
  return function() {
    if (this.options.enableTtsPlugin) {
      // Bind to events

      this.bind(BookReader.eventNames.PostInit, () => {
        this.$('.BRicon.read').click(() => {
          this.ttsToggle();
          return false;
        });
        if (this.ttsEngine) {
          this.ttsEngine.init();
          if (/[?&]_autoReadAloud=show/.test(location.toString())) {
            this.ttsStart(false); // false flag is to initiate read aloud controls
          }
        }
      });

      // This is fired when the hash changes by one of the other plugins!
      // i.e. it will fire every time the page changes -_-
      // this.bind(BookReader.eventNames.stop, function(e, br) {
      //     this.ttsStop();
      // }.bind(this));
    }
    super_.call(this);
  };
})(BookReader.prototype.init);

/** @override */
BookReader.prototype._createPageContainer = (function (super_) {
  return function (index) {
    const pageContainer = super_.call(this, index);
    if (this.options.enableTtsPlugin && pageContainer.page && index in this._ttsBoxesByIndex) {
      const pageIndex = pageContainer.page.index;
      renderBoxesInPageContainerLayer('ttsHiliteLayer', this._ttsBoxesByIndex[pageIndex], pageContainer.page, pageContainer.$container[0]);
    }
    return pageContainer;
  };
})(BookReader.prototype._createPageContainer);

// Extend buildMobileDrawerElement
BookReader.prototype.buildMobileDrawerElement = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (this.options.enableTtsPlugin && this.ttsEngine) {
      $el.find('.BRmobileMenu__moreInfoRow').after($(`
        <li>
            <span>
                <span class="DrawerIconWrapper"><img class="DrawerIcon" src="${this.imagesBaseURL}icon_speaker_open.svg" alt="info-speaker"/></span>
                Read Aloud
            </span>
            <div>
                <span class="larger">Press to toggle read aloud</span>
                <br/>
                <button class="BRicon read"></button>
            </div>
        </li>`));
    }
    return $el;
  };
})(BookReader.prototype.buildMobileDrawerElement);

// Extend initNavbar
BookReader.prototype.initNavbar = (function (super_) {
  return function () {
    const $el = super_.call(this);
    if (this.options.enableTtsPlugin && this.ttsEngine) {
      const engines = this.ttsEnginesAll.map(engine => {
        const url = new URL(location.toString());
        url.searchParams.set('_forceTTSEngine', engine.constructor.name == 'FestivalTTSEngine' ? 'openai' : 'browser');
        return {
          selected: engine === this.ttsEngine,
          name: engine.constructor.name == 'FestivalTTSEngine' ? 'OpenAI' : 'Browser',
          url,
        };
      });

      this.refs.$BRReadAloudToolbar = $(`
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
          <li>
            ${engines.map(({ selected, name, url }) => `
              <a href="${url}" class="engine ${selected ? 'selected' : ''}">${name}</a>
            `).join('')}
          </li>
        </ul>
      `);

      $el.find('.BRcontrols').prepend(this.refs.$BRReadAloudToolbar);

      const renderVoiceOption = (voices) => {
        return voices.map(voice =>
          `<option value="${voice.voiceURI}">${voice.lang} - ${voice.name}</option>`).join('');
      };

      const voiceSortOrder = (a,b) => `${a.lang} - ${a.name}`.localeCompare(`${b.lang} - ${b.name}`);

      const renderVoicesMenu = (voicesMenu) => {
        voicesMenu.empty();
        const bookLanguage = this.ttsEngine.opts.bookLanguage;
        const bookLanguages = this.ttsEngine.getVoices().filter(v => v.lang.startsWith(bookLanguage)).sort(voiceSortOrder);
        const otherLanguages = this.ttsEngine.getVoices().filter(v => !v.lang.startsWith(bookLanguage)).sort(voiceSortOrder);

        if (this.ttsEngine.getVoices().length > 1) {
          voicesMenu.append($(`<optgroup label="Book Language (${bookLanguage})"> ${renderVoiceOption(bookLanguages)} </optgroup>`));
          voicesMenu.append($(`<optgroup label="Other Languages"> ${renderVoiceOption(otherLanguages)} </optgroup>`));

          voicesMenu.val(this.ttsEngine.voice.voiceURI);
          voicesMenu.show();
        } else {
          voicesMenu.hide();
        }
      };

      const voicesMenu = this.refs.$BRReadAloudToolbar.find('[name=playback-voice]');
      renderVoicesMenu(voicesMenu);
      voicesMenu.on("change", ev => this.ttsEngine.setVoice(voicesMenu.val()));
      this.ttsEngine.events.on('pause resume start', () => this.ttsUpdateState());
      this.ttsEngine.events.on('voiceschanged', () => renderVoicesMenu(voicesMenu));
      this.refs.$BRReadAloudToolbar.find('[name=play]').on("click", this.ttsPlayPause.bind(this));
      this.refs.$BRReadAloudToolbar.find('[name=advance]').on("click", this.ttsJumpForward.bind(this));
      this.refs.$BRReadAloudToolbar.find('[name=review]').on("click", this.ttsJumpBackward.bind(this));
      const $rateSelector = this.refs.$BRReadAloudToolbar.find('select[name="playback-speed"]');
      $rateSelector.on("change", ev => this.ttsEngine.setPlaybackRate(parseFloat($rateSelector.val())));
      $(`<li>
          <button class="BRicon read js-tooltip" title="${tooltips.readAloud}">
            <div class="icon icon-read-aloud"></div>
            <span class="BRtooltip">${tooltips.readAloud}</span>
          </button>
        </li>`).insertBefore($el.find('.BRcontrols .BRicon.zoom_out').closest('li'));
    }
    return $el;
  };
})(BookReader.prototype.initNavbar);

// ttsToggle()
//______________________________________________________________________________
BookReader.prototype.ttsToggle = function () {
  if (this.autoStop) this.autoStop();
  if (this.ttsEngine.playing) {
    this.ttsStop();
  } else {
    this.ttsStart();
  }
};

// ttsStart(
//______________________________________________________________________________
BookReader.prototype.ttsStart = function (startTTSEngine = true) {
  if (this.constModeThumb == this.mode)
    this.switchMode(this.constMode1up);

  this.refs.$BRReadAloudToolbar.addClass('visible');
  this.$('.BRicon.read').addClass('unread active');
  this.ttsSendAnalyticsEvent('Start');
  if (startTTSEngine)
    this.ttsEngine.start(this.currentIndex(), this.book.getNumLeafs());
};

BookReader.prototype.ttsJumpForward = function () {
  if (this.ttsEngine.paused) {
    this.ttsEngine.resume();
  }
  this.ttsEngine.jumpForward();
};

BookReader.prototype.ttsJumpBackward = function () {
  if (this.ttsEngine.paused) {
    this.ttsEngine.resume();
  }
  this.ttsEngine.jumpBackward();
};

BookReader.prototype.ttsUpdateState = function() {
  const isPlaying = !(this.ttsEngine.paused || !this.ttsEngine.playing);
  this.$('.read-aloud [name=play]').toggleClass('playing', isPlaying);
};

BookReader.prototype.ttsPlayPause = function() {
  if (!this.ttsEngine.playing) {
    this.ttsToggle();
  } else {
    this.ttsEngine.togglePlayPause();
    this.ttsUpdateState();
  }
};

// ttsStop()
//______________________________________________________________________________
BookReader.prototype.ttsStop = function () {
  this.refs.$BRReadAloudToolbar.removeClass('visible');
  this.$('.BRicon.read').removeClass('unread active');
  this.ttsSendAnalyticsEvent('Stop');
  this.ttsEngine.stop();
  this.ttsRemoveHilites();
  this.removeProgressPopup();
};

/**
 * @param {PageChunk} chunk
 * @return {PromiseLike<void>} returns once the flip is done
 */
BookReader.prototype.ttsBeforeChunkPlay = async function(chunk) {
  await this.ttsMaybeFlipToIndex(chunk.leafIndex);
  this.ttsHighlightChunk(chunk);
  this.ttsScrollToChunk(chunk);
};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsSendChunkFinishedAnalyticsEvent = function(chunk) {
  this.ttsSendAnalyticsEvent('ChunkFinished-Words', approximateWordCount(chunk.text));
};

/**
 * Flip the page if the provided leaf index is not visible
 * @param {Number} leafIndex
 */
BookReader.prototype.ttsMaybeFlipToIndex = async function (leafIndex) {
  if (this.constMode2up != this.mode) {
    this.jumpToIndex(leafIndex);
  } else {
    await this._modes.mode2Up.mode2UpLit.jumpToIndex(leafIndex);
  }
};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsHighlightChunk = function(chunk) {
  // The poorly-named variable leafIndex
  const pageIndex = chunk.leafIndex;

  this.ttsRemoveHilites();

  // group by index; currently only possible to have chunks on one page :/
  this._ttsBoxesByIndex = {
    [pageIndex]: chunk.lineRects.map(([l, b, r, t]) => ({l, r, b, t}))
  };

  // update any already created pages
  for (const [pageIndexString, boxes] of Object.entries(this._ttsBoxesByIndex)) {
    const pageIndex = parseFloat(pageIndexString);
    const page = this.book.getPage(pageIndex);
    const pageContainers = this.getActivePageContainerElementsForIndex(pageIndex);
    pageContainers.forEach(container => renderBoxesInPageContainerLayer('ttsHiliteLayer', boxes, page, container));
  }
};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsScrollToChunk = function(chunk) {
  // It behaves weird if used in thumb mode
  if (this.constModeThumb == this.mode) return;

  $(`.pagediv${chunk.leafIndex} .ttsHiliteLayer rect`).last()?.[0]?.scrollIntoView({
    // Only vertically center the highlight if we're in 1up or in full screen. In
    // 2up, if we're not fullscreen, the whole body gets scrolled around to try to
    // center the highlight 🙄 See:
    // https://stackoverflow.com/questions/11039885/scrollintoview-causing-the-whole-page-to-move/11041376
    // Note: nearest doesn't quite work great, because the ReadAloud toolbar is now
    // full-width, and covers up the last line of the highlight.
    block: this.constMode1up == this.mode || this.isFullscreenActive ? 'center' : 'nearest',
    inline: 'center',
    behavior: 'smooth',
  });
};

// ttsRemoveHilites()
//______________________________________________________________________________
BookReader.prototype.ttsRemoveHilites = function () {
  $(this.getActivePageContainerElements()).find('.ttsHiliteLayer').remove();
  this._ttsBoxesByIndex = {};
};

/**
 * @private
 * Send an analytics event with an optional value. Also attaches the book's language.
 * @param {string} action
 * @param {number} [value]
 */
BookReader.prototype.ttsSendAnalyticsEvent = function(action, value) {
  if (this.archiveAnalyticsSendEvent) {
    const extraValues = {};
    const mediaLanguage = this.ttsEngine.opts.bookLanguage;
    if (mediaLanguage) extraValues.mediaLanguage = mediaLanguage;
    this.archiveAnalyticsSendEvent('BRReadAloud', action, value, extraValues);
  }
};
