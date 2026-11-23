// This dependency uses import.meta.url, which Jest does not handle in our current test setup.
// Mocking it keeps this panel test lightweight and avoids pulling in the translation runtime.
jest.mock('@internetarchive/bergamot-translator/translator.js', () => ({
  BatchTranslator: class {},
}));

import { render } from 'lit';
import { BrTranslatePanel } from '@/src/plugins/translate/plugin.translate.js';
import { TranslationManager } from '@/src/plugins/translate/TranslationManager.js';

describe('BrTranslatePanel unsupported language warning', () => {
  test('shows unsupported language warning message', () => {
    const panel = new BrTranslatePanel();
    panel.sourceLanguageSupported = false;
    panel.detectedFromLang = 'zzzz';

    expect(panel._statusWarning()).toBe('Translating from zzzz is not supported');
  });
});

describe('BrTranslatePanel download progress', () => {
  test('shows the language pair, total size and progress while loading a model', () => {
    const panel = new BrTranslatePanel();
    panel.userTranslationActive = true;
    panel.loadingModel = true;
    panel.detectedFromLang = 'en';
    panel.detectedToLang = 'fr';
    panel.downloadProgress = {loaded: 12_950_000, total: 25_900_000};

    const container = document.createElement('div');
    render(panel._languageModelStatus(), container);
    expect(container.querySelector('.download-card__title').textContent).toBe('Downloading English → français');
    expect(container.querySelector('.download-card__status').textContent).toBe('25.9 MB');
    expect(container.querySelector('[role=progressbar]').getAttribute('aria-valuenow')).toBe('12950000');
    expect(container.querySelector('.download-card__bar-fill').style.width).toBe('50%');
  });

  test('leaves the size blank until the total is known', () => {
    const panel = new BrTranslatePanel();
    panel.userTranslationActive = true;
    panel.loadingModel = true;
    panel.downloadProgress = {loaded: 0, total: 0};

    const container = document.createElement('div');
    render(panel._languageModelStatus(), container);
    expect(container.querySelector('.download-card__status').textContent).toBe('\u00a0');
  });

  test('toggle button reads Cancel while a model is downloading', () => {
    const panel = new BrTranslatePanel();
    expect(panel._toggleButtonLabel()).toBe('Translate');
    panel.userTranslationActive = true;
    panel.loadingModel = true;
    expect(panel._toggleButtonLabel()).toBe('Cancel');
    panel.loadingModel = false;
    expect(panel._toggleButtonLabel()).toBe('Stop Translating');
  });
});

describe('TranslationManager.loadTranslationModels', () => {
  test('reports combined progress across pivot models', async () => {
    const manager = new TranslationManager();
    const models = [
      {from: 'fr', to: 'en', files: {model: {size: 30}, vocab: {size: 10}}},
      {from: 'en', to: 'de', files: {model: {size: 50}, lex: {size: 10}}},
    ];
    manager.translator = /** @type {any} */ ({
      backing: {
        getModels: async () => models,
        getTranslationModel: async ({from, to}) => manager._onModelProgress({from, to, loaded: 20}),
      },
    });

    const onProgress = jest.fn();
    await manager.loadTranslationModels('fr', 'de', {onProgress});
    expect(onProgress).toHaveBeenNthCalledWith(1, 0, 100);
    expect(onProgress).toHaveBeenLastCalledWith(40, 100);
  });
});
