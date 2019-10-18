import { isChrome, sleep, promisifyEvent, isFirefox, isAndroid } from './utils.js';
import AbstractTTSEngine from './AbstractTTSEngine.js';
/** @typedef {import("./AbstractTTSEngine.js").PageChunk} PageChunk */
/** @typedef {import("./AbstractTTSEngine.js").AbstractTTSSound} AbstractTTSSound */
/** @typedef {import("./AbstractTTSEngine.js").TTSEngineOptions} TTSEngineOptions */

/**
 * @extends AbstractTTSEngine
 * TTS using Web Speech APIs
 **/
export default class WebTTSEngine extends AbstractTTSEngine {
    static isSupported() {
        return typeof(window.speechSynthesis) !== 'undefined';
    }

    /** @param {TTSEngineOptions} options */
    constructor(options) {
        super(options);

        // SAFARI doesn't have addEventListener on speechSynthesis
        if (speechSynthesis.addEventListener) {
            speechSynthesis.addEventListener('voiceschanged', () => this.events.trigger('voiceschanged'));
        }
    }

    /** @override */
    getVoices() { return speechSynthesis.getVoices(); }

    /** @override */
    createSound(chunk) {
        return new WebTTSSound(chunk.text);
    }
}

/** @extends AbstractTTSSound */
export class WebTTSSound {
    /** @param {string} text **/
    constructor(text) {
        this.text = text;
        this.loaded = false;
        this.paused = false;
        this.started = false;
        /** Whether the audio was stopped with a .stop() call */
        this.stopped = false;
        this.rate = 1;

        /** @type {SpeechSynthesisUtterance} */
        this.utterance = null;
        
        /** @type {SpeechSynthesisVoice} */
        this.voice = null;
        
        this._lastEvents = {
            /** @type {SpeechSynthesisEvent} */
            pause: null,
            /** @type {SpeechSynthesisEvent} */
            boundary: null,
            /** @type {SpeechSynthesisEvent} */
            start: null,
        };

        /** Store where we are in the text. Only works on some browsers. */
        this._charIndex = 0;

        /** @type {Function} resolve function called when playback finished */
        this._finishResolver = null;

        /** @type {Promise} promise resolved by _finishResolver */
        this._finishPromise = null;
    }
    
    /** @override **/
    load(onload) {
        this.loaded = false;
        this.started = false;

        this.utterance = new SpeechSynthesisUtterance(this.text.slice(this._charIndex));
        this.utterance.voice = this.voice;
        // Need to also set lang (for some reason); won't set voice on Chrome@Android otherwise
        if (this.voice) this.utterance.lang = this.voice.lang;
        this.utterance.rate = this.rate;

        // Keep track of the speech synthesis events that come in; they have useful info
        // about progress (like charIndex)
        this.utterance.addEventListener('start', ev => this._lastEvents.start = ev);
        this.utterance.addEventListener('boundary', ev => this._lastEvents.boundary = ev);
        this.utterance.addEventListener('pause', ev => this._lastEvents.pause = ev);

        // Update our state
        this.utterance.addEventListener('start', () => {
            this.started = true;
            this.stopped = false;
            this.paused = false;
        });
        this.utterance.addEventListener('pause', () => this.paused = true);
        this.utterance.addEventListener('resume', () => this.paused = false);
        this.utterance.addEventListener('end', ev => {
            if (!this.paused && !this.stopped) {
                // Trigger a new event, finish, which only fires when audio fully completed
                this.utterance.dispatchEvent(new CustomEvent('finish', ev));
            }
        });
        this.loaded = true;
        onload && onload();
    }

    /**
     * Run whenever properties have changed. Tries to restart in the same spot it
     * left off.
     * @return {Promise<void>}
     */
    reload() {
        // We'll restore the pause state, so copy it here
        const wasPaused = this.paused;
        // Use recent event to determine where we'll restart from
        // Browser support for this is mixed, but it degrades to restarting the chunk
        // and that's ok
        const recentEvent = this._lastEvents.boundary || this._lastEvents.pause;
        if (recentEvent) {
            this._charIndex = this.text.indexOf(recentEvent.target.text) + recentEvent.charIndex;
        }

        // We can't modify the utterance object, so we have to make a new one
        return this.stop()
        .then(() => {
            this.load();
            // Instead of playing and immediately pausing, we don't start playing. Note
            // this is a requirement because pause doesn't work consistently across
            // browsers.
            if (!wasPaused) this.play();
        });
    }

    play() {
        this._finishPromise = this._finishPromise || new Promise(res => this._finishResolver = res);
        this.utterance.addEventListener('finish', this._finishResolver);

        // clear the queue
        speechSynthesis.cancel();
        // reset pause state
        speechSynthesis.resume();
        // Speak
        speechSynthesis.speak(this.utterance);

        const isLocalVoice = this.utterance.voice && this.utterance.voice.localService;
        if (isChrome() && !isLocalVoice) this._chromePausingBugFix();

        return this._finishPromise;
    }

    /** @return {Promise} */
    stop() {
        // 'end' won't fire if already stopped
        const endPromise = this.stopped ? Promise.resolve() : promisifyEvent(this.utterance, 'end');
        this.stopped = true;
        speechSynthesis.cancel();
        return endPromise;
    }

    /**
     * @override
     * Will fire a pause event unless already paused
     **/
    pause() {
        if (this.paused) return;
        
        const pausePromise = promisifyEvent(this.utterance, 'pause');
        speechSynthesis.pause();
        
        // There are a few awful browser cases:
        // 1. Pause works and fires
        // 2. Pause doesn't work and doesn't fire
        // 3. Pause works but doesn't fire
        const pauseMightNotWork = (isFirefox() && isAndroid());
        const pauseMightNotFire = isChrome() || pauseMightNotWork;

        if (pauseMightNotFire) {
            // wait for it just it incase
            const timeoutPromise = sleep(100).then(() => 'timeout');
            Promise.race([pausePromise, timeoutPromise])
            .then(result => {
                // We got our pause event; nothing to do!
                if (result != 'timeout') return;

                this.utterance.dispatchEvent(new CustomEvent('pause', this._lastEvents.start));
                // if pause might not work, then we'll stop entirely and restart later
                if (pauseMightNotWork) this.stop();
            });
        }
    }

    resume() {
        if (!this.started) {
            this.play();
            return;
        }

        if (!this.paused) return;

        // Browser cases:
        // 1. Resume works + fires
        // 2. Resume works + doesn't fire (Chrome Desktop)
        // 3. Resume doesn't work + doesn't fire (Chrome/FF Android)
        const resumeMightNotWork = (isChrome() && isAndroid()) || (isFirefox() && isAndroid());
        const resumeMightNotFire = isChrome() || resumeMightNotWork;

        // Try resume
        const resumePromise = promisifyEvent(this.utterance, 'resume');
        speechSynthesis.resume();

        if (resumeMightNotFire) {
            Promise.race([resumePromise, sleep(100).then(() => 'timeout')])
            .then(result => {
                if (result != 'timeout') return;

                this.utterance.dispatchEvent(new CustomEvent('resume', {}));
                if (resumeMightNotWork) {
                    const reloadPromise = this.reload();
                    reloadPromise.then(() => this.play());
                }
            });
        }
    }

    setPlaybackRate(rate) {
        this.rate = rate;
        this.reload();
    }

    /**
     * @private
     * Chrome has a bug where it only plays 15 seconds of TTS and then
     * suddenly stops (see https://bugs.chromium.org/p/chromium/issues/detail?id=679437 )
     * We avoid this (as described here: https://bugs.chromium.org/p/chromium/issues/detail?id=679437#c15 )
     * by pausing after 14 seconds and ~instantly resuming.
     */
    _chromePausingBugFix() {
        const timeoutPromise = sleep(14000).then(() => 'timeout');
        const pausePromise = promisifyEvent(this.utterance, 'pause').then(() => 'paused');
        const endPromise = promisifyEvent(this.utterance, 'end').then(() => 'ended');
        return Promise.race([timeoutPromise, pausePromise, endPromise])
        .then(result => {
            switch(result) {
                case 'ended':
                    // audio was stopped/finished; nothing to do
                    break;
                case 'paused':
                    // audio was paused; wait for resume
                    promisifyEvent(this.utterance, 'resume')
                    .then(() => this._chromePausingBugFix());
                    break;
                case 'timeout':
                    // We hit Chrome's secret cut off time. Pause/resume
                    // to be able to keep TTS-ing
                    speechSynthesis.pause();
                    sleep(25)
                    .then(() => {
                        speechSynthesis.resume();
                        this._chromePausingBugFix();
                    });
                    break;
            }
        });
    }
}
