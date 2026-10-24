// @ts-check
import { Cache } from '../../util/cache.js';
import { BatchTranslator } from '@internetarchive/bergamot-translator/translator.js';
import { toISO6391, toNativeName } from '../tts/utils.js';

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

  /** @type {Record<string, string>[]} */
  fromLanguages = [];
  /** @type {Record<string, string>[]} */
  toLanguages = [];

  /** @type {boolean} */
  active = false;

  publicPath = '';

  /** @type {((progress: {from: string, to: string, loaded: number}) => void) | null} */
  _onModelProgress = null;

  constructor() {
    //TODO Should default to the book language as the first element
    const enModel = {code: "en", name: "English (en)", type: "prod"};
    this.fromLanguages.push(enModel);
    this.toLanguages.push(enModel);
  }


  async initWorker() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      this._initResolve = resolve;
      this._initReject = reject;
    });
    const registryUrl = "https://cors.archive.org/cors/mozilla-translate-models/firefox_models/";
    const registryJson = await fetch(registryUrl + "registry.json").then(r => r.json());
    for (const language of Object.values(registryJson)) {
      for (const file of Object.values(language)) {
        file.name = registryUrl + file.name;
      }
    }

    /** @type {BatchTranslator} */
    // Arbitrary setting for number of workers, 1 is already quite fast
    // batchSize from 8 -> 4 for improved performance
    this.translator = new BatchTranslator({
      registryUrl: `data:application/json,${encodeURIComponent(JSON.stringify(registryJson))}`,
      workers: 2,
      batchSize: 4,
      workerUrl: this.publicPath + '/translator-worker.js',
      onmodelprogress: (progress) => this._onModelProgress?.(progress),
    });

    const modelType = await this.translator.backing.registry;
    const arr = {}; // unsure if we need to keep track of the files
    for (const obj of Object.values(modelType)) {
      const firstLang = obj['from'];
      const secondLang = obj['to'];
      const fromModelType = obj['files'];
      arr[`${firstLang}${secondLang}`] = fromModelType;
      // Assuming that all of the languages loaded from the registryUrl inside @internetarchive/bergamot-translator/translator.js are prod
      // List of dev models found here https://github.com/mozilla/firefox-translations-models/tree/main/models/base
      // There are also differences between the model types in the repo above here: https://github.com/mozilla/firefox-translations-models?tab=readme-ov-file#firefox-translations-models
      if (firstLang !== "en") {
        const name = `${toNativeName(firstLang)} (${toISO6391(firstLang)})`;
        this.fromLanguages.push({code: firstLang, name: name, type: "prod"});
      }
      if (secondLang !== "en") {
        const name = `${toNativeName(secondLang)} (${toISO6391(secondLang)})`;
        this.toLanguages.push({code: secondLang, name: name, type: "prod"});
      }
    }
    this._initResolve([this.modelRegistry]);
    return this.initPromise;
  }

  /**
   * Targets the page and paragraph of a text layer to create a translation from the "fromLang" to the "toLang". Tries to force order in translation by using the pageIndex (+1000 if the current page is not visible) and paragraphIndex
   * @param {string} fromLang
   * @param {string} toLang
   * @param {string} pageIndex
   * @param {number} paragraphIndex
   * @param {string} text
   * @param {number} priority
   * @return {Promise<string>} translated text
   */

  getTranslation = async (fromLang, toLang, pageIndex, paragraphIndex, text, priority) => {
    this.active = true;
    if (fromLang == toLang || !fromLang || !toLang) {
      return;
    }
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
    });

    this.currentlyTranslating[key] = {
      promise,
      resolve: _resolve,
      reject: _reject,
    };

    if (!text) {
      this.currentlyTranslating[key].reject("No text was provided");
      return promise;
    }
    this.translator.translate({
      to: toLang,
      from: fromLang,
      text: text,
      html: false,
      priority: priority,
    }).then((resp) => {
      const response = resp;
      this.currentlyTranslating[key].resolve(response.target.text);
      this.alreadyTranslated.add({index: key, response: response.target.text});
      delete this.currentlyTranslating[key];
    }).catch((err) => {
      this.currentlyTranslating[key].reject(err);
      delete this.currentlyTranslating[key];
    });

    return promise;
  }

  /**
   * Downloads the model(s) needed to translate between two languages. Pairs without
   * English need two models, since they're translated through English.
   * @param {string} fromLanguage
   * @param {string} toLanguage
   * @param {object} [options]
   * @param {AbortSignal} [options.signal]
   * @param {(loaded: number, total: number) => void} [options.onProgress] bytes downloaded / total
   */
  loadTranslationModels = async (fromLanguage, toLanguage, {signal, onProgress} = {}) => {
    const models = await this.translator.backing.getModels({from: fromLanguage, to: toLanguage});
    const total = models
      .flatMap(model => Object.values(model.files))
      .reduce((sum, file) => sum + (file?.size || 0), 0);
    const loadedByModel = {};
    onProgress?.(0, total);

    const handler = ({from, to, loaded}) => {
      loadedByModel[`${from}${to}`] = loaded;
      onProgress?.(Object.values(loadedByModel).reduce((sum, n) => sum + n, 0), total);
    };
    this._onModelProgress = handler;
    try {
      await Promise.all(models.map(({from, to}) => this.translator.backing.getTranslationModel({from, to}, {signal})));
    } finally {
      if (this._onModelProgress === handler) this._onModelProgress = null;
    }
  }

  /** Drops all queued translation requests */
  cancelTranslations() {
    this.translator.remove(() => true);
  }
}
