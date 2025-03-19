import sinon from 'sinon';
import WebTTSEngine, { WebTTSSound } from '@/src/plugins/tts/WebTTSEngine.js';
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

describe('WebTTSEngine', () => {
  test('getVoices should include default voice when no actual default', () => {
    // iOS devices set all the voices to default -_-
    speechSynthesis.getVoices = () => [
      {
        default: true,
        lang: "ar-001",
        localService: true,
        name: "Majed",
        voiceURI: "com.apple.voice.compact.ar-001.Maged",
      },
      {
        default: true,
        lang: "bg-BG",
        localService: true,
        name: "Daria",
        voiceURI: "com.apple.voice.compact.bg-BG.Daria",
      },
    ];
    const voices = WebTTSEngine.prototype.getVoices();
    expect(voices.length).toBe(3);
    expect(voices[0].voiceURI).toBe('bookreader.SystemDefault');
  });

  test('getVoices should not include default voice when there is a default', () => {
    speechSynthesis.getVoices = () => [
      {
        default: true,
        lang: "ar-001",
        localService: true,
        name: "Majed",
        voiceURI: "com.apple.voice.compact.ar-001.Maged",
      },
      {
        default: false,
        lang: "bg-BG",
        localService: true,
        name: "Daria",
        voiceURI: "com.apple.voice.compact.bg-BG.Daria",
      },
    ];
    const voices = WebTTSEngine.prototype.getVoices();
    expect(voices.length).toBe(2);
  });
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

    test('reloading does not resolve the original promise', async () => {
      const sound = new WebTTSSound('hello world');
      sound.load();
      const finishSpy = sinon.spy();
      sound.play().then(finishSpy);
      sound.reload();
      sound.utterance.dispatchEvent('pause', {});
      await afterEventLoop();
      sound.utterance.dispatchEvent('end', {});
      await afterEventLoop();
      expect(finishSpy.callCount).toBe(0);
    });
  });

  describe('_chromePausingBugFix', () => {
    /** @type {sinon.SinonFakeTimers} */
    let clock = null;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    test('if speech less than 15s, nothing special', async () => {
      const sound = new WebTTSSound('hello world foo bar');
      sound.load();
      sound.play();
      sound._chromePausingBugFix();
      clock.tick(10000);
      sound.utterance.dispatchEvent('end', {});
      await afterEventLoop();
      expect(speechSynthesis.pause.callCount).toBe(0);
    });

    test('if speech greater than 15s, pause called', async () => {
      const sound = new WebTTSSound('foo bah');
      sound.load();
      sound.play();
      sound._chromePausingBugFix();
      clock.tick(20000);

      await afterEventLoop();
      expect(speechSynthesis.pause.callCount).toBe(1);
    });

    test('on pause reloads if timed out', async () => {
      const sound = new WebTTSSound('foo bah');
      sound.load();
      sound.play();
      sound._chromePausingBugFix();
      clock.tick(5000);
      sound.utterance.dispatchEvent('pause', {});
      await afterEventLoop();
      clock.tick(15000);

      await afterEventLoop();
      expect(sound._chromeTimedOutWhilePaused).toBe(true);
    });
  });

  test('fire pause if browser does not do it', async () => {
    const clock = sinon.useFakeTimers();
    const languageGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    languageGetter.mockReturnValue('firefox android');
    const sound = new WebTTSSound('foo bah');
    sound.load();
    sound.play();
    const dispatchSpy = sinon.spy(sound.utterance, 'dispatchEvent');
    sound.pause();
    clock.tick(1000);
    clock.restore();

    await afterEventLoop();
    expect(dispatchSpy.callCount).toBe(1);
    expect(dispatchSpy.args[0][0].type).toBe('pause');
  });

  test('fire resume if browser does not do it', async () => {
    const clock = sinon.useFakeTimers();
    const languageGetter = jest.spyOn(window.navigator, 'userAgent', 'get');
    languageGetter.mockReturnValue('firefox android');
    const sound = new WebTTSSound('foo bah');
    sound.load();
    sound.play();
    sound.started = true;
    sound.paused = true;
    const dispatchSpy = sinon.spy(sound.utterance, 'dispatchEvent');
    sound.resume();
    clock.tick(1000);
    clock.restore();

    await afterEventLoop();
    expect(dispatchSpy.callCount).toBe(1);
    expect(dispatchSpy.args[0][0].type).toBe('resume');
  });
});
