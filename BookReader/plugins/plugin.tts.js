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
 * @typedef {Object} PageChunk
 * @property {Number} leafIndex
 * @property {String} text
 * @property {DJVURect[]} lineRects
 */

/** TTS using Festival endpoint */
class FestivalSpeechEngine {
    /**
     * 
     * @param {Object} options 
     * @param {String} options.server
     * @param {String} options.bookPath
     * @param {Number} options.numLeafs
     * @param {(leafIndex: Number) => PromiseLike<void>} options.onLeafChange
     * @param {Function} options.onLoadingStart
     * @param {Function} options.onLoadingComplete
     * @param {function(PageChunk): void} options.beforeChunkStart
     */
    constructor(options) {
        this.playing = false;
        /** @type {'mp3' | 'ogg'} format of audio to get */
        this.audioFormat = $.browser.mozilla ? 'ogg' : 'mp3';
        /** @type {Boolean} Whether this tts engine can run */
        this.isSupported = typeof(soundManager) !== 'undefined' && soundManager.supported();

        this.server = options.server;
        this.bookPath = options.bookPath;
        this.numLeafs = options.numLeafs;
        this.onLeafChange = options.onLeafChange;
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
     * @param {Number} leafIndex
     * @return {PromiseLike<Array<PageChunk>>}
     */
    fetchPageChunks(leafIndex) {
        var url = 'https://'+this.server+'/BookReader/BookReaderGetTextWrapper.php?path='+this.bookPath+'_djvu.xml&page='+leafIndex;
        return $.ajax({ url: url, dataType:'jsonp' })
        .then(
            /** @param {Array<[String, ...Array<DJVURect>]>} chunks */
            function (chunks) {
                return chunks.map(c => {
                    return {
                        leafIndex,
                        text: c[0],
                        lineRects: c.slice(1)
                    };
                });
            }
        );
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
        this.playing = true;

        if (navigator.userAgent.match(/mobile/i)) {
            // HACK for iOS. Security restrictions require playback to be triggered
            // by a user click/touch. This intention gets lost in the ajax callback
            // above, but for some reason, if we start the audio here, it works
            soundManager.createSound({url: this.getSoundUrl(' ')}).play();
        }

        this.onLoadingStart();

        /** @type {AsyncStream<PageChunk>} */
        this.chunkStream = AsyncStream.range(leafIndex, this.numLeafs-1)
        .map(this.fetchPageChunks.bind(this))
        .buffer(2)
        .flatten();

        /** @type {AsyncStream<PageChunk & { sound: SMSound }>} */
        this.soundStream = this.chunkStream
        .map(this.fetchChunkAudio.bind(this))
        .buffer(2);

        this.step();
    }

    /**
     * @private
     * A step of play loop
     */
    step() {
        this.soundStream.pull()
        .then(item => {
            this.onLoadingComplete();
            this.onLeafChange(item.value.leafIndex);
            this.beforeChunkStart(item.value);
            return this.playSound(item.value.sound);
        })
        .then(() => {
            if (this.playing) return this.step();
        });
    }

    /**
     * @private
     * @param {SMSound} snd 
     * @return {PromiseLike} resolves once the sound has finished playing
     */
    playSound(snd) {
        return new Promise(res => snd.play({ onfinish: res }))
        .then(() => snd.destruct());
    }

    /**
     * @private
     * @param {PageChunk} pageChunk
     * @return {PromiseLike<PageChunk & { sound: SMSound }>}
     */
    fetchChunkAudio(pageChunk) {
        return new Promise(res => {
            function resolve(sound) {
                res($.extend(pageChunk, { sound }))
            }
            soundManager.createSound({
                url: this.getSoundUrl(pageChunk.text),

                // Many soundManger2 callbacks are broken when using HTML5 audio.
                // whileloading: broken on safari, worked in FF4, but broken on FireFox 5
                // onload: fires on safari, but *after* the sound starts playing, and does not fire in FF or IE9
                // onbufferchange: fires in FF5 using HTML5 audio, but not in safari using flash audio
                // whileplaying: fires everywhere
                onload: function() { resolve(this); },
                //fires in FF and IE9
                onready: function() { resolve(this); },
                //fires in safari...
                onbufferchange: function() {
                    if (!this.isBuffering) {
                        resolve(this);
                    }
                }
            }).load();
        });
    }

    stop() {
        soundManager.stopAll();
        this.playing = false;
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
                onLeafChange: this.ttsMaybeFlip.bind(this),
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

/**
 * Flip the page if the provided leaf index is not visible
 * @param {Number} leafIndex
 * @return {PromiseLike<void>} resolves once the flip animation has completed
 */
BookReader.prototype.ttsMaybeFlip = function (leafIndex) {
    var in2PageMode = this.constMode2up == this.mode;
    var mustFlip = leafIndex > this.twoPage.currentIndexR;
    var deferred = $.Deferred();

    if (in2PageMode && mustFlip) {
        this.animationFinishedCallback = deferred.resolve.bind(deferred);
        this.next();
    } else {
        deferred.resolve();
    }

    return deferred.promise();
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

    this.ttsScrollToChunk(chunk);
};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsScrollToChunk = function(chunk) {
    if (this.constMode1up != this.mode) return;

    var leafTop = 0;
    var h;
    var i;
    for (i=0; i<chunk.leafIndex; i++) {
        h = parseInt(this._getPageHeight(i)/this.reduce);
        leafTop += h + this.padding;
    }

    var chunkTop = chunk.lineRects[0][3]; //coords are in l,b,r,t order
    var chunkBot = chunk.lineRects[chunk.lineRects.length-1][1];

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

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsHilite1UP = function(chunk) {
    for (var i = 0; i < chunk.lineRects.length; i++) {
        //each rect is an array of l,b,r,t coords (djvu.xml ordering...)
        var l = chunk.lineRects[i][0];
        var b = chunk.lineRects[i][1];
        var r = chunk.lineRects[i][2];
        var t = chunk.lineRects[i][3];

        var div = document.createElement('div');
        this.ttsHilites.push(div);
        $(div).prop('className', 'BookReaderSearchHilite').appendTo(
            this.$('.pagediv'+chunk.leafIndex)
        );

        $(div).css({
            width:  (r-l)/this.reduce + 'px',
            height: (b-t)/this.reduce + 'px',
            left:   l/this.reduce + 'px',
            top:    t/this.reduce +'px'
        });
    }

};

/**
 * @param {PageChunk} chunk
 */
BookReader.prototype.ttsHilite2UP = function (chunk) {
    for (var i = 0; i < chunk.lineRects.length; i++) {
        //each rect is an array of l,b,r,t coords (djvu.xml ordering...)
        var l = chunk.lineRects[i][0];
        var b = chunk.lineRects[i][1];
        var r = chunk.lineRects[i][2];
        var t = chunk.lineRects[i][3];

        var div = document.createElement('div');
        this.ttsHilites.push(div);
        $(div).prop('className', 'BookReaderSearchHilite').css('zIndex', 3).appendTo(this.refs.$brTwoPageView);
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
 * The underlying object wrapped each stream's elements. (Based on
 * JavaScript Generators; see
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next )
 * @template T
 * @typedef {Object} TStreamItem
 * @property {T} value
 * @property {Boolean} done
 */

/**
 * @abstract
 * Class that makes it easier to deal with a series of async events
 * (represented as Promises). All the function let you interact with
 * the promise's value instead of the promise itself, letting you 
 * treat it as a stream of synchronuous values. The notable exception
 * being the `pull` method, which should be used to consume the stream,
 * and hence must return the promise directly.
 * @template T
 */
class AsyncStream {
    /** @typedef {TStreamItem<T>} TItem */

    /**
     * @abstract
     * Take the next item off the stream
     * @return {PromiseLike<TItem>}
     */
    pull() { return null; }

    /**
     * Transform the stream's items
     * @template B
     * @param {function(T): B | PromiseLike<B>} mapper 
     * @return {AsyncStream<B>}
     */
    map(mapper) {
        return new MappingAsyncStream(this, mapper);
    }

    /**
     * Select only the stream items for which `predicate` returns true
     * @param {function(T): Boolean} predicate 
     * @return {AsyncStream<T>}
     */
    filter(predicate) {
        return new FilteringAsyncStream(this, predicate);
    }

    /**
     * Load multiple items of the stream at the time to avoid long wait
     * times between `pull`s. Starts `bufferSize` promises at a time 
     * (simultaneously).
     * @param {Number} bufferSize 
     * @return {AsyncStream<T>}
     */
    buffer(bufferSize) {
        return new BufferingAsyncStream(this, bufferSize);
    }

    /**
     * If the current stream is an array of items, this expands the
     * stream into a stream such that every element of the array 
     * becomes its own item.
     * @template T2
     * @this {AsyncStream<T2[]>}
     * @return {AsyncStream<T2>}
     */
    flatten() {
        return new FlatteningAsyncStream(this);
    }

    /**
     * Create a stream that iterates from `start` to `end` (inclusive)
     * @param {number} start 
     * @param {number} end 
     * @return {AsyncStream<number>}
     */
    static range(start, end) {
        return new RangeAsyncStream(start, end);
    }
}

/**
 * @extends AsyncStream<number>
 * An async stream the returns numbers in a range (inclusive)
 */
class RangeAsyncStream extends AsyncStream {
    /**
     * 
     * @param {number} start 
     * @param {number} end 
     */
    constructor(start, end) {
        super();
        this.start = start;
        this.end = end;
        this.cur = start;
    }

    pull() {
        if (this.cur <= this.end) {
            return Promise.resolve({ value: this.cur++, done: false });
        } else {
            return Promise.resolve({ value: null, done: true });
        }
    }
}

/**
 * @template T1, T2
 * @extends AsyncStream<T2>
 */
class MappingAsyncStream extends AsyncStream {
    /**
     * 
     * @param {AsyncStream<T1>} parent 
     * @param {(x: T1) => T2 | PromiseLike<T2>} mapper 
     */
    constructor(parent, mapper) {
        super();
        this.parent = parent;
        this.mapper = mapper;
    }

    pull() {
        return this.parent.pull()
        .then(item => {
            if (item.done) {
                return Promise.resolve({ value: null, done: true });
            }

            var mapped = this.mapper(item.value);
            if (!(mapped instanceof Promise)) {
                mapped = Promise.resolve(mapped);
            }
            return /** @type {PromiseLike<T2>} */(mapped).then(value => {
                return { value, done: false }
            });
        });
    }
}

/**
 * @template T
 * @extends AsyncStream<T>
 */
class FilteringAsyncStream extends AsyncStream {
    /**
     * 
     * @param {AsyncStream<T>} parent 
     * @param {function(T): Boolean} predicate
     */
    constructor(parent, predicate) {
        super();
        this.parent = parent;
        this.predicate = predicate;
    }

    pull() {
        return this.parent.pull()
        .then(item => {
            if (item.done) {
                return Promise.resolve({ value: null, done: true });
            }

            if (this.predicate(item.value)) return Promise.resolve(item);
            else return this.pull();
        });
    }
}

/**
 * @template T
 * @extends AsyncStream<T>
 */
class FlatteningAsyncStream extends AsyncStream {
    /**
     * @param {AsyncStream<T[]>} parent 
     */
    constructor(parent) {
        super();
        this.parent = parent;
        /** @type {Array<T>} */
        this._lastResult = [];
        /** @type {PromiseLike<T[]>} */
        this._inProgress = null;
    }

    pull() {
        if (this._lastResult.length) {
            return Promise.resolve({ value: this._lastResult.shift(), done: false });
        } else if (this._inProgress) {
            return this._inProgress.then(() => this.pull());
        } else {
            this._inProgress = this.parent.pull()
            .then(item => {
                if (item.done) {
                    return Promise.resolve({ value: null, done: true });
                }

                this._lastResult = item.value;
                this._inProgress = null;
                return this.pull();
            });
            return this._inProgress;
        }
    }
}

/**
 * @template T
 * @extends AsyncStream<T>
 */
class BufferingAsyncStream extends AsyncStream {
    /**
     * @param {AsyncStream<T>} parent
     * @param {Number} bufferSize
     */
    constructor(parent, bufferSize) {
        super();
        this.parent = parent;
        this._bufferSize = bufferSize;
        /** @type {PromiseLike<TStreamItem<T>>[]} */
        this._promiseBuffer = [];
    }

    pull() {
        var toFetch = Math.max(0, this._bufferSize - this._promiseBuffer.length);
        for (var i = 0; i < toFetch; i++) {
            this._promiseBuffer.push(this.parent.pull());
        }

        return this._promiseBuffer.shift();;
    }
}
