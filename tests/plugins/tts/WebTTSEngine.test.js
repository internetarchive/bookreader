import sinon from 'sinon';
import { WebTTSSound } from '../../../src/js/plugins/tts/WebTTSEngine.js';
import { afterEventLoop, eventTargetMixin } from '../../utils.js';

beforeEach(() => {
    window.speechSynthesis = {
        cancel: sinon.stub(),
        speak: sinon.stub(),
        pause: sinon.stub(),
        resume: sinon.stub(),
        ...eventTargetMixin(),
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
            sound.load();
            expect(sound.rate).toBe(1);
            sound.setPlaybackRate(2);
            expect(sound.rate).toBe(2);
        });

        test('reloading does not resolve the original promise', () => {
            const sound = new WebTTSSound('hello world');
            sound.load();
            const finishSpy = sinon.spy();
            sound.play().then(finishSpy);
            sound.reload();
            sound.utterance.dispatchEvent('pause', {});
            return afterEventLoop()
            .then(() => {
                sound.utterance.dispatchEvent('end', {});
                return afterEventLoop()
            })
            .then(() => expect(finishSpy.callCount).toBe(0));
        });
    });

    describe('_chromePausingBugFix', () => {
        test('if speech less than 15s, nothing special', () => {
            const clock = sinon.useFakeTimers();
            const sound = new WebTTSSound('hello world foo bar');
            sound.load();
            sound.play();
            sound._chromePausingBugFix();
            clock.tick(10000);
            sound.utterance.dispatchEvent('end', {});
            clock.restore();
            return afterEventLoop()
            .then(() => {
                expect(speechSynthesis.pause.callCount).toBe(0);
            });
        });
        
        test('if speech greater than 15s, pause called', () => {
            let clock = sinon.useFakeTimers();
            const sound = new WebTTSSound('foo bah');
            sound.load();
            sound.play();
            sound._chromePausingBugFix();
            clock.tick(20000);
            clock.restore();
            
            return afterEventLoop()
            .then(() => expect(speechSynthesis.pause.callCount).toBe(1));
        });
    });
});
