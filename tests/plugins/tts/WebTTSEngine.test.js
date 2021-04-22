import sinon from 'sinon';
import { WebTTSSound } from '../../../src/plugins/tts/WebTTSEngine.js';
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
    test('if speech less than 15s, nothing special', async () => {
      const clock = sinon.useFakeTimers();
      const sound = new WebTTSSound('hello world foo bar');
      sound.load();
      sound.play();
      sound._chromePausingBugFix();
      clock.tick(10000);
      sound.utterance.dispatchEvent('end', {});
      clock.restore();
      await afterEventLoop();
      expect(speechSynthesis.pause.callCount).toBe(0);
    });

    test('if speech greater than 15s, pause called', async () => {
      const clock = sinon.useFakeTimers();
      const sound = new WebTTSSound('foo bah');
      sound.load();
      sound.play();
      sound._chromePausingBugFix();
      clock.tick(20000);
      clock.restore();

      await afterEventLoop();
      expect(speechSynthesis.pause.callCount).toBe(1);
    });

    test('on pause reloads if timed out', async () => {
      const clock = sinon.useFakeTimers();
      const sound = new WebTTSSound('foo bah');
      sound.load();
      sound.play();
      sound._chromePausingBugFix();
      sound.pause();
      clock.tick(2000);
      clock.restore();

      await afterEventLoop();
      expect(speechSynthesis.cancel.callCount).toBe(1);
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
