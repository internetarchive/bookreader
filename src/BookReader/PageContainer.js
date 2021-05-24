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
   * @param {boolean} opts.usePDF
   * @param {array} opts.pdfSources
   * @param {number} opts.index
   */
  constructor(page, {pdfJSInstance, isProtected, imageCache, loadingImage, usePDF = false, pdfSources = [], index}) {
    this.page = page;
    this.imageCache = imageCache;
    this.loadingImage = loadingImage;
    this.usePDF = usePDF;
    this.pdfSources = pdfSources;
    this.index = index;
    this.pdf = pdfJSInstance;
    this.$container = $('<div />', {
      'class': `BRpagecontainer ${page ? `pagediv${page.index}` : 'BRemptypage'}`,
      css: { position: 'absolute' },
    }).attr('data-side', page?.pageSide);

    if (isProtected) {
      this.$container.append($('<div class="BRscreen" />'));
      this.$container.addClass('protected');
    }

    if (usePDF) {
      const pageCanvas = $('<canvas />', {
        id: `pdf-canvas-${page.index}`
      })
      this.canvas = pageCanvas;
      this.$container.append(pageCanvas);
    }

    /** @type {JQuery<HTMLImageElement>} The main book page image */
    this.$img = null;
    console.log("container", this.index, this.page);
  }

  /**
   * @param {object} param0
   * @param {{ width: number, height: number, top: number, left: number }} [param0.dimensions]
   * @param {number} param0.reduce
   */
  update({dimensions = null, reduce = null}) {
    if (this.usePDF && this.fetchingPdf) {
      console.log("-- update--- fetching pdf page: ", this.index);
      return;
    }

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

    if (this.usePDF) {
      this.drawPDFpage(reduce, dimensions);
    }

    return this;
  }

  async drawPDFpage(scalez = 1, dimensions) {
    if (this.fetchingPdf) {
      console.log("fetching pdf page: ", this.index);
      return;
    }
    this.fetchingPdf = true;
    console.log('****** drawPDFpage', this.index, this.pdf);
    if (!this.index || !this.pdf?.getPage) {
      return;
    }
    // Load information from the first page.
    const page = await this.pdf?.getPage(this.index);
    const viewport = page.getViewport({scale: 1});

    const desiredWidth = $(this.$container).height();
    this.pdfScale = desiredWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale: this.pdfScale });
    console.log("page, scaledViewport, desiredWidth", this.index, page, scaledViewport, desiredWidth);

    // Apply page dimensions to the <canvas> element.
    const thisCanvas = this.canvas[0];
    const context = thisCanvas.getContext("2d");
    thisCanvas.height = scaledViewport.height;
    thisCanvas.width = scaledViewport.width;
    context.clearRect(0, 0, thisCanvas.width, thisCanvas.height);

    // Render the page into the <canvas> element.
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    await page.render(renderContext);
    console.log("Page rendered!");
    this.fetchingPdf = false;
  }
}
