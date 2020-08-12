//@ts-check
const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

class TextSelectionPlugin {

  constructor() {
    /**@type {PromiseLike<JQuery<HTMLElement>>} */
    this.djvuPagesPromise = null;
  }

  /**
   * @param {string} ocaid
   */
  init(ocaid) {
    this.djvuPagesPromise = $.ajax({
      type: "GET",
      url: `https://cors.archive.org/cors/${ocaid}/${ocaid}_djvu.xml`,
      dataType: "xml",

      error: function (e) {
        return undefined;
      }
    }).then(function (xmlMap) {
      if (xmlMap != undefined) {
        return $(xmlMap).find("OBJECT");
      }
    });
  }

  /**
   * @param {number} index
   * @returns {Promise<HTMLElement>}
   */
  async getPageText(index) {
    return (await this.djvuPagesPromise)[index];
  }

  /**
   * Stops page flipping on short click, allows text selction on longer mousedown
   * @param {JQuery} $container
   */
  stopPageFlip($container){
    const $svg = $container.find('svg');
    let longPressTimer;

    $svg.on("mousedown", (event) => {
      if ($(event.target).is('tspan')) {
        event.stopPropagation();
        longPressTimer = window.setTimeout(() => {
          $svg.one("mouseup", (event) => {
            event.stopPropagation();
            clearTimeout(longPressTimer);
          });
        }, 250);
      }
    });
  }

  /**
   * @param {number} pageIndex
   * @param {JQuery} $container
   */
  async createTextLayer(pageIndex, $container) {
    const $svgLayers = $container.find('textSelectionSVG');
    if ($svgLayers.length) return;
    const XMLpage = await this.getPageText(pageIndex);
    const XMLwidth = $(XMLpage).attr("width");
    const XMLheight = $(XMLpage).attr("height");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${XMLwidth} ${XMLheight}`);
    $container.append(svg);
    $(svg).addClass('textSelectionSVG');
    svg.setAttribute('preserveAspectRatio', 'none');
    $(svg).css({
      "width": "100%",
      "position": "absolute",
      "height": "100%",
      "top": "0",
      "left": "0",
    });

    $(XMLpage).find("PARAGRAPH").each((i, paragraph) => {
      // adding text element for each paragraph in the page
      const paragSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const words = $(paragraph).find("WORD");
      let [leftMin, bottomMax, rightMax, topMin] = [Infinity, 0, 0, Infinity];
      let wordHeightMax = 0;

      for(let i = 0; i < words.length; i++) {
        // adding tspan for each word in paragraph
        const currWord = words[i];
        // eslint-disable-next-line no-unused-vars
        const [left, bottom, right, top] = $(currWord).attr("coords").split(',').map(parseFloat);
        const wordHeight = bottomMax - top;
        if(left < leftMin) leftMin = left;
        if(bottom > bottomMax) bottomMax = bottom;
        if(right > rightMax) rightMax = right;
        if(top < topMin) topMin = top;
        if(wordHeight > wordHeightMax) wordHeightMax = wordHeight;

        const wordTspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
        wordTspan.setAttribute("x", left.toString());
        wordTspan.setAttribute("y", bottom.toString());
        wordTspan.setAttribute("textLength", (right - left).toString());
        wordTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
        wordTspan.textContent = currWord.textContent;
        paragSvg.append(wordTspan);

        // adding spaces after words except at the end of the paragraph
        if(i < words.length - 1){
          const nextWord = words[i + 1];
          // eslint-disable-next-line no-unused-vars
          const [leftNext, bottomNext, rightNext, topNext] = $(nextWord).attr("coords").split(',').map(parseFloat);
          const spaceTspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
          spaceTspan.setAttribute("x", right.toString());
          spaceTspan.setAttribute("y", bottom.toString());
          if((leftNext - right) > 0) spaceTspan.setAttribute("textLength", (leftNext - right).toString());
          spaceTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
          spaceTspan.textContent = " ";
          paragSvg.append(spaceTspan);
        }
      }
      paragSvg.setAttribute("font-size", wordHeightMax.toString());
      svg.append(paragSvg);
    })
    this.stopPageFlip($container);
  }
}

class BookreaderWithTextSelection extends BookReader {
  init() {
    if(this.enableTextSelection){
      const OCAID = this.bookId;
      this.textSelectionPlugin = new TextSelectionPlugin();
      this.textSelectionPlugin.init(OCAID);
    }
    super.init();
  }

  /**
   * @param {PageModel} page
   */
  _createPageContainer(page, styles = {}) {
    const $container = super._createPageContainer(page, styles);
    if(this.enableTextSelection){
      this.textSelectionPlugin.createTextLayer(page.index, $container);
    }
    return $container;
  }
}
window.BookReader = BookreaderWithTextSelection;