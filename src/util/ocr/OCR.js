// @ts-check
import { Rect } from '../rect.js';

/**
 * Format-agnostic model of a book's OCR text.
 *
 * Callers (e.g. the text selection plugin) walk
 * OCRBook -> OCRPage -> OCRParagraph -> OCRLine -> OCRWord without needing to
 * know whether the underlying markup is djvu xml or hOCR; see DjVuXML.js and
 * hOCR.js for the per-format implementations.
 */

/**
 * Common base for the OCR objects, each backed by a single element of the
 * source markup.
 *
 * Children are read from the markup once and memoized, so that the same
 * object is handed out every time; callers rely on that both for identity
 * (e.g. "is this the paragraph's last line?") and to see edits they make to a
 * word's box.
 * @abstract
 */
export class OCRElement {
  /** @param {Element} el */
  constructor(el) {
    this.el = el;
  }

  /**
   * The box this element declares in the markup, or null if it declares none
   * and it should instead be derived from the element's contents.
   * @protected
   * @returns {Rect | null}
   */
  _readBox() {
    return null;
  }
}

/** A single word, with its text and position on the page. */
export class OCRWord extends OCRElement {
  /**
   * Raw text of the word, including any surrounding whitespace the OCR
   * happened to include inside it.
   * @abstract
   * @returns {string}
   */
  get text() {
    throw new Error('Not implemented');
  }

  /** @returns {Rect} */
  get box() {
    return this._box ??= this._readBox();
  }

  /** @param {Rect} box */
  set box(box) {
    this._box = box;
  }
}

/** A line of words. */
export class OCRLine extends OCRElement {
  /**
   * @abstract
   * @protected
   * @returns {OCRWord[]}
   */
  _readWords() {
    throw new Error('Not implemented');
  }

  /** @returns {OCRWord[]} */
  get words() {
    return this._words ??= this._readWords().filter(hasUsableBox);
  }

  get firstWord() { return this.words[0]; }
  get lastWord() { return this.words[this.words.length - 1]; }

  /** @returns {Rect} */
  get box() {
    return this._box ??= this._readBox() ?? Rect.bounding(this.words.map(w => w.box));
  }

  get text() {
    return this.words.map(w => w.text.trim()).join(' ');
  }
}

/** A paragraph, containing one or more lines. */
export class OCRParagraph extends OCRElement {
  /**
   * @abstract
   * @protected
   * @returns {OCRLine[]}
   */
  _readLines() {
    throw new Error('Not implemented');
  }

  /** @returns {OCRLine[]} */
  get lines() {
    return this._lines ??= this._readLines().filter(line => line.words.length);
  }

  /** @returns {OCRWord[]} */
  get words() {
    return this.lines.flatMap(line => line.words);
  }

  /** @returns {Rect} */
  get box() {
    return this._box ??= this._readBox() ?? Rect.bounding(this.lines.map(l => l.box));
  }

  /**
   * Whether this is a running header/footer, as tagged by the OCR pipeline
   * (see BookReaderGetText.py).
   * @returns {boolean}
   */
  get isHeaderFooter() {
    return !!this.el.getAttribute('x-role');
  }
}

/** A single page of OCR text. */
export class OCRPage extends OCRElement {
  /**
   * @abstract
   * @protected
   * @returns {OCRParagraph[]}
   */
  _readParagraphs() {
    throw new Error('Not implemented');
  }

  /** @returns {OCRParagraph[]} */
  get paragraphs() {
    return this._paragraphs ??= this._readParagraphs().filter(p => p.lines.length);
  }

  /** @returns {OCRWord[]} */
  get words() {
    return this.paragraphs.flatMap(p => p.words);
  }

  /** @returns {Rect} */
  get box() {
    return this._box ??= this._readBox() ?? Rect.bounding(this.paragraphs.map(p => p.box));
  }
}

/** A book's OCR text. */
export class OCRBook {
  /** @param {OCRPage[]} pages */
  constructor(pages) {
    this.pages = pages;
  }

  /**
   * @abstract
   * @param {string} rawResponse Contents of the book's OCR file; may also be a
   * fragment of one containing a single page.
   * @returns {OCRBook}
   */
  static parse(rawResponse) {
    throw new Error('Not implemented');
  }
}

/**
 * Words we can't position get dropped, rather than rendered somewhere wrong.
 * @param {OCRWord} word
 */
function hasUsableBox(word) {
  // Some OCR puts words at 0,0, which renders very oddly; e.g.
  // https://archive.org/details/illustratedbooko00robe/page/n11/mode/2up
  if (!word.box || (word.box.left == 0 && word.box.top == 0)) {
    console.error('Found invalid ocr word coordinates');
    return false;
  }
  return true;
}
