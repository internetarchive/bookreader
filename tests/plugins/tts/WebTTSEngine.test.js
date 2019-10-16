import sinon from 'sinon';
import { WebTTSSound } from '../../../src/js/plugins/tts/WebTTSEngine.js';
import { afterEventLoop, eventTargetMixin } from '../../utils.js';

beforeEach(() => {
    window.speechSynthesis = {
        cancel: sinon.stub(),
        speak: sinon.stub(),
        pause: sinon.stub(),
        resume: sinon.stub(),
    };
    window.SpeechSynthesisUtterance = function (text) {
        this.text = text;
        Object.assign(this, eventTargetMixin());
    };
});

afterEach(() => {
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
});


describe('WebTTSSound', () => {
    describe('setPlaybackRate', () => {
        test('works if not playing', () => {
            const sound = new WebTTSSound('hello world');
            expect(sound.rate).toBe(1);
            sound.setPlaybackRate(2);
            expect(sound.rate).toBe(2);
        });

        test('if playing, pauses/stops, but does not resolve the original promise', () => {
            const sound = new WebTTSSound('hello world');
            sound.load();
            sound.play();
            const originalOnEndSpy = sinon.spy(sound.sound, 'onend');
            sound.setPlaybackRate(2);
            expect(sound.rate).toBe(1);
            sound.sound.dispatchEvent('pause', {})
            return afterEventLoop()
            .then(() => {
                expect(sound.rate).toBe(2);
                expect(window.speechSynthesis.speak.callCount).toBe(2);
                expect(originalOnEndSpy.callCount).toBe(0);
            });
        });
    });

    describe('_chromePausingBugFix', () => {
        test('if speech less than 15s, nothing special', () => {
            const clock = sinon.useFakeTimers();
            let endResolver = null;
            const endPromise = new Promise(res => endResolver = res);
            const sound = new WebTTSSound();
            sound._chromePausingBugFix(endPromise);
            clock.tick(10000);
            endResolver();
            clock.restore();
            return afterEventLoop()
            .then(() => {
                expect(speechSynthesis.pause.callCount).toBe(0);
            });
        });

        
        test('if speech greater than 15s, pause called', () => {
            let clock = sinon.useFakeTimers();
            const endPromise = new Promise(res => {});
            const sound = new WebTTSSound('foo bah');
            sound.load();
            sound._chromePausingBugFix(endPromise);
            clock.tick(20000);
            clock.restore();
            
            return afterEventLoop()
            .then(() => expect(speechSynthesis.pause.callCount).toBe(1));
        });
    });
});
