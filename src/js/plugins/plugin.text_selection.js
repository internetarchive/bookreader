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
    }).then(function (response) {
      const xmlMap = response;

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
   * @param {JQuery} $container
   */
  stopPageFlip($container){
    const $svg = $container.find('svg');
    $svg.on("mousedown", (event) => {
      if ($(event.target).is('tspan')) {
        event.stopPropagation();
        $container.one("mouseup", (event) => event.stopPropagation());
      }
    });
  }

  /**
   * @param {JQuery} $container
   */
  hideTextLayer($container) {
    const $svg = $container.find('svg');
    if ($container.hasClass("BRpageFlipping")) {
      $svg.css('display', 'none');
    }
  }

  /**
   * @param {JQuery} $container
   */
  showTextLayer($container) {
    const $svg = $container.find('svg');
    if (!$container.hasClass("BRpageFlipping")) {
      $svg.css('display', 'block');
    }
  }

  /**
   * @param {number} pageIndex
   * @param {JQuery} $container
   */
  async createTextLayer(pageIndex, $container) {
    const $svgLayers = $container.find('textSelctionSVG');
    if (!$svgLayers.length) {
      const XMLpage = await this.getPageText(pageIndex);
      const XMLwidth = $(XMLpage).attr("width");
      const XMLheight = $(XMLpage).attr("height");

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 " + XMLwidth + " " + XMLheight);
      $container.append(svg);
      $(svg).addClass('textSelctionSVG');
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
        const paragArr = $(paragraph).find("WORD");
        let [leftMin, bottomMax, rightMax, topMin] = [Infinity, 0, 0, Infinity];
        let wordHeightMax = 0;

        for(i = 0; i < paragArr.length; i++) {
          // adding tspan for each word in paragraph
          const currWord = paragArr[i];
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
          const textNode = document.createTextNode(currWord.textContent);
          wordTspan.append(textNode);
          paragSvg.append(wordTspan);

          // adding spaces after words except at the end of the paragraph
          if(i < paragArr.length - 1){
            const nextWord = paragArr[i + 1];
            // eslint-disable-next-line no-unused-vars
            const [leftNext, bottomNext, rightNext, topNext] = $(nextWord).attr("coords").split(',').map(parseFloat);
            const spaceTspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            spaceTspan.setAttribute("x", right.toString());
            spaceTspan.setAttribute("y", bottom.toString());
            if((leftNext - right) > 0) spaceTspan.setAttribute("textLength", (leftNext - right).toString());
            spaceTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
            const spaceTextNode = document.createTextNode(" ");
            spaceTspan.append(spaceTextNode);
            paragSvg.append(spaceTspan);
          }
        }
        paragSvg.setAttribute("x", leftMin.toString());
        paragSvg.setAttribute("y", bottomMax.toString());
        paragSvg.setAttribute("font-size", wordHeightMax.toString());
        paragSvg.setAttribute("textLength", (rightMax - leftMin).toString());
        $(paragSvg).css({
          "fill": "red",
          "cursor": "text",
          'white-space': 'pre',
          "fill-opacity": "0",
        });
        svg.append(paragSvg);
      })
      this.stopPageFlip($container);
    }
  }
}

class BookreaderWithTextSelection extends BookReader {
  init() {
    if(this.enableTextSelection){
      this.enableTextSelection = true;
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