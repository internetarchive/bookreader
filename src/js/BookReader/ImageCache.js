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
    this.maxCache = this.br.maxImageCache || 100;

    this.createImage = this._createImage.bind(this);
    this.image = this.image.bind(this);
  }

  /**
   * Get an image
   * Checks cache first if image is available & of equal/better scale,
   * if not, a new image gets created
   *
   * @param {String|Number} index - page index
   * @param {Number} reduce
   * @returns $image
   */
  image(index, reduce) {
    const $thisImage = this.cache[index];
    const currImageScale = $thisImage?.reduce;
    console.log("IMAGE CACHE ----- `image` - index, currImageScale, reduce", index, currImageScale, reduce);
    if (currImageScale <= reduce) {
      console.log("Image -- curr good enough reduce, index", reduce, index);
      return $thisImage;
    }

    return this._createImage(index, reduce);
  }


  /**
   * @private
   * Removes image from cache
   * Empties `src` & `srcSet` attributes prior to cancel pending requests
   *
   * @param {String|Number} index - page index
   */
  _bustImageCache(index) {
    const $thisImage = this.cache[index];
    // allows browser to abort a pending request

    $($thisImage).attr('src', '').attr('srcSet', []);
    delete this.cache[index];
  }

  /**
   * @private
   * Creates an image & stashes in cache
   *  Will bust cache iff
   *
   * @param {String|Number} index - page index
   * @param {Number} reduce
   * @returns $image
   */
  _createImage(index, reduce) {
    const hasCache = this.cache[index];
    if (hasCache) {
      console.log("Image --- bust cache - index, ", index);
      this._bustImageCache(index);
    }

    // Q: where/when do we delete an image?

    const src = this.br._getPageURI(index, reduce);
    const srcSet = this.br.options.useSrcSet ? this.br._getPageURISrcset(index, reduce) : [];
    const $img = $('<img />', {
      'class': 'BRpageimage',
      'alt': 'Book page image',
      src,
      srcSet
    }).data('reduce', reduce);

    this.cache[index] = { ...$img, reduce, uri: src };
    console.log("Image --- create, reduce", reduce, this.cache[index]);

    return this.cache[index];
  }
}
