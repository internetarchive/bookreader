import langs from 'iso-language-codes';

/**
 * Use regex to approximate word count in a string
 * @param {string} text
 * @return {number}
 */
export function approximateWordCount(text) {
  const m = text.match(/\S+/g);
  return m ? m.length : 0;
}

/**
 * Checks whether the current browser is on android
 * @param {string} [userAgent]
 * @return {boolean}
 */
export function isAndroid(userAgent = navigator.userAgent) {
  return /android/i.test(userAgent);
}

/**
 * @typedef {string} ISO6391
 * Language code in ISO 639-1 format. e.g. en, fr, zh
 **/

/**
 * @param {string} language in some format
 * @return {ISO6391?}
 */
export function toISO6391(language) {
  if (!language) return null;
  language = language.toLowerCase();

  return searchForISO6391(language, ['iso639_1']) ||
    searchForISO6391(language, ['iso639_2T']) ||
    searchForISO6391(language, ['iso639_2B', 'nativeName', 'name']);
}

/**
 * Searches for the given long in the given columns.
 * @param {string} language
 * @param {Array<keyof import('iso-language-codes').Code>} columnsToSearch
 * @return {ISO6391?}
 */
function searchForISO6391(language, columnsToSearch) {
  for (const lang of langs) {
    for (const colName of columnsToSearch) {
      if (lang[colName].split(', ').map(x => x.toLowerCase()).indexOf(language) != -1) {
        return lang.iso639_1;
      }
    }
  }
  return null;
}

/**
 * Checks whether the current browser supports localStorage or
 * if the current context has access to it.
 * @return {boolean}
 */
export function hasLocalStorage() {
  try {
    return !!window.localStorage;
  } catch (e) {
    // Will throw in sandboxed iframe
    // DOMException: Window.localStorage getter: Forbidden in a sandboxed document without the 'allow-same-origin' flag.
    return false;
  }
}

export const DEBUG_READ_ALOUD = location.toString().indexOf('_debugReadAloud=true') != -1;

export async function checkIfFiresPause() {
  // Pick some random text so that if it accidentally speaks, it's not too annoying
  const u = new SpeechSynthesisUtterance("Loading");
  let calledPause = false;
  u.addEventListener('pause', () => calledPause = true);
  speechSynthesis.speak(u);
  await new Promise(res => setTimeout(res, 10));
  speechSynthesis.pause();
  return calledPause;
}
