
import BookReader from '@/src/BookReader.js';

beforeAll(() => {
  document.body.innerHTML = '<div id="BookReader">';
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('BookReader options', () => {
  describe('`autoResize`', () => {
    it('is on by default', () => {
      const br = new BookReader();
      br.init();
      expect(br.options.autoResize).toBe(true);
    });
  });

  describe('`startFullscreen`', () => {
    it('initializes BookReader to fullscreen', () => {
      const br = new BookReader({
        startFullscreen: true,
      });
      br.init();

      expect(document.getElementById('BookReader').classList.contains('br-ui-full')).toBe(true);
    });
  });

  describe('`useSrcSet`', () => {
    it('is on by default', () => {
      const br = new BookReader();
      br.init();
      expect(br.options.autoResize).toBe(true);
    });
  });

  describe('`showNavbar`', () => {
    it('is on by default', () => {
      const br = new BookReader();
      br.init();
      expect(br.options.showNavbar).toBe(true);
    });
  });
});
