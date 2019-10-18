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
        
        /** @type {SpeechSynthesisEvent} */
        this._lastStartEvent = null;

        /** @type {SpeechSynthesisEvent} */
        this._lastPauseEvent = null;

        /** @type {SpeechSynthesisEvent} */
        this._lastBoundaryEvent = null;

        /** Store where we are in the text. Only works on some browsers. */
        this._charIndex = 0;

        /** @type {Function} resolve function called when playback finished */
        this._finishResolver = null;

        /** @type {Promise} promise resolved by _finishResolver */
        this._finishPromise = null;
    }
    
    /** @override **/
    load(onload) {
        console.log("LOAD START")
        this.loaded = false;
        this.started = false;
        this.stopped = false;

        this.utterance = new SpeechSynthesisUtterance(this.text.slice(this._charIndex));
        this.utterance.voice = this.voice;
        // Need to also set lang (for some reason); won't work on Chrome@Android otherwise
        if (this.voice) this.utterance.lang = this.voice.lang;
        this.utterance.rate = this.rate;
        this.utterance.addEventListener('pause', () => console.log('pause'));
        this.utterance.addEventListener('resume', () => console.log('resume'));
        this.utterance.addEventListener('start', () => console.log('start'));
        this.utterance.addEventListener('end', () => console.log('end'));
        this.utterance.addEventListener('error', () => console.log('error'));
        this.utterance.addEventListener('boundary', () => console.log('boundary'));
        this.utterance.addEventListener('mark', () => console.log('mark'));
        this.utterance.addEventListener('finish', () => console.log('finish'));
        
        this.utterance.addEventListener('start', ev => this._lastStartEvent = ev);
        this.utterance.addEventListener('boundary', ev => this._lastBoundaryEvent = ev);
        this.utterance.addEventListener('pause', ev => this._lastPauseEvent = ev);
        this.utterance.addEventListener('pause', () => this.paused = true);
        this.utterance.addEventListener('resume', () => this.paused = false);
        this.utterance.addEventListener('start', () => {
            this.started = true;
            this.paused = false;
        });
        this.utterance.addEventListener('end', ev => {
            if (!this.paused && !this.stopped) {
                this.utterance.dispatchEvent(new CustomEvent('finish', ev));
            }
        });
        this.loaded = true;
        onload && onload();
        console.log("LOAD END")
    }

    /**
     * When any of the speaker settings are changed, the utterance
     * must be reloaded.
     * @return {Promise<void>}
     */
    reload() {
        console.log("RELOAD");
        const wasPaused = this.paused;
        // Safari kind of hangs when we call pause here (for some reason)
        // But safari gives us word boudaries, so we don't even have to pause
        const promisesToRace = [sleep(100).then(() => this._lastBoundaryEvent || this._lastStartEvent)];
        if (!this._lastBoundaryEvent) {
            promisesToRace.push(promisifyEvent(this.utterance, 'pause'));
            speechSynthesis.pause();
        }
        return Promise.race(promisesToRace)
        .then(ev => {
            const endPromise = promisifyEvent(this.utterance, 'end');
            this.stop();

            // Browser support for this is mixed, but it degrades to
            // restarting the chunk if it doesn't exist, and that's ok
            this._charIndex += ev ? (ev.charIndex || 0) : 0;

            return endPromise;
        }).then(() => {
            speechSynthesis.resume();
            this.load();
            if (!wasPaused) this.play();
        });
    }

    play() {
        console.log("PLAY START");
        this._finishPromise = this._finishPromise || new Promise(res => this._finishResolver = () => { console.log("RESOLVING"), res() });
        this.utterance.addEventListener('finish', this._finishResolver);
        speechSynthesis.cancel();
        speechSynthesis.speak(this.utterance);

        // Note this could be local; if voice is null/undefined browser
        // uses the default, but to be safe we check it directly
        const isLocalVoice = this.utterance.voice && this.utterance.voice.localService;
        if (isChrome() && !isLocalVoice) this._chromePausingBugFix();
        
        console.log("PLAY END");
        return this._finishPromise;
    }

    stop() {
        console.log("STOP");
        this.stopped = true;
        speechSynthesis.cancel();
    }

    /**
     * Pause synthesis and returns a promise
     * @return {Promise<SpeechSynthesisEvent>}
     */
    pause() {
        if (this.paused) {
            console.log("ALREADY PAUSED");
            return Promise.resolve(this._lastPauseEvent || this._lastStartEvent);
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
                        this.utterance.dispatchEvent(new CustomEvent('pause', this._lastStartEvent));
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
                        this.utterance.dispatchEvent(new CustomEvent('pause', this._lastStartEvent));
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
