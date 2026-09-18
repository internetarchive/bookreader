// @ts-check
import { OCRBook, OCRLine, OCRPage, OCRParagraph, OCRWord } from './OCR.js';
import { Rect } from '../rect.js';

/**
 * djvu xml, as produced by IA's djvu derive; e.g.
 * https://archive.org/download/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml
 *
 * Only WORDs are guaranteed to carry coords, so the enclosing LINE/PARAGRAPH
 * boxes are usually derived from them.
 */

export class DjVuXMLWord extends OCRWord {
  get text() {
    return this.el.textContent;
  }

  /** @override */
  _readBox() {
    return readCoords(this.el);
  }
}

export class DjVuXMLLine extends OCRLine {
  /** @override */
  _readWords() {
    return Array.from(this.el.querySelectorAll('WORD'), el => new DjVuXMLWord(el));
  }

  /** @override */
  _readBox() {
    return readCoords(this.el);
  }
}

export class DjVuXMLParagraph extends OCRParagraph {
  /** @override */
  _readLines() {
    return Array.from(this.el.querySelectorAll('LINE'), el => new DjVuXMLLine(el));
  }

  /** @override */
  _readBox() {
    return readCoords(this.el);
  }
}

export class DjVuXMLPage extends OCRPage {
  /** @override */
  _readParagraphs() {
    return Array.from(this.el.querySelectorAll('PARAGRAPH'), el => new DjVuXMLParagraph(el));
  }

  /** @override */
  _readBox() {
    return readCoords(this.el);
  }
}

export class DjVuXMLBook extends OCRBook {
  /** @override */
  static parse(rawResponse) {
    const doc = new DOMParser().parseFromString(rawResponse, 'text/xml');
    if (doc.querySelector('parsererror')) {
      throw new Error('Unable to parse djvu xml');
    }
    return new DjVuXMLBook(Array.from(doc.querySelectorAll('OBJECT'), el => new DjVuXMLPage(el)));
  }
}

/**
 * @param {Element} el
 * @returns {Rect | null}
 */
function readCoords(el) {
  const coords = el.getAttribute('coords');
  if (!coords) return null;
  // Some books have a 5th coordinate (the baseline); ignore it.
  const [left, bottom, right, top] = coords.split(',').map(parseFloat);
  return Rect.fromEdges(left, top, right, bottom);
}
