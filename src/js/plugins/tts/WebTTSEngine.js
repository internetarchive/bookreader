import { isChrome, sleep, promisifyEvent } from './utils.js';
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

        // Note this could be local; if voice is null/undefined browser
        // uses the default, but to be safe we check it directly
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
     * Pause synthesis and returns a promise
     * @return {Promise<SpeechSynthesisEvent>}
     */
    pause() {
        if (this.paused) {
            console.log("ALREADY PAUSED");
            return Promise.resolve(this._lastEvents.pause || this._lastEvents.start);
        } else {
            const pausePromise = promisifyEvent(this.utterance, 'pause');
            speechSynthesis.pause();
            // Chrome Desktop doesn't fire the pause event :(
            if (isChrome()) {
                const timeoutPromise = sleep(40).then(() => 'timeout');
                return Promise.race([pausePromise, timeoutPromise])
                .then(result => {
                    if (result == 'timeout') {
                        console.log("PAUSE TIMEOUT");
                        this.utterance.dispatchEvent(new CustomEvent('pause', this._lastEvents.start));
                    }
                    return pausePromise;
                });
            } else if (/firefox/i.test(navigator.userAgent) && /android/i.test(navigator.userAgent)) {
                // pause/resume don't actually do anything on FF (except set speechSynthesis.paused 🤦‍)
                // Fallback: Just stop if the pause event doesn't fire
                const timeoutPromise = sleep(40).then(() => 'timeout');
                return Promise.race([pausePromise, timeoutPromise])
                .then(result => {
                    if (result == 'timeout') {
                        console.log("PAUSE TIMEOUT");
                        this.utterance.dispatchEvent(new CustomEvent('pause', this._lastEvents.start));
                        this.reload();
                    }
                    return pausePromise;
                });
            } else {
                console.log("NORMAL PAUSE");
                return pausePromise;
            }
        }
    }

    resume() {
        if (!this.started) {
            this.play();
        } else if ((isChrome() && !speechSynthesis.paused && this.paused)) {
            // CHROME/FF ANDROID HACK 😭
            // speechSynthesis.resume() doesn't work on Chrome Android
            // speechSynthesis.paused is always false on Chrome Desktop/Android, but resume
            // works on desktop.
            // speechSynthesis.paused changes on FF@Android, but it doesn't pause or resume
            const resumePromise = promisifyEvent(this.utterance, 'resume');
            speechSynthesis.resume();
            const timeoutPromise = sleep(100).then(() => 'timeout');
            return Promise.race([resumePromise, timeoutPromise])
            .then(result => {
                if (result == 'timeout') {
                    console.log('RESUME TIMEOUT');
                    // I was hoping to use speechSynthesis.speaking to test if resume had
                    // worked, but guess what; chrome on Android show .speaking to be true
                    // after a call to pause 😭
                    if (/android/i.test(navigator.userAgent) || !speechSynthesis.speaking) {
                        console.log('RESUME RELOAD')
                        // No resume; have to restart :/
                        const reloadPromise = this.reload();
                        const startPromise = promisifyEvent(this.utterance, 'start');
                        reloadPromise.then(() => this.play());
                        return startPromise;
                    }
                    else {
                        console.log('RESUME SILENT');
                        // Resume works, it just doesn't fire the event
                        this.utterance.dispatchEvent(new CustomEvent('resume', {}));
                        return resumePromise;
                    }
                } else {
                    return resumePromise;
                }
            })
        } else {
            console.log("NORMAL RESUME");
            const resumePromise = promisifyEvent(this.utterance, 'resume');
            speechSynthesis.resume();
            return resumePromise;
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
                    console.log('CHROME-PAUSE-FIX: ended');
                    break;
                case 'paused':
                    console.log('CHROME-PAUSE-FIX: paused');
                    promisifyEvent(this.utterance, 'resume')
                    .then(() => this._chromePausingBugFix());
                    break;
                case 'timeout':
                    console.log('CHROME-PAUSE-FIX: timeout');
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
