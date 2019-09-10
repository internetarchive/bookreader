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
     * @param {Function} options.ttsNextChunk
     * @param {Function} options.ttsPrefetchAudio
     * @param {(chunk: DJVUChunk) => void} options.onPlayStart
     */
    constructor(options) {
        this.ttsPlaying     = false;
        this.ttsIndex       = null;  //leaf index
        this.ttsPosition    = -1;    //chunk (paragraph) number
        this.ttsBuffering   = false;
        this.ttsPoller      = null;
        this.ttsFormat      = null;
        /** @type {Array<DJVUChunk>} */
        this.ttsChunks      = null;
        this.ttsNextChunks  = null;

        this.server = options.server;
        this.bookPath = options.bookPath;
        this.numLeafs = options.numLeafs;
        this.maybeFlipHandler = options.maybeFlipHandler;
        this.onLoadingStart = options.onLoadingStart;
        this.onLoadingComplete = options.onLoadingComplete;
        this.ttsNextChunk = options.ttsNextChunk;
        this.ttsPrefetchAudio = options.ttsPrefetchAudio;
        this.onPlayStart = options.onPlayStart;

        this.isSoundManagerSupported = false;

        if (typeof(soundManager) !== 'undefined') {
            this.isSoundManagerSupported = soundManager.supported();
        }
    }

    init() {
        if (this.isSoundManagerSupported) {
            this.setupSoundManager();
        }
    }

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
     * Gets the text on a page with given index
     * @param {String|Number} index
     * @param {Function} callback 
     */
    getText(index, callback) {
        var url = 'https://'+this.server+'/BookReader/BookReaderGetTextWrapper.php?path='+this.bookPath+'_djvu.xml&page='+index;
        this.ttsAjax = $.ajax({
          url: url,
          dataType:'jsonp',
          success: callback
        });
    }

    /**
     * Get URL for audio that says this text
     * @param {String} dataString the thing to say
     */
    getSoundUrl(dataString) {
        return 'https://'+this.server+'/BookReader/BookReaderGetTTS.php?string='
                  + dataString
                  + '&format=.'+this.ttsFormat;
    }

    /**
     * @param {String|Number} index leaf index
     */
    start(index) {
        if (soundManager.debugMode) console.log('starting readAloud');
        this.ttsIndex = index;
        this.ttsFormat = 'mp3';
        if ($.browser.mozilla) {
            this.ttsFormat = 'ogg';
        }

        this.getText(this.ttsIndex, this.startCB.bind(this));
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
        soundManager.destroySound('chunk'+this.ttsIndex+'-'+this.ttsPosition);

        this.ttsPlaying     = false;
        this.ttsIndex       = null;  //leaf index
        this.ttsPosition    = -1;    //chunk (paragraph) number
        this.ttsBuffering   = false;
        this.ttsPoller      = null;
    }

    /**
     * 1. advance ttsPosition
     * 2. if necessary, advance ttsIndex, and copy ttsNextChunks to ttsChunks
     * 3. if necessary, flip to current page, or scroll so chunk is visible
     * 4. do something smart is ttsNextChunks has not yet finished preloading (TODO)
     * 5. stop playing at end of book
     * @param {Boolean} starting 
     */
    advance(starting) {
        this.ttsPosition++;
        if (this.ttsPosition >= this.ttsChunks.length) {
            if (this.ttsIndex == (this.numLeafs - 1)) {
                if (soundManager.debugMode) console.log('tts stop');
                return false;
            } else {
                if ((null != this.ttsNextChunks) || (starting)) {
                    if (soundManager.debugMode) console.log('moving to next page!');
                    this.ttsIndex++;
                    this.ttsPosition = 0;
                    this.ttsChunks = this.ttsNextChunks;
                    this.ttsNextChunks = null;
                    return this.maybeFlipHandler(starting, this.ttsIndex);
                } else {
                    if (soundManager.debugMode) console.log('tts advance: ttsNextChunks is null');
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Create the sounds from the provided text
     * @param {Array<DJVUChunk>} data 
     */
    startCB(data) {
        if (soundManager.debugMode)  console.log('ttsStartCB got data: ' + data);
        this.ttsChunks = data;

        //deal with the page being blank
        if (0 == data.length) {
            if (soundManager.debugMode) console.log('first page is blank!');
            if(this.advance(true)) {
                this.getText(this.ttsIndex, this.startCB.bind(this));
            }
            return;
        }

        this.onLoadingStart();

        ///// Many soundManger2 callbacks are broken when using HTML5 audio.
        ///// whileloading: broken on safari, worked in FF4, but broken on FireFox 5
        ///// onload: fires on safari, but *after* the sound starts playing, and does not fire in FF or IE9
        ///// onbufferchange: fires in FF5 using HTML5 audio, but not in safari using flash audio
        ///// whileplaying: fires everywhere

        var dataString = data[0][0];
        dataString = encodeURIComponent(dataString);
        var soundUrl = this.getSoundUrl(dataString);
        this.ttsPosition = -1;
        var onLoadingComplete = this.onLoadingComplete;
        var snd = soundManager.createSound({
            id: 'chunk'+this.ttsIndex+'-0',
            url: soundUrl,
            onload: onLoadingComplete,
            //fires in safari...
            onbufferchange: function() {
                if (false == this.isBuffering) {
                    onLoadingComplete();
                }
            },
            //fires in FF and IE9
            onready: onLoadingComplete
        });
        snd.load();

        this.ttsNextChunk();
    }

    play() {
        var chunk = this.ttsChunks[this.ttsPosition];
        if (soundManager.debugMode) {
            console.log('ttsPlay position = ' + this.ttsPosition);
            console.log('chunk = ' + chunk);
            console.log(this.ttsChunks);
        }

        this.onPlayStart(chunk);

        //play current chunk
        var soundId = 'chunk'+this.ttsIndex+'-'+this.ttsPosition;
        if (false == this.ttsBuffering) {
            soundManager.play(soundId, { onfinish: this.ttsNextChunk });
        } else {
            soundManager.play(soundId, { onfinish: this.startPolling.bind(this) });
        }
    }

    /**
     * Play of the current chunk has ended, but the next chunk has not yet been loaded.
     * We need to wait for the text for the next page to be loaded, so we can
     * load the next audio chunk
     */
    startPolling() {
        if (soundManager.debugMode) console.log('Starting the TTS poller...');
        var self = this;
        this.ttsPoller = setInterval(function() {
            if (self.ttsBuffering) {return;}
    
            if (soundManager.debugMode) console.log('TTS buffering finished!');
            clearInterval(self.ttsPoller);
            self.ttsPoller = null;
            self.ttsPrefetchAudio();
            self.ttsNextChunk();
        }, 500);
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
                ttsNextChunk: this.ttsNextChunk.bind(this),
                ttsPrefetchAudio: this.ttsPrefetchAudio.bind(this),
                onPlayStart: this.ttsHighlightChunk.bind(this)
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
        if (this.options.enableTtsPlugin && this.ttsEngine.isSoundManagerSupported) {
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
        if (this.options.enableTtsPlugin && this.ttsEngine.isSoundManagerSupported) {
            $("<button class='BRicon read js-tooltip'></button>").insertAfter($el.find('.BRpage .BRicon.thumb'));
        }
        return $el;
    };
})(BookReader.prototype.initNavbar);

// ttsToggle()
//______________________________________________________________________________
BookReader.prototype.ttsToggle = function () {
    if (this.autoStop) this.autoStop();
    if (false == this.ttsEngine.ttsPlaying) {
        this.ttsEngine.ttsPlaying = true;
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
    if (false == this.ttsEngine.ttsPlaying) return;
    this.$('.BRicon.read').removeClass('unread');

    this.ttsEngine.stop();
    this.ttsRemoveHilites();
    this.removeProgressPopup();
};

// ttsNextPageCB
//______________________________________________________________________________
BookReader.prototype.ttsNextPageCB = function (data) {
    this.ttsEngine.ttsNextChunks = data;
    if (soundManager.debugMode) console.log('preloaded next chunks.. data is ' + data);

    if (true == this.ttsEngine.ttsBuffering) {
        if (soundManager.debugMode) console.log('ttsNextPageCB: ttsBuffering is true');
        this.ttsEngine.ttsBuffering = false;
    }
};

// ttsLoadChunk
//______________________________________________________________________________
BookReader.prototype.ttsLoadChunk = function (page, pos, string) {
    var snd = soundManager.createSound({
     id: 'chunk'+page+'-'+pos,
     url: 'https://'+this.ttsEngine.server+'/BookReader/BookReaderGetTTS.php?string=' + encodeURIComponent(string) + '&format=.'+this.ttsEngine.ttsFormat //the .ogg is to trick SoundManager2 to use the HTML5 audio player
    });
    snd.br = this;
    snd.load()
};


// ttsNextChunk()
//______________________________________________________________________________
// This function into two parts: ttsNextChunk gets run before page flip animation
// and ttsNextChunkPhase2 get run after page flip animation.
// If a page flip is necessary, advance() will return false so Phase2 isn't
// called. Instead, this.animationFinishedCallback is set, so that Phase2
// continues after animation is finished.

BookReader.prototype.ttsNextChunk = function () {
    if (soundManager.debugMode) console.log('nextchunk pos=' + this.ttsEngine.ttsPosition);

    if (-1 != this.ttsEngine.ttsPosition) {
        soundManager.destroySound('chunk'+this.ttsEngine.ttsIndex+'-'+this.ttsEngine.ttsPosition);
    }

    this.ttsRemoveHilites(); //remove old hilights

    var moreToPlay = this.ttsEngine.advance(false);

    if (moreToPlay) {
        this.ttsNextChunkPhase2();
    }

    //This function is called again when ttsPlay() has finished playback.
    //If the next chunk of text has not yet finished loading, ttsPlay()
    //will start polling until the next chunk is ready.
};

// ttsNextChunkPhase2()
//______________________________________________________________________________
// page flip animation has now completed
BookReader.prototype.ttsNextChunkPhase2 = function () {
    if (null == this.ttsEngine.ttsChunks) {
        alert('error: ttsChunks is null?'); //TODO
        return;
    }

    if (0 == this.ttsEngine.ttsChunks.length) {
        if (soundManager.debugMode) console.log('ttsNextChunk2: ttsChunks.length is zero.. hacking...');
        this.ttsEngine.startCB(this.ttsEngine.ttsChunks);
        return;
    }

    if (soundManager.debugMode) console.log('next chunk is ' + this.ttsEngine.ttsPosition);

    //prefetch next page of text
    if (0 == this.ttsEngine.ttsPosition) {
        if (this.ttsEngine.ttsIndex<(this.getNumLeafs()-1)) {
            this.ttsEngine.getText(this.ttsEngine.ttsIndex+1, this.ttsNextPageCB.bind(this));
        }
    }

    this.ttsPrefetchAudio();

    this.ttsEngine.play();
};

// ttsMaybeFlip()
//______________________________________________________________________________
// A page flip might be necessary. This code is confusing since
// ttsNextChunks might be null if we are starting on a blank page.
BookReader.prototype.ttsMaybeFlip = function (starting, ttsIndex) {
    if (this.constMode2up == this.mode) {
        if ((ttsIndex != this.twoPage.currentIndexL) && (ttsIndex != this.twoPage.currentIndexR)) {
            if (!starting) {
                this.animationFinishedCallback = this.ttsNextChunkPhase2;
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

// ttsPrefetchAudio()
//______________________________________________________________________________
BookReader.prototype.ttsPrefetchAudio = function () {

    if(false != this.ttsEngine.ttsBuffering) {
        alert('TTS Error: prefetch() called while content still buffering!');
        return;
    }

    //preload next chunk
    var nextPos = this.ttsEngine.ttsPosition+1;
    if (nextPos < this.ttsEngine.ttsChunks.length) {
        this.ttsLoadChunk(this.ttsEngine.ttsIndex, nextPos, this.ttsEngine.ttsChunks[nextPos][0]);
    } else {
        //for a short page, preload might nt have yet returned..
        if (soundManager.debugMode) console.log('preloading chunk 0 from next page, index='+(this.ttsEngine.ttsIndex+1));
        if (null != this.ttsEngine.ttsNextChunks) {
            if (0 != this.ttsEngine.ttsNextChunks.length) {
                this.ttsLoadChunk(this.ttsEngine.ttsIndex+1, 0, this.ttsEngine.ttsNextChunks[0][0]);
            } else {
                if (soundManager.debugMode) console.log('prefetchAudio(): ttsNextChunks is zero length!');
            }
        } else {
            if (soundManager.debugMode) console.log('ttsNextChunks is null, not preloading next page');
            this.ttsEngine.ttsBuffering = true;
        }
    }

};

// ttsHighlightChunk()
//______________________________________________________________________________
BookReader.prototype.ttsHighlightChunk = function (chunk) {
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
    for (i=0; i<this.ttsEngine.ttsIndex; i++) {
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
            this.$('.pagediv'+this.ttsEngine.ttsIndex)
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
        this.setHilightCss2UP(div, this.ttsEngine.ttsIndex, l, r, t, b);
    }
};

// ttsRemoveHilites()
//______________________________________________________________________________
BookReader.prototype.ttsRemoveHilites = function (chunk) {
    $(this.ttsHilites).remove();
    this.ttsHilites = [];
};
