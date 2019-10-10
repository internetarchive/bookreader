import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import AbstractTTSEngine from '../../../src/js/plugins/tts/AbstractTTSEngine.js';
/** @typedef {import('../../../src/js/plugins/tts/AbstractTTSEngine.js').TTSEngineOptions} TTSEngineOptions */

describe('AbstractTTSEngine', () => {
    test('stops playing once done', () => {
        class Dummy extends AbstractTTSEngine {
            getPlayStream() {
                return { pull: sinon.stub().resolves({ done: true }) };
            }
        }
        const d = new Dummy(DUMMY_TTS_ENGINE_OPTS);
        const stopSpy = sinon.spy(d, 'stop');
        expect(stopSpy.callCount).toBe(0);
        d.step();
        return afterEventLoop()
        .then(() => expect(stopSpy.callCount).toBe(1));
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
