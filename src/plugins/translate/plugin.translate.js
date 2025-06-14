// @ts-check
import { html, LitElement } from 'lit';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { customElement, property } from 'lit/decorators.js';
import { langs, TranslationManager } from "./TranslationManager.js";

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

export class TranslatePlugin extends BookReaderPlugin {

  options = {
    enabled: true,
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
   * Current language code that is being translated From
   * @type {!string} 
   */
  langFromCode = "en";

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

  async init() {

    if (!this.options.enabled) {
      return;
    }

    /**
     * @param {*} ev
     * @param {object} eventProps
    */
    this.br.on('textLayerRendered', async (_, {pageIndex, pageContainer}) => {
      // Stops invalid models from running, also prevents translation on page load
      // TODO check if model has finished loading or if it exists
      if (!this.translationManager.checkModel(this.langFromCode, this.langToCode)) {
        return;
      }

      const pageElement = pageContainer.$container[0];
      this.translateRenderedLayer(pageElement);
    });
    await this.translationManager.initWorker();
    // Note await above lets _render function properly, since it gives the browser
    // time to render the rest of bookreader, which _render depends on
    this._render();
    
    this.langToCode = this.translationManager.toLanguages[0].code;
    
  }

  /** @param {HTMLElement} page*/
  getParagraphsOnPage = (page) => {
    return page ? Array.from(page.querySelectorAll(".BRtextLayer > .BRparagraphElement")) : [];
  }

  translateActivePageContainerElements() {
    const currentlyActiveContainers = this.br.getActivePageContainerElements();
    const visiblePageContainers = currentlyActiveContainers.filter((element) => {
      return element.classList.contains('BRpage-visible');
    })
    const hiddenPageContainers = currentlyActiveContainers.filter((element) => {
      return !element.classList.contains('BRpage-visible');
    });
    
    for (const page of visiblePageContainers) {
      this.translateRenderedLayer(page);
    }
    for (const loadingPage of hiddenPageContainers) {
      this.translateRenderedLayer(loadingPage);
    }
  }

  /** @param {HTMLElement} page */
  async translateRenderedLayer(page) {
    if (this.br.mode == this.br.constModeThumb) {
      return;
    }

    const pageIndex = page.dataset.index;
    let pageTranslationLayer;
    if (!page.querySelector('.BRPageLayer.BRtranslateLayer')) {
      pageTranslationLayer = document.createElement('div');
      pageTranslationLayer.classList.add('BRPageLayer', 'BRtranslateLayer');
      page.prepend(pageTranslationLayer);
    } else {
      pageTranslationLayer = page.querySelector('.BRPageLayer.BRtranslateLayer');
    }

    const textLayerElement = page.querySelector('.BRtextLayer');
    $(pageTranslationLayer).css({
      "width": $(textLayerElement).css("width"),
      "height": $(textLayerElement).css("height"),
      "transform": $(textLayerElement).css("transform"),
      "pointer-events": $(textLayerElement).css("pointer-events"),
      "z-index": 3,
    });
    const paragraphs = this.getParagraphsOnPage(page);

    paragraphs.forEach(async (paragraph, pidx) => {
      let translatedParagraph = page.querySelector(`[data-translate-index='${pageIndex}-${pidx}']`)
      if (!translatedParagraph) {
        translatedParagraph = document.createElement('p');
        // set data-translate-index on the placeholder
        translatedParagraph.setAttribute('data-translate-index', `${pageIndex}-${pidx}`);
        translatedParagraph.className = 'BRparagraphElement';
        const originalParagraphStyle = paragraphs[pidx];
  
        $(translatedParagraph).css({
          "margin-left": $(originalParagraphStyle).css("margin-left"),
          "margin-top": $(originalParagraphStyle).css("margin-top"),
          "top": $(originalParagraphStyle).css("top"),
          "height": $(originalParagraphStyle).css("height"),
          "font-size": `${parseInt($(originalParagraphStyle).css("font-size")) - 3}px`,
          "width": $(originalParagraphStyle).css("width"),
        });
  
        pageTranslationLayer.append(translatedParagraph);
      }

      if (paragraph.textContent.length !== 0) {
        const translatedText = await this.translationManager.getTranslation(this.langFromCode, this.langToCode, pageIndex, pidx, paragraph.textContent);
        // prevent duplicate spans from appearing if exists
        translatedParagraph.firstElementChild?.remove();
        const createSpan = document.createElement('span');
        createSpan.className = 'BRlineElement';
        createSpan.textContent = translatedText;
        translatedParagraph.appendChild(createSpan);
      }
    })
  };

  clearAllTranslations() {
    document.querySelectorAll('.BRtranslateLayer').forEach(el => el.remove());
  };

  handleFromLangChange = async (e) => {
    this.clearAllTranslations();
    const selectedLangFrom = e.detail.value;

    // Update the from language
    this.langFromCode = selectedLangFrom;

    // Add 'From' language to 'To' list if not already present
    if (!this.translationManager.toLanguages.some(lang => lang.code === selectedLangFrom)) {
      this.translationManager.toLanguages.push({ code: selectedLangFrom, name: langs[selectedLangFrom] });
    }

    // Update the 'To' languages list and set the correct 'To' language
    this._panel.toLanguages = this.translationManager.toLanguages;

    console.log(this.langFromCode, this.langToCode);
    if (this.langFromCode !== this.langToCode) {
      this.translateActivePageContainerElements();
    }
  }

  handleToLangChange = async (e) => {
    this.clearAllTranslations();
    this.langToCode = e.detail.value;
    this.translateActivePageContainerElements();
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
        this._panel.fromLanguages = this.translationManager.fromLanguages;
        this._panel.toLanguages = this.translationManager.toLanguages;
      }
      }"
        @langFromChanged="${this.handleFromLangChange}"
        @langToChanged="${this.handleToLangChange}"
        .fromLanguages="${this.translationManager.fromLanguages}"
        .toLanguages="${this.translationManager.toLanguages}"
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
              lang => html`<option value="${lang.code}">${lang.name}</option>`,
            )}
          </select>
        </label>
      </div>
      <div class="panel panel--to">
        <label>
          To
          <select id="lang-to" name="to" class="lang-select" @change="${this._onLangToChange}">
            ${this.toLanguages.map(
              lang => html`<option value="${lang.code}">${lang.name}</option>`,
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
    if (prevLang == this._getSelectedLang('from')) {
      console.log("_onPrevLangClick: will not change since prevLang is the same as the current 'To' language code");
      return;
    }
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

