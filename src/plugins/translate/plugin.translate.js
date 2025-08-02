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
      if (this.translationManager.active) {
        const pageElement = pageContainer.$container[0];
        this.translateRenderedLayer(pageElement);
      }

      const pageElement = pageContainer.$container[0];
      await this.translateRenderedLayer(pageElement);
    });

    /**
     * @param {*} ev
     * @param {object} eventProps
    */
    this.br.on('pageVisible', (_, {pageContainerEl}) => {
      for (const paragraphEl of pageContainerEl.querySelectorAll('.BRtranslateLayer > .BRparagraphElement')) {
        if (paragraphEl.textContent) {
          this.fitVisiblePage(paragraphEl);
        }
      }
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
    if (this.br.mode == this.br.constModeThumb) {
      return;
    }

    const pageIndex = page.dataset.index;

    let pageTranslationLayer;
    if (!page.querySelector('.BRPageLayer.BRtranslateLayer')) {
      pageTranslationLayer = document.createElement('div');
      pageTranslationLayer.classList.add('BRPageLayer', 'BRtranslateLayer');
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

    paragraphs.forEach(async (paragraph, pidx) => {
      let translatedParagraph = page.querySelector(`[data-translate-index='${pageIndex}-${pidx}']`);
      if (!translatedParagraph) {
        translatedParagraph = document.createElement('p');
        // set data-translate-index on the placeholder
        translatedParagraph.setAttribute('data-translate-index', `${pageIndex}-${pidx}`);
        translatedParagraph.className = 'BRparagraphElement';
        const originalParagraphStyle = paragraphs[pidx];
        const fontSize = `${parseInt($(originalParagraphStyle).css("font-size"))}px`;

        $(translatedParagraph).css({
          "margin-left": $(originalParagraphStyle).css("margin-left"),
          "margin-top": $(originalParagraphStyle).css("margin-top"),
          "top": $(originalParagraphStyle).css("top"),
          "height": $(originalParagraphStyle).css("height"),
          "width": $(originalParagraphStyle).css("width"),
          "font-size": fontSize,
        });

        // Note: We'll likely want to switch to using the same logic as
        // TextSelectionPlugin's selection, which allows for e.g. click-to-flip
        // to work simultaneously with text selection.
        translatedParagraph.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        });

        translatedParagraph.addEventListener('mouseup', (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        });

        translatedParagraph.addEventListener('dragstart', (e) =>{
          e.preventDefault();
        });
        pageTranslationLayer.append(translatedParagraph);
      }

      if (paragraph.textContent.length !== 0) {
        const pagePriority = parseFloat(pageIndex) + priority + pidx;
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
  }

  clearAllTranslations() {
    document.querySelectorAll('.BRtranslateLayer').forEach(el => el.remove());
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
      icon: html`<img src='${this.br.options.imagesBaseURL}/language-icon.svg' width="26"/>
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
        .disclaimerMessage="${this.options.panelDisclaimerText}"
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
  @property({ type: String }) disclaimerMessage = '';

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
      <br/>
      <div class="disclaimer" id="disclaimerMessage"> ${this.disclaimerMessage} </div>
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

