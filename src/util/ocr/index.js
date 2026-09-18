// @ts-check
import { DjVuXMLBook } from './DjVuXML.js';
import { HOCRBook } from './hOCR.js';

/** @typedef {'DjVuXML' | 'hOCR'} OCRFormat */

/** @type {Record<OCRFormat, typeof import('./OCR.js').OCRBook>} */
export const OCR_BOOK_CLASSES = {
  DjVuXML: DjVuXMLBook,
  hOCR: HOCRBook,
};

/**
 * @param {OCRFormat} format
 * @param {string} rawResponse
 * @returns {import('./OCR.js').OCRBook}
 */
export function parseOCRBook(format, rawResponse) {
  const bookClass = OCR_BOOK_CLASSES[format];
  if (!bookClass) throw new Error(`Unsupported OCR format: ${format}`);
  return bookClass.parse(rawResponse);
}
