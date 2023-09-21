import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import AbstractTTSEngine from '@/src/plugins/tts/AbstractTTSEngine.js';
import PageChunkIterator from '@/src/plugins/tts/PageChunkIterator.js';
/** @typedef {import('@/src/plugins/tts/AbstractTTSEngine.js').TTSEngineOptions} TTSEngineOptions */

// Skipping because it's flaky. Fix in #672
describe.skip('AbstractTTSEngine', () => {
  test('stops playing once done', async () => {
    class DummyEngine extends AbstractTTSEngine {
      getVoices() { return []; }
    }
    const d = new DummyEngine(DUMMY_TTS_ENGINE_OPTS);
    d._chunkIterator = { next: sinon.stub().resolves(PageChunkIterator.AT_END) };
    const stopStub = sinon.stub(d, 'stop');
    expect(stopStub.callCount).toBe(0);
    d.step();
    await afterEventLoop();
    expect(stopStub.callCount).toBe(1);
  });
});

for (const dummyVoice of [dummyVoiceHyphens, dummyVoiceUnderscores]) {
  describe(`getBestBookVoice with BCP47 ${dummyVoice == dummyVoiceUnderscores ? '+' : '-'} underscores`, () => {
    const { getBestBookVoice } = AbstractTTSEngine;

    test('undefined if no voices', () => {
      expect(getBestBookVoice([], 'en', [])).toBe(undefined);
    });

    test('returns first voice if no matching', () => {
      const enVoice = dummyVoice({lang: "en-US"});
      expect(getBestBookVoice([enVoice], 'fr', [])).toBe(enVoice);
    });

    test('choose first matching voice', () => {
      const voices = [
        dummyVoice({lang: "en-GB"}),
        dummyVoice({lang: "en-US"}),
      ];
      expect(getBestBookVoice(voices, 'en', [])).toBe(voices[0]);
    });

    test('choose first matching default voice', () => {
      const voices = [
        dummyVoice({lang: "en-GB"}),
        dummyVoice({lang: "en-US", default: true}),
      ];
      expect(getBestBookVoice(voices, 'en', [])).toBe(voices[1]);
    });

    test('does not choose default if better language match exists', () => {
      const voices = [
        dummyVoice({lang: "en-US", default: true}),
        dummyVoice({lang: "fr-FR"}),
      ];
      expect(getBestBookVoice(voices, 'fr', [])).toBe(voices[1]);
    });

    test('choose users dialect if present', () => {
      const voices = [
        dummyVoice({lang: "en-GB"}),
        dummyVoice({lang: "en-CA"}),
        dummyVoice({lang: "en-US"}),
      ];
      expect(getBestBookVoice(voices, 'en', ['en-CA', 'en'])).toBe(voices[1]);
    });

    test('choose users dialect even if not default', () => {
      const voices = [
        dummyVoice({lang: "en-US", default: true}),
        dummyVoice({lang: "en-GB"}),
        dummyVoice({lang: "en-CA"}),
      ];
      expect(getBestBookVoice(voices, 'en', ['en-CA', 'en'])).toBe(voices[2]);
    });

    test('choose language even if dialect does not match', () => {
      const voices = [
        dummyVoice({lang: "en-GB"}),
      ];
      expect(getBestBookVoice(voices, 'en', ['en-CA'])).toBe(voices[0]);
    });

    test('real world example', () => {
      // Chrome 77 @ Windows 10
      const voices = [
        { default: true, lang: "en-US", name: "Microsoft David Desktop - English (United States)", localService: true, voiceURI: "Microsoft David Desktop - English (United States)" },
        { default: false, lang: "de-DE", name: "Microsoft Hedda Desktop - German", localService: true, voiceURI: "Microsoft Hedda Desktop - German" },
        { default: false, lang: "en-US", name: "Microsoft Zira Desktop - English (United States)", localService: true, voiceURI: "Microsoft Zira Desktop - English (United States)" },
        { default: false, lang: "de-DE", name: "Google Deutsch", localService: false, voiceURI: "Google Deutsch" },
        { default: false, lang: "en-US", name: "Google US English", localService: false, voiceURI: "Google US English" },
        { default: false, lang: "en-GB", name: "Google UK English Female", localService: false, voiceURI: "Google UK English Female" },
        { default: false, lang: "en-GB", name: "Google UK English Male", localService: false, voiceURI: "Google UK English Male" },
        { default: false, lang: "es-ES", name: "Google español", localService: false, voiceURI: "Google español" },
        { default: false, lang: "es-US", name: "Google español de Estados Unidos", localService: false, voiceURI: "Google español de Estados Unidos" },
        { default: false, lang: "fr-FR", name: "Google français", localService: false, voiceURI: "Google français" },
        { default: false, lang: "hi-IN", name: "Google हिन्दी", localService: false, voiceURI: "Google हिन्दी" },
        { default: false, lang: "id-ID", name: "Google Bahasa Indonesia", localService: false, voiceURI: "Google Bahasa Indonesia" },
        { default: false, lang: "it-IT", name: "Google italiano", localService: false, voiceURI: "Google italiano" },
        { default: false, lang: "ja-JP", name: "Google 日本語", localService: false, voiceURI: "Google 日本語" },
        { default: false, lang: "ko-KR", name: "Google 한국의", localService: false, voiceURI: "Google 한국의" },
        { default: false, lang: "nl-NL", name: "Google Nederlands", localService: false, voiceURI: "Google Nederlands" },
        { default: false, lang: "pl-PL", name: "Google polski", localService: false, voiceURI: "Google polski" },
        { default: false, lang: "pt-BR", name: "Google português do Brasil", localService: false, voiceURI: "Google português do Brasil" },
        { default: false, lang: "ru-RU", name: "Google русский", localService: false, voiceURI: "Google русский" },
        { default: false, lang: "zh-CN", name: "Google 普通话（中国大陆）", localService: false, voiceURI: "Google 普通话（中国大陆）" },
        { default: false, lang: "zh-HK", name: "Google 粤語（香港）", localService: false, voiceURI: "Google 粤語（香港）" },
        { default: false, lang: "zh-TW", name: "Google 國語（臺灣）", localService: false, voiceURI: "Google 國語（臺灣）" }
      ];

      expect(getBestBookVoice(voices, 'en', ['en-CA', 'en'])).toBe(voices[0]);
    });

    test('choose stored language from localStorage', () => {
      const voices = [
        dummyVoice({lang: "en-US", voiceURI: "English US", default: true}),
        dummyVoice({lang: "en-GB", voiceURI: "English GB",}),
        dummyVoice({lang: "en-CA", voiceURI: "English CA",}),
      ];
      class DummyEngine extends AbstractTTSEngine {
        getVoices() { return voices; }
      };
      const ttsEngine = new DummyEngine({...DUMMY_TTS_ENGINE_OPTS, bookLanguage: 'en'});
      // simulates setting default voice on tts startup
      ttsEngine.updateBestVoice();
      // simulates user choosing a voice that matches the bookLanguage
      // voice will be stored in localStorage
      ttsEngine.setVoice(voices[2].voiceURI);

      // expecting the voice to be selected by getMatchingStoredVoice and returned as best voice
      expect(getBestBookVoice(voices, 'en', [])).toBe(voices[2]);
    });
  });
}

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

/**
 * @param {SpeechSynthesisVoice}
 * @return {SpeechSynthesisVoice}
 **/
function dummyVoiceHyphens(overrides) {
  return Object.assign({
    default: false,
    lang: "en-US",
    name: "Microsoft David",
    localService: false,
    voiceURI: "",
  }, overrides);
}

/**
 * Construct a voice-like object using underscores instead of hyphenes
 * (Like Chrome/Android)
 * @param {SpeechSynthesisVoice}
 * @return {SpeechSynthesisVoice}
 **/
function dummyVoiceUnderscores(overrides) {
  const voice = dummyVoiceHyphens(overrides);
  voice.lang = voice.lang.replace('-', '_');
  return voice;
}
