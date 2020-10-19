/* global BookReader, soundManager */
/**
 * Plugin for Text to Speech in BookReader
 */
import FestivalTTSEngine from './FestivalTTSEngine.js';
import WebTTSEngine from './WebTTSEngine.js';
import { toISO6391, approximateWordCount } from './utils.js';
import { en as tooltips } from './tooltip_dict.js';
/** @typedef {import('./PageChunk.js')} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js")} AbstractTTSEngine */

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
      this.ttsHilites = [];
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
          server: options.server,
          bookPath: options.bookPath,
          bookLanguage: toISO6391(options.bookLanguage),
          onLoadingStart: this.showProgressPopup.bind(this, 'Loading audio...'),
          onLoadingComplete: this.removeProgressPopup.bind(this),
          onDone: this.ttsStop.bind(this),
          beforeChunkPlay: this.ttsBeforeChunkPlay.bind(this),
          afterChunkPlay: this.ttsSendChunkFinishedAnalyticsEvent.bind(this),
        });
      }
    }
  };
})(BookReader.prototype.setup);

BookReader.prototype.init = (function(super_) {
  return function() {
    if (this.options.enableTtsPlugin) {
      // Bind to events

      // TODO move this to BookReader.js or something
      this.bind(BookReader.eventNames.fragmentChange, () => {
        if (this.mode == this.constMode2up) {
          // clear highlights if they're no longer valid for this page
          const visibleIndices = [this.twoPage.currentIndexL, this.twoPage.currentIndexR];
          const visibleSelector = visibleIndices.map(i => `.BRReadAloudHilite.Leaf-${i}`).join(', ');
          $(this.ttsHilites).filter(visibleSelector).show();
          $(this.ttsHilites).not(visibleSelector).hide();
        }
      });

      this.bind(BookReader.eventNames.PostInit, () => {
        this.$('.BRicon.read').click(() => {
          this.ttsToggle();
          return false;
        });
        if (this.ttsEngine) {
          this.ttsEngine.init();
          if (/[?&]_autoReadAloud=show/.test(location.toString())) {
            this.refs.$BRReadAloudToolbar.show();
            this.$('.BRicon.read').addClass('unread active');
            this.$('.read-aloud [name=play]').addClass('playing');
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
        </ul>
      `);
      $el.find('.BRcontrols').prepend(this.refs.$BRReadAloudToolbar);
      this.ttsEngine.events.on('pause resume start', () => this.ttsUpdateState());
      this.refs.$BRReadAloudToolbar.find('[name=play]').click(this.ttsPlayPause.bind(this));
      this.refs.$BRReadAloudToolbar.find('[name=advance]').click(this.ttsJumpForward.bind(this));
      this.refs.$BRReadAloudToolbar.find('[name=review]').click(this.ttsJumpBackward.bind(this));
      const $rateSelector = this.refs.$BRReadAloudToolbar.find('select[name="playback-speed"]');
      $rateSelector.change(ev => this.ttsEngine.setPlaybackRate(parseFloat($rateSelector.val())));
      $(`<li>
          <button class="BRicon read js-tooltip" title="${tooltips.readAloud}">
            <div class="icon icon-read-aloud"></div>
            <span class="tooltip">${tooltips.readAloud}</span>
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
BookReader.prototype.ttsStart = function () {
  if (this.constModeThumb == this.mode)
    this.switchMode(this.constMode1up);

  this.refs.$BRReadAloudToolbar.addClass('visible');
  setTimeout(() => this.refs.$BRReadAloudToolbar.addClass('animate'), 20);
  this.$('.BRicon.read').addClass('unread active');
  this.ttsSendAnalyticsEvent('Start');
  this.ttsEngine.start(this.currentIndex(), this.getNumLeafs());
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
    this.ttsUpdateState(this.ttsEngine.paused);
  }
};

// ttsStop()
//______________________________________________________________________________
BookReader.prototype.ttsStop = function () {
  this.refs.$BRReadAloudToolbar.removeClass('animate');
  setTimeout(() => this.refs.$BRReadAloudToolbar.removeClass('visible'), 250);
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
BookReader.prototype.ttsBeforeChunkPlay = function(chunk) {
  return this.ttsMaybeFlipToIndex(chunk.leafIndex)
    .then(() => {
      this.ttsHighlightChunk(chunk);
      this.ttsScrollToChunk(chunk);
    });
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
 * @return {PromiseLike<void>} resolves once the flip animation has completed
 */
BookReader.prototype.ttsMaybeFlipToIndex = function (leafIndex) {
  const in2PageMode = this.constMode2up == this.mode;
  let resolve = null;
  const promise = new Promise(res => resolve = res);

  if (!in2PageMode) {
    this.jumpToIndex(leafIndex);
    resolve();
  } else {
    const leafVisible = leafIndex == this.twoPage.currentIndexR || leafIndex == this.twoPage.currentIndexL;
    if (leafVisible) {
      resolve();
    } else {
      this.animationFinishedCallback = resolve;
      const mustGoNext = leafIndex > Math.max(this.twoPage.currentIndexR, this.twoPage.currentIndexL);
      if (mustGoNext) this.next();
      else this.prev();
      promise.then(this.ttsMaybeFlipToIndex.bind(this, leafIndex));
    }
  }

  return promise;
}

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsHighlightChunk = function(chunk) {
  this.ttsRemoveHilites();

  if (this.constMode2up == this.mode) {
    this.ttsHilite2UP(chunk);
  } else {
    this.ttsHilite1UP(chunk);
  }
};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsScrollToChunk = function(chunk) {
  if (this.constMode1up != this.mode) return;

  let leafTop = 0;
  let h;
  let i;
  for (i = 0; i < chunk.leafIndex; i++) {
    h = parseInt(this._getPageHeight(i) / this.reduce);
    leafTop += h + this.padding;
  }

  const chunkTop = chunk.lineRects[0][3]; //coords are in l,b,r,t order
  const chunkBot = chunk.lineRects[chunk.lineRects.length - 1][1];

  const topOfFirstChunk = leafTop + chunkTop / this.reduce;
  const botOfLastChunk  = leafTop + chunkBot / this.reduce;

  if (soundManager.debugMode) console.log('leafTop = ' + leafTop + ' topOfFirstChunk = ' + topOfFirstChunk + ' botOfLastChunk = ' + botOfLastChunk);

  const containerTop = this.refs.$brContainer.prop('scrollTop');
  const containerBot = containerTop + this.refs.$brContainer.height();
  if (soundManager.debugMode) console.log('containerTop = ' + containerTop + ' containerBot = ' + containerBot);

  if ((topOfFirstChunk < containerTop) || (botOfLastChunk > containerBot)) {
    this.refs.$brContainer.stop(true).animate({scrollTop: topOfFirstChunk},'fast');
  }
};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsHilite1UP = function(chunk) {
  for (let i = 0; i < chunk.lineRects.length; i++) {
    //each rect is an array of l,b,r,t coords (djvu.xml ordering...)
    const l = chunk.lineRects[i][0];
    const b = chunk.lineRects[i][1];
    const r = chunk.lineRects[i][2];
    const t = chunk.lineRects[i][3];

    const div = document.createElement('div');
    this.ttsHilites.push(div);
    $(div).prop('className', 'BookReaderSearchHilite').appendTo(
      this.$('.pagediv' + chunk.leafIndex)
    );

    $(div).css({
      width:  (r - l) / this.reduce + 'px',
      height: (b - t) / this.reduce + 'px',
      left:   l / this.reduce + 'px',
      top:    t / this.reduce + 'px'
    });
  }

};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsHilite2UP = function (chunk) {
  for (let i = 0; i < chunk.lineRects.length; i++) {
    //each rect is an array of l,b,r,t coords (djvu.xml ordering...)
    const l = chunk.lineRects[i][0];
    const b = chunk.lineRects[i][1];
    const r = chunk.lineRects[i][2];
    const t = chunk.lineRects[i][3];

    const div = document.createElement('div');
    this.ttsHilites.push(div);
    $(div)
      .prop('className', 'BookReaderSearchHilite BRReadAloudHilite Leaf-' + chunk.leafIndex)
      .css('zIndex', 3)
      .appendTo(this.refs.$brTwoPageView);
    this.setHilightCss2UP(div, chunk.leafIndex, l, r, t, b);
  }
};

// ttsRemoveHilites()
//______________________________________________________________________________
BookReader.prototype.ttsRemoveHilites = function () {
  $(this.ttsHilites).remove();
  this.ttsHilites = [];
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
