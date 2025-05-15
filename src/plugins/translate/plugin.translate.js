// @ts-check
import { html, LitElement } from 'lit';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { customElement, property } from 'lit/decorators.js';
import { toISO6391 } from '../tts/utils.js';

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

const qs = selector => document.querySelector(selector);
const status = message => (console.log(message));

const langs = /** @type {{[lang: string]: string}} */ {
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
  "uk": "Ukrainian"
};

export class TranslatePlugin extends BookReaderPlugin {

  options = {
    enabled: true,
  }
  /**
   * @typedef {Object} genericModelInfo
   * @property {string} name
   * @property {number} size
   * @property {number} estimatedCompressedSize
   * @property {qualityModelInfo} [qualityModel]
   * @property {string} [expectedSha256Hash]
   * @property {string} [modelType]
   */

  /** @type {Worker}*/
  worker;
  /**
   * @type { {[langPair: string] : {model: genericModelInfo, lex: genericModelInfo, vocab: genericModelInfo, quality?: genericModelInfo}} }
   */
  modelRegistry;

  /** @type {?number}*/
  version;

  /** @type {{[lang: string]: string}} */
  supportedFromCodes = {};
  /** @type {{[lang:string]: string}} */
  supportedToCodes = {};

  /** @type {string[]} */
  fromLanguages = [];
  /** @type {string[]} */
  toLanguages = [];
  /** @type {!string} */
  langFromCode;
  /** @type {!string} */
  langToCode;
  /**
   * @type {BrTranslatePanel} _panel - Represents a panel used in the plugin.
   * The specific type and purpose of this panel should be defined based on its usage.
   */
  _panel;

  async init() {
    const self = this;

    if (!this.options.enabled) {
      return;
    }
    await Promise.resolve();
    this._render();

    if (window.Worker) {
      this.worker = new Worker("/BookReader/translate/worker.js");
      this.worker.postMessage(["import"]);
    }

    // This needs to be updates to change #output
    this.worker.onmessage = (e) => {
      const [cmd, ...rest] = e.data;
      if (cmd === "translate_reply" && rest[0]) {
        const [translation, selector] = rest;
        console.log(translation.join("\n\n"));
        console.log(selector);
        const el = document.querySelector(selector);
        if (el) {
          document.querySelector(selector).innerHTML = translation.join("<br><br>");
        }
      } else if (cmd === "load_model_reply" && e.data[1]) {
        status(e.data[1]);
        if (this.langFromCode !== this.langToCode) {
          this.translateVisiblePages();
        }
      } else if (cmd === "import_reply" && e.data[1]) {
        this.modelRegistry = e.data[1];
        this.version = e.data[2];
        this.initWorker();
      }
    };

    // Any time an action occurs, get the text
    const next = BookReader.prototype.next;
    BookReader.prototype.next = function (...args) {
      let r = next.apply(this, args);
      console.log("BookReader.prototype.next triggered", args);
      setTimeout(() => {
        self.clearTranslations();
        if (self.langFromCode !== self.langToCode) {
          self.translateVisiblePages();
        }
      }, 0);
      return r;
    };
  }

  *getVisiblePages() {
    for (const el of document.querySelectorAll('.BRpage-visible')) {
      if ([...el.classList].some(cls => /^pagediv\d+$/.test(cls))) {
        const textLayer = el.querySelector(".BRtextLayer");
        if (textLayer) yield textLayer;
      }
    }
  }
  /** @param {JQuery<HTMLElement>} page*/
  getParagraphsOnPage = (page) => {
    return page ? Array.from(page.querySelectorAll(".BRparagraphElement")) : [];
  }

  translateVisiblePages = () => {
    this.clearTranslations();
    let gidx = 0;
    for (const page of this.getVisiblePages()) {
      const paragraphs = this.getParagraphsOnPage(page);

      // Create the translation layer for all paragraphs on the page
      const pageTranslationLayer = document.createElement('div');
      pageTranslationLayer.className = 'translation';
      page.insertBefore(pageTranslationLayer, page.firstChild);

      paragraphs.forEach((paragraph) => {
        // set data-index on the paragraph
        paragraph.setAttribute('data-index', gidx.toString());

        const translationPlaceholder = document.createElement('p');
        // set data-translate-index on the placeholder
        translationPlaceholder.setAttribute('data-translate-index', gidx.toString());
        pageTranslationLayer.appendChild(translationPlaceholder);

        const selector = `.${page.className.split(' ').join('.')} .translation p[data-translate-index="${gidx}"]`;

        if (paragraph.textContent) {
          this.worker.postMessage([
            "translate",
            this.langFromCode,
            this.langToCode,
            [paragraph.textContent],
            selector
          ]);
        }
        gidx++;
      });
    }
  }

  clearTranslations = () => {
    document.querySelectorAll('.translation').forEach(el => el.remove());
  };


    /**
   * @protected
   * @param {import ("../../BookReader/PageContainer.js").PageContainer} pageContainer
   */
  _configurePageContainer(pageContainer) {
    // fetch each page
    // break each page into paragraphs
    // call translate and give ...
    return pageContainer;
  }

  initWorker = () => {
    // parse supported languages and model types (prod or dev)
    this.supportedFromCodes["en"] = "prod";
    this.supportedToCodes["en"] = "prod";
    for (const [langPair, value] of Object.entries(this.modelRegistry)) {
      const firstLang = langPair.substring(0, 2);
      const secondLang = langPair.substring(2, 4);
      if (firstLang !== "en") this.supportedFromCodes[firstLang] = value.model.modelType;
      if (secondLang !== "en") this.supportedToCodes[secondLang] = value.model.modelType;
    }

    // try to guess input language from user agent
    let bookLanguage = "en"; //toISO6391(this.br.options.bookLanguage);
    let readersLanguage = navigator.language;

    // initialize everything as book language
    this.langFromCode = this.langToCode = bookLanguage;

    // use reader's language, if we know it and it's available
    if (readersLanguage) {
      readersLanguage = readersLanguage.split("-")[0];
      if (readersLanguage in this.supportedToCodes) {
        console.log("guessing input language is", readersLanguage);
        this.langToCode = readersLanguage;
      }
    }

    this.fromLanguages = this.formatLangs(this.supportedFromCodes);
    // find first output lang that *isn't* input language

    this.toLanguages = this.formatLangs(this.supportedToCodes);
    this.langToCode = this.findFirstSupportedTo();

    // load this model
    this.loadModel();
  }

  handleFromLangChange = (e) => {
    this.clearTranslations();
    const selectedLangFrom = e.detail.value;

    // Update the from language
    this.langFromCode = selectedLangFrom;

    let setToCode = this.langToCode !== selectedLangFrom ? this.langToCode : this.findFirstSupportedTo();

    // Add 'From' language to 'To' list if not already present
    if (!this.toLanguages.some(lang => lang.code === selectedLangFrom)) {
      this.toLanguages.push({ code: selectedLangFrom, name: langs[selectedLangFrom] });
    }

    // Update the 'To' languages list and set the correct 'To' language
    this._panel.toLanguages = this.formatLangs(this.supportedToCodes, setToCode, selectedLangFrom);

    console.log(this.langFromCode, this.langToCode);
    if (this.langFromCode !== this.langToCode) {
      this.loadModel();
    }
  }

  handleToLangChange = (e) => {
    this.clearTranslations();
    this.langToCode = e.detail.value;
    this.loadModel();
  }

  isSupported = (lngFrom, lngTo) => {
    return (`${lngFrom}${lngTo}` in this.modelRegistry) || lngFrom === lngTo ||
      ((`${lngFrom}en` in this.modelRegistry) && (`en${lngTo}` in this.modelRegistry))
  }

  switchLanguage() {
    const prevLangFromCode = this.langFromCode;
    this.langFromCode = this.langToCode;

    if (prevLangFromCode in this.supportedToCodes) {
      this._panel.toLanguages = this.formatLangs(this.supportedToCodes, prevLangFromCode, this.langFromCode);
    }
    else {
      this.langToCode = null;
    }

    this.loadModel();
  };

  findFirstSupportedTo = () => {
    return Object.keys(this.supportedToCodes)[0];
}

  loadModel = () => {
    const fromCode = this.langFromCode;
    const toCode = this.langToCode;
    if (fromCode !== toCode) {
      if (!this.isSupported(fromCode, toCode)) {
        status("Language pair is not supported");
        return;
      }

      status(`Installing model...`);
      console.log(`Loading model '${fromCode}${toCode}'`);
      this.worker.postMessage(["load_model", fromCode, toCode]);
    }
  };

  translateCall = (paragraphs) => {
    this.worker.postMessage(["translate", this.langFromCode, this.langToCode, paragraphs, '#output']);
  };

  formatLangs = (langsToSet, value, exclude) => {
    const prop = [];
    for (const [code, type] of Object.entries(langsToSet)) {
      //if (code === exclude) continue;
      let name = langs[code];
      if (type === "dev") name += " (βeta)";
      prop.push({code, name});
    }
    return prop;
  }

  /**
  * Update the table of contents based on array of TOC entries.
  */
  _render() {
    this.br.shell.menuProviders['translate'] = {
      id: 'translate',
      icon: html`
        <svg xmlns="http://www.w3.org/2000/svg" width="34" viewBox="0 0 24 24"><path fill="currentColor" d="M10 5.75h1.25v2.5H9.5c-.41 0-.75.34-.75.75s.34.75.75.75h.25v1.96A5.72 5.72 0 0 0 6.25 17c0 3.17 2.58 5.75 5.75 5.75s5.75-2.58 5.75-5.75c0-2.33-1.39-4.4-3.5-5.29V9.75h.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75h-1.75v-1.5H14c1.52 0 2.75-1.23 2.75-2.75V3c0-.41-.34-.75-.75-.75h-2c-.579 0-1.115.178-1.558.483A2.75 2.75 0 0 0 10 1.25H8c-.41 0-.75.34-.75.75v1c0 1.52 1.23 2.75 2.75 2.75m2.75-.5V5c0-.69.56-1.25 1.25-1.25h1.25V4c0 .69-.56 1.25-1.25 1.25zm-1.5 6.98V9.75h1.5v2.48c0 .33.22.62.53.72c1.77.56 2.97 2.19 2.97 4.06A4.26 4.26 0 0 1 12 21.26a4.26 4.26 0 0 1-4.25-4.25c0-1.87 1.19-3.5 2.97-4.06c.32-.1.53-.39.53-.72m-2.5-9.48H10c.69 0 1.25.56 1.25 1.25v.25H10c-.69 0-1.25-.56-1.25-1.25z" color="currentColor"/></svg>
      `,
      label: 'Translate',
      component: html`<br-translate-panel
        @connected="${e => {
          this._panel = e.target;
          this._panel.fromLanguages = this.fromLanguages;
          this._panel.toLanguages = this.toLanguages;
        }
      }"
        @langFromChanged="${this.handleFromLangChange}"
        @langToChanged="${this.handleToLangChange}"
        .fromLanguages="${this.fromLanguages}"
        .toLanguages="${this.toLanguages}"
        .version="${this.version}"
        class="translate-panel"
      />`,
    };
    this.br.shell.addMenuShortcut('translate');
    this.br.shell.updateMenuContents();
  }
}
BookReader?.registerPlugin('translate', TranslatePlugin);

@customElement('br-translate-panel')
export class BrTranslatePanel extends LitElement {
  @property({ type: Array }) fromLanguages = []; // List of obj {code, name}
  @property({ type: Array }) toLanguages = []; // List of obj {code, name}
  @property({ type: String }) version = '';
  @property({ type: String }) prevSelectedLang = ''; // Tracks the previous selected language for the "To" dropdown

  /** @override */
  createRenderRoot() {
    // Disable shadow DOM; that would require a huge rejiggering of CSS
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    this.dispatchEvent(new CustomEvent('connected'));
  }

  render() {
    const showPrevLangButton =
      this.prevSelectedLang &&
      (this.prevSelectedLang !== this._getSelectedLang('to') || this._getSelectedLang('from') === this._getSelectedLang('to'));

    return html`<div class="app">
      <div class="panel panel--from">
        <label>
          From
          <select id="lang-from" name="from" class="lang-select" @change="${this._onLangFromChange}">
            ${this.fromLanguages.map(
              lang => html`<option value="${lang.code}">${lang.name}</option>`
            )}
          </select>
        </label>
      </div>
      <div class="panel panel--to">
        <label>
          To
          <select id="lang-to" name="to" class="lang-select" @change="${this._onLangToChange}">
            ${this.toLanguages.map(
              lang => html`<option value="${lang.code}">${lang.name}</option>`
            )}
          </select>
        </label>
        ${showPrevLangButton
          ? html`<button class="prev-lang-btn" @click="${this._onPrevLangClick}">
              ${this._getLangName(this.prevSelectedLang)}
            </button>`
          : ''}
      </div>
      <div class="footer" id="status"></div>
    </div>`;
  }

  _onLangFromChange(event) {
    const langFromChangedEvent = new CustomEvent('langFromChanged', {
      detail: { value: event.target.value },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(langFromChangedEvent);

    // Update the prevSelectedLang if "To" is different from "From"
    if (this._getSelectedLang('to') !== this._getSelectedLang('from')) {
      this.prevSelectedLang = this._getSelectedLang('from');
    }
  }

  _onLangToChange(event) {
    const langToChangedEvent = new CustomEvent('langToChanged', {
      detail: { value: event.target.value },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(langToChangedEvent);

    // Update the prevSelectedLang if "To" is different from "From"
    if (this._getSelectedLang('from') !== event.target.value) {
      this.prevSelectedLang = this._getSelectedLang('from');
    }
  }

  _onPrevLangClick() {
    const prevLang = this.prevSelectedLang;
    this.prevSelectedLang = this._getSelectedLang('to'); // Update prevSelectedLang to current "To" value
    const langToChangedEvent = new CustomEvent('langToChanged', {
      detail: { value: prevLang },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(langToChangedEvent);

    // Update the "To" dropdown to the previous language
    const toDropdown = this.querySelector('#lang-to');
    if (toDropdown) {
      toDropdown.value = prevLang;
    }
  }

  _getSelectedLang(type) {
    const dropdown = this.querySelector(`#lang-${type}`);
    return dropdown ? dropdown.value : '';
  }

  _getLangName(code) {
    const lang = [...this.fromLanguages, ...this.toLanguages].find(lang => lang.code === code);
    return lang ? lang.name : '';
  }
}

