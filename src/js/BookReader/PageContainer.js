// @ts-check
/** @typedef {import('./BookModel.js').PageModel} PageModel */
/** @typedef {import('./ImageCache.js').ImageCache} ImageCache */


export class PageContainer {
  /**
   * @param {PageModel} page
   * @param {object} opts
   * @param {boolean} opts.isProtected Whether we're in a protected book
   * @param {boolean} opts.useSrcSet
   * @param {ImageCache} opts.imageCache
   */
  constructor(page, {isProtected, useSrcSet, imageCache}) {
    this.page = page;
    this.useSrcSet = useSrcSet;
    this.imageCache = imageCache;
    this.$container = $('<div />', {
      'class': `BRpagecontainer pagediv${page.index}`,
      css: { position: 'absolute' },
    })
      .attr('data-side', page.pageSide);

    if (isProtected) {
      this.$container.append($('<div class="BRscreen" />'));
      this.$container.addClass('protected');
    }

    /** @type {JQuery<HTMLImageElement>} The main book page image */
    this.$primaryImg = null;
    /**
     * @type {JQuery<HTMLImageElement>}
     * The image at the previous resolution; shown underneath as the
     * new image is loading.
     */
    this.$exitingImg = null;
  }

  /**
   * @param {object} param0
   * @param {{ width: number, height: number, top: number, left: number }} [param0.dimensions]
   * @param {number} param0.reduce
   */
  update({dimensions = null, reduce = null}) {
    if (dimensions) this.$container.css(dimensions);
    const alreadyLoaded = this.imageCache.imageLoaded(this.page.index, reduce);

    this.$exitingImg?.remove();
    // Any image loaded we can display while loading the correct res?
    if (!alreadyLoaded) {
      const nextBestLoadedReduce = this.imageCache.getBestLoadedReduce(this.page.index, reduce);
      if (nextBestLoadedReduce !== null) {
        this.$exitingImg = this.imageCache
          .image(this.page.index, nextBestLoadedReduce)
          .appendTo(this.$container);
      }
    }

    // Add the actual, highres image
    this.$primaryImg?.remove();
    this.$primaryImg = this.imageCache
      .image(this.page.index, reduce)
      .appendTo(this.$container);
    if (this.$exitingImg) {
      this.$primaryImg.attr('alt', '');
    }
    if (!alreadyLoaded) {
      this.$primaryImg.one('loadend', async () => {
        this.$primaryImg.attr('alt', 'Book page image');
        this.$exitingImg?.remove();
      });
    }

    return this;
  }
}
