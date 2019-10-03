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
        let promise = null;

        // Hack for iOS
        if (navigator.userAgent.match(/mobile/i)) {
            promise = this.iOSCaptureUserIntentHack();
        }
        
        promise = promise || Promise.resolve();
        promise.then(() => super.start(leafIndex, numLeafs));
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
        if (!chunk.sound.loaded) this.opts.onLoadingStart();
        return new Promise(res => chunk.sound.play({ onfinish: res }))
        .then(() => chunk.sound.destruct());
    }

    /**
     * @private
     * @param {PageChunk} pageChunk
     * @return {PageChunk & { sound: SMSound }}
     */
    fetchChunkSound(pageChunk) {
        pageChunk.sound = soundManager.createSound({
            url: this.getSoundUrl(pageChunk.text),
            // API recommended, but only fires once play started on safari
            onload: () => this.opts.onLoadingComplete(),
        });
        pageChunk.sound.load();
        return pageChunk;
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

    /**
     * @private
     * Security restrictions require playback to be triggered
     * by a user click/touch. This intention gets lost in the async calls
     * on iOS, but, for some reason, if we start the audio here, it works.
     * See https://stackoverflow.com/questions/12206631/html5-audio-cant-play-through-javascript-unless-triggered-manually-once
     * @return {PromiseLike}
     */
    iOSCaptureUserIntentHack() {
        let sound = soundManager.createSound({
            // We can't use a whitespace string; it causes an infinite loop (???)
            url: this.getSoundUrl('t'),
            volume: 0,
        });
        return new Promise(res => sound.play({onfinish: res}))
        .then(() => sound.destruct());
    }
}
