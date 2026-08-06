import IaAudioBook from './IaAudioBook.js';
import WebSpeechEngine from './engines/WebSpeechEngine.js';
import SyntheticPcmEngine from './engines/SyntheticPcmEngine.js';
import simulateLatency from './engines/simulateLatency.js';
import './AudioReaderView.js';

/**
 * Entry point for the audio-first reading mode (issue #1580).
 *
 * Boots a standalone `<ia-audio-reader>` against an archive.org item. Deliberately
 * does not load BookReader itself: this mode renders no page images, so none of
 * the page model, viewing modes, or image-oriented plugins are wanted. See cq #2.
 *
 * Query parameters:
 *   ocaid       archive.org identifier (required)
 *   engine      `webspeech` (default) or `pcm` (measurable tones, not speech)
 *   synthDelay  ms of artificial synthesis latency, to exercise the buffering
 *   lookahead   paragraphs to keep buffered (default 5)
 *   debug       `1` to show the buffer/plan overlay
 */

const DEFAULT_OCAID = 'theworksofplato01platiala';

/**
 * @param {URLSearchParams} params
 * @param {string} bookLanguage
 * @return {Object} an object implementing the player's TTSEngine interface
 */
function createEngine(params, bookLanguage) {
  const requested = params.get('engine') || 'webspeech';
  const engine = buildEngine(requested, bookLanguage);
  return simulateLatency(engine, Number(params.get('synthDelay')) || 0);
}

/**
 * @param {string} requested
 * @param {string} bookLanguage
 * @return {Object}
 */
function buildEngine(requested, bookLanguage) {
  if (requested === 'webspeech') {
    if (!WebSpeechEngine.isSupported()) {
      throw new Error('AudioReader: this browser has no speechSynthesis');
    }
    return new WebSpeechEngine({ bookLanguage });
  }

  if (requested === 'pcm') {
    if (!SyntheticPcmEngine.isSupported()) {
      throw new Error('AudioReader: this browser has no Web Audio');
    }
    return new SyntheticPcmEngine();
  }

  throw new Error(`AudioReader: unknown engine "${requested}"`);
}

/**
 * Record speech events on `window.__audioReaderEvents` so an automated browser
 * test can assert that audio really started rather than inferring it from the
 * absence of an error.
 */
function instrumentSpeech() {
  const log = [];
  window.__audioReaderEvents = log;

  if (typeof SpeechSynthesisUtterance === 'undefined') return;

  const nativeSpeak = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = (utterance) => {
    const record = { text: utterance.text, voice: utterance.voice?.name || null, spoke: false };
    log.push({ type: 'speak', ...record });
    utterance.addEventListener('start', () => log.push({ type: 'start', text: utterance.text }));
    utterance.addEventListener('end', () => log.push({ type: 'end', text: utterance.text }));
    utterance.addEventListener('error', ev => log.push({ type: 'error', text: utterance.text, error: ev.error }));
    return nativeSpeak(utterance);
  };
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  const ocaid = params.get('ocaid') || DEFAULT_OCAID;
  const view = document.querySelector('ia-audio-reader');
  view.debug = params.get('debug') === '1';

  instrumentSpeech();

  try {
    const book = await IaAudioBook.load(ocaid);
    const engine = createEngine(params, book.language);

    await view.attach(book, engine, {
      ...(params.get('lookahead') ? { lookahead: Number(params.get('lookahead')) } : {}),
    });

    // Handles for the browser tests and for poking at state in the console.
    window.audioReader = { book, engine, view, player: view.player };
    document.body.dataset.audioreaderReady = 'true';
    console.log(`AudioReader ready: "${book.title}" (${book.numLeafs} leaves, ${book.toc.length} TOC entries, ${engine.name})`);
  } catch (error) {
    console.error(error);
    document.body.dataset.audioreaderError = error.message;
    view.innerHTML = '';
    const message = document.createElement('p');
    message.className = 'audioreader-error';
    message.textContent = error.message;
    document.body.append(message);
  }
}

boot();
