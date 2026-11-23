// This dependency uses import.meta.url, which Jest does not handle in our current test setup.
// Mocking it keeps this panel test lightweight and avoids pulling in the translation runtime.
jest.mock('@internetarchive/bergamot-translator/translator.js', () => ({
  BatchTranslator: class {},
}));

import { render } from 'lit';
import { BrTranslatePanel, TranslatePlugin, loadRecentLanguages } from '@/src/plugins/translate/plugin.translate.js';

describe('BrTranslatePanel unsupported language warning', () => {
  test('shows unsupported language warning message', () => {
    const panel = new BrTranslatePanel();
    panel.sourceLanguageSupported = false;
    panel.detectedFromLang = 'zzzz';

    expect(panel._statusWarning()).toBe('Translating from zzzz is not supported');
  });
});

describe('BrTranslatePanel recent languages', () => {
  const toLanguages = [
    {code: 'en', name: 'English (en)'},
    {code: 'fr', name: 'français (fr)'},
    {code: 'de', name: 'Deutsch (de)'},
    {code: 'ko', name: '한국어 (ko)'},
  ];

  /** @param {BrTranslatePanel} panel */
  const renderOptions = (panel) => {
    const select = document.createElement('select');
    render(panel._renderToLanguageOptions(), select);
    return select;
  };

  beforeEach(() => localStorage.clear());

  test('shows only the full list when there is no history', () => {
    const panel = new BrTranslatePanel();
    panel.toLanguages = toLanguages;
    const select = renderOptions(panel);
    expect(select.querySelector('optgroup')).toBeNull();
    expect(select.options.length).toBe(4);
  });

  test('shows recent languages in their own group, most recent first', () => {
    localStorage.setItem('BrTranslateRecentLanguages', JSON.stringify(['ko', 'xx', 'fr']));
    const panel = new BrTranslatePanel();
    panel.toLanguages = toLanguages;
    panel.detectedToLang = 'fr';
    const select = renderOptions(panel);
    const [recent, all] = select.querySelectorAll('optgroup');
    expect([...recent.children].map(o => o.value)).toEqual(['ko', 'fr']);
    expect(all.children.length).toBe(4);
    expect(select.value).toBe('fr');
    expect(recent.querySelector('[value=fr]').selected).toBe(true);
  });

  test('remembers the chosen language, up to three', () => {
    const panel = new BrTranslatePanel();
    panel.recentToLanguages = ['de', 'fr', 'ko'];
    panel._onLangToChange({target: {value: 'fr'}});
    expect(panel.recentToLanguages).toEqual(['fr', 'de', 'ko']);
    panel._onLangToChange({target: {value: 'en'}});
    expect(panel.recentToLanguages).toEqual(['en', 'fr', 'de']);
    expect(JSON.parse(localStorage.getItem('BrTranslateRecentLanguages'))).toEqual(['en', 'fr', 'de']);
  });

  test('ignores invalid stored data', () => {
    localStorage.setItem('BrTranslateRecentLanguages', '{not json');
    expect(loadRecentLanguages()).toEqual([]);
  });
});

describe('TranslatePlugin.getDefaultToLanguage', () => {
  const plugin = /** @type {any} */ ({
    translationManager: {toLanguages: [{code: 'en'}, {code: 'fr'}, {code: 'zh-Hans'}]},
  });
  const getDefault = (browserLanguages) => {
    jest.spyOn(navigator, 'languages', 'get').mockReturnValue(browserLanguages);
    return TranslatePlugin.prototype.getDefaultToLanguage.call(plugin);
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  test('uses the browser language, matching by base language', () => {
    expect(getDefault(['fr-CA', 'en'])).toBe('fr');
    expect(getDefault(['zh-CN'])).toBe('zh-Hans');
  });

  test('skips browser languages without a model', () => {
    expect(getDefault(['xx', 'fr'])).toBe('fr');
    expect(getDefault(['xx'])).toBe('en');
  });

  test('prefers the most recently used language', () => {
    localStorage.setItem('BrTranslateRecentLanguages', JSON.stringify(['zh-Hans']));
    expect(getDefault(['fr'])).toBe('zh-Hans');
  });
});
