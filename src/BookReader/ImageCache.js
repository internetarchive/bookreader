// @ts-check
/**
 * Creates an image cache dictionary
 * storing images in `<img>` tags so that
 * BookReader can leverage browser caching
 */
/** @typedef {import("./BookModel").BookModel} BookModel */
/** @typedef {import("./BookModel").PageIndex} PageIndex */
/** @typedef {import("./ReduceSet").ReduceSet} ReduceSet */
/** @typedef {import("./options").BookReaderOptions} BookReaderOptions */

import { Pow2ReduceSet } from "./ReduceSet.js";
import { DEFAULT_OPTIONS } from "./options.js";

export class ImageCache {
  /**
   * @param {BookModel} book
   * @param {object} opts
   * @param {boolean} [opts.useSrcSet]
   * @param {ReduceSet} [opts.reduceSet]
   * @param {BookReaderOptions['renderPageURI']} [opts.renderPageURI]
   */
  constructor(
    book,
    {
      useSrcSet = false,
      reduceSet = Pow2ReduceSet,
      renderPageURI = DEFAULT_OPTIONS.renderPageURI,
    } = {},
  ) {
    /** @type {BookModel} */
    this.book = book;
    /** @type {boolean} */
    this.useSrcSet = useSrcSet;
    /** @type {ReduceSet} */
    this.reduceSet = reduceSet;
    /** @type {BookReaderOptions['renderPageURI']} */
    this.renderPageURI = renderPageURI;

    /** @type {{ [index: number]: { reduce: number, loaded: boolean }[] }} */
    this.cache = {};
    this.defaultScale = 8;
  }

  /**
   * Get an image
   * Checks cache first if image is available & of equal/better scale,
   * if not, a new image gets created
   *
   * @param {PageIndex} index
   * @param {Number} reduce
   * @param {HTMLImageElement?} [img]
   */
  image(index, reduce, img = null) {
    const finalReduce = this.getFinalReduce(index, reduce);
    return this._serveImageElement(index, finalReduce, img);
  }

  /**
   * Get the final reduce factor to use for the given index
   *
   * @param {PageIndex} index
   * @param {Number} reduce
   */
  getFinalReduce(index, reduce) {
    const cachedImages = this.cache[index] || [];
    const sufficientImages = cachedImages
      .filter(x => x.loaded && x.reduce <= reduce);

    if (sufficientImages.length) {
      // Choose the largest reduction factor that meets our needs
      const bestReduce = Math.max(...sufficientImages.map(e => e.reduce));
      // Don't need to floor here, since we know the image is in the cache
      // and hence was already floor'd by the below `else` clause before
      // it was added
      return bestReduce;
    } else {
      // Don't use a cache entry; i.e. a fresh fetch will be made
      // for this reduce
      return this.reduceSet.floor(reduce);
    }
  }

  /**
   * Checks if an image of equal or greater quality has been loaded
   * @param {PageIndex} index
   * @param {Number} reduce
   * @returns {Boolean}
   */
  imageLoaded(index, reduce) {
    const cacheImg = this.cache[index]?.find(e => e.reduce <= reduce);
    return cacheImg?.loaded ?? false;
  }

  /**
   * Get the best image that's already loaded for the given index,
   * trying to choose values less that the given reduce
   * @param {PageIndex} index
   * @param idealMaxReduce
   * @returns {null | number}
   */
  getBestLoadedReduce(index, idealMaxReduce = Infinity) {
    const candidates = this.cache[index]?.filter(x => x.loaded) || [];
    if (!candidates.length) return null;

    const lowerResImages = candidates.filter(e => e.reduce >= idealMaxReduce);
    if (lowerResImages.length) {
      // Choose the highest quality loaded lower res image
      return Math.min(...lowerResImages.map(e => e.reduce));
    }
    // Otherwise choose whatever is closest to the reduce
    const higherRestImages = candidates.filter(e => e.reduce < idealMaxReduce);
    return Math.max(...higherRestImages.map(e => e.reduce));
  }

  /**
   * @private
   * Generates an image element on the fly from image info in cache
   *
   * @param {PageIndex} index
   * @param {number} reduce
   * @param {HTMLImageElement?} [img]
   * @returns {JQuery<HTMLImageElement>} with base image classes
   */
  _serveImageElement(index, reduce, img = null) {
    let cacheEntry = this.cache[index]?.find(e => e.reduce == reduce);
    if (!cacheEntry) {
      cacheEntry = { reduce, loaded: false };
      const entries = this.cache[index] || (this.cache[index] = []);
      entries.push(cacheEntry);
    }
    const page = this.book.getPage(index);

    const uri = page.getURI(reduce, 0);
    const $img = $(img || document.createElement('img'))
      .addClass('BRpageimage')
      .attr('alt', 'Book page image')
      .data('reduce', reduce)
      .data('src', uri);
    this.renderPageURI($img[0], uri);
    if (this.useSrcSet) {
      $img.attr('srcset', page.getURISrcSet(reduce));
    }
    if (!cacheEntry.loaded) {
      $img.one('load', () => cacheEntry.loaded = true);
    }
    return $img;
  }
}
