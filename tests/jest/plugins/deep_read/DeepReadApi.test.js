import { extractMockEntities } from '@/src/plugins/deep_read/DeepReadApi.js';
import { BookReaderTextFragment, renderHighlight } from '@/src/util/TextSelectionManager.js';

/** Mimics the text selection plugin's word/space structure */
function makeTextLayer(words) {
  const textLayer = document.createElement('div');
  textLayer.className = 'BRtextLayer';
  textLayer.innerHTML = words
    .map(w => `<span class="BRwordElement">${w}</span>`)
    .join('<span class="BRspace"> </span>');
  document.body.append(textLayer);
  return textLayer;
}

const fakeBook = { getPageIndex: (pageNum) => parseInt(pageNum.slice(1)) };

describe('extractMockEntities', () => {
  const words = 'He travelled from London to Paris, where Mr Henry Smith met him. Paris was cold.'.split(' ');

  test('finds capitalized phrases, skipping lone sentence starts', () => {
    const { mentions, entities } = extractMockEntities(words, 3, 10);
    expect(Object.values(entities).map(e => e.label)).toEqual(['London', 'Paris', 'Henry Smith']);
    expect(entities['mock:london'].type).toBe('place');
    expect(entities['mock:henry-smith'].type).toBe('person');
    expect(mentions.map(m => m.entityId)).toEqual(['mock:london', 'mock:paris', 'mock:henry-smith']);
  });

  test('respects maxMentions', () => {
    expect(extractMockEntities(words, 3, 1).mentions).toHaveLength(1);
  });

  test('fragments can be located in the text layer', () => {
    const { mentions } = extractMockEntities(words, 3, 10);
    const textLayer = makeTextLayer(words);
    for (const mention of mentions) {
      const fragment = BookReaderTextFragment.fromString(mention.fragment, fakeBook, 0);
      expect(fragment.pageIndex).toBe(3);
      const marks = renderHighlight(textLayer, fragment, 'BRdeepReadEntity');
      // renderHighlight marks whole words, so punctuation comes along
      expect(marks.map(m => m.textContent).join('').replace(/[^\p{L} ]/gu, '')).toBe(fragment.quote);
    }
  });
});
