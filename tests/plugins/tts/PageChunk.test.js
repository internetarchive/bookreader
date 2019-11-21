import PageChunk from '../../../src/js/plugins/tts/PageChunk.js';

describe('_fixChunkRects', () => {
    const { _fixChunkRects } = PageChunk;

    test('Handles empty array', () => {
        const rects = [];
        expect(_fixChunkRects(rects)).toBe(rects);
        expect(rects).toEqual([]);
    });

    test('Does not modify normal values values normal', () => {
        const rects = [[100,100,500,80], [200,200,500,180], [300,300,500,280]];
        expect(_fixChunkRects(rects)).toBe(rects);
        expect(rects).toEqual([[100,100,500,80], [200,200,500,180], [300,300,500,280]]);
    });

    test('Fixes outlier values in first rect', () => {
        const rects = [[100,2300,2300,0], [200,200,200,180], [300,300,200,280]];
        expect(_fixChunkRects(rects)).toBe(rects);
        expect(rects).toEqual([[100,2300,200,2280], [200,200,200,180], [300,300,200,280]]);
    });
});
