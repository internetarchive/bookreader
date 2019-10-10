import '../../../BookReader/jquery-1.10.1.js';
import '../../../BookReader/jquery.browser.min.js';
import FestivalTTSEngine from '../../../src/js/plugins/tts/FestivalTTSEngine.js';
import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import { DUMMY_TTS_ENGINE_OPTS } from './AbstractTTSEngine.test.js';
/** @typedef {import('../../../src/js/plugins/tts/AbstractTTSEngine.js').TTSEngineOptions} TTSEngineOptions */

describe('iOSCaptureUserIntentHack', () => {
    test('synchronously calls createSound/play to capture user intent', () => {
        const mockSound = createMockSound();
        const sm = {
            supported: sinon.stub().returns(true),
            createSound: sinon.stub().returns(mockSound),
        };
        window.soundManager = sm;
        const engine = new FestivalTTSEngine(DUMMY_TTS_ENGINE_OPTS);
        engine.iOSCaptureUserIntentHack();

        expect(sm.createSound.callCount).toBe(1);
        expect(mockSound.play.callCount).toBe(1);
    });
});

describe('misc', () => {
    test('starts playing even if onload not called until play starts', () => {
        const sm = {
            supported: sinon.stub().returns(true),
            createSound: sinon.stub().returns(createMockSound()),
            stopAll: sinon.stub(),
        };
        window.soundManager = sm;
        const engine = new FestivalTTSEngine(DUMMY_TTS_ENGINE_OPTS);
        sinon.stub(engine, 'playChunk').resolves();
        sinon.stub(engine, 'fetchPageChunks').resolves([{
            leafIndex: 0,
            chunkIndex: 0,
            text: 'Once upon a time',
            lineRects: [],
        }]);
        engine.start(0, 5);

        // because things happen in callbacks, need to run code at end of the JS event loop
        return afterEventLoop()
        .then(() => {
            expect(sm.createSound.callCount).toBe(1);
            expect(engine.fetchPageChunks.callCount).toBe(5);
            expect(engine.playChunk.callCount).toBe(1);
        });
    });
});

/** @returns {SMSound} */
function createMockSound() {
    return {
        load: sinon.stub(),
        play: sinon.stub(),
        destruct: sinon.stub(),
    };
}
