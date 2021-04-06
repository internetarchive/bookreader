// @ts-check
/**
 * Creates an image cache dictionary
 * storing images in `<img>` tags so that
 * BookReader can leverage browser caching
 */
/** @typedef {import("./BookModel").BookModel} BookModel */
/** @typedef {import("./BookModel").PageIndex} PageIndex */
/** @typedef {import("./ReduceSet").ReduceSet} ReduceSet */

import { Pow2ReduceSet } from "./ReduceSet";

export class ImageCache {
  /**
   * @param {BookModel} book
   * @param {object} opts
   * @param {boolean} [opts.useSrcSet]
   * @param {ReduceSet} [opts.reduceSet]
   */
  constructor(book, { useSrcSet = false, reduceSet = Pow2ReduceSet } = {}) {
    this.book = book;
    this.useSrcSet = useSrcSet;
    this.reduceSet = reduceSet;
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
   */
  image(index, reduce) {
    const cachedImages = this.cache[index] || [];
    const sufficientImages = cachedImages
      .filter(x => x.loaded && x.reduce <= reduce);
    if (sufficientImages.length) {
      // Choose the largest reduction factor that meets our needs
      const bestReduce = Math.max(...sufficientImages.map(e => e.reduce));
      return this._serveImageElement(index, bestReduce);
    } else {
      // Don't use a cache entry; i.e. a fresh fetch will be made
      // for this reduce
      return this._serveImageElement(index, reduce);
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
   * @returns {JQuery<HTMLImageElement>} with base image classes
   */
  _serveImageElement(index, reduce) {
    const validReduce = this.reduceSet.floor(reduce);
    let cacheEntry = this.cache[index]?.find(e => e.reduce == validReduce);
    if (!cacheEntry) {
      cacheEntry = { reduce: validReduce, loaded: false };
      const entries = this.cache[index] || (this.cache[index] = []);
      entries.push(cacheEntry);
    }
    const page = this.book.getPage(index);

    const $img = $('<img />', {
      'class': 'BRpageimage',
      'alt': 'Book page image',
      src: page.getURI(validReduce, 0),
    })
      .data('reduce', validReduce);
    if (this.useSrcSet) {
      $img.attr('srcset', page.getURISrcSet(validReduce));
    }
    if (!cacheEntry.loaded) {
      $img.one('load', () => cacheEntry.loaded = true);
    }
    return $img;
  }
}
