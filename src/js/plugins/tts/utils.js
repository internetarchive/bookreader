import langs from 'iso-language-codes/js/data.js';

/**
 * Convert a EventTarget style event into a promise
 * @param {EventTarget} target
 * @param {string} eventType
 * @return {Promise<Event>}
 */
export function promisifyEvent(target, eventType) {
  return new Promise(res => {
    const resolver = ev => {
      target.removeEventListener(eventType, resolver);
      res(ev);
    };
    target.addEventListener(eventType, resolver);
  });
}

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
 * Waits the provided number of ms and then resolves with a promise
 * @param {number} ms
 * @return {Promise}
 */
export function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
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

/** Each lang is an array, with each index mapping to a different property */
const COLUMN_TO_LANG_INDEX = {
  'Name': 0,
  'Endonym': 1,
  'ISO 639-1': 2,
  'ISO 639-2/T': 3,
  'ISO 639-2/B': 4
};

/**
 * @param {string} language in some format
 * @return {ISO6391?}
 */
export function toISO6391(language) {
  if (!language) return null;
  language = language.toLowerCase();

  return searchForISO6391(language, ['ISO 639-1']) ||
    searchForISO6391(language, ['ISO 639-2/B']) ||
    searchForISO6391(language, ['ISO 639-2/T', 'Endonym', 'Name']);
}

/**
 * Searches for the given long in the given columns.
 * @param {string} language
 * @param {Array<keyof COLUMN_TO_LANG_INDEX>} columnsToSearch
 * @return {ISO6391?}
 */
function searchForISO6391(language, columnsToSearch) {
  for (let i = 0; i < langs.length; i++) {
    for (let colI = 0; colI < columnsToSearch.length; colI++) {
      const column = columnsToSearch[colI];
      const columnValue = langs[i][COLUMN_TO_LANG_INDEX[column]];
      if (columnValue.split(', ').map(x => x.toLowerCase()).indexOf(language) != -1) {
        return langs[i][COLUMN_TO_LANG_INDEX['ISO 639-1']];
      }
    }
  }
  return null;
}
