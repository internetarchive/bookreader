// @ts-check
import { Cache } from '../../util/cache.js';

export const langs = /** @type {{[lang: string]: string}} */ {
  "bg": "Bulgarian",
  "ca": "Catalan",
  "cs": "Czech",
  "nl": "Dutch",
  "en": "English",
  "et": "Estonian",
  "de": "German",
  "fr": "French",
  "is": "Icelandic",
  "it": "Italian",
  "nb": "Norwegian Bokmål",
  "nn": "Norwegian Nynorsk",
  "fa": "Persian",
  "pl": "Polish",
  "pt": "Portuguese",
  "ru": "Russian",
  "es": "Spanish",
  "uk": "Ukrainian",
};
const status = message => (console.log(message));

export class TranslationManager {
  /** @type {Cache<{index: string, response: string}>} */
  alreadyTranslated = new Cache(100);
  
  /**
  * @typedef {Object} genericModelInfo
  * @property {string} name
  * @property {number} size
  * @property {number} estimatedCompressedSize
  * @property {any} [qualityModel]
  * @property {string} [expectedSha256Hash]
  * @property {string} [modelType]
  */
  /**
  * @type { {[langPair: string] : {model: genericModelInfo, lex: genericModelInfo, vocab: genericModelInfo, quality?: genericModelInfo}} }
  */
  modelRegistry = {};

  /** @type {Record<key, {promise: Promise<string>, resolve: function, reject: function}>} */
  currentlyTranslating = {}
  /** @type {Record<key, {promise: Promise<string>, resolve: function, reject: function}>} */
  _modelPromises = {};
  /** 
   * @type {string} 
   * e.g. 'ende' 'encz'
  */
  currentModel = '';

  /** @type {Record<string, string>[]} */
  fromLanguages = [];
  /** @type {Record<string, string>[]} */
  toLanguages = [];


  constructor() {
    //TODO Should default to the book language as the first element
    const enModel = {code: "en", name: "English", type: "prod"};
    this.fromLanguages.push(enModel);
    this.toLanguages.push(enModel);
  }


  async initWorker() {
    if (this.initPromise) return this.initPromise;

    if (window.Worker) {
      this.worker = new Worker("/BookReader/translate/worker.js");
      this.worker.postMessage(["import"]);
    }

    this.initPromise = new Promise((resolve, reject) => {
      this._initResolve = resolve;
      this._initReject = reject;
    });

    this.worker.onmessage = (e) => {
      const [cmd, ...rest] = e.data;
      if (cmd === "translate_reply" && rest[0]) {
        const [translation, key] = rest;
        if (translation.length) {
          this.currentlyTranslating[key].resolve(translation[0]);
          this.alreadyTranslated.add({index: key, response: translation})
          delete this.currentlyTranslating[key];
        }
      } else if (cmd === "load_model_reply" && e.data[1]) {
        status(e.data[1]);
        const [result, from, to] = rest;
        this._modelPromises[`${from}${to}`].resolve(result);
        // keep as source of truth
        this.currentModel = `${from}${to}`;
      } else if (cmd === "import_reply" && e.data[1]) {
        this.modelRegistry = e.data[1];
        for (const [langPair, value] of Object.entries(this.modelRegistry)) {
          const firstLang = langPair.substring(0, 2);
          const secondLang = langPair.substring(2, 4);

          if (firstLang !== "en") {
            const fromModelType = value.model.modelType !== "dev" ? langs[firstLang] : langs[firstLang] + " (βeta)";
            this.fromLanguages.push({code: firstLang, name: fromModelType, type: value.model.modelType});
          }
          if (secondLang !== "en") {
            const toModelType = value.model.modelType !== "dev" ? langs[secondLang] : langs[secondLang] + " (βeta)";
            this.toLanguages.push({code: secondLang, name: toModelType, type: value.model.modelType});
          }
        }

        this._initResolve([this.modelRegistry]);
        
      } else {
        console.log("Unrecognized cmd:" + cmd + " \n Or invalid data:", e);
      }
    }
    return this.initPromise;
  }

  /**
   * @param {string} fromCode
   * @param {string} toCode
   * @returns {Promise<string>} Promise result 
   */
  loadModel = async (fromCode, toCode) => {
    if (fromCode === toCode || !this.isSupported(fromCode, toCode)) {
      status("Language pair is not supported");
      return;
    }

    const key = `${fromCode}${toCode}`;
    if (key in this._modelPromises && this.currentModel == key) {
      return this._modelPromises[key].promise;
    }
    status(`Installing model...`);
    console.log(`Loading model '${fromCode}${toCode}'`);

    let _resolve = null;
    let _reject = null;

    const promise = new Promise((res, rej) => {
      _resolve = res;
      _reject = rej;
    })

    this._modelPromises[key] = {
      promise,
      resolve: _resolve,
      reject: _reject,
    }
    this.currentModel = key;
    this.worker.postMessage(["load_model", fromCode, toCode]);
    return promise;
  };

  isSupported = (lngFrom, lngTo) => {
    return (`${lngFrom}${lngTo}` in this.modelRegistry) || lngFrom === lngTo ||
      ((`${lngFrom}en` in this.modelRegistry) && (`en${lngTo}` in this.modelRegistry));
  }

  /**
   * Targets the page and paragraph of a text layer to create a translation from the "fromLang" to the "toLang"
   * @param {string} fromLang
   * @param {string} toLang
   * @param {string} pageIndex
   * @param {number} paragraphIndex
   * @param {string} text
   * @return {Promise<string>} translated text
   */

  getTranslation = async (fromLang, toLang, pageIndex, paragraphIndex, text) => {
    const key = `${fromLang}${toLang}-${pageIndex}:${paragraphIndex}`;

    const cachedEntry = this.alreadyTranslated.entries.find(x => x.index == key);
    if (cachedEntry) {
      return cachedEntry.response;
    }

    if (key in this.currentlyTranslating) {
      return this.currentlyTranslating[key].promise;
    }

    let _resolve = null;
    let _reject = null;
    const promise = new Promise((res, rej) => {
      _resolve = res;
      _reject = rej;
    })


    this.currentlyTranslating[key] = {
      promise,
      resolve: _resolve,
      reject: _reject,
    };

    if (!text) {
      this.currentlyTranslating[key].reject("No text was provided");
      return promise
    }
    this.loadModel(fromLang, toLang).then(() => {
      this.worker.postMessage([
        "translate",
        fromLang,
        toLang,
        [text],
        key,
        paragraphIndex
      ])
    })
    .catch(e => _reject(e));

    return promise;
  }
  // TODO name better, maybe not needed?
  checkModel = (fromLang, toLang) => {
    const key = `${fromLang}${toLang}`;
    return key in this._modelPromises;
  };
}