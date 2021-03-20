/**
 * Creates an image cache dictionary
 * storing images in `<img>` tags so that
 * BookReader can leverage browser caching
 */
export class ImageCache {
  constructor(br) {
    this.br = br;
    this.cache = {};
    this.defaultScale = 8;
  }

  /**
   * Get an image
   * Checks cache first if image is available & of equal/better scale,
   * if not, a new image gets created
   *
   * @param {String|Number} index - page index
   * @param {Number} reduce
   * @returns {Element} $image
   */
  image(index, reduce) {
    const $thisImage = this.cache[index];
    const currImageScale = $thisImage?.reduce;
    if (currImageScale <= reduce) {
      return this._serveImageElement(index);
    }

    return this._createImage(index, reduce);
  }

  /**
   * Checks if image has been loaded
   * @param {String|Number} index - page index
   * @param {Number} reduce
   * @returns {Boolean}
   */
  imageLoaded(index, reduce) {
    const cacheImg = this.cache[index];
    if (!cacheImg) {
      return false;
    }
    const { reduce: cachedReduce, loaded } = cacheImg;
    const cacheImgReducedWellEnough = cachedReduce <= reduce;
    return cacheImgReducedWellEnough && loaded;
  }

  /**
   * @private
   * Removes image from cache
   * Empties `src` & `srcSet` attributes prior to cancel pending requests
   *
   * @param {String|Number} index - page index
   */
  _bustImageCache(index) {
    delete this.cache[index];
  }

  /**
   * @private
   * Creates an image & stashes in cache
   * - Use only to create an image as it will
   *    bust cache if requested index has one stashed
   *
   * @param {String|Number} index - page index
   * @param {Number} reduce
   * @returns $image
   */
  _createImage(index, reduce) {
    const hasCache = this.cache[index];
    if (hasCache) {
      this._bustImageCache(index);
    }
    const src = this.br._getPageURI(index, reduce);
    const srcSet = this.br.options.useSrcSet ? this.br._getPageURISrcset(index, reduce) : [];
    this.cache[index] = { reduce, uri: src, srcSet, loaded: false }
    return this._serveImageElement(index);
  }

  /**
   * @private
   * Generates an image element on the fly from image info in cache
   *
   * @param {String|Number} index - page index
   * @returns {Element} jQuery <img> element with base image classes
   */
  _serveImageElement(index) {
    const { uri, srcSet, reduce } = this.cache[index];

    const $img = $('<img />',{
      'class': 'BRpageimage',
      'alt': 'Book page image',
      src: uri,
      srcSet
    })
      .attr('style', '')
      .data('reduce', reduce)
      .load(() => this.cache[index].loaded = true);
    return $img;
  }
}
