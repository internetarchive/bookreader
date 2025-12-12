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

/** @type {{[lang: string]: string}} */
// Handle odd one-off language pairs that might show up over time
const specialLangs =  {
  "zh-hans": "中文 (Zhōngwén)",
};

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
  language = language.toLocaleLowerCase();
  if (specialLangs[language]) {
    return language;
  }
  const codeObj = findLanguage(language, 'iso639_1') || findLanguage(language, 'iso639_2T') || findLanguage(language, 'iso639_2B');
  if (codeObj) return codeObj.iso639_1;
  return null;
}

/**
 *
 * @param {string} language
 * @returns {string}
 */
export function toNativeName(language) {
  if (!language) return null;
  language = language.toLocaleLowerCase();
  if (specialLangs[language]) {
    return specialLangs[language];
  }
  const codeObj = findLanguage(language, 'iso639_1') || findLanguage(language, 'iso639_2T') || findLanguage(language, 'iso639_2B');
  if (codeObj?.nativeName) return codeObj.nativeName.split(", ")[0];
  return null;
}

/** @typedef {import('iso-language-codes').Code} Code */

/**
 * @param {string} language
 * @returns {Code | null}
 */
function findLanguage(language, codeType) {
  if (!language) return null;
  language = language.toLowerCase();
  for (const lang of langs) {
    if (lang[codeType].toLowerCase().split(", ").includes(language)) {
      return lang;
    } else if (lang.name.toLowerCase().split(", ").includes(language)) {
      return lang;
    } else if (lang.nativeName.toLowerCase().split(", ").includes(language)) {
      return lang;
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
