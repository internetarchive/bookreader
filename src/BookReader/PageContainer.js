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

    // Create high res image
    const newImageURI = this.page.getURI(this.imageCache.getFinalReduce(this.page.index, reduce), 0);

    // Avoid removing/re-adding the image if it's already there
    // This can be called quite a bit, so we need to be fast
    if (this.$img?.data('src') == newImageURI) {
      return this;
    }

    const $newImg = this.imageCache.image(this.page.index, reduce);
    this.$img?.remove();
    this.$img = $newImg.prependTo(this.$container);

    const backgroundLayers = [];
    if (!alreadyLoaded) {
      this.$container.addClass('BRpageloading');
      backgroundLayers.push(`url("${this.loadingImage}") center/20px no-repeat`);
    }
    if (nextBestLoadedReduce) {
      backgroundLayers.push(`url("${this.page.getURI(nextBestLoadedReduce, 0)}") center/100% 100% no-repeat`);
    }

    if (!alreadyLoaded) {
      this.$img
        .css('background', backgroundLayers.join(','))
        .one('loadend', async (ev) => {
          $(ev.target).css({ 'background': '' });
          $(ev.target).parent().removeClass('BRpageloading');
        });
    }

    return this;
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
 * @param {PageModel} page
 * @param {string} className
 */
export function createDIVPageLayer(page, className) {
  const div = document.createElement("div");
  div.style.width = `${page.width}px`;
  div.style.height = `${page.height}px`;
  div.setAttribute('class', `BRPageLayer ${className}`);
  return div;
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

  // Some style; corner radius 4px. Can't set this in CSS yet
  rect.setAttribute("rx", "4");
  rect.setAttribute("ry", "4");
  return rect;
}

/**
 * @param {string} layerClass
 * @param {Array<{ l: number, r: number, b: number, t: number }>} boxes
 * @param {PageModel} page
 * @param {HTMLElement} containerEl
 * @param {string[]} [rectClasses] CSS classes to add to the rects
 */
export function renderBoxesInPageContainerLayer(layerClass, boxes, page, containerEl, rectClasses = null) {
  const mountedSvg = containerEl.querySelector(`.${layerClass}`);
  // Create the layer if it's not there
  const svg = mountedSvg || createSVGPageLayer(page, layerClass);
  if (!mountedSvg) {
    // Insert after the image if the image is already loaded.
    const imgEl = containerEl.querySelector('.BRpageimage');
    if (imgEl) $(svg).insertAfter(imgEl);
    else $(svg).prependTo(containerEl);
  }

  for (const [i, box] of boxes.entries()) {
    const rect = boxToSVGRect(box);
    if (rectClasses) {
      rect.setAttribute('class', rectClasses[i]);
    }
    svg.appendChild(rect);
  }
}
