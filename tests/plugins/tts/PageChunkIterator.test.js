import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import PageChunkIterator from "../../../src/js/plugins/tts/PageChunkIterator";
import PageChunk from '../../../src/js/plugins/tts/PageChunk';

describe('Buffers pages', () => {
    test('Does not error if no room for reverse buffer', async () => {
        const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(6);
        expect(Object.keys(iterator._bufferedPages).length).toBe(6);
    });

    test('Does not error if no room for forward buffer', async () => {
        const iterator = new PageChunkIterator(100, 99, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(6);
        expect(Object.keys(iterator._bufferedPages).length).toBe(6);
    });

    test('Fewer pages than buffer size', async () => {
        const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(1);
        expect(Object.keys(iterator._bufferedPages).length).toBe(1);
    });

    test('Buffers data before/after', async () => {
        const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(11);
        expect(Object.keys(iterator._bufferedPages).length).toBe(11);
    });

    test('Buffer size does not grow indefinitely', async () => {
        const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        for (let i = 0; i < 5; i++) await iterator.next();
        expect(Object.keys(iterator._bufferedPages).length).toBe(11);
    });

    test('Does not make a new request if buffered', async () => {
        const iterator = new PageChunkIterator(10, 7, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);

        await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(8);
        
        await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(8);
    });
});

describe('Iterates pages', () => {
    test('Moves between chunks before moving between pages', ()  => {
        const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
        const chunks = [
            dummyPageChunk(),
            dummyPageChunk(),
            dummyPageChunk(),
        ];
        sinon.stub(iterator, '_fetchPageDirect').resolves(chunks);
        expect(iterator.currentPage).toBe(50);
        expect(iterator.nextChunkIndex).toBe(0);
        return iterator.next()
        .then(() => {
            expect(iterator.currentPage).toBe(50);
            expect(iterator.nextChunkIndex).toBe(1);
            return iterator.next();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(50);
            expect(iterator.nextChunkIndex).toBe(2);
            return iterator.next();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(50);
            expect(iterator.nextChunkIndex).toBe(3);
            return iterator.next();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(51);
            expect(iterator.nextChunkIndex).toBe(1);
        });
    });

    test('Fires AT_END when done', () => {
        const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        return iterator.next()
        .then(res => {
            expect(res instanceof PageChunk).toBe(true);
            return iterator.next();
        })
        .then(res => {
            expect(res).toBe(PageChunkIterator.AT_END);
        });
    });

    test('Fires AT_END reaching past end', () => {
        const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        return iterator.next()
        .then(res => {
            expect(res instanceof PageChunk).toBe(true);
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(1);
            return iterator.next();
        })
        .then(res => {
            expect(res).toBe(PageChunkIterator.AT_END);
            expect(iterator.currentPage).toBe(1);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.next();
        })
        .then(res => {
            expect(res).toBe(PageChunkIterator.AT_END);
            expect(iterator.currentPage).toBe(1);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.next();
        })
        .then(res => {
            expect(res).toBe(PageChunkIterator.AT_END);
            expect(iterator.currentPage).toBe(1);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.next();
        });
    });

    test('Moves backwards between chunks/pages', () => {
        const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
        const chunks = [
            dummyPageChunk(),
            dummyPageChunk(),
            dummyPageChunk(),
        ];
        sinon.stub(iterator, '_fetchPageDirect').resolves(chunks);
        expect(iterator.currentPage).toBe(50);
        expect(iterator.nextChunkIndex).toBe(0);
        return iterator.decrement()
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(2);
            return iterator.decrement();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(1);
            return iterator.decrement();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.decrement();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(48);
            expect(iterator.nextChunkIndex).toBe(2);
        });
    });

    test('Moving backwards at start refires start chunk', () => {
        const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
        const chunks = [
            dummyPageChunk(),
            dummyPageChunk(),
            dummyPageChunk(),
        ];
        sinon.stub(iterator, '_fetchPageDirect').resolves(chunks);
        expect(iterator.currentPage).toBe(0);
        expect(iterator.nextChunkIndex).toBe(0);
        return iterator.decrement()
        .then(() => {
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.decrement();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.decrement();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(0);
        });
    });

    test('Empty book', async () => {
        const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([]);
        const result = await iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(100);
        expect(result).toBe(PageChunkIterator.AT_END);
    });

    test('Moving forward through empty pages', async () => {
        const iterator = new PageChunkIterator(10, 0, {pageBufferSize: 5});
        const nonEmptyPages = {
            0: [dummyPageChunk()],
            5: [dummyPageChunk()],
        };
        sinon.stub(iterator, '_fetchPageDirect')
        .callsFake(async i => nonEmptyPages[i] || []);

        const result0 = await iterator.next();
        expect(result0).toBe(nonEmptyPages[0][0]);

        const result1 = await iterator.next();
        expect(result1).toBe(nonEmptyPages[5][0]);
    });

    test('Moving backward through empty pages', async () => {
        const iterator = new PageChunkIterator(10, 5, {pageBufferSize: 5});
        const nonEmptyPages = {
            0: [dummyPageChunk()],
            5: [dummyPageChunk()],
        };
        sinon.stub(iterator, '_fetchPageDirect')
        .callsFake(async i => nonEmptyPages[i] || []);

        await iterator.decrement();
        const result0 = await iterator.next();
        expect(result0).toBe(nonEmptyPages[0][0]);
    });
});

function dummyPageChunk() {
    return new PageChunk(0, 0, "Line", []);
}
