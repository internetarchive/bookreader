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
    start(leafIndex, numLeafs) {
        // Need to run in this function to capture user intent to start playing audio
        if ('mediaSession' in navigator) {
            const audio = new Audio(SILENCE_10S);
            audio.loop = true;

            this.events.on('pause', () => audio.pause());
            this.events.on('resume', () => audio.play());
            audio.play().then(() => {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: br.bookTitle,
                    artist: br.options.metadata.filter(m => m.label == 'Author').map(m => m.value)[0],
                    // album: 'The Ultimate Collection (Remastered)',
                    artwork: [
                        { src: br.options.thumbnail, type: 'image/jpg' },
                    ]
                });
                
                navigator.mediaSession.setActionHandler('play', () => {
                    audio.play();
                    this.resume();
                });
                navigator.mediaSession.setActionHandler('pause', () => {
                    audio.pause();
                    this.pause();
                });
                // navigator.mediaSession.setActionHandler('seekbackward', () => {
                //     console.log("MS:seekbackward");
                // });
                navigator.mediaSession.setActionHandler('seekforward', () => this.jumpForward());
                // navigator.mediaSession.setActionHandler('previoustrack', () => {
                //     console.log("MS:previoustrack");
                // });
                // navigator.mediaSession.setActionHandler('nexttrack', () => {
                //     console.log("MS:nexttrack");
                // });
            });
        }

        return super.start(leafIndex, numLeafs);
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
        this.utterance.addEventListener('pause', () => console.log('pause'));
        this.utterance.addEventListener('resume', () => console.log('resume'));
        this.utterance.addEventListener('start', () => console.log('start'));
        this.utterance.addEventListener('end', () => console.log('end'));
        this.utterance.addEventListener('error', () => console.log('error'));
        this.utterance.addEventListener('boundary', () => console.log('boundary'));
        this.utterance.addEventListener('mark', () => console.log('mark'));
        this.utterance.addEventListener('finish', () => console.log('finish'));
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

    finish() {
        this.stop().then(() => this.utterance.dispatchEvent(new Event('finish')));
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


const SILENCE_10S = 'data:audio/mp3;base64,/+MYxAALUAIGIAhElNJYANDC+TP84uj///k+U1O/5Q/rD2q9Z8hrfD///8uOcCAYbCwIBgPygDUCBBWRuCitLBF+5WnkndJ1/+MYxA0JWAI2UABEAsU/NW+77PR/1ot/8Gyyma///3uy1faIAir/+Rf85iZlrRnLRWkJ8ktSg/////8+X8kK/eMSE4Nqzi4B/+MYxCILC2IYAABHLTUEITFi0EGECnPVjcgliXHyevbULXN4vuu/X/HvpLJeddYQt+vy2l/R///8WraoXi9yCQ1yRy2A8frG/+MYxDAKQAIySAhElhRrVtiN/QFYJ6iejc0mr/0p13/qWkaolLJVV2bv//VUlCS+k/HmgsZNqpBJIKysBsuVd3Z9Druj+wXA/+MYxEIMCAIuSAhElqs74stn9v3Xf9O0ACV7nv93/+rcYSwsdNA8K/9wMNCEH15z/f/f///7//3/9vX+3///9f/X/////br9/+MYxEwK+AY2UAhEAj7v7odWSWRonMdUDHI2AICxGeeob2NZ//+wf/9lbP+sXpFSw2swIH0L9G//703RVZEohbA2JEFghWIA/+MYxFsK+0YqUAgEZd1ok+v6///lPL5rtf/PP/81/l53/r////r////+2+h6IjuWaRUYrGQHyiKqAEAAz//9f6///9v/p9///+MYxGoLKAIqSAhElkd7dy/+/N////+/XoZ1eZLOM9kV2nNDhw5SFIEIJNUWgTCMfov9//y/n////X+f//////f15VL5g/+r/+MYxHgLS0YqSAgFQ9dKveVaognVisOOJFcrgQlCEGCQiMWtfp9PTbSXMVqo56EbI7FfQyZYdm5bf///0vTOUgPOVVCKFIrs/+MYxIULW2YiIAgEcFEDP6cwqHAgxhuJANADcbEgiJNBl679jvp3O/vqV6f+n//yX9RL//9tRg7QYQpw8DhAUJEV/LLUvPWx/+MYxJIMY2IiQAgLgTMBX5kbfRGS40gSJ8of8v///n+fvNfv3ZRKntAfeGVZpbqYbj5CaAtNJgVMev/ra6qU2RbLQ1m9rGY9/+MYxJsMw2IUAACNMUrodGYs0GaqnVKr////2dy1oiKcEpVOr1EOOH1i8GOl8WpYkhgwxbJJJIlwUES58rxtGpV9lH66rPu3/+MYxKMJoAIuSAhElo5u3/tfStFVTNP///5W9xJwuQUF4OjF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jt3af3+tv8ti6Ok7mKKdi6JWcFDB45SK4Aihp2X7qRoEb57X/+MYxPQQ22YWQAhMvD6kf9MvI9gvRZf/oheJ2UA///Nl+OI5/716We34n/L///5/nrOgAyI25jAfW5T0ZM4UCRptKu7HGDys/+MYxOsNw2YUIABNEL/YiP5uf//f/f/r///OUb4f/57/D3+vsvWV/f///vzLogQsDFMSEQPiSEUgBBI9YgMIA///PL//8v///+MYxO8PI2YiSAiHov//1+y7U3Kg+QlKz0SIZh6mMiaElsyuxqS6+la//6LelCaFcdM8yKUIKIcWQKRWYVqRxAUEwAV0Lm02/+MYxO0NK2oUAABNLGVtJRwEFPmf/LPz+yU0jhwIH////XL//3LObPXljR+j9fzU718v//8vnh4h0zIgDAaJEnQ7ADYBAVEM/+MYxPMPC2YdoAhM3jjh9f/fv6nS/hfysIeLDKzqZ5JmvOa/v///f93c51u37nu5JSbmY2qjVUuMSdsg1C0eJS8JMA+2XfOq/+MYxPENM14hoAhG35JAAw7/n37//X/+n//76fOrorvXr6b1o36OVF/6N///1Sjucx9DFYzIgmwMOMhziooY40wIgs44VdEc/+MYxPcRw2IRgAiTaXG40BOk55RxztmUss/72Vb2v/9ezqf8rppfV//6kKamBwCACZwywLJg0MB96rkZL7H9/Lyz+jM2wmJs/+MYxOsPG14eQAhG39v2/+//7/5RhKXbq60ad4O8v5epKi+fr/z//f8p8c8qc6j7lEgcd4KMwC0wQcQ4UlERurcSN+5fql/3/+MYxOkNy2YUAABTEQBlh/Fpf//XncimfLIk5GZ366weWv+Z3gX6L+l///t+bSgq6tfRmu5WUxiDqJtQNLTDuv/3GSgH9SVz/+MYxOwOe1oaIAgKbFX65+f776X/mX/7/+eyDn//z2/35PP//0f////70pORMrEjmKkIFJAS5GDrFZI3aGhX3P+csp/KH68//+MYxO0LMAYmSABEAP//reXtmX3z+UvqfNQjSozGH16dO+c/Lv///mfbmxdfKOIMSIZXUGLcMDizNAwVlUMRJiTl1x5pORxo/+MYxPsQM2YdoAhGvvM3f+uYqZgF1zfr4d//TekXbn6lcvLXj/7//+a99ft/////09EU2SZiOEdnsnUPUToKcYLV6m23HWiT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/+MYxOwNY1YeIAgEjXYEV9Ss5kQSds055zg9iMDKjYRqVrZ3Zbr0aX/Zf2/dXDzl2JS7T7Zq2UWSuiRWRROLBM30JMIAuZYR/+MYxPEOg2oQAABNEPLKMZVqJJxgKinl6IUPzv8+vyca+8/m5/+v/l//y/5F5139Ifn3/////pMqmytEsoVTylQGgRsvavlB/+MYxPIOA2YUAABNEOHTpScX5//evL5oEG8OzbKj8TBmSRsAMprXL//PL8/fp3caXE25t0zFH83Eg35LUORw4YfoYcFVKLp1/+MYxPUPQ2IZgAjNohEe1zjz5HV+79l/L/X+RX3/Kf/xEWyP/N5S257Z/6G6L/yq//7t9mczGNzs4zNKRzILgDlqxB5kmwwT/+MYxPMRW2oMAACTEOtSVaqgL5z////L/r5uv9l932Iqs6rrWlKk/X9////+VkVkZUtNU5iMJipxhSuSYSHh0YHjAMNDBApV/+MYxOgOw1YeQAiNo7JJAIBVERa6+/ouv/+v/+n/0S+2l6/7tQlkRlVnrLX7J3rf////lvvRTdGh5SIymcxxMCOHBVCAIVyi/+MYxOgNO2IUIABRE8eqbbccZJDy/t7IBflU0yZSr1f//8P/l/NLmJGXnf//P/mS+vPz64fXv/+Vnk07M4hi2ARxDnEALYo7/+MYxO4QI2YZoAiTog0q/mf5+/PRecBUTceU1CsWyIeDtvHvkVf///+onuau2mo5sa/mIyRDiyjg4SCxQkcD4uYYHZpV1f5L/+MYxOgNi1YZQAgKr3tyJpZXqam08x5NonOKSlhR+yn7//+/3481Fz57PBRj/g7oQEFI6H9TWDiYYQtIqQo5Cv/v28nVs93o/+MYxOwPC2IaQAgEpciq9jsdUuYoeRpSM6dkVmyYalVMhjSsv9N7t354fdhCMPa2Ssynr4RVJFEUpkzSrEx8UziQsSnqWEpd/+MYxOoOk2YiSAhG3rlV+3lI+Hit16tmBInizR3TaL/////z/u3f/NupzId73kUyOG6gVsVIKycRtgoNwlL/4fyZqjXIRqZM/+MYxOoNi2oUAABRENcwkJmFCROYYhEKFCYVhJ5SFCv/1Nabf5yq8ybczPokkbpRI0jGmlIz2OJWRk5JyIBMAS5FTEFNRTMu/+MYxO4NK2IQAABNLTk5LjNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPQRC2oMAACTEFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxOoLw14UAABNLFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxPYPo13sAABNEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';