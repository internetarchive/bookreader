import { marshallSearchResults } from '@/src/plugins/search/utils.js';
import { deepCopy } from '@/tests/jest/utils.js';
import { DUMMY_RESULTS } from './utils.js';

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
