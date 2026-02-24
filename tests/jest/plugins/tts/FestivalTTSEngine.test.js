import FestivalTTSEngine from '@/src/plugins/tts/FestivalTTSEngine.js';
import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import { DUMMY_TTS_ENGINE_OPTS } from './AbstractTTSEngine.test.js';
import PageChunk from '@/src/plugins/tts/PageChunk.js';
import PageChunkIterator from '@/src/plugins/tts/PageChunkIterator.js';
/** @typedef {import('@/src/plugins/tts/AbstractTTSEngine.js').TTSEngineOptions} TTSEngineOptions */

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
  test('starts playing even if onload not called until play starts', async () => {
    const sm = {
      supported: sinon.stub().returns(true),
      createSound: sinon.stub().returns(createMockSound()),
      stopAll: sinon.stub(),
    };
    window.soundManager = sm;
    const engine = new FestivalTTSEngine(DUMMY_TTS_ENGINE_OPTS);
    sinon.stub(engine, 'playSound').returns(new Promise(() => {}));
    sinon.stub(engine, 'stop');
    sinon.stub(PageChunkIterator.prototype, '_fetchPageChunks').resolves([dummyPageChunk()]);
    engine.start(0, 5);

    // because things happen in callbacks, need to run code at end of the JS event loop
    await afterEventLoop();
    expect(sm.createSound.callCount).toBe(1);
    expect(PageChunkIterator.prototype._fetchPageChunks.callCount).toBeGreaterThanOrEqual(1);
    expect(engine.playSound.callCount).toBe(1);
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

/** @return {PageChunk} */
function dummyPageChunk() {
  return new PageChunk(0, 0, 'Once upon a time', []);
}
