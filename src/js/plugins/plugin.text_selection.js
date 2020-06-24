class BookReaderTextSelection extends BookReader {
    /**
     * @param {BookReaderOptions} options
     */
  setup(options) {
    super.setup(options);
    this._plugins = {
      ink: new InkPlugin(this).setup()
    };
  }

  init() {
    super.init();
    const { projects } = this._plugins.ink;
    this.$('.BRcontainer').on('pointerover pointerdown', '.BR-ink-canvas', ev => {
        const canvas = ev.currentTarget;
        const $canvas = $(canvas);
        const $container = $canvas.parents('.BRpagecontainer');
        
        const xmlMap = $.ajax({
            type: "GET",
            url: "./demo.xml",
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
               const coords = el.attr("coords")
                
            }
            )
        }