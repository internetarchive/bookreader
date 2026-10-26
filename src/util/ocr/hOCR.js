// @ts-check
import { OCRBook, OCRLine, OCRPage, OCRParagraph, OCRWord } from './OCR.js';
import { Rect } from '../rect.js';

/**
 * hOCR (https://github.com/kba/hocr-spec), as produced by IA's hocr derive;
 * e.g. https://archive.org/download/goodytwoshoes00newyiala/goodytwoshoes00newyiala_hocr.html
 *
 * Note only words read their declared bbox; the enclosing line/paragraph boxes
 * are derived from the words they contain instead. The renderer positions
 * everything relative to word boxes, so deriving keeps containers consistent
 * with their contents — an ocr_par/ocr_carea bbox can otherwise cover
 * whitespace or non-text content that the rendered text does not.
 */

/** hOCR represents a line as a span with one of these classes. */
const LINE_CLASSES = [
  'ocr_line',
  'ocr_header',
  'ocr_footer',
  'ocr_pageno',
  'ocr_caption',
  'ocr_textfloat',
];
const LINE_SELECTOR = LINE_CLASSES.map(c => `.${c}`).join(', ');

export class HOCRWord extends OCRWord {
  get text() {
    // Can contain markup, e.g. <strong>/<em> from font detection
    return this.el.textContent;
  }

  /** @override */
  _readBox() {
    return readBbox(this.el);
  }
}

export class HOCRLine extends OCRLine {
  /** @override */
  _readWords() {
    return Array.from(this.el.querySelectorAll('.ocrx_word'), el => new HOCRWord(el));
  }
}

export class HOCRParagraph extends OCRParagraph {
  /**
   * @param {Element} el
   * @param {Element[]} lineEls The line elements grouped under `el`
   */
  constructor(el, lineEls) {
    super(el);
    this.lineEls = lineEls;
  }

  /** @override */
  _readLines() {
    return this.lineEls.map(el => new HOCRLine(el));
  }
}

export class HOCRPage extends OCRPage {
  /**
   * hOCR does not require lines to be wrapped in an ocr_par, so group them by
   * their parent element (usually an ocr_par, sometimes an ocr_carea) rather
   * than looking for paragraphs directly.
   * @override
   */
  _readParagraphs() {
    /** @type {Map<Element, Element[]>} */
    const linesByParent = new Map();
    for (const lineEl of this.el.querySelectorAll(LINE_SELECTOR)) {
      const parent = lineEl.parentElement ?? this.el;
      if (!linesByParent.has(parent)) linesByParent.set(parent, []);
      linesByParent.get(parent).push(lineEl);
    }
    return Array.from(linesByParent, ([el, lineEls]) => new HOCRParagraph(el, lineEls));
  }
}

export class HOCRBook extends OCRBook {
  /** @override */
  static parse(rawResponse) {
    // Parsed as html rather than as the xhtml it claims to be, since real
    // world hOCR is not reliably well-formed xml.
    const doc = new DOMParser().parseFromString(rawResponse, 'text/html');
    return new HOCRBook(Array.from(doc.querySelectorAll('.ocr_page'), el => new HOCRPage(el)));
  }
}

/**
 * hOCR stores an element's properties in its title attribute; e.g.
 * title="bbox 100 200 150 220; x_wconf 95"
 * @param {Element} el
 * @returns {Rect | null}
 */
function readBbox(el) {
  const match = /\bbbox (-?\d+) (-?\d+) (-?\d+) (-?\d+)/.exec(el.getAttribute('title') || '');
  if (!match) return null;
  const [left, top, right, bottom] = match.slice(1).map(Number);
  return Rect.fromEdges(left, top, right, bottom);
}
