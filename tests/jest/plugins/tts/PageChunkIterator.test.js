import sinon from 'sinon';
import PageChunkIterator from "@/src/plugins/tts/PageChunkIterator.js";
import PageChunk from '@/src/plugins/tts/PageChunk.js';

describe('Buffers pages', () => {
  test('Does not error if no room for reverse buffer', async () => {
    const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);
    await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(6);
    expect(Object.keys(iterator._bufferedPages).length).toBe(6);
  });

  test('Does not error if no room for forward buffer', async () => {
    const iterator = new PageChunkIterator(100, 99, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);
    await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(6);
    expect(Object.keys(iterator._bufferedPages).length).toBe(6);
  });

  test('Fewer pages than buffer size', async () => {
    const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);
    await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(1);
    expect(Object.keys(iterator._bufferedPages).length).toBe(1);
  });

  test('Buffers data before/after', async () => {
    const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);
    await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(11);
    expect(Object.keys(iterator._bufferedPages).length).toBe(11);
  });

  test('Buffer size does not grow indefinitely', async () => {
    const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);
    for (let i = 0; i < 5; i++) await iterator.next();
    expect(Object.keys(iterator._bufferedPages).length).toBe(11);
  });

  test('Does not make a new request if buffered', async () => {
    const iterator = new PageChunkIterator(10, 7, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);

    await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(8);

    await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(8);
  });
});

describe('Iterates pages', () => {
  test('Moves between chunks before moving between pages', async ()  => {
    const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
    const chunks = [
      dummyPageChunk(),
      dummyPageChunk(),
      dummyPageChunk(),
    ];
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves(chunks);

    for (let i = 0; i < 4; i++) {
      expect(iterator._cursor.page).toBe(50);
      expect(iterator._cursor.chunk).toBe(i);
      await iterator.next();
    }

    expect(iterator._cursor.page).toBe(51);
    expect(iterator._cursor.chunk).toBe(1);
  });

  test('Fires AT_END when done', async () => {
    const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);

    expect((await iterator.next()) instanceof PageChunk).toBe(true);
    expect(await iterator.next()).toBe(PageChunkIterator.AT_END);
  });

  test('Fires AT_END reaching past end', async () => {
    const iterator = new PageChunkIterator(1, 0, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([dummyPageChunk()]);

    expect((await iterator.next()) instanceof PageChunk).toBe(true);
    expect(iterator._cursor.page).toBe(0);
    expect(iterator._cursor.chunk).toBe(1);

    for (let i = 0; i < 4; i++) {
      expect(await iterator.next()).toBe(PageChunkIterator.AT_END);
      expect(iterator._cursor.page).toBe(1);
      expect(iterator._cursor.chunk).toBe(0);
    }
  });

  test('Moves backwards between chunks/pages', async () => {
    const iterator = new PageChunkIterator(100, 50, {pageBufferSize: 5});
    const chunks = [
      dummyPageChunk(),
      dummyPageChunk(),
      dummyPageChunk(),
    ];
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves(chunks);
    expect(iterator._cursor.page).toBe(50);
    expect(iterator._cursor.chunk).toBe(0);

    for (let i = 2; i >= 0; i--) {
      await iterator.decrement();
      expect(iterator._cursor.page).toBe(49);
      expect(iterator._cursor.chunk).toBe(i);
    }

    await iterator.decrement();
    expect(iterator._cursor.page).toBe(48);
    expect(iterator._cursor.chunk).toBe(2);
  });

  test('Moving backwards at start refires start chunk', async () => {
    const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
    const chunks = [
      dummyPageChunk(),
      dummyPageChunk(),
      dummyPageChunk(),
    ];
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves(chunks);

    for (let i = 0; i < 4; i++) {
      expect(iterator._cursor.page).toBe(0);
      expect(iterator._cursor.chunk).toBe(0);
      await iterator.decrement();
    }
  });

  test('Empty book', async () => {
    const iterator = new PageChunkIterator(100, 0, {pageBufferSize: 5});
    sinon.stub(iterator, '_fetchPageChunksDirect').resolves([]);
    const result = await iterator.next();
    expect(iterator._fetchPageChunksDirect.callCount).toBe(100);
    expect(result).toBe(PageChunkIterator.AT_END);
  });

  test('Moving forward through empty pages', async () => {
    const iterator = new PageChunkIterator(10, 0, {pageBufferSize: 5});
    const nonEmptyPages = {
      0: [dummyPageChunk()],
      5: [dummyPageChunk()],
    };
    sinon.stub(iterator, '_fetchPageChunksDirect')
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
    sinon.stub(iterator, '_fetchPageChunksDirect')
      .callsFake(async i => nonEmptyPages[i] || []);

    await iterator.decrement();
    const result0 = await iterator.next();
    expect(result0).toBe(nonEmptyPages[0][0]);
  });
});

function dummyPageChunk() {
  return new PageChunk(0, 0, "Line", []);
}
