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

describe('_fromTextWrapperResponse', () => {
    const { _fromTextWrapperResponse } = PageChunk;

    test('Handles empty array', () => {
        expect(_fromTextWrapperResponse(0, [])).toEqual([]);
    });

    test('Basic test', () => {
        const chunks = _fromTextWrapperResponse(0, [['Line', [0,100,100,0]]]);
        expect(chunks).toEqual([new PageChunk(0, 0, 'Line', [[0,100,100,0]])]);
    });
});

describe('_removeDanglingHyphens', () => {
    const { _removeDanglingHyphens } = PageChunk;

    test('No change to empty string', () => {
        expect(_removeDanglingHyphens('')).toEqual('');
    });

    test('No change when no hyphens string', () => {
        expect(_removeDanglingHyphens('Hello world!')).toEqual('Hello world!');
    });

    test('No change to hyphens mid-word', () => {
        expect(_removeDanglingHyphens('It is mid-word!')).toEqual('It is mid-word!');
    });

    test('Removes hyphens followed by spaces', () => {
        expect(_removeDanglingHyphens('It is not mid- word!')).toEqual('It is not midword!');
        expect(_removeDanglingHyphens('mid- word fid- word')).toEqual('midword fidword');
    });
});

describe('_fixIsolatedLetters', () => {
    const { _fixIsolatedLetters } = PageChunk;

    test('No change to empty string', () => {
        expect(_fixIsolatedLetters('')).toEqual('');
    });

    test('Concatenate when isolated letter other than A and I are found', () => {
        expect(_fixIsolatedLetters('W hen they come for me!')).toEqual('When they come for me!');
    });

    test('No change to already fixed words', () => {
        expect(_fixIsolatedLetters('This sentence is correct')).toEqual('This sentence is correct');
    });

    test('Ambiguous case where it is difficult to decide whether to concatenate or not', () => {
        expect(_fixIsolatedLetters('It is absolutely fine')).toEqual('It is absolutely fine');
        expect(_fixIsolatedLetters('I love book reader')).toEqual('I love book reader');
    });
});