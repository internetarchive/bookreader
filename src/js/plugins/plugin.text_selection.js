BookReader.prototype.textSelection = function () {
  console.log("initializing text-selection");

  $.ajax({
    type: "GET",
    // url: "https://ia803103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml",
    url: "./goodytwoshoes00newyiala_djvu.xml",
    dataType: "xml",

    error: function (e) {
      console.log("XML reading Failed: ", e);
      return undefined;
    },

    success: function (response) {
      const xmlMap = response;

      if (xmlMap != undefined) {
        console.log("get xml succesful");
        const page1 = $(xmlMap).find("OBJECT")[1];
        console.log("page found");
        const XMLwidth = $(page1).attr("width");
        const XMLheight = $(page1).attr("height");

        // const currWidth = $('.BRpagecontainer')[0].width();
        // const scaleFactor = currWidth/XMLwidth;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 " + XMLwidth + " " + XMLheight);
        $('.BRpagecontainer')[0].append(svg);
        $(svg).css({
          "width": "100%",
          "position": "absolute",
          "height": "100%",
          "top": "0",
          "left": "0",
        });


        $(page1).find("WORD").each((i, el) => {
          const [left, bottom, right, top] = $(el).attr("coords").split(',');
          const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
          // svg.setAttribute("height", scaleFactor*(coords[1] - coords[3]));
          // svg.setAttribute("width",  scaleFactor*(coords[2] - coords[0]));
          textSvg.setAttribute("x", left);
          textSvg.setAttribute("y", bottom);
          // const xmlDPI = 500;
          // const currentDPI = window.devicePixelRatio*96;
          // console.log(currentDPI)
          // const scaleFactor = currentDPI/xmlDPI;
          // console.log(scaleFactor);

          $(textSvg).css({
            "font-size": "50",
            "fill": "red",
          });
          const textNode = document.createTextNode(el.textContent);
          textSvg.append(textNode);
          svg.append(textSvg);
        })
      }
    }
  });
}