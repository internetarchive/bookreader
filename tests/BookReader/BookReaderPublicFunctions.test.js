import BookReader from '../../src/js/BookReader';

beforeAll(() => {
  global.alert = jest.fn();
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('BookReader.prototype.trigger', () => {
  test('fires custom event', () => {
    const br = new BookReader();
    global.br = br;
    global.dispatchEvent = jest.fn();

    const props = {bar: 1};
    br.trigger('foo', props);
    expect(global.dispatchEvent.mock.calls.length).toBe(1);
  });
});

describe('`BookReader.prototype.prev`', () => {
  const br = new BookReader();
  global.br = br;
  br.trigger = jest.fn();
  br.flipBackToIndex = jest.fn();
  br.jumpToIndex = jest.fn();

  test('does not take action if user is on front page', () => {
    br.firstIndex = 0;
    br.prev();
    expect(br.trigger.mock.calls.length).toBe(0);
    expect(br.flipBackToIndex.mock.calls.length).toBe(0);
    expect(br.jumpToIndex.mock.calls.length).toBe(0);
  });

  describe('2up mode', () => {
    test('fires event and turns the page', () => {
      br.firstIndex = 10;
      br.mode = br.constMode2up;
      br.prev();
      expect(br.jumpToIndex.mock.calls.length).toBe(0); // <--  does not get called
      expect(br.trigger.mock.calls.length).toBe(1);
      expect(br.flipBackToIndex.mock.calls.length).toBe(1);
    });
  });

  describe('non 2up mode', () => {
    test('jumps to provided index', () => {
      br.firstIndex = 100;
      br.mode = br.constMode1up;
      br.prev();
      expect(br.jumpToIndex.mock.calls.length).toBe(1);  // <--  gets called
      expect(br.trigger.mock.calls.length).toBe(1); // <-- gets called by `jumpToIndex` internally
      expect(br.flipBackToIndex.mock.calls.length).toBe(1); // <-- gets called by `jumpToIndex` internally
    });
  });
});

