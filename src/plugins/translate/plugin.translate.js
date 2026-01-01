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
    panelDisclaimerText: "Translations are in alpha",
  }

  translationManager = new TranslationManager();
  worker;

  toLanguages = [];
  langFromCode;
  langToCode;
  _panel;
  userToggleTranslate;
  loadingModel = true;

  textSelectionManager = new TextSelectionManager(
    '.BRtranslateLayer',
    this.br,
    { selectionElement: [".BRlineElement"] },
    1
  );

  /**
   * Detect browser language and normalize to ISO-639-1
   * Fallback to 'en'
   */
  getBrowserToLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    if (!browserLang) return 'en';

    const isoLang = toISO6391(browserLang.split('-')[0]);
    return isoLang || 'en';
  }

  async init() {
    const currentLanguage = toISO6391(
      this.br.options.bookLanguage.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    );

    this.langFromCode = currentLanguage ?? "en";
    this.textSelectionManager.init();

    if (!this.options.enabled) return;

    this.translationManager.publicPath =
      this.br.options.imagesBaseURL.replace(/\/+$/, '') + '/..';

    this.br.on('textLayerRendered', async (_, { pageContainer }) => {
      if (!this.translationManager || !this.translationManager.active) return;
      this.translateRenderedLayer(pageContainer.$container[0]);
    });

    this.br.on('pageVisible', (_, { pageContainerEl }) => {
      if (!this.translationManager.active) return;
      for (const p of pageContainerEl.querySelectorAll(
        '.BRtranslateLayer > .BRparagraphElement'
      )) {
        if (p.textContent) this.fitVisiblePage(p);
      }
    });

    await this.translationManager.initWorker();

    /* ------------------------------
     * DEFAULT "TRANSLATE TO" LANGUAGE
     * ------------------------------ */
    const browserLang = this.getBrowserToLanguage();

    const supportedLang = this.translationManager.toLanguages.find(
      lang => lang.code === browserLang
    );

    this.langToCode = supportedLang ? browserLang : 'en';

    this._render();
  }

  getParagraphsOnPage(page) {
    return page
      ? Array.from(page.querySelectorAll(".BRtextLayer > .BRparagraphElement"))
      : [];
  }

  translateActivePageContainerElements() {
    const containers = this.br.getActivePageContainerElements();
    const visible = containers.filter(el => el.classList.contains('BRpage-visible'));
    const hidden = containers.filter(el => !el.classList.contains('BRpage-visible'));

    for (const page of visible) this.translateRenderedLayer(page, 0);
    for (const page of hidden) this.translateRenderedLayer(page, 1000);
  }

  async translateRenderedLayer(page, priority = 0) {
    if (
      this.br.mode === this.br.constModeThumb ||
      !this.userToggleTranslate ||
      this.langFromCode === this.langToCode
    ) return;

    const pageIndex = page.dataset.index;

    let layer = page.querySelector('.BRtranslateLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.classList.add('BRPageLayer', 'BRtranslateLayer', 'BRtranslateLayerLoading');
      layer.setAttribute('lang', this.langToCode);
      page.prepend(layer);
    }

    const textLayer = page.querySelector('.BRtextLayer');
    textLayer.classList.add('showingTranslation');

    $(layer).css({
      width: $(textLayer).css("width"),
      height: $(textLayer).css("height"),
      transform: $(textLayer).css("transform"),
      pointerEvents: $(textLayer).css("pointer-events"),
      zIndex: 3,
    });

    const paragraphs = this.getParagraphsOnPage(page);

    await Promise.all(paragraphs.map(async (p, i) => {
      if (!p.textContent) return;

      let translated = layer.querySelector(
        `[data-translate-index='${pageIndex}-${i}']`
      );

      if (!translated) {
        translated = document.createElement('p');
        translated.className = 'BRparagraphElement';
        translated.dataset.translateIndex = `${pageIndex}-${i}`;
        layer.append(translated);
      }

      await this.translationManager.getTranslationModel(
        this.langFromCode,
        this.langToCode
      );

      this.loadingModel = false;
      this._panel.loadingModel = false;

      const text = await this.translationManager.getTranslation(
        this.langFromCode,
        this.langToCode,
        pageIndex,
        i,
        p.textContent,
        pageIndex + priority + i
      );

      translated.textContent = text;

      if (page.classList.contains('BRpage-visible')) {
        this.fitVisiblePage(translated);
      }
    }));
  }

  clearAllTranslations() {
    document.querySelectorAll('.BRtranslateLayer').forEach(el => el.remove());
    document.querySelectorAll('.showingTranslation')
      .forEach(el => el.classList.remove('showingTranslation'));
  }

  fitVisiblePage(el) {
    let size = parseInt($(el).css("font-size"));
    while (el.clientHeight < el.scrollHeight && size > 0) {
      size--;
      $(el).css({ fontSize: `${size}px` });
    }
  }

  handleFromLangChange = (e) => {
    this.clearAllTranslations();
    this.langFromCode = e.detail.value;
    this._render();
    this.translateActivePageContainerElements();
  }

  handleToLangChange = (e) => {
    this.clearAllTranslations();
    this.langToCode = e.detail.value;
    this._render();
    this.translateActivePageContainerElements();
  }

  handleToggleTranslation = () => {
    this.userToggleTranslate = !this.userToggleTranslate;
    this.translationManager.active = this.userToggleTranslate;

    this._render();

    if (!this.userToggleTranslate) {
      this.clearAllTranslations();
      this.textSelectionManager.detach();
    } else {
      this.translateActivePageContainerElements();
      this.textSelectionManager.attach();
    }
  }

  _render() {
    this.br.shell.menuProviders['translate'] = {
      id: 'translate',
      label: 'Translate',
      component: html`
        <br-translate-panel
          .fromLanguages=${this.translationManager.fromLanguages}
          .toLanguages=${this.translationManager.toLanguages}
          .detectedFromLang=${this.langFromCode}
          .detectedToLang=${this.langToCode}
          .userTranslationActive=${this.userToggleTranslate}
          .loadingModel=${this.loadingModel}
          @langFromChanged=${this.handleFromLangChange}
          @langToChanged=${this.handleToLangChange}
          @toggleTranslation=${this.handleToggleTranslation}
        />
      `,
    };

    this.br.shell.updateMenuContents();
  }
}

BookReader?.registerPlugin('translate', TranslatePlugin);
