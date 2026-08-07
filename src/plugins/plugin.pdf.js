// @ts-check
import { BookReaderPlugin } from '../BookReaderPlugin.js';
import * as pdfjsLib from 'pdfjs-dist';

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

// Point pdf.js at its worker bundle, resolved relative to this script's own
// location so it works regardless of where BookReader is deployed/mounted.
// This runs once, as soon as the plugin script is loaded (i.e. before any
// PdfPlugin.loadDocument call), since it must be set before pdf.js starts
// fetching a document.
const THIS_SCRIPT_SRC = /** @type {HTMLScriptElement} */ (document.currentScript)?.src;
pdfjsLib.GlobalWorkerOptions.workerSrc = THIS_SCRIPT_SRC ?
  new URL('pdf.worker.js', THIS_SCRIPT_SRC).toString() :
  'pdf.worker.js';

// Some PDFs use image codecs (JPEG2000/JPX, JBIG2, ICC) that pdf.js decodes
// via separate wasm modules; point it at the copy bundled alongside this
// plugin (see `wasm` files from `pdfjs-dist`).
const DEFAULT_WASM_URL = THIS_SCRIPT_SRC ?
  new URL('pdf-wasm/', THIS_SCRIPT_SRC).toString() :
  'pdf-wasm/';

/**
 * Renders a PDF as a BookReader book, using pdf.js (bundled) to rasterize
 * pages on demand.
 *
 * Like the IIIF plugin, this plugin expects the PDF to already have been
 * loaded with pdf.js _before_ BookReader is constructed, and the resulting
 * objects passed in as options -- BookReader reads page dimensions
 * synchronously while setting up, so there's no good hook for an async
 * load once construction has started. Use the `PdfPlugin.loadDocument`
 * convenience method to do this loading.
 *
 * @example
 * const { pdfDocument, pages } = await BookReader.PLUGINS.pdf.loadDocument(url);
 * const br = new BookReader({ plugins: { pdf: { pdfDocument, pages } } });
 * br.init();
 *
 * @extends BookReaderPlugin<PdfPlugin['options']>
 */
export class PdfPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /** @type {import('pdfjs-dist').PDFDocumentProxy | null} e.g. from `PdfPlugin.loadDocument` */
    pdfDocument: null,
    /** @type {import('pdfjs-dist').PDFPageProxy[] | null} one per page, in page order; e.g. from `PdfPlugin.loadDocument` */
    pages: null,
    /** @type {number} Resolution (in pixels-per-inch) pages are rasterized at when reduce == 1 */
    ppi: 300,
    /** @type {string} Image format used when rasterizing pages */
    renderMimeType: 'image/webp',
    /** @type {number} Quality (0-1) used when rasterizing pages, for lossy formats */
    renderQuality: 0.9,
  }

  /**
   * Serializes renders per page index; pdf.js throws if a page's `render`
   * is called again before the previous call's render finishes.
   * @type {{[pageIndex: number]: Promise<void>}}
   */
  renderQueues = {};

  /**
   * Loads a PDF from a URL, and pre-fetches all of its pages. This is a
   * convenience for building the `pdfDocument`/`pages` options; call it
   * _before_ constructing BookReader, and pass the result in as options.
   * See the class-level example.
   *
   * @param {string} url
   * @param {Partial<import('pdfjs-dist').DocumentInitParameters>} [docParams]
   */
  static async loadDocument(url, docParams = {}) {
    const pdfDocument = await pdfjsLib.getDocument({url, wasmUrl: DEFAULT_WASM_URL, ...docParams}).promise;
    const pages = await Promise.all(
      Array.from({length: pdfDocument.numPages}, (_, i) => pdfDocument.getPage(i + 1)),
    );
    return {pdfDocument, pages};
  }

  /**
   * @param {PdfPlugin['options']} options
   */
  setup(options) {
    super.setup(options);
    this.pdfDocument = this.options.pdfDocument;
    this.pages = this.options.pages;
    // PDF units are 1/72in; scale up to our target rasterization ppi.
    this.baseScale = this.options.ppi / 72;

    if (this.options.enabled) {
      Object.assign(this.br.options, this.toBookOptions());
    }
  }

  toBookOptions() {
    /** @type {Partial<import('../BookReader/options.js').BookReaderOptions>} */
    const book = {
      ppi: this.options.ppi,
      data: [],
      /**
       * @this {import('../BookReader.js').default}
       */
      getPageURI(pageIndex, reduce) {
        return `pdfjs://${pageIndex}/${reduce}`;
      },
      renderPageURI: (img, uri) => this.renderPageURI(img, uri),
    };

    let spread = [];
    this.pages.forEach((page, index) => {
      const viewport = page.getViewport({scale: this.baseScale});
      /** @type {import('../BookReader/options.js').PageData} */
      const pageData = {
        width: viewport.width,
        height: viewport.height,
        pageNum: `${index + 1}`,
      };
      spread.push(pageData);
      if (index % 2 == 0) {
        book.data.push(spread);
        spread = [];
      }
    });
    if (spread.length > 0) {
      book.data.push(spread);
    }
    return book;
  }

  /**
   * Rasterizes the page referenced by `uri` (as produced by `getPageURI`)
   * into `img`.
   * @param {HTMLImageElement} img
   * @param {string} uri
   */
  renderPageURI(img, uri) {
    const match = /^pdfjs:\/\/(\d+)\/([\d.]+)$/.exec(uri);
    if (!match) {
      img.src = uri;
      return Promise.resolve();
    }

    const pageIndex = parseInt(match[1], 10);
    const reduce = parseFloat(match[2]);
    const page = this.pages[pageIndex];

    const prevRender = this.renderQueues[pageIndex] || Promise.resolve();
    const thisRender = prevRender
      .catch(() => {})
      .then(() => this._rasterizePage(page, this.baseScale / reduce, img));
    this.renderQueues[pageIndex] = thisRender;
    return thisRender;
  }

  /**
   * @param {import('pdfjs-dist').PDFPageProxy} page
   * @param {number} scale
   * @param {HTMLImageElement} img
   */
  async _rasterizePage(page, scale, img) {
    const viewport = page.getViewport({scale});
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({canvasContext: canvas.getContext('2d'), viewport}).promise;
    img.src = canvas.toDataURL(this.options.renderMimeType, this.options.renderQuality);
  }
}

BookReader?.registerPlugin('pdf', PdfPlugin);
