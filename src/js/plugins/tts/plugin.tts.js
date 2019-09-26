/**
 * Plugin for Text to Speech in BookReader
 */

import 'es6-promise/auto';
import FestivalTTSEngine from './FestivalTTSEngine.js';
import { toISO6391 } from './utils.js';

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
            this.ttsEngine = new FestivalTTSEngine({
                server: options.server,
                bookPath: options.bookPath,
                bookLanguage: toISO6391(options.bookLanguage),
                onLoadingStart: this.showProgressPopup.bind(this, 'Loading audio...'),
                onLoadingComplete: this.removeProgressPopup.bind(this),
                onDone: this.ttsStop.bind(this),
                beforeChunkPlay: this.ttsBeforeChunkPlay.bind(this)
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
                br.$('.BRicon.read').click(function(e) {
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
    this.ttsEngine.start(this.currentIndex(), this.getNumLeafs());
};

// ttsStop()
//______________________________________________________________________________
BookReader.prototype.ttsStop = function () {
    this.$('.BRicon.read').removeClass('unread');
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
 * Flip the page if the provided leaf index is not visible
 * @param {Number} leafIndex
 * @return {PromiseLike<void>} resolves once the flip animation has completed
 */
BookReader.prototype.ttsMaybeFlipToIndex = function (leafIndex) {
    var in2PageMode = this.constMode2up == this.mode;
    var resolve = null;
    var promise = new Promise(res => resolve = res);
    
    if (!in2PageMode) {
        this.jumpToIndex(leafIndex);
        resolve();
    } else {
        var leafVisible = leafIndex == this.twoPage.currentIndexR || leafIndex == this.twoPage.currentIndexL;
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
