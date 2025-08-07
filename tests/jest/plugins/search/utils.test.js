import { marshallSearchResults, renderMatch } from '@/src/plugins/search/utils.js';
import { deepCopy } from '@/tests/jest/utils.js';
import { DUMMY_RESULTS } from './utils.js';

describe('renderMatch', () => {
  test('Supports custom pre/post tags', () => {
    const matchText = DUMMY_RESULTS.matches[0].text
      .replace(/\{\{\{/g, '<IA_FTS_MATCH>')
      .replace(/\}\}\}/g, '</IA_FTS_MATCH>');
    const html = renderMatch(matchText, '<IA_FTS_MATCH>', '</IA_FTS_MATCH>');
    expect(html).toContain('<mark>');
    expect(html).toContain('</mark>');
  });
});

describe('marshallSearchResults', () => {
  test('Adds match index', () => {
    const results = deepCopy(DUMMY_RESULTS);
    marshallSearchResults(results, x => x.toString(), '{{{', '}}}');
    expect(results.matches[0]).toHaveProperty('matchIndex', 0);
    expect(results.matches[0].par[0].boxes[0]).toHaveProperty('matchIndex', 0);
  });

  test('Adds display page number', () => {
    const results = deepCopy(DUMMY_RESULTS);
    marshallSearchResults(results, x => `n${x}`, '{{{', '}}}');
    expect(results.matches[0]).toHaveProperty('displayPageNumber', 'n37');
  });
});
