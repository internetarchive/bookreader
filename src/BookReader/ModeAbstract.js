// @ts-check
/** @typedef {import('../BookReader.js').default} BookReader */
/** @typedef {import('./BookModel.js').BookModel} BookModel */
/** @typedef {import('./BookModel.js').PageIndex} PageIndex */
/** @typedef {import('./BookModel.js').PageModel} PageModel */

/**
 * @abstract
 */
export class ModeAbstract {
  /** @type {BookReader} */
  br;

  /** @type {BookModel} */
  book;

  /** @type {HTMLElement} */
  get scrollContainer() {
    throw new Error('Not implemented');
  }

  /**
   * Get the page at the given index or direction
   * @param {PageIndex | 'left' | 'right' | 'next' | 'prev'} indexOrDirection
   * @return {PageModel | undefined}
   */
  parsePageSpecifier(indexOrDirection) {
    const isRTL = this.book.pageProgression == 'rl';
    switch (indexOrDirection) {
    case 'left':
      return isRTL ? this.parsePageSpecifier('next') : this.parsePageSpecifier('prev');
    case 'right':
      return isRTL ? this.parsePageSpecifier('prev') : this.parsePageSpecifier('next');
    case 'next':
      if (this.br.firstIndex < this.book.getNumLeafs() - 1) {
        return this.book.getPage(this.br.firstIndex + 1);
      }
      return undefined;
    case 'prev':
      if (this.br.firstIndex >= 1) {
        return this.book.getPage(this.br.firstIndex - 1);
      }
      return undefined;
    default:
      return this.book.getPage(indexOrDirection);
    }
  }
}
