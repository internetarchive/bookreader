import AudioReaderPlayer, { segmentKey } from '@/src/audioreader/AudioReaderPlayer.js';
import ParagraphSource from '@/src/audioreader/ParagraphSource.js';

const DEBOUNCE = 10;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
/** Long enough for the seek debounce to fire and the resulting async work to settle. */
const settle = () => sleep(DEBOUNCE * 5);

/** Two long sentences, so every paragraph yields landmark + tail + one more sentence. */
const para = n => `Paragraph ${n} begins right here with plenty of words. And it has a second sentence too.`;

/** Ten paragraphs, one per leaf, so paragraph seeks cross page boundaries. */
const PAGES = Array.from({ length: 10 }, (_, i) => [para(i)]);

function makeSource(pages = PAGES) {
  const fetchPageChunks = async (leafIndex) => (pages[leafIndex] || [])
    .map((text, chunkIndex) => ({ leafIndex, chunkIndex, text, lineRects: [] }));
  return new ParagraphSource({ fetchPageChunks, numLeafs: pages.length });
}

/**
 * Engine whose synthesis and playback can be resolved on demand, so tests can
 * observe the states the UI cares about (spinner, mid-sound seek) instead of
 * racing them.
 */
function makeEngine({ instantSynth = true, instantPlay = true } = {}) {
  const pendingSynth = new Map();
  const pendingPlay = [];
  const spoken = [];
  const calls = { pause: 0, resume: 0, stop: 0 };

  const engine = {
    synthesize: jest.fn((text, { signal }) => {
      if (instantSynth) return Promise.resolve({ text });
      return new Promise((resolve, reject) => {
        pendingSynth.set(text, resolve);
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }),
    play: jest.fn((sound, { signal }) => {
      spoken.push(sound.text);
      if (instantPlay) return Promise.resolve();
      return new Promise((resolve, reject) => {
        pendingPlay.push(resolve);
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    }),
    pause: jest.fn(() => { calls.pause++; }),
    resume: jest.fn(() => { calls.resume++; }),
    stop: jest.fn(() => { calls.stop++; }),
  };

  return {
    engine, spoken, calls,
    async finishSynth(text, value = { text }) {
      pendingSynth.get(text)(value);
      pendingSynth.delete(text);
      await sleep(0);
    },
    async finishPlay() {
      pendingPlay.shift()?.();
      await sleep(0);
    },
  };
}

function makePlayer(overrides = {}) {
  const source = overrides.source || makeSource();
  const { engine, spoken, calls, finishSynth, finishPlay } = overrides.harness || makeEngine();
  const onChange = jest.fn();
  const onParagraphChange = jest.fn();
  const player = new AudioReaderPlayer({
    source, engine, seekDebounceMs: DEBOUNCE, onChange, onParagraphChange, ...overrides.playerOpts,
  });
  return { player, source, engine, spoken, calls, finishSynth, finishPlay, onChange, onParagraphChange };
}

describe('initial buffering', () => {
  test('preloads in the priority order the issue specifies', async () => {
    const { player, engine } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    const order = engine.synthesize.mock.calls.map(([text]) => text);
    expect(order[0]).toBe('Paragraph 0 begins');                                   // 3-word landmark
    expect(order[1]).toBe('right here with plenty of words.');                     // rest of the sentence
    expect(order[2]).toBe('And it has a second sentence too.');                    // rest of the paragraph
    expect(order[3]).toBe('Paragraph 1 begins');                                   // then the lookahead
  });

  test('buffers exactly 5 paragraphs, not the whole book', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    const planned = player._plan.map(job => job.key.split('#')[0]);
    expect(new Set(planned)).toEqual(new Set(['0:0', '1:0', '2:0', '3:0', '4:0']));
  });

  test('honors a custom lookahead', async () => {
    const { player } = makePlayer({ playerOpts: { lookahead: 2 } });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    const planned = new Set(player._plan.map(job => job.key.split('#')[0]));
    expect(planned).toEqual(new Set(['0:0', '1:0']));
  });

  test('does not play anything before play() is called', async () => {
    const { player, engine } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    expect(engine.synthesize).toHaveBeenCalled();
    expect(engine.play).not.toHaveBeenCalled();
    expect(player.playing).toBe(false);
  });

  test('truncates the buffer at the end of the book', async () => {
    const { player } = makePlayer({ source: makeSource(PAGES.slice(0, 3)) });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    const planned = new Set(player._plan.map(job => job.key.split('#')[0]));
    expect(planned).toEqual(new Set(['0:0', '1:0', '2:0']));
  });
});

describe('playback', () => {
  test('reads a paragraph segment by segment, then moves to the next paragraph', async () => {
    const { player, spoken } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    await player.play();
    await settle();

    expect(spoken.slice(0, 4)).toEqual([
      'Paragraph 0 begins',
      'right here with plenty of words.',
      'And it has a second sentence too.',
      'Paragraph 1 begins',
    ]);
  });

  test('slides the buffer window forward as paragraphs are read', async () => {
    const harness = makeEngine({ instantPlay: false });
    const { player, finishPlay } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    player.play();
    await settle();

    expect(new Set(player._plan.map(j => j.key.split('#')[0])))
      .toEqual(new Set(['0:0', '1:0', '2:0', '3:0', '4:0']));

    // Read all three segments of paragraph 0.
    for (let i = 0; i < 3; i++) { await finishPlay(); await settle(); }

    expect(player.cursor).toEqual({ leafIndex: 1, chunkIndex: 0 });
    expect(new Set(player._plan.map(j => j.key.split('#')[0])))
      .toEqual(new Set(['1:0', '2:0', '3:0', '4:0', '5:0']));
  });

  test('marks finished at the end of the book', async () => {
    const { player } = makePlayer({ source: makeSource([[para(0)]]) });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    await player.play();
    await settle();

    expect(player.finished).toBe(true);
    expect(player.playing).toBe(false);
  });

  test('pause stops the engine but keeps position', async () => {
    const harness = makeEngine({ instantPlay: false });
    const { player, calls } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    player.play();
    await settle();

    player.pause();
    expect(calls.pause).toBe(1);
    expect(player.playing).toBe(false);
    expect(player.cursor).toEqual({ leafIndex: 0, chunkIndex: 0 });
  });
});

describe('the loading spinner', () => {
  test('is on while waiting for the current segment, off once it arrives', async () => {
    const harness = makeEngine({ instantSynth: false, instantPlay: false });
    const { player, finishSynth, spoken } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    expect(player.loading).toBe(false);
    player.play();
    await settle();

    // Audio for the landmark has not been synthesized yet.
    expect(player.loading).toBe(true);
    expect(spoken).toEqual([]);

    await finishSynth('Paragraph 0 begins');
    await settle();
    expect(player.loading).toBe(false);
    expect(spoken).toEqual(['Paragraph 0 begins']);
  });

  test('comes back on if the next segment is not buffered yet', async () => {
    const harness = makeEngine({ instantSynth: false, instantPlay: false });
    const { player, finishSynth, finishPlay } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    player.play();
    await settle();

    await finishSynth('Paragraph 0 begins');
    await settle();
    expect(player.loading).toBe(false);

    // Landmark finishes playing, but the rest of the sentence has not arrived.
    await finishPlay();
    await settle();
    expect(player.loading).toBe(true);
  });

  test('is off when the segment was already buffered', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    player.play();
    await settle();

    expect(player.loading).toBe(false);
  });
});

describe('seek throttling', () => {
  test('a burst of next() presses causes exactly one buffer rebuild', async () => {
    const { player, source } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    const windowSpy = jest.spyOn(source, 'window');
    for (let i = 0; i < 6; i++) player.next();
    await settle();

    expect(windowSpy).toHaveBeenCalledTimes(1);
  });

  test('a burst of presses still lands the right number of paragraphs forward', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    for (let i = 0; i < 6; i++) player.next();
    await settle();

    expect(player.cursor).toEqual({ leafIndex: 6, chunkIndex: 0 });
  });

  test('mixed next/prev presses net out', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 5, chunkIndex: 0 });
    await settle();

    player.next(); player.next(); player.next(); player.prev();
    await settle();

    expect(player.cursor).toEqual({ leafIndex: 7, chunkIndex: 0 });
  });

  test('seeking stops the current sound immediately, without waiting for the debounce', async () => {
    const harness = makeEngine({ instantPlay: false });
    const { player, calls } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    player.play();
    await settle();

    const stopsBefore = calls.stop;
    player.next();
    expect(calls.stop).toBeGreaterThan(stopsBefore);
    expect(player.seeking).toBe(true);

    await settle();
    expect(player.seeking).toBe(false);
  });

  test('seeking rebuilds the buffer around the new position', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    player.next(); player.next();
    await settle();

    expect(new Set(player._plan.map(j => j.key.split('#')[0])))
      .toEqual(new Set(['2:0', '3:0', '4:0', '5:0', '6:0']));
  });

  test('keeps playing after a seek if it was playing before', async () => {
    // Playback must still be in progress when the seek lands, so the sound is
    // held open rather than running the whole book to completion instantly.
    const harness = makeEngine({ instantPlay: false });
    const { player, spoken } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();
    player.play();
    await settle();

    spoken.length = 0;
    player.next();
    await settle();

    expect(player.playing).toBe(true);
    expect(spoken).toEqual(['Paragraph 1 begins']);
  });

  test('stays paused after a seek if it was paused', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    player.next();
    await settle();

    expect(player.playing).toBe(false);
  });

  test('seeking past the start of the book clamps rather than breaking', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 1, chunkIndex: 0 });
    await settle();

    for (let i = 0; i < 5; i++) player.prev();
    await settle();

    expect(player.cursor).toEqual({ leafIndex: 0, chunkIndex: 0 });
  });

  test('seeking past the end of the book clamps rather than breaking', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 8, chunkIndex: 0 });
    await settle();

    for (let i = 0; i < 5; i++) player.next();
    await settle();

    expect(player.cursor).toEqual({ leafIndex: 9, chunkIndex: 0 });
  });

  test('notifies the UI once per actual paragraph change, not once per press', async () => {
    const { player, onParagraphChange } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    onParagraphChange.mockClear();
    player.next(); player.next(); player.next();
    await settle();

    expect(onParagraphChange).toHaveBeenCalledTimes(1);
  });
});

describe('table of contents jumps', () => {
  test('jumpToLeaf lands on the first paragraph at or after the leaf', async () => {
    const pages = [[para(0)], [], [], [para(3)]];
    const { player } = makePlayer({ source: makeSource(pages) });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    await player.jumpToLeaf(1);
    await settle();

    expect(player.cursor).toEqual({ leafIndex: 3, chunkIndex: 0 });
  });

  test('jumpToLeaf cancels a pending seek rather than compounding with it', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    player.next();
    await player.jumpToLeaf(7);
    await settle();

    expect(player.cursor).toEqual({ leafIndex: 7, chunkIndex: 0 });
  });
});

describe('housekeeping', () => {
  test('segmentKey is unique per paragraph and segment', () => {
    expect(segmentKey({ leafIndex: 3, chunkIndex: 1 }, 2)).toBe('3:1#2');
    expect(segmentKey({ leafIndex: 3, chunkIndex: 1 }, 2))
      .not.toBe(segmentKey({ leafIndex: 3, chunkIndex: 2 }, 1));
  });

  test('paragraphText reassembles the paragraph being read', async () => {
    const { player } = makePlayer();
    await player.start({ leafIndex: 2, chunkIndex: 0 });
    await settle();

    expect(player.paragraphText).toBe(para(2));
  });

  test('bufferState reports progress toward a hydrated buffer', async () => {
    const harness = makeEngine({ instantSynth: false });
    const { player, finishSynth } = makePlayer({ harness });
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    expect(player.bufferState).toEqual({ ready: 0, total: 15 });
    await finishSynth('Paragraph 0 begins');
    await settle();
    expect(player.bufferState.ready).toBe(1);
  });

  test('destroy stops audio and empties the buffer', async () => {
    const { player, calls } = makePlayer();
    await player.start({ leafIndex: 0, chunkIndex: 0 });
    await settle();

    player.destroy();

    expect(calls.stop).toBeGreaterThan(0);
    expect(player.queue.readyKeys()).toEqual([]);
  });
});
