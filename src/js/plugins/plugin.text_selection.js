class BookReaderTextSelection extends BookReader {
    /**
     * @param {BookReaderOptions} options
     */
  setup(options) {
    super.setup(options);
    // this._plugins = {
    //   ink: new InkPlugin(this).setup()
    // };
  }

  init() {
    super.init();
    // const { projects } = this._plugins.ink;
    this.$('.BRcontainer').on('pointerover pointerdown', '.BR-ink-canvas', ev => {
      const canvas = ev.currentTarget;
      const $canvas = $(canvas);
      const $container = $canvas.parents('.BRpagecontainer');
      console.log("initializing text-selection");
        
      const xmlMap = $.ajax({
        type: "GET",
        url: "https://ia803103.us.archive.org/14/items/goodytwoshoes00newyiala/goodytwoshoes00newyiala_djvu.xml",
        dataType: "xml",

        error: function (e) {
          console.log("XML reading Failed: ", e);
          return undefined;
        },

        success: function (response) {
          return response;
        }
      });

      if(xmlMap != undefined){
        const page1  = $(xmlMap).find("OBJECT")[1];
        page1.find("word").each( (el, i) => {
          const coords = el.attr("coords").split(',');
          var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          var textSvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
          svg.setAttribute("height", coords[1] - coords[3])
            .setAttribute("width", coords[0] - coords[2])
            .setAttribute("x", coords[0])
            .setAttribute("y", coords[1]);
            var textNode = document.createTextNode(el.textContent);
            textSvg.append(textNode);
            svg.append(textSvg);
            canvas.append(svg);    
        })
      }
    })
  }
}