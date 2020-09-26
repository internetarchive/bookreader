//@ts-check
import { isFirefox, isSafari } from '../../util/browserSniffing.js';

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

export class TextSelectionPlugin {

  constructor(avoidTspans = isFirefox(), pointerEventsOnParagraph = isSafari()) {
    /**@type {PromiseLike<JQuery<HTMLElement>|undefined>} */
    this.djvuPagesPromise = null;
    // Using text elements insted of tspans for words because Firefox does not allow svg tspan strech.
    // Tspans are necessary on Chrome because they prevent newline character after every word when copying
    this.svgParagraphElement = "text";
    this.svgWordElement = "tspan";
    this.insertNewlines = avoidTspans
    // Safari has a bug where `pointer-events` doesn't work on `<tspans>`. So
    // there we will set `pointer-events: all` on the paragraph element. We don't
    // do this everywhere, because it's a worse experience. Thanks Safari :/
    this.pointerEventsOnParagraph = pointerEventsOnParagraph;
    if (avoidTspans) {
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
    }).then(xmlMap  => xmlMap && $(xmlMap).find("OBJECT"));
  }

  /**
   * @param {number} index
   * @returns {Promise<HTMLElement|undefined>}
   */
  async getPageText(index) {
    const XMLpagesArr = await this.djvuPagesPromise;
    if (XMLpagesArr) return XMLpagesArr[index];
  }

  /**
   * Intercept copied text to remove any styling applied to it
   * @param {JQuery} $container
   */
  interceptCopy($container) {
    $container[0].addEventListener('copy', (event) => {
      const selection = document.getSelection();
      event.clipboardData.setData('text/plain', selection.toString());
      event.preventDefault();
    });
  }

  /**
   * Applies mouse events when in default mode
   * @param {SVGElement} svg
   */
  defaultMode(svg) {
    svg.classList.remove("selectingSVG");
    $(svg).on("mousedown.textSelectPluginHandler", (event) => {
      if (!$(event.target).is(".BRwordElement")) return;
      event.stopPropagation();
      svg.classList.add("selectingSVG");
      $(svg).one("mouseup.textSelectPluginHandler", (event) => {
        if (window.getSelection().toString() != "") {
          event.stopPropagation();
          $(svg).off(".textSelectPluginHandler");
          this.textSelectingMode(svg);
        }
        else svg.classList.remove("selectingSVG");
      })
    })
  }

  /**
   * Applies mouse events when in textSelecting mode
   * @param {SVGElement} svg
   */
  textSelectingMode(svg) {
    $(svg).on('mousedown.textSelectPluginHandler', (event) => {
      if (!$(event.target).is(".BRwordElement")) {
        if (window.getSelection().toString() != "") window.getSelection().removeAllRanges();
      }
      event.stopPropagation();
    })
    $(svg).on('mouseup.textSelectPluginHandler', (event) => {
      event.stopPropagation();
      if (window.getSelection().toString() == "") {
        $(svg).off(".textSelectPluginHandler");
        this.defaultMode(svg);      }
    })
  }

  /**
   * Initializes text selection modes if there is an svg on the page
   * @param {JQuery} $container
   */
  stopPageFlip($container) {
    /** @type {JQuery<SVGElement>} */
    const $svg = $container.find('svg.textSelectionSVG');
    if (!$svg.length) return;
    $svg.each((i, s) => this.defaultMode(s))
    this.interceptCopy($container);
  }

  /**
   * @param {number} pageIndex
   * @param {JQuery} $container
   */
  async createTextLayer(pageIndex, $container) {
    const $svgLayers = $container.find('.textSelectionSVG');
    if ($svgLayers.length) return;
    const XMLpage = await this.getPageText(pageIndex);
    if (!XMLpage) return;
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
      // Adding text element for each paragraph in the page
      const words = $(paragraph).find("WORD");
      if (!words.length) return;
      const paragSvg = document.createElementNS("http://www.w3.org/2000/svg", this.svgParagraphElement);
      paragSvg.setAttribute("class", "BRparagElement");
      if (this.pointerEventsOnParagraph) {
        paragSvg.style.pointerEvents = "all";
      }

      const wordHeightArr = [];

      for (let i = 0; i < words.length; i++) {
        // Adding tspan for each word in paragraph
        const currWord = words[i];
        // eslint-disable-next-line no-unused-vars
        const [left, bottom, right, top] = $(currWord).attr("coords").split(',').map(parseFloat);
        const wordHeight = bottom - top;
        wordHeightArr.push(wordHeight);

        const wordTspan = document.createElementNS("http://www.w3.org/2000/svg", this.svgWordElement);
        wordTspan.setAttribute("class", "BRwordElement");
        wordTspan.setAttribute("x", left.toString());
        wordTspan.setAttribute("y", bottom.toString());
        wordTspan.setAttribute("textLength", (right - left).toString());
        wordTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
        wordTspan.textContent = currWord.textContent;
        paragSvg.appendChild(wordTspan);

        // Adding spaces after words except at the end of the paragraph
        // TODO: assumes left-to-right text
        if (i < words.length - 1){
          const nextWord = words[i + 1];
          // eslint-disable-next-line no-unused-vars
          const [leftNext, bottomNext, rightNext, topNext] = $(nextWord).attr("coords").split(',').map(parseFloat);
          const spaceTspan = document.createElementNS("http://www.w3.org/2000/svg", this.svgWordElement);
          spaceTspan.setAttribute("class", "BRwordElement");
          spaceTspan.setAttribute("x", right.toString());
          spaceTspan.setAttribute("y", bottom.toString());
          if ((leftNext - right) > 0) spaceTspan.setAttribute("textLength", (leftNext - right).toString());
          spaceTspan.setAttribute("lengthAdjust", "spacingAndGlyphs");
          spaceTspan.textContent = " ";
          paragSvg.appendChild(spaceTspan);
        }

        // Adds newline at the end of paragraph on Firefox
        if ((i ==  words.length - 1 && (this.insertNewlines))) {
          paragSvg.appendChild(document.createTextNode("\n"));
        }
      }

      wordHeightArr.sort();
      const paragWordHeight = wordHeightArr[Math.floor(wordHeightArr.length * 0.85)];
      paragSvg.setAttribute("font-size", paragWordHeight.toString());
      svg.appendChild(paragSvg);
    })
    this.stopPageFlip($container);
  }
}

export class BookreaderWithTextSelection extends BookReader {
  init() {
    if (this.enableTextSelection){
      this.textSelectionPlugin = new TextSelectionPlugin();
      this.textSelectionPlugin.init(this.bookId);
    }
    super.init();
  }

  /**
   * @param {number} index
   */
  _createPageContainer(index, styles = {}) {
    const $container = super._createPageContainer(index, styles);
    // Disable if thumb mode; it's too janky
    if (this.enableTextSelection && this.mode != this.constModeThumb){
      this.textSelectionPlugin.createTextLayer(index, $container);
    }
    return $container;
  }
}
window.BookReader = BookreaderWithTextSelection;
export default BookreaderWithTextSelection;
