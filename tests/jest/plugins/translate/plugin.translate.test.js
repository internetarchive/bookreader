// This dependency uses import.meta.url, which Jest does not handle in our current test setup.
// Mocking it keeps this panel test lightweight and avoids pulling in the translation runtime.
jest.mock('@internetarchive/bergamot-translator/translator.js', () => ({
  BatchTranslator: class {},
}));

import { BrTranslatePanel } from '@/src/plugins/translate/plugin.translate.js';

describe('BrTranslatePanel unsupported language warning', () => {
  test('shows unsupported language warning message', () => {
    const panel = new BrTranslatePanel();
    panel.sourceLanguageSupported = false;
    panel.detectedFromLang = 'zzzz';

    expect(panel._statusWarning()).toBe('Translating from zzzz is not supported');
  });
});
