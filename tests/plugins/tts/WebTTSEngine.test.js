import sinon from 'sinon';
import { WebTTSSound } from '../../../src/js/plugins/tts/WebTTSEngine.js';
import { afterEventLoop } from '../../utils.js';

beforeEach(() => {
    window.speechSynthesis = {
        cancel: sinon.stub(),
        speak: sinon.stub(),
        pause: sinon.stub(),
        resume: sinon.stub(),
    };
    window.SpeechSynthesisUtterance = function (text) {
        this.text = text;
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
            let resolvePause = null;
            sinon.stub(sound, 'pause').callsFake(() => resolvePause = sound.sound.onpause);
            sound.setPlaybackRate(2);
            expect(sound.rate).toBe(1);
            resolvePause({});
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
            const newPromise = sound._chromePausingBugFix(endPromise);
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
            let endResolver = null;
            const endPromise = new Promise(res => endResolver = res);
            const sound = new WebTTSSound();
            const newPromise = sound._chromePausingBugFix(endPromise);
            clock.tick(20000);
            clock.restore();
            
            return afterEventLoop()
            .then(() => expect(speechSynthesis.pause.callCount).toBe(1));
        });
    });
});
