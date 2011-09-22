(function() {
  var SinglePageViewPlugin;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  SinglePageViewPlugin = (function() {
    function SinglePageViewPlugin() {
      $.extend(this, {
        reader: null,
        container: null,
        imageElement: null,
        viewContainer: null,
        imageContainer: null,
        currentIndex: null,
        previousIndex: null
      });
    }
    /*
    * init(bookReaderObject, parentElement)
    *
    * input: bookReaderObject representing the core book reader manager
    *        parentElement representing the HTML DOM element within which the plugin can do what it wants
    *
    * init(...) will initialize the DOM and display the page associated with the current index
    *
    	*/
    SinglePageViewPlugin.prototype.init = function(bookReaderObject, parentElement) {
      this.reader = bookReaderObject;
      this.container = $(parentElement);
      this.reader.parentElement.bind('br_indexUpdated.SinglePageViewPlugin', __bind(function(data) {
        this.previousIndex = this.currentIndex;
        return this.eventIndexUpdated();
      }, this));
      this.container.bind('br_left.SinglePageViewPlugin', __bind(function() {
        if (this.currentIndex > this.firstDisplayableIndex()) {
          return this.reader.jumpToIndex(this.currentIndex - 1);
        }
      }, this));
      this.container.bind('br_right.SinglePageViewPlugin', __bind(function() {
        if (this.currentIndex < this.lastDisplayableIndex()) {
          return this.reader.jumpToIndex(this.currentIndex + 1);
        }
      }, this));
      return this.refresh();
    };
    SinglePageViewPlugin.prototype.refresh = function() {
      this.container.empty();
      this.viewContainer = $("<div class='single-page-view'></div>");
      this.imageElement = $("<img />");
      this.imageContainer = $("<div class='image'></div>");
      this.imageContainer.append(this.imageElement);
      this.viewContainer.append(this.imageContainer);
      this.container.append(this.viewContainer);
      this.showCurrentIndex();
      /*
      * We may need to bind to events that handle advancing and retreating pages
      * since the presentation/view plugin knows how many pages are being shown
      		*/
      return this.showCurrentIndex();
    };
    /*
    * showCurrentIndex()
    *
    * showCurrentIndex() will update the height, width, and href attributes of the <img/>
    * tag that is displaying the current page
    	*/
    SinglePageViewPlugin.prototype.showCurrentIndex = function() {
      this.imageElement.attr({
        height: this.reader.getPageHeight(this.currentIndex),
        width: this.reader.getPageWidth(this.currentIndex),
        src: this.reader.getPageURI(this.currentIndex)
      });
      this.viewContainer.width(this.reader.getPageWidth(this.currentIndex));
      return this.imageContainer.width(this.reader.getPageWidth(this.currentIndex));
    };
    /*
    * eventIndexUpdated()
    *
    * eventIndexUpdated() will update the current index and the DOM. This is where
    * page turning animations can be tied in.
    	*/
    SinglePageViewPlugin.prototype.eventIndexUpdated = function() {
      this.currentIndex = this.reader.getCurrentIndex();
      return this.showCurrentIndex();
    };
    SinglePageViewPlugin.prototype.firstDisplayableIndex = function() {
      return 1;
    };
    SinglePageViewPlugin.prototype.lastDisplayableIndex = function() {
      return this.reader.getNumPages() - 1;
    };
    return SinglePageViewPlugin;
  })();
  this.SinglePageViewPlugin = SinglePageViewPlugin;
  SinglePageViewPlugin.params = {
    autofit: 'height'
  };
  BookReader.registerPlugin(SinglePageViewPlugin);
}).call(this);
