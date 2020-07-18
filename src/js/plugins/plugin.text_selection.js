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
    console.log("initializing text-selection");
    this.djvuPagesPromise = $.ajax({
      type: "GET",
      url: `https://cors.archive.org/cors/${ocaid}/${ocaid}_djvu.xml`,
      dataType: "xml",

      error: function (e) {
        console.log("XML reading Failed: ", e);
        return undefined;
      }
    }).then(function (response) {
      const xmlMap = response;

      if (xmlMap != undefined) {
        console.log("get xml succesful");
        console.log("xml page array created");
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
   * @param {number} pageIndex
   * @param {JQuery} $container
   */
  async createTextLayer(pageIndex, $container) {
    const $svgLayers = $container.find('textSelctionSVG');
    if (!$svgLayers.length){
      console.log(`created svg layer for page ${pageIndex}`)
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


      $(XMLpage).find("WORD").each((i, el) => {
        // eslint-disable-next-line no-unused-vars
        const [left, bottom, right, top] = $(el).attr("coords").split(',').map(parseFloat);
        const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textSvg.setAttribute("x", left.toString());
        textSvg.setAttribute("y", bottom.toString());
        textSvg.setAttribute("font-size", (bottom - top).toString());
        textSvg.setAttribute("textLength", (right - left).toString());


        $(textSvg).css({
          "fill": "red",
          "cursor": "text",
        });
        const textNode = document.createTextNode(el.textContent);
        textSvg.append(textNode);
        svg.append(textSvg);
      })
    }
  }
}

class BookreaderWithTextSelection extends BookReader {
  init() {
    const OCAID = this.bookId;
    this.textSelectionPlugin = new TextSelectionPlugin();
    this.textSelectionPlugin.init(OCAID);
    super.init();
  }

  /**
   * @param {PageModel} page
   */
  _createPageContainer(page, styles = {}) {
    console.log(`Created Page ${page.index}`);
    const $container = super._createPageContainer(page, styles);
    this.textSelectionPlugin.createTextLayer(page.index, $container);
    return $container;
  }
}
window.BookReader = BookreaderWithTextSelection;