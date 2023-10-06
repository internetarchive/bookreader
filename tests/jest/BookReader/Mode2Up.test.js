
import sinon from 'sinon';
import { Mode2Up } from '@/src/BookReader/Mode2Up.js';
import BookReader from '@/src/BookReader.js';
import { BookModel } from '@/src/BookReader/BookModel.js';
import { afterEventLoop } from '../utils';
/** @typedef {import('@/src/BookReader/options.js').BookReaderOptions} BookReaderOptions */

beforeAll(() => {
  global.alert = jest.fn();
});
afterEach(() => {
  jest.restoreAllMocks();
  sinon.restore();
});

/** @type {BookReaderOptions['data']} */
const SAMPLE_DATA = [
  [
    { width: 123, height: 123, uri: 'https://archive.org/image0.jpg', pageNum: '1' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image1.jpg', pageNum: '2' },
    { width: 123, height: 123, uri: 'https://archive.org/image2.jpg', pageNum: '3' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image3.jpg', pageNum: '4' },
    { width: 123, height: 123, uri: 'https://archive.org/image4.jpg', pageNum: '5' },
  ],
  [
    { width: 123, height: 123, uri: 'https://archive.org/image5.jpg', pageNum: '6' },
  ],
];


describe('Mode2Up', () => {
  /** @type {BookReader} */
  let br;
  /** @type {BookModel} */
  let bookModel;
  /** @type {Mode2Up} */
  let mode2Up;

  beforeEach(() => {
    br = new BookReader({
      data: SAMPLE_DATA,
      el: document.createElement('div'),
    });
    br.init();
    bookModel = new BookModel(br);
    mode2Up = new Mode2Up(br, bookModel);
  });

  describe('prepare', () => {
    it('initializes DOM properly', async () => {
      const spyAppend = sinon.spy(br.refs.$brContainer, 'append');
      const spyRequestUpdate = sinon.spy(mode2Up.mode2UpLit, 'requestUpdate');
      const initFirstRenderSpy = sinon.spy(mode2Up.mode2UpLit, 'initFirstRender');
      const jumpToIndexSpy = sinon.spy(mode2Up.mode2UpLit, 'jumpToIndex');
      sinon.stub(mode2Up.mode2UpLit, 'updateComplete').get(() => Promise.resolve());
      mode2Up.prepare();

      expect(br.refs.$brContainer[0].style.overflow).toEqual('hidden');
      expect(spyAppend.calledWith(mode2Up.$el)).toBe(true);
      expect(mode2Up.mode2UpLit.style.opacity).toEqual('0');

      await afterEventLoop();

      expect(initFirstRenderSpy.called).toBe(true);
      expect(jumpToIndexSpy.called).toBe(false);
      expect(mode2Up.everShown).toBe(true);
      expect(spyRequestUpdate.called).toBe(true);
      expect(mode2Up.mode2UpLit.style.opacity).toEqual('1');
    });
  });

  describe('resizePageView', () => {
    it('updates autoFit when possible', async () => {
      const updateClientSizesSpy = sinon.stub(mode2Up.mode2UpLit.htmlDimensionsCacher, 'updateClientSizes');
      const resizeViaAutofitSpy = sinon.spy(mode2Up.mode2UpLit, 'resizeViaAutofit');
      const recenterStub = sinon.stub(mode2Up.mode2UpLit, 'recenter');

      mode2Up.resizePageView();
      expect(updateClientSizesSpy.called).toBe(true);
      expect(resizeViaAutofitSpy.called).toBe(true);
      expect(recenterStub.called).toBe(true);

      // Test with scale and autoFit as 'none'
      mode2Up.mode2UpLit.scale = 0.1;
      mode2Up.mode2UpLit.autoFit = 'none';
      mode2Up.resizePageView();

      expect(mode2Up.mode2UpLit.autoFit).toEqual('auto');
      expect(resizeViaAutofitSpy.callCount).toEqual(2);
      expect(recenterStub.callCount).toEqual(2);
    });
  });
});
