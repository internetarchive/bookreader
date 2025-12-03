// @ts-check
import { html, LitElement } from 'lit';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { customElement, property } from 'lit/decorators.js';
import { TranslationManager } from "./TranslationManager.js";
import { toISO6391 } from '../tts/utils.js';
import { sortBy } from '../../../src/BookReader/utils.js';
import { TextSelectionManager } from '../../../src/util/TextSelectionManager.js';
import '@internetarchive/ia-activity-indicator/ia-activity-indicator.js';

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

export class TranslatePlugin extends BookReaderPlugin {

  options = {
    enabled: true,

    /** @type {string | import('lit').TemplateResult} */
    panelDisclaimerText: "Translations are in alpha",
  }

  /** @type {TranslationManager} */
  translationManager = new TranslationManager();

  /** @type {Worker}*/
  worker;

  /**
   * Contains the list of languages available to translate to
   * @type {string[]}
   */
  toLanguages = [];

  /**
   * Current language code that is being translated From. Defaults to EN currently
   * @type {!string}
   */
  langFromCode;

  /**
   * Current language code that is being translated To
   * @type {!string}
   */
  langToCode;
  /**
   * @type {BrTranslatePanel} _panel - Represents a panel used in the plugin.
   * The specific type and purpose of this panel should be defined based on its usage.
   */
  _panel;

  /**
   * @type {boolean} userToggleTranslate - Checks if user has initiated translation
   * Should synchronize with the state of TranslationManager's active state
   */
  userToggleTranslate;

  /**
   * @type {boolean} loadingModel - Shows loading animation while downloading lang model
   */
  loadingModel = true;

  textSelectionManager = new TextSelectionManager('.BRtranslateLayer', this.br, {selectionElement: [".BRlineElement"]}, 1);

  async init() {
    const currentLanguage = toISO6391(this.br.options.bookLanguage.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ""));
    this.langFromCode = currentLanguage ?? "en";
    this.textSelectionManager.init();

    if (!this.options.enabled) {
      return;
    }

    this.translationManager.publicPath = this.br.options.imagesBaseURL.replace(/\/+$/, '') + '/..';

    /**
     * @param {*} ev
     * @param {object} eventProps
    */
    this.br.on('textLayerRendered', async (_, {pageIndex, pageContainer}) => {
      // Stops invalid models from running, also prevents translation on page load
      // TODO check if model has finished loading or if it exists
      if (!this.translationManager) {
        return;
      }
      if (this.translationManager.active) {
        const pageElement = pageContainer.$container[0];
        this.translateRenderedLayer(pageElement);
      }
    });

    /**
     * @param {*} ev
     * @param {object} eventProps
    */
    this.br.on('pageVisible', (_, {pageContainerEl}) => {
      if (!this.translationManager.active) {
        return;
      }
      for (const paragraphEl of pageContainerEl.querySelectorAll('.BRtranslateLayer > .BRparagraphElement')) {
        if (paragraphEl.textContent) {
          this.fitVisiblePage(paragraphEl);
        }
      }
    });

    await this.translationManager.initWorker();
    // Note await above lets _render function properly, since it gives the browser
    // time to render the rest of bookreader, which _render depends on
    
    // Detect browser language and use as default "To" language if available
    const browserLang = navigator.language;
    const browserLangCode = toISO6391(browserLang);
    const browserLangAvailable = browserLangCode && 
      this.translationManager.toLanguages.some(lang => lang.code === browserLangCode);
    
    // Set browser language as default if available, otherwise fallback to English
    this.langToCode = browserLangAvailable 
      ? browserLangCode 
      : this.translationManager.toLanguages[0].code;
    
    this._render();
  }

  /** @param {HTMLElement} page*/
  getParagraphsOnPage = (page) => {
    return page ? Array.from(page.querySelectorAll(".BRtextLayer > .BRparagraphElement")) : [];
  }

  translateActivePageContainerElements() {
    const currentlyActiveContainers = this.br.getActivePageContainerElements();
    const visiblePageContainers = currentlyActiveContainers.filter((element) => {
      return element.classList.contains('BRpage-visible');
    });
    const hiddenPageContainers = currentlyActiveContainers.filter((element) => {
      return !element.classList.contains('BRpage-visible');
    });

    for (const page of visiblePageContainers) {
      this.translateRenderedLayer(page, 0);
    }
    for (const loadingPage of hiddenPageContainers) {
      this.translateRenderedLayer(loadingPage, 1000);
    }
  }

  /** @param {HTMLElement} page */
  async translateRenderedLayer(page, priority) {
    // Do not run translation if in thumbnail mode or if user did not initiate transations
    if (this.br.mode == this.br.constModeThumb || !this.userToggleTranslate || this.langFromCode == this.langToCode) {
      return;
    }

    const pageIndex = page.dataset.index;

    let pageTranslationLayer;
    if (!page.querySelector('.BRPageLayer.BRtranslateLayer')) {
      pageTranslationLayer = document.createElement('div');
      pageTranslationLayer.classList.add('BRPageLayer', 'BRtranslateLayer', 'BRtranslateLayerLoading');
      pageTranslationLayer.setAttribute('lang', `${this.langToCode}`);
      page.prepend(pageTranslationLayer);
    } else {
      pageTranslationLayer = page.querySelector('.BRPageLayer.BRtranslateLayer');
    }

    const textLayerElement = page.querySelector('.BRtextLayer');
    textLayerElement.classList.add('showingTranslation');
    $(pageTranslationLayer).css({
      "width": $(textLayerElement).css("width"),
      "height": $(textLayerElement).css("height"),
      "transform": $(textLayerElement).css("transform"),
      "pointer-events": $(textLayerElement).css("pointer-events"),
      "z-index": 3,
    });
    const paragraphs = this.getParagraphsOnPage(page);

    const paragraphTranslationPromises = paragraphs.map(async (paragraph, pidx) => {
      let translatedParagraph = page.querySelector(`[data-translate-index='${pageIndex}-${pidx}']`);
      if (!translatedParagraph) {
        translatedParagraph = document.createElement('p');
        // set data-translate-index on the placeholder
        translatedParagraph.setAttribute('data-translate-index', `${pageIndex}-${pidx}`);
        translatedParagraph.className = 'BRparagraphElement';
        const originalParagraphStyle = paragraphs[pidx];
        // check text selection paragraphs for header/footer roles
        if (paragraph.classList.contains('ocr-role-header-footer')) {
          translatedParagraph.ariaHidden = "true";
          translatedParagraph.classList.add('ocr-role-header-footer');
        }
        const fontSize = `${parseInt($(originalParagraphStyle).css("font-size"))}px`;

        $(translatedParagraph).css({
          "margin-left": $(originalParagraphStyle).css("margin-left"),
          "margin-top": $(originalParagraphStyle).css("margin-top"),
          "top": $(originalParagraphStyle).css("top"),
          "height": $(originalParagraphStyle).css("height"),
          "width": $(originalParagraphStyle).css("width"),
          "font-size": fontSize,
        });
        pageTranslationLayer.append(translatedParagraph);
      }

      if (paragraph.textContent.length !== 0) {
        const pagePriority = parseFloat(pageIndex) + priority + pidx;
        this.translationManager.getTranslationModel(this.langFromCode, this.langToCode).then(() => {
          this._panel.loadingModel = false;
          this.loadingModel = false;
        });
        const translatedText = await this.translationManager.getTranslation(this.langFromCode, this.langToCode, pageIndex, pidx, paragraph.textContent, pagePriority);
        // prevent duplicate spans from appearing if exists
        translatedParagraph.firstElementChild?.remove();

        const firstWordSpacing = paragraphs[pidx]?.firstChild?.firstChild;
        const createSpan = document.createElement('span');
        createSpan.className = 'BRlineElement';
        createSpan.textContent = translatedText;
        translatedParagraph.appendChild(createSpan);

        $(createSpan).css({
          "text-indent": $(firstWordSpacing).css('padding-left'),
        });
        if (page.classList.contains('BRpage-visible')) {
          this.fitVisiblePage(translatedParagraph);
        }
      }
    });

    this.textSelectionManager?.stopPageFlip(this.br.refs.$brContainer);
    await Promise.all(paragraphTranslationPromises);
    this.br.trigger('translateLayerRendered', {
      leafIndex: pageIndex,
      translateLayer: pageTranslationLayer,
    });
  }

  /**
   * Get the translation layers for a specific leaf index.
   * @param {number} leafIndex
   * @returns {Promise<HTMLElement[]>}
   */
  async getTranslateLayers(leafIndex) {
    const pageContainerElements = this.br.getActivePageContainerElementsForIndex(leafIndex);
    const translateLayer = $(pageContainerElements).filter(`[data-index='${leafIndex}']`).find('.BRtranslateLayer');
    if (translateLayer.length) return translateLayer.toArray();

    return new Promise((res, rej) => {
      const handler = async (_, extraParams) => {
        if (extraParams.leafIndex == leafIndex) {
          this.br.off('translateLayerRendered', handler); // remember to detach translateLayer
          res([extraParams.translateLayer]);
        }
      };
      this.br.on('translateLayerRendered', handler);
    });
  }

  clearAllTranslations() {
    document.querySelectorAll('.BRtranslateLayer').forEach(el => el.remove());
    document.querySelectorAll('.showingTranslation').forEach(el => el.classList.remove('showingTranslation'));
  }

  /**
   * @param {Element} paragEl
   */
  fitVisiblePage(paragEl) {
    // For some reason, Chrome does not detect the transform property for the translation + text layers
    // Could not get it to fetch the transform value using $().css method
    // Oddly enough the value is retrieved if using .style.transform instead?
    const translateLayerEl = paragEl.parentElement;
    if ($(translateLayerEl).css('transform') == 'none') {
      const pageNumber = paragEl.getAttribute('data-translate-index').split('-')[0];
      /** @type {HTMLElement} selectionTransform */
      const textLayerEl = document.querySelector(`[data-index='${pageNumber}'] .BRtextLayer`);
      $(translateLayerEl).css({'transform': textLayerEl.style.transform});
    }

    const originalFontSize = parseInt($(paragEl).css("font-size"));
    let adjustedFontSize = originalFontSize;
    while (paragEl.clientHeight < paragEl.scrollHeight && adjustedFontSize > 0) {
      adjustedFontSize--;
      $(paragEl).css({ "font-size": `${adjustedFontSize}px` });
    }

    const textHeight = paragEl.firstElementChild.clientHeight;
    const scrollHeight = paragEl.scrollHeight;
    const fits = textHeight < scrollHeight;
    if (fits) {
      const lines = textHeight / adjustedFontSize;
      // Line heights for smaller paragraphs occasionally need a minor adjustment
      const newLineHeight = scrollHeight / lines;
      $(paragEl).css({
        "line-height" : `${newLineHeight}px`,
        "overflow": "visible",
      });
    }
  }

  handleFromLangChange = async (e) => {
    this.clearAllTranslations();
    const selectedLangFrom = e.detail.value;

    // Update the from language
    this.langFromCode = selectedLangFrom;
    this._panel.requestUpdate();

    // Add 'From' language to 'To' list if not already present
    if (!this.translationManager.toLanguages.some(lang => lang.code === selectedLangFrom)) {
      this.translationManager.toLanguages.push({
        code: selectedLangFrom,
        name: this.translationManager.fromLanguages.find((entry) => entry.code == selectedLangFrom).name,
      });
    }

    // Update the 'To' languages list and set the correct 'To' language
    this._panel.toLanguages = this.translationManager.toLanguages;

    console.log(this.langFromCode, this.langToCode);
    this._render();
    if (this.langFromCode !== this.langToCode) {
      this.translateActivePageContainerElements();
    }
  }

  handleToLangChange = async (e) => {
    this.clearAllTranslations();
    this.langToCode = e.detail.value;
    this._render();
    this.translateActivePageContainerElements();
  }

  handleToggleTranslation = async () => {
    this.userToggleTranslate = !this.userToggleTranslate;
    this.translationManager.active = this.userToggleTranslate;

    this._render();
    if (!this.userToggleTranslate) {
      this.clearAllTranslations();
      this.br.trigger('translationDisabled', { });
      this.textSelectionManager.detach();
    } else {
      this.br.trigger('translationEnabled', { });
      this.translateActivePageContainerElements();
      this.textSelectionManager.attach();
    }
  }

  /**
  * Update translation side menu
  */
  _render() {
    this.br.shell.menuProviders['translate'] = {
      id: 'translate',
      icon: html`<img src='${this.br.options.imagesBaseURL}/translate.svg' width="26"/>`,
      label: 'Translate',
      component: html`<br-translate-panel
        @connected="${e => {
        this._panel = e.target;
        this._panel.fromLanguages = this.translationManager.fromLanguages;
        this._panel.toLanguages = this.translationManager.toLanguages;
        this._panel.userTranslationActive = this.userToggleTranslate;
        this._panel.detectedToLang = this.langToCode;
        this._panel.detectedFromLang = this.langFromCode;
        this._panel.loadingModel = this.loadingModel;
      }
      }"
        @langFromChanged="${this.handleFromLangChange}"
        @langToChanged="${this.handleToLangChange}"
        @toggleTranslation="${this.handleToggleTranslation}"
        .fromLanguages="${this.translationManager.fromLanguages}"
        .toLanguages="${this.translationManager.toLanguages}"
        .disclaimerMessage="${this.options.panelDisclaimerText}"
        .userTranslationActive=${this.userToggleTranslate}
        .detectedFromLang=${this.langFromCode}
        .detectedToLang=${this.langToCode}
        .loadingModel=${this.loadingModel}
        class="translate-panel"
      />`,
    };
    this.br.shell.updateMenuContents();
  }
}
BookReader?.registerPlugin('translate', TranslatePlugin);

@customElement('br-translate-panel')
export class BrTranslatePanel extends LitElement {
  @property({ type: Array }) fromLanguages = []; // List of obj {code, name}
  @property({ type: Array }) toLanguages = []; // List of obj {code, name}
  @property({ type: String }) prevSelectedLang = ''; // Tracks the previous selected language for the "To" dropdown
  @property({ type: String }) disclaimerMessage = '';
  @property({ type: Boolean }) userTranslationActive = false;
  @property({ type: String }) detectedFromLang = '';
  @property({ type: String }) detectedToLang = '';
  @property({ type: Boolean }) loadingModel;

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
    return html`<div class="app" style="margin-top: 5%;padding-right: 5px;">
      <div
        class="disclaimer"
        id="disclaimerMessage"
        style="background-color: rgba(255,255,255,0.1);padding: 10px;border-radius: 8px;font-size: 12px;margin-bottom: 10px;color: rgba(255,255,255, 0.9);"
      >${this.disclaimerMessage}</div>

      <div class="panel panel--to" style="padding: 0 10px;">
        <label>
          <span style="font-size: 12px;color: #ccc;">Translate To</span>
          <select id="lang-to" name="to" class="lang-select" style="display:block; width:100%;" @change="${this._onLangToChange}">
          ${sortBy(this.toLanguages, ((lang) => lang.name.toLowerCase()
    )).map((lang) => {
      return html`<option value="${lang.code}" 
                        ?selected=${lang.code == this.detectedToLang}
                        > ${lang.name ? lang.name : lang.code} </option>`;
    })
          }
          </select>
        </label>
      </div>

      <div class="panel panel--start" style="text-align: right;padding: 0 10px;/*! font-size: 18px; */margin-top: 10px;">
            <button class="start-translation-brn" @click="${this._toggleTranslation}">
              ${this.userTranslationActive ? "Stop Translating" : "Translate"}
            </button>
      </div>

      <div class="panel panel--from" style="font-size: 12px;color: #ccc;text-align: center;padding: 8px 10px;">
        <details style="display: contents">
          <summary style="text-decoration: underline white; cursor:pointer; display:inline-block"> 
            <i>
              Source: ${this._getLangName(this.detectedFromLang)} ${this.prevSelectedLang ? "" : "(detected)"} 
            </i> Change 
          </summary>
          <select id="lang-from" name="from" class="lang-select" value=${this.detectedFromLang} @change="${this._onLangFromChange}" style="width:65%; margin-top: 3%; margin-bottom: 3%">
          ${sortBy(this.fromLanguages, ((lang) => lang.name.toLowerCase()
          )).map((lang) => {
            return html`<option value="${lang.code}"
                      ?selected=${lang.code == this.detectedFromLang}
                      >${lang.name ? lang.name : lang.code} </option>`;
          })
          }
          </select>
      </details>
      <div class="footer" id="status" style="margin-top:5%">
      ${this._statusWarning()}
      </div>

      <div class="lang-models-loading"> 
      ${this._languageModelStatus()}
      </div>
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
    this.loadingModel = true;
    this.detectedFromLang = event.target.value;
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
    this.loadingModel = true;
    this.detectedToLang = event.target.value;
  }

  _getSelectedLang(type) {
    /** @type {HTMLSelectElement} */
    const dropdown = this.querySelector(`#lang-${type}`);
    return dropdown ? dropdown.value : '';
  }

  _getLangName(code) {
    const lang = [...this.fromLanguages, ...this.toLanguages].find(lang => lang.code === code);
    return lang ? lang.name : '';
  }

  _toggleTranslation(event) {
    const toggleTranslateEvent = new CustomEvent('toggleTranslation', {
      detail: {value: event.target.value},
      bubbles: true,
      composed:true,
    });
    this.userTranslationActive = !this.userTranslationActive;
    this.dispatchEvent(toggleTranslateEvent);
  }

  // TODO: Hardcoded warning message for now but should add more statuses
  _statusWarning() {
    if (this.detectedFromLang == this.detectedToLang) {
      return "Translate To language is the same as the Source language";
    }
    return "";
  }

  _languageModelStatus() {
    if (this.userTranslationActive) {
      if (this.loadingModel) {
        return html`
        <ia-activity-indicator mode="processing" style="display:block; width: 40px; height: 40px; margin: 0 auto;"></ia-activity-indicator>
        <p>Downloading language model</p>
        `;
      }
      return html`<p>Language model loaded</p>`;
    }
    return "";
  }
}
