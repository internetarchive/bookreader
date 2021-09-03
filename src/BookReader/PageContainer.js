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
    this.pdfScale = 0;
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
  }

  /**
   * @param {object} param0
   * @param {{ width: number, height: number, top: number, left: number }} [param0.dimensions]
   * @param {number} param0.reduce
   */
  update({dimensions = null, reduce = null}) {
    if (this.usePDF && this.fetchingPdf) {
      console.log("-- update--- fetching pdf page: ", this.index, this.pdfScale);
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
          $(ev.target).css({ 'background': '' });
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
    const page = await this.pdf?.getPage(this.index + 1);

    const viewport = page.getViewport({scale: 1});

    const desiredWidth = $(this.$container).height();
    const desiredScale = desiredWidth / viewport.width;

    const notIdeal = desiredScale >= this.pdfScale;
    if (!notIdeal) {
      console.log('**exit::: !notIdeal: idx, this.pdfScale, desiredScale ', this.index, this.pdfScale, desiredScale);
      this.fetchingPdf = false;
      return;
    }

    if (!desiredScale) {
      console.log('**exit::: !desiredScale: idx, this.pdfScale, desiredScale ', this.index, this.pdfScale, desiredScale);
      this.fetchingPdf = false;
      return;
    }

    this.pdfScale = desiredScale;

    const scaledViewport = page.getViewport({ scale: this.pdfScale });

    console.log('*!!*draw! idx, scaledViewport, this.pdfScale', this.index, scaledViewport, this.pdfScale);

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


/**
 * @param {PageModel} page
 * @param {string} className
 */
export function createSVGPageLayer(page, className) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("viewBox", `0 0 ${page.width} ${page.height}`);
  svg.setAttribute('class', `BRPageLayer ${className}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  return svg;
}

/**
 * @param {{ l: number, r: number, b: number, t: number }} box
 */
export function boxToSVGRect({ l: left, r: right, b: bottom, t: top }) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", left.toString());
  rect.setAttribute("y", top.toString());
  rect.setAttribute("width", (right - left).toString());
  rect.setAttribute("height", (bottom - top).toString());
  return rect;
}

/**
 * @param {string} layerClass
 * @param {Array<{ l: number, r: number, b: number, t: number }>} boxes
 * @param {PageModel} page
 * @param {HTMLElement} containerEl
 */
export function renderBoxesInPageContainerLayer(layerClass, boxes, page, containerEl) {
  const mountedSvg = containerEl.querySelector(`.${layerClass}`);
  // Create the layer if it's not there
  const svg = mountedSvg || createSVGPageLayer(page, layerClass);
  if (!mountedSvg) {
    // Insert after the image if the image is already loaded.
    const imgEl = containerEl.querySelector('.BRpageimage');
    if (imgEl) $(svg).insertAfter(imgEl);
    else $(svg).prependTo(containerEl);
  }
  boxes.forEach(box => svg.appendChild(boxToSVGRect(box)));
}
