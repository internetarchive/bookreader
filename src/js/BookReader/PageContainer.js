// @ts-check
/** @typedef {import('./BookModel.js').PageModel} PageModel */
/** @typedef {import('./ImageCache.js').ImageCache} ImageCache */


export class PageContainer {
  /**
   * @param {PageModel} page
   * @param {object} opts
   * @param {boolean} opts.isProtected Whether we're in a protected book
   * @param {ImageCache} opts.imageCache
   * @param {string} opts.loadingImage
   */
  constructor(page, {isProtected, imageCache, loadingImage}) {
    this.page = page;
    this.imageCache = imageCache;
    this.loadingImage = loadingImage;
    this.$container = $('<div />', {
      'class': `BRpagecontainer ${page ? `pagediv${page.index}` : 'BRemptypage'}`,
      css: { position: 'absolute' },
    }).attr('data-side', page?.pageSide);

    if (isProtected) {
      this.$container.append($('<div class="BRscreen" />'));
      this.$container.addClass('protected');
    }

    /** @type {JQuery<HTMLImageElement>} The main book page image */
    this.$img = null;
  }

  /**
   * @param {object} param0
   * @param {{ width: number, height: number, top: number, left: number }} [param0.dimensions]
   * @param {number} param0.reduce
   */
  update({dimensions = null, reduce = null}) {
    if (dimensions) {
      this.$container.css(dimensions);
    }

    if (reduce == null || !this.page) {
      return;
    }

    const alreadyLoaded = this.imageCache.imageLoaded(this.page.index, reduce);
    const nextBestLoadedReduce = !alreadyLoaded && this.imageCache.getBestLoadedReduce(this.page.index, reduce);

    // Add the actual, highres image
    this.$img?.remove();
    this.$img = this.imageCache
      .image(this.page.index, reduce)
      .prependTo(this.$container);

    const backgroundLayers = [];
    if (!alreadyLoaded) {
      this.$container.addClass('BRpageloading');
      backgroundLayers.push(`url("${this.loadingImage}") center/20px no-repeat`);
    }
    if (nextBestLoadedReduce) {
      backgroundLayers.push(`url("${this.page.getURI(nextBestLoadedReduce, 0)}") center/100% no-repeat`);
    }

    if (!alreadyLoaded) {
      this.$img
        .css('background', backgroundLayers.join(','))
        .one('loadend', async (ev) => {
          $(ev.target).css({ 'background': '' })
          $(ev.target).parent().removeClass('BRpageloading');
        });
    }

    return this;
  }
}
