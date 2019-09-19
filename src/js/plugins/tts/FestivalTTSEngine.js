import 'es6-promise/auto';
import AbstractTTSEngine from './AbstractTTSEngine.js';

/**
 * @extends AbstractTTSEngine<{ sound: SMSound }>
 * TTS using Festival endpoint
 **/
export default class FestivalTTSEngine extends AbstractTTSEngine {
    /**
     * @param {TTSEngineOptions} options 
     */
    constructor(options) {
        super(options);
        /** @type {'mp3' | 'ogg'} format of audio to get */
        this.audioFormat = $.browser.mozilla ? 'ogg' : 'mp3';
        /** @type {Boolean} Whether this tts engine can run */
        this.isSupported = typeof(soundManager) !== 'undefined' && soundManager.supported();
    }

    /** @override */
    init() {
        if (this.isSupported) {
            // setup sound manager
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
    }

    /**
     * @override
     * @param {number} leafIndex
     * @param {number} numLeafs total number of leafs in the current book
     */
    start(leafIndex, numLeafs) {
        if (navigator.userAgent.match(/mobile/i)) {
            // HACK for iOS. Security restrictions require playback to be triggered
            // by a user click/touch. This intention gets lost in the ajax callback
            // above, but for some reason, if we start the audio here, it works
            soundManager.createSound({url: this.getSoundUrl(' ')}).play();
        }
        
        super.start(leafIndex, numLeafs);
    }

    /** @override */
    stop() {
        this.playStream = null;
        soundManager.stopAll();
        super.stop();
    }

    /** @override */
    getPlayStream() {
        this.playStream = this.playStream || this.chunkStream
        .map(this.fetchChunkSound.bind(this));

        return this.playStream;
    }

    /**
     * @override
     * @param {PageChunk & { sound: SMSound }} chunk
     * @return {PromiseLike}
     */
    playChunk(chunk) {
        return new Promise(res => chunk.sound.play({ onfinish: res }))
        .then(() => chunk.sound.destruct());
    }

    /**
     * @private
     * @param {PageChunk} pageChunk
     * @return {PromiseLike<PageChunk & { sound: SMSound }>}
     */
    fetchChunkSound(pageChunk) {
        this.opts.onLoadingStart();
        return new Promise(res => {
            const resolve = sound => {
                this.opts.onLoadingComplete();
                res($.extend(pageChunk, { sound }))
            };
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

    /**
     * @private
     * Get URL for audio that says this text
     * @param {String} dataString the thing to say
     * @return {String} url
     */
    getSoundUrl(dataString) {
        return 'https://'+this.opts.server+'/BookReader/BookReaderGetTTS.php?string='
                  + encodeURIComponent(dataString)
                  + '&format=.'+this.audioFormat;
    }
}