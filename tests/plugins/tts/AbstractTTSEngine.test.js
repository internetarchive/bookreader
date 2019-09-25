import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import AbstractTTSEngine from '../../../src/js/plugins/tts/AbstractTTSEngine.js';
/** @typedef {import('../../../src/js/plugins/tts/AbstractTTSEngine.js').TTSEngineOptions} TTSEngineOptions */

describe('AbstractTTSEngine', () => {
    test('stops playing once done', () => {
        const d = new AbstractTTSEngine(DUMMY_TTS_ENGINE_OPTS);
        d.chunkStream = { pull: sinon.stub().resolves({ done: true }) };
        const stopStub = sinon.stub(d, 'stop');
        expect(stopStub.callCount).toBe(0);
        d.step();
        return afterEventLoop()
        .then(() => expect(stopStub.callCount).toBe(1));
    });
});

/** @type {TTSEngineOptions} */
export const DUMMY_TTS_ENGINE_OPTS = {
    server: 'blah',
    bookPath: 'blah',
    bookLanguage: 'blah',
    onLoadingStart() {},
    onLoadingComplete() {},
    onDone() {},
    beforeChunkPlay() { return Promise.resolve(); },
    afterChunkPlay() {},
};
