/**
 * A stand-in for jQuery, used only by the audio reader bundle.
 *
 * Why this exists: the audio reader reuses two modules from the read-aloud plugin
 * (`PageChunk` for parsing the OCR text response, `AbstractTTSEngine` for voice
 * selection, and `WebTTSSound` for the browser speech workarounds). Those files
 * mention `$` -- `PageChunk.fetch` uses `$.ajax`, `AbstractTTSEngine`'s
 * constructor uses `$({})` as an event emitter -- so webpack's ProvidePlugin
 * injects a `jquery` import at the top of each, and the real bundle resolves that
 * to the global `jQuery` that BookReader loads separately.
 *
 * The audio reader renders no page images and boots no BookReader, so pulling in
 * ~87KB of jQuery to satisfy code paths it never executes would be exactly the
 * dead weight cq #2 is about. Aliasing `jquery` to this file keeps the bundle
 * jQuery-free while still importing the real, tested modules.
 *
 * The parts this mode genuinely uses are all jQuery-free:
 *   - `PageChunk._fromTextWrapperResponse` (a pure parser)
 *   - `AbstractTTSEngine.getBestBookVoice` (a static method)
 *   - `WebTTSSound` (SpeechSynthesis only)
 *
 * Anything that really does need jQuery throws with an explanation rather than
 * failing later in a confusing way. If a future change trips one of these, the
 * fix is to extract the jQuery-free part upstream, not to widen this shim.
 */

const MESSAGE = 'AudioReader uses a jQuery stub (see src/audioreader/jqueryShim.js). '
  + 'This code path needs real jQuery, which the audio-first mode does not load.';

/**
 * @param {any} _selector
 * @return {never}
 */
function jqueryShim(_selector) {
  throw new Error(`${MESSAGE} Called as $(...)`);
}

jqueryShim.ajax = () => { throw new Error(`${MESSAGE} Called as $.ajax(...)`); };

export default jqueryShim;
