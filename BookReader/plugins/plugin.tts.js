/**
 * Plugin for Text to Speech in BookReader
 */

// Default options for TTS
jQuery.extend(BookReader.defaultOptions, {
    server: 'ia600609.us.archive.org',
    bookPath: '',
    enableTtsPlugin: true,
});

/**
 * @typedef {[number, number, number, number]} DJVURect
 * coords are in l,b,r,t order
 */

/**
 * @typedef {[String, ...Array<DJVURect>]} DJVUChunk
 * A ~paragraph from DJVU with line rectangles.
 */

/** TTS using Festival endpoint */
class FestivalSpeechEngine {
    /**
     * 
     * @param {Object} options 
     * @param {String} options.server
     * @param {String} options.bookPath
     * @param {Number} options.numLeafs
     * @param {(starting: boolean, index) => boolean} options.maybeFlipHandler
     * @param {Function} options.onLoadingStart
     * @param {Function} options.onLoadingComplete
     * @param {(chunk: DJVUChunk) => void} options.beforeChunkStart
     */
    constructor(options) {
        this.playing = false;
        /** @type {Number} leaf index */
        this.leafIndex = null;
        /** @type {Number} index of active 'chunk'; index of this.chunks */
        this.chunkIndex = -1;
        this.buffering = false;
        /** @type {Number?} used in setInterval */
        this.poller = null;
        /** @type {'mp3' | 'ogg'} format of audio to get */
        this.audioFormat = null;
        /** @type {Array<DJVUChunk>} Chunks currently being read */
        this.chunks = null;
        /** @type {Array<DJVUChunk>} Chunks to read */
        this.prefetchedChunks = null;
        /** @type {Boolean} Whether this tts engine can run */
        this.isSupported = typeof(soundManager) !== 'undefined' && soundManager.supported();

        this.server = options.server;
        this.bookPath = options.bookPath;
        this.numLeafs = options.numLeafs;
        this.maybeFlipHandler = options.maybeFlipHandler;
        this.onLoadingStart = options.onLoadingStart;
        this.onLoadingComplete = options.onLoadingComplete;
        this.beforeChunkStart = options.beforeChunkStart;
    }

    init() {
        if (this.isSupported) {
            this.setupSoundManager();
        }
    }

    /**
     * @private
     */
    setupSoundManager() {
        soundManager.setup({
            debugMode: false,
            // Note, there's a bug in Chrome regarding range requests.
            // Flash is used as a workaround.
            // See https://bugs.chromium.org/p/chromium/issues/detail?id=505707
            preferFlash: true,
            url: '/bookreader/BookReader/soundmanager/swf',
            useHTML5Audio: true,
            //flash 8 version of swf is buggy when calling play() on a sound that is still loading
            flashVersion: 9
        });
    }

    /**
     * @private
     * Gets the text on a page with given index
     * @param {String|Number} index
     * @return {PromiseLike<Array<DJVUChunk>>}
     */
    getText(index) {
        var url = 'https://'+this.server+'/BookReader/BookReaderGetTextWrapper.php?path='+this.bookPath+'_djvu.xml&page='+index;
        return $.ajax({
          url: url,
          dataType:'jsonp'
        });
    }

    /**
     * @private
     * Get URL for audio that says this text
     * @param {String} dataString the thing to say
     */
    getSoundUrl(dataString) {
        return 'https://'+this.server+'/BookReader/BookReaderGetTTS.php?string='
                  + encodeURIComponent(dataString)
                  + '&format=.'+this.audioFormat;
    }

    /**
     * @param {Number} leafIndex
     */
    start(leafIndex) {
        if (soundManager.debugMode) console.log('starting readAloud');
        this.leafIndex = leafIndex;
        this.audioFormat = $.browser.mozilla ? 'ogg' : 'mp3';

        this.startWithChunks(null);
        if (navigator.userAgent.match(/mobile/i)) {
            // HACK for iOS. Security restrictions require playback to be triggered
            // by a user click/touch. This intention gets lost in the ajax callback
            // above, but for some reason, if we start the audio here, it works
            soundManager.createSound({url: this.getSoundUrl(' ')}).play();
        }
    }

    stop() {
        if (soundManager.debugMode) console.log('stopping readaloud');
        soundManager.stopAll();
        soundManager.destroySound('chunk'+this.leafIndex+'-'+this.chunkIndex);

        this.playing = false;
        this.leafIndex = null;
        this.chunkIndex = -1;
        this.buffering = false;
        this.poller = null;
    }

    /**
     * @private
     * 1. advance chunkIndex
     * 2. if necessary, advance leafIndex, and copy nextChunks to chunks
     * 3. if necessary, flip to current page, or scroll so chunk is visible
     * 4. do something smart if nextChunks has not yet finished preloading (TODO)
     * 5. stop playing at end of book
     * @param {Boolean} starting whether just started readaloud
     * @return {Boolean} whether we could advance
     */
    advance(starting) {
        this.chunkIndex++;

        if (this.chunkIndex >= this.chunks.length) {
            if (this.leafIndex == (this.numLeafs - 1)) {
                if (soundManager.debugMode) console.log('tts stop');
                return false;
            }
            if ((null != this.prefetchedChunks) || (starting)) {
                if (soundManager.debugMode) console.log('moving to next page!');
                this.leafIndex++;
                this.chunkIndex = 0;
                this.chunks = this.prefetchedChunks;
                this.prefetchedChunks = null;
                return this.maybeFlipHandler(starting, this.leafIndex);
            } else {
                if (soundManager.debugMode) console.log('tts advance: nextChunks is null');
                return false;
            }
        }

        return true;
    }

    /**
     * @private
     * Create the sounds from the provided text
     * @param {Array<DJVUChunk>} [chunks] 
     */
    startWithChunks(chunks) {
        if (soundManager.debugMode)  console.log('ttsstartWithChunks got data: ' + chunks);

        // Starting
        if (!chunks) {
            this.getText(this.leafIndex).then(this.startWithChunks.bind(this));
            return;
        }

        // Page is blank
        if (!chunks.length) {
            if (soundManager.debugMode) console.log('first page is blank!');
            if (this.advance(true)) {
                this.getText(this.leafIndex).then(this.startWithChunks.bind(this));
            }
            return;
        }

        this.chunks = chunks;

        this.onLoadingStart();

        var chunkText = chunks[0][0];
        this.chunkIndex = -1;
        this.loadTextAudio(this.leafIndex, 0, chunkText, this.onLoadingComplete.bind(this));
        this.nextChunk();
    }

    /**
     * @private
     * Play the current chunk
     */
    play() {
        var chunk = this.chunks[this.chunkIndex];
        if (soundManager.debugMode) {
            console.log('ttsPlay position = ' + this.chunkIndex);
            console.log('chunk = ' + chunk);
            console.log(this.chunks);
        }

        this.beforeChunkStart(chunk);

        //play current chunk
        var soundId = 'chunk'+this.leafIndex+'-'+this.chunkIndex;
        if (false == this.buffering) {
            soundManager.play(soundId, { onfinish: this.nextChunk.bind(this) });
        } else {
            soundManager.play(soundId, { onfinish: this.startPolling.bind(this) });
        }
    }

    /**
     * @private
     * Play of the current chunk has ended, but the next chunk has not yet been loaded.
     * We need to wait for the text for the next page to be loaded, so we can
     * load the next audio chunk
     */
    startPolling() {
        if (soundManager.debugMode) console.log('Starting the TTS poller...');
        var self = this;
        this.poller = setInterval(function() {
            if (self.buffering) {return;}
    
            if (soundManager.debugMode) console.log('TTS buffering finished!');
            clearInterval(self.poller);
            self.poller = null;
            self.prefetchAudio();
            self.nextChunk();
        }, 500);
    }

    /**
     * @private
     * Preloads the audio for the next chunk
     */
    prefetchAudio() {
        if(false != this.buffering) {
            alert('TTS Error: prefetch() called while content still buffering!');
            return;
        }
    
        //preload next chunk
        var nextPos = this.chunkIndex+1;
        if (nextPos < this.chunks.length) {
            this.loadTextAudio(this.leafIndex, nextPos, this.chunks[nextPos][0]);
        } else {
            //for a short page, preload might nt have yet returned..
            if (soundManager.debugMode) console.log('preloading chunk 0 from next page, index='+(this.leafIndex+1));
            if (null != this.prefetchedChunks) {
                if (0 != this.prefetchedChunks.length) {
                    this.loadTextAudio(this.leafIndex+1, 0, this.prefetchedChunks[0][0]);
                } else {
                    if (soundManager.debugMode) console.log('prefetchAudio(): nextChunks is zero length!');
                }
            } else {
                if (soundManager.debugMode) console.log('nextChunks is null, not preloading next page');
                this.buffering = true;
            }
        }
    }

    /**
     * @private
     * Loads the audio for the provided text
     * @param {Number} page 
     * @param {Number} pos 
     * @param {String} text text to read
     * @param {Function} [onload] callback to call once loading completed
     */
    loadTextAudio(page, pos, text, onload) {
        var soundConfig = {
            id: 'chunk'+page+'-'+pos,
            url: this.getSoundUrl(text)
        };
        if (onload) {
            // Many soundManger2 callbacks are broken when using HTML5 audio.
            // whileloading: broken on safari, worked in FF4, but broken on FireFox 5
            // onload: fires on safari, but *after* the sound starts playing, and does not fire in FF or IE9
            // onbufferchange: fires in FF5 using HTML5 audio, but not in safari using flash audio
            // whileplaying: fires everywhere

            $.extend(soundConfig, {
                onload: onload,
                //fires in FF and IE9
                onready: onload,
                //fires in safari...
                onbufferchange: function() {
                    if (false == this.isBuffering) {
                        onload();
                    }
                }
            });
        }
        soundManager.createSound(soundConfig).load();
    }

    /**
     * @private
     * This function into two parts: nextChunk gets run before page flip animation
     * and nextChunkPhase2 get run after page flip animation.
     * If a page flip is necessary, advance() will return false so Phase2 isn't
     * called. Instead, this.animationFinishedCallback is set, so that Phase2
     * continues after animation is finished.
     */
    nextChunk() {
        if (soundManager.debugMode) console.log('nextchunk pos=' + this.chunkIndex);

        if (-1 != this.chunkIndex) {
            soundManager.destroySound('chunk'+this.leafIndex+'-'+this.chunkIndex);
        }
    
        var moreToPlay = this.advance(false);
        if (moreToPlay) {
            this.nextChunkPhase2();
        }
    
        //This function is called again when play() has finished playback.
        //If the next chunk of text has not yet finished loading, play()
        //will start polling until the next chunk is ready.
    }

    /**
     * @public
     * FIXME This should be private
     * page flip animation has now completed
     */
    nextChunkPhase2() {
        if (null == this.chunks) {
            alert('error: chunks is null?'); //TODO
            return;
        }
    
        if (0 == this.chunks.length) {
            if (soundManager.debugMode) console.log('ttsNextChunk2: chunks.length is zero.. hacking...');
            this.startWithChunks(this.chunks);
            return;
        }
    
        if (soundManager.debugMode) console.log('next chunk is ' + this.chunkIndex);
    
        //prefetch next page of text
        if (0 == this.chunkIndex && this.leafIndex < (this.numLeafs-1)) {
            this.getText(this.leafIndex+1).then(this.savePrefetchedChunks.bind(this));
        }
    
        this.prefetchAudio();
        this.play();
    }

    /**
     * @private
     * @param {Array<DJVUChunk>} chunks 
     */
    savePrefetchedChunks(chunks) {
        this.prefetchedChunks = chunks;
        if (soundManager.debugMode) console.log('preloaded next chunks.. data is ' + chunks);
    
        if (true == this.buffering) {
            if (soundManager.debugMode) console.log('nextPageCB: buffering is true');
            this.buffering = false;
        }
    }
}

// Extend the constructor to add TTS properties
BookReader.prototype.setup = (function (super_) {
    return function (options) {
        super_.call(this, options);

        if (this.options.enableTtsPlugin) {
            this.ttsEngine = new FestivalSpeechEngine({
                server: options.server,
                bookPath: options.bookPath,
                numLeafs: this.getNumLeafs(),
                maybeFlipHandler: this.ttsMaybeFlip.bind(this),
                onLoadingStart: this.showProgressPopup.bind(this, 'Loading audio...'),
                onLoadingComplete: this.removeProgressPopup.bind(this),
                beforeChunkStart: this.ttsHighlightChunk.bind(this)
            });
            this.ttsHilites = [];
        }
    };
})(BookReader.prototype.setup);

BookReader.prototype.init = (function(super_) {
    return function() {
        if (this.options.enableTtsPlugin) {
            // Bind to events
            this.bind(BookReader.eventNames.PostInit, function(e, br) {
                jIcons = br.$('.BRicon.read').click(function(e) {
                    br.ttsToggle();
                    return false;
                });
                br.ttsEngine.init();
            });

            this.bind(BookReader.eventNames.stop, function(e, br) {
                this.ttsStop();
            }.bind(this));
        }
        super_.call(this);
    };
})(BookReader.prototype.init);


// Extend buildMobileDrawerElement
BookReader.prototype.buildMobileDrawerElement = (function (super_) {
    return function () {
        var $el = super_.call(this);
        if (this.options.enableTtsPlugin && this.ttsEngine.isSupported) {
            $el.find('.BRmobileMenu__moreInfoRow').after($(
                "    <li>"
                +"      <span>"
                +"        <span class=\"DrawerIconWrapper \"><img class=\"DrawerIcon\" src=\""+this.imagesBaseURL+"icon_speaker_open.svg\" alt=\"info-speaker\"/></span>"
                +"        Read Aloud"
                +"      </span>"
                +"      <div>"
                +"        <span class='larger'>Press to toggle read aloud</span> <br/>"
                +"        <button class='BRicon read'></button>"
                +"      </div>"
                +"    </li>"
            ));
        };
        return $el;
    };
})(BookReader.prototype.buildMobileDrawerElement);

// Extend initNavbar
BookReader.prototype.initNavbar = (function (super_) {
    return function () {
        var $el = super_.call(this);
        var readIcon = '';
        if (this.options.enableTtsPlugin && this.ttsEngine.isSupported) {
            $("<button class='BRicon read js-tooltip'></button>").insertAfter($el.find('.BRpage .BRicon.thumb'));
        }
        return $el;
    };
})(BookReader.prototype.initNavbar);

// ttsToggle()
//______________________________________________________________________________
BookReader.prototype.ttsToggle = function () {
    if (this.autoStop) this.autoStop();
    if (false == this.ttsEngine.playing) {
        this.ttsEngine.playing = true;
        this.showProgressPopup('Loading audio...');
        this.ttsStart();
    } else {
        this.ttsStop();
    }
};

// ttsStart(
//______________________________________________________________________________
BookReader.prototype.ttsStart = function () {
    if (this.constModeThumb == this.mode)
        this.switchMode(this.constMode1up);

    this.$('.BRicon.read').addClass('unread');
    this.ttsEngine.start(this.currentIndex());
};

// ttsStop()
//______________________________________________________________________________
BookReader.prototype.ttsStop = function () {
    if (false == this.ttsEngine.playing) return;
    this.$('.BRicon.read').removeClass('unread');

    this.ttsEngine.stop();
    this.ttsRemoveHilites();
    this.removeProgressPopup();
};

// ttsMaybeFlip()
//______________________________________________________________________________
// A page flip might be necessary. This code is confusing since
// nextChunks might be null if we are starting on a blank page.
BookReader.prototype.ttsMaybeFlip = function (starting, leafIndex) {
    if (this.constMode2up == this.mode) {
        if ((leafIndex != this.twoPage.currentIndexL) && (leafIndex != this.twoPage.currentIndexR)) {
            if (!starting) {
                this.animationFinishedCallback = this.ttsEngine.nextChunkPhase2.bind(this.ttsEngine);
                this.next();
                return false;
            } else {
                this.next();
                return true;
            }
        } else {
            return true;
        }
    }

    return true;
}

// ttsHighlightChunk()
//______________________________________________________________________________
BookReader.prototype.ttsHighlightChunk = function(chunk) {
    this.ttsRemoveHilites();

    if (this.constMode2up == this.mode) {
        this.ttsHilite2UP(chunk);
    } else {
        this.ttsHilite1UP(chunk);
    }

    this.ttsScrollToChunk(chunk);
};

// scrollToChunk()
//______________________________________________________________________________
BookReader.prototype.ttsScrollToChunk = function(chunk) {
    if (this.constMode1up != this.mode) return;

    var leafTop = 0;
    var h;
    var i;
    for (i=0; i<this.ttsEngine.leafIndex; i++) {
        h = parseInt(this._getPageHeight(i)/this.reduce);
        leafTop += h + this.padding;
    }

    var chunkTop = chunk[1][3]; //coords are in l,b,r,t order
    var chunkBot = chunk[chunk.length-1][1];

    var topOfFirstChunk = leafTop + chunkTop/this.reduce;
    var botOfLastChunk  = leafTop + chunkBot/this.reduce;

    if (soundManager.debugMode) console.log('leafTop = ' + leafTop + ' topOfFirstChunk = ' + topOfFirstChunk + ' botOfLastChunk = ' + botOfLastChunk);

    var containerTop = this.refs.$brContainer.prop('scrollTop');
    var containerBot = containerTop + this.refs.$brContainer.height();
    if (soundManager.debugMode) console.log('containerTop = ' + containerTop + ' containerBot = ' + containerBot);

    if ((topOfFirstChunk < containerTop) || (botOfLastChunk > containerBot)) {
        this.refs.$brContainer.stop(true).animate({scrollTop: topOfFirstChunk},'fast');
    }
};

// ttsHilite1UP()
//______________________________________________________________________________
BookReader.prototype.ttsHilite1UP = function(chunk) {
    var i;
    for (i=1; i<chunk.length; i++) {
        //each rect is an array of l,b,r,t coords (djvu.xml ordering...)
        var l = chunk[i][0];
        var b = chunk[i][1];
        var r = chunk[i][2];
        var t = chunk[i][3];

        var div = document.createElement('div');
        this.ttsHilites.push(div);
        $(div).prop('className', 'BookReaderSearchHilite').appendTo(
            this.$('.pagediv'+this.ttsEngine.leafIndex)
        );

        $(div).css({
            width:  (r-l)/this.reduce + 'px',
            height: (b-t)/this.reduce + 'px',
            left:   l/this.reduce + 'px',
            top:    t/this.reduce +'px'
        });
    }

};

// ttsHilite2UP()
//______________________________________________________________________________
BookReader.prototype.ttsHilite2UP = function (chunk) {
    var i;
    for (i=1; i<chunk.length; i++) {
        //each rect is an array of l,b,r,t coords (djvu.xml ordering...)
        var l = chunk[i][0];
        var b = chunk[i][1];
        var r = chunk[i][2];
        var t = chunk[i][3];

        var div = document.createElement('div');
        this.ttsHilites.push(div);
        $(div).prop('className', 'BookReaderSearchHilite').css('zIndex', 3).appendTo(this.refs.$brTwoPageView);
        this.setHilightCss2UP(div, this.ttsEngine.leafIndex, l, r, t, b);
    }
};

// ttsRemoveHilites()
//______________________________________________________________________________
BookReader.prototype.ttsRemoveHilites = function (chunk) {
    $(this.ttsHilites).remove();
    this.ttsHilites = [];
};
