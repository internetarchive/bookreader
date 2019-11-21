import sinon from 'sinon';
import { afterEventLoop } from '../../utils.js';
import PageChunkIterator from "../../../src/js/plugins/tts/PageChunkIterator";
import PageChunk from '../../../src/js/plugins/tts/PageChunk';

describe('Buffers pages', () => {
    test('Does not error if no room for reverse buffer', () => {
        const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        iterator.next();
        expect(Object.keys(iterator._bufferingPages).length).toBe(6);
    });

    test('Does not error if no room for forward buffer', () => {
        const iterator = new PageChunkIterator(100, 99, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        iterator.next();
        expect(Object.keys(iterator._bufferingPages).length).toBe(6);
    });

    test('Fewer pages than buffer size', () => {
        const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        iterator.next();
        expect(iterator._fetchPageDirect.callCount).toBe(1);
        expect(Object.keys(iterator._bufferingPages).length).toBe(1);
    });

    test('Buffers data before/after', () => {
        const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        iterator.next();
        expect(Object.keys(iterator._bufferingPages).length).toBe(11);
    });

    test('Buffer size does not grow indefinitely', () => {
        const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);
        iterator.next();
        iterator.next();
        iterator.next();
        iterator.next();
        expect(Object.keys(iterator._bufferingPages).length).toBe(11);
    });

    test('Does not make a new request if buffered', () => {
        const iterator = new PageChunkIterator(10, 7, {pageBufferSize: 5});
        sinon.stub(iterator, '_fetchPageDirect').resolves([dummyPageChunk()]);

        return iterator.next()
        .then(() => {
            expect(iterator._fetchPageDirect.callCount).toBe(8);
            return iterator.next()
        })
        .then(() => {
            expect(iterator._fetchPageDirect.callCount).toBe(8);
        });
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
        return iterator.prev()
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(3);
            return iterator.prev();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(2);
            return iterator.prev();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(1);
            return iterator.prev();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(49);
            expect(iterator.nextChunkIndex).toBe(0);
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
        return iterator.prev()
        .then(() => {
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.prev();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(0);
            return iterator.prev();
        })
        .then(() => {
            expect(iterator.currentPage).toBe(0);
            expect(iterator.nextChunkIndex).toBe(0);
        });
    });
});

function dummyPageChunk() {
    return new PageChunk(0, 0, "Line", []);
}
