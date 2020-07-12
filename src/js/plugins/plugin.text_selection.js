const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);
let XMLpageArr = undefined;

class BookreaderWithTextSelection extends BookReader {
  init() {
    console.log("initializing text-selection");
    const OCAID = this.bookId;
    $.ajax({
      type: "GET",
      url: `https://cors.archive.org/cors/${OCAID}/${OCAID}_djvu.xml`,
      dataType: "xml",
      async: false,

      error: function (e) {
        console.log("XML reading Failed: ", e);
        return undefined;
      },

      success: function (response) {
        const xmlMap = response;

        if (xmlMap != undefined) {
          console.log("get xml succesful");
          XMLpageArr = $(xmlMap).find("OBJECT");
          console.log("xml page array created");
          // this.checkTextLayer(page1);
        }
      }
    });
    super.init();

  }

  /**
  * @param {PageModel} page
  */
  _createPageContainer(page, styles = {}) {
    console.log(`Created Page ${page.index}`);
    const $container = super._createPageContainer(page, styles);
    this.createTextLayer(page, $container);
    return $container;
  }
}
window.BookReader = BookreaderWithTextSelection;

BookreaderWithTextSelection.prototype.createTextLayer = function (page, $container){
  const $svgLayers = $container.find('textSelctionSVG');
  if (!$svgLayers.length){
    console.log(`created svg layer for page ${page.index}`)
    const XMLpage = XMLpageArr[page.index];
    const XMLwidth = $(XMLpage).attr("width");
    const XMLheight = $(XMLpage).attr("height");

    // const currWidth = $('.BRpagecontainer')[0].width();
    // const scaleFactor = currWidth/XMLwidth;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + XMLwidth + " " + XMLheight);
    $container.append(svg);
    $(svg).addClass('textSelctionSVG')
    $(svg).css({
      "width": "100%",
      "position": "absolute",
      "height": "100%",
      "top": "0",
      "left": "0",
    });


    $(XMLpage).find("WORD").each((i, el) => {
      const [left, bottom, right, top] = $(el).attr("coords").split(',');
      const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
      // svg.setAttribute("height", scaleFactor*(coords[1] - coords[3]));
      // svg.setAttribute("width",  scaleFactor*(coords[2] - coords[0]));
      textSvg.setAttribute("x", left);
      textSvg.setAttribute("y", bottom);
      textSvg.setAttribute("font-size", bottom - top);

      // const xmlDPI = 500;
      // const currentDPI = window.devicePixelRatio*96;
      // console.log(currentDPI)
      // const scaleFactor = currentDPI/xmlDPI;
      // console.log(scaleFactor);

      $(textSvg).css({
      // "font-size": "50",
        "fill": "red",
      });
      const textNode = document.createTextNode(el.textContent);
      textSvg.append(textNode);
      svg.append(textSvg);
    })
  }
}
