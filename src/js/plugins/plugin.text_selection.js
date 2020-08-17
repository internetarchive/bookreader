//@ts-check
import { isFirefox } from './tts/utils';

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

class TextSelectionPlugin {

  constructor(avoidTspans = isFirefox()) {
    /**@type {PromiseLike<JQuery<HTMLElement>>} */
    this.djvuPagesPromise = null;
    // Using text elements insted of tspans for words because Firefox does not allow svg tspan strech.
    // Tspans are necessary on Chrome because they prevent newline character after every word when coping
    this.svgParagraphElement = "text";
    this.svgWordElement = "tspan";
    if(avoidTspans) {
      this.svgParagraphElement = "g";
      this.svgWordElement = "text";
    }
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
   * Intercept copied text
   * @param {JQuery} $container
   */
  interceptCopy($container) {
    $container.each((i, pageContainer) => {
      pageContainer.addEventListener('copy', (event) => {
        const selection = document.getSelection();
        event.clipboardData.setData('text/plain', selection.toString());
        event.preventDefault();
      });
    });
  }

  /**
   * Deselect all text after clicking elswhere in the BRcontainer
   * @param {JQuery} $container
   */
  deselectOnClick($container) {
    $container.one("mousedown", (event) => {
      if (window.getSelection) window.getSelection().removeAllRanges();
    })
  }

  /**
   * Stops page flipping on short click, allows text selction on longer mousedown
   * @param {JQuery} $container
   */
  stopPageFlip($container) {
    const $svg = $container.find('svg');
    let longPressTimer;
    this.interceptCopy($container);

    $svg.on("mousedown", (event) => {
      if ($(event.target).is(this.svgWordElement)) {
        event.stopPropagation();
        longPressTimer = window.setTimeout(() => {
          $svg.one("mouseup", (event) => {
            event.stopPropagation();
            clearTimeout(longPressTimer);
            this.deselectOnClick($container);
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
    const $svgLayers = $container.find('.textSelectionSVG');
    if ($svgLayers.length) return;
    const XMLpage = await this.getPageText(pageIndex);
    const XMLwidth = $(XMLpage).attr("width");
    const XMLheight = $(XMLpage).attr("height");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("viewBox", `0 0 ${XMLwidth} ${XMLheight}`);
    $container.append(svg);
    svg.setAttribute('class', 'textSelectionSVG');
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
      const paragSvg = document.createElementNS("http://www.w3.org/2000/svg", this.svgParagraphElement);
      paragSvg.setAttribute("class", "BRparagElement");
      const words = $(paragraph).find("WORD");
      let wordHeightMax = 0;

      for(let i = 0; i < words.length; i++) {
        // adding tspan for each word in paragraph
        const currWord = words[i];
        // eslint-disable-next-line no-unused-vars
        const [left, bottom, right, top] = $(currWord).attr("coords").split(',').map(parseFloat);
        const wordHeight = bottom - top;
        if(wordHeight > wordHeightMax) wordHeightMax = wordHeight;

        const wordTspan = document.createElementNS("http://www.w3.org/2000/svg", this.svgWordElement);
        wordTspan.setAttribute("class", "BRwordElement");
        wordTspan.setAttribute("x", left.toString());
        wordTspan.setAttribute("y", bottom.toString());
        wordTspan.setAttribute("textLength", (right - left).toString());
        wordTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
        wordTspan.textContent = currWord.textContent;
        paragSvg.appendChild(wordTspan);

        // adding spaces after words except at the end of the paragraph
        if(i < words.length - 1){
          const nextWord = words[i + 1];
          // eslint-disable-next-line no-unused-vars
          const [leftNext, bottomNext, rightNext, topNext] = $(nextWord).attr("coords").split(',').map(parseFloat);
          const spaceTspan = document.createElementNS("http://www.w3.org/2000/svg", this.svgWordElement);
          spaceTspan.setAttribute("class", "BRwordElement");
          spaceTspan.setAttribute("x", right.toString());
          spaceTspan.setAttribute("y", bottom.toString());
          if((leftNext - right) > 0) spaceTspan.setAttribute("textLength", (leftNext - right).toString());
          spaceTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
          spaceTspan.textContent = " ";
          paragSvg.appendChild(spaceTspan);
        }
      }
      paragSvg.setAttribute("font-size", wordHeightMax.toString());
      // paragSvg.setAttribute("lengthAdjust", "spacingAndGlyphs");
      svg.appendChild(paragSvg);
    })
    this.stopPageFlip($container);
  }
}

class BookreaderWithTextSelection extends BookReader {
  // constructor() {
  //   super();
  // }

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
export default BookreaderWithTextSelection;
