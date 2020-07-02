BookReader.prototype.textSelection = function() {
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

  if(xmlMap != undefined){
    console.log("get xml succesful");
    const page1  = $(xmlMap).find("OBJECT")[1];
    console.log("page found");
    const XMLwidth = $(page1).attr("width");
    const currWidth = $('.BRpagecontainer').width();
    const scaleFactor = currWidth/XMLwidth;

    $(page1).find("WORD").each( (i, el) => {
      const coords = $(el).attr("coords").split(',');
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
      svg.setAttribute("height", scaleFactor*Math.abs(coords[3] - coords[1]));
      svg.setAttribute("width",  scaleFactor*Math.abs(coords[0] - coords[2]));
      // svg.setAttribute("x", coords[0]);
      // svg.setAttribute("y", coords[1]);
      // const xmlDPI = 500;
      // const currentDPI = window.devicePixelRatio*96;
      // console.log(currentDPI)
      // const scaleFactor = currentDPI/xmlDPI;
      // console.log(scaleFactor);

      $(svg).css({"position": "absolute",
        "top": scaleFactor*coords[1],
        "right": scaleFactor*coords[0]});
        var textNode = document.createTextNode(el.textContent);
        textSvg.append(textNode);
        svg.append(textSvg);
        $('.BRpagecontainer').append(svg);    
    })
  }
}
});
}