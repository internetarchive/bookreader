(function() {
  var SinglePageViewPlugin;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  SinglePageViewPlugin = (function() {
    function SinglePageViewPlugin() {
      this.bookReaderObject = null;
      this.parentElement = null;
      this.imageElement = null;
      this.currentIndex = null;
      this.previousIndex = null;
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
      var leftPageEl, rightPageEl;
      this.bookReaderObject = bookReaderObject;
      this.parentElement = parentElement;
      this.viewContainer = $("<div class='single-page-view'></div>");
      /*
      		* leftPageEl and rightPageEl are provided for short-term dev use
      		*/
      leftPageEl = $("<div class='left-page'></div>");
      rightPageEl = $("<div class='right-page'></div>");
      this.imageElement = $("<img />");
      this.imageContainer = $("<div class='image'></div>");
      this.imageContainer.append(this.imageElement);
      this.viewContainer.append(leftPageEl);
      this.viewContainer.append(rightPageEl);
      this.viewContainer.append(this.imageContainer);
      this.parentElement.append(this.viewContainer);
      this.currentIndex = this.bookReaderObject.getCurrentIndex();
      this.bookReaderObject.parentElement.bind('br_indexUpdated.SinglePageViewPlugin', __bind(function(data) {
        this.previousIndex = this.currentIndex;
        this.currentIndex = this.bookReaderObject.getCurrentIndex();
        return this.eventIndexUpdated();
      }, this));
      this.parentElement.bind('br_left.SinglePageViewPlugin', __bind(function() {
        if (this.currentIndex > 1) {
          return this.bookReaderObject.jumpToIndex(this.currentIndex - 1);
        }
      }, this));
      this.parentElement.bind('br_right.SinglePageViewPlugin', __bind(function() {
        if (this.currentIndex < this.bookReaderObject.getNumPages()) {
          return this.bookReaderObject.jumpToIndex(this.currentIndex + 1);
        }
      }, this));
      /*
      		* The following are for short-term dev use
      		*/
      leftPageEl.bind('click', __bind(function() {
        return this.parentElement.trigger('left');
      }, this));
      rightPageEl.bind('click', __bind(function() {
        return this.parentElement.trigger('right');
      }, this));
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
        height: this.bookReaderObject.getPageHeight(this.currentIndex),
        width: this.bookReaderObject.getPageWidth(this.currentIndex),
        src: this.bookReaderObject.getPageURI(this.currentIndex)
      });
      this.viewContainer.width(40 + this.bookReaderObject.getPageWidth(this.currentIndex));
      return this.imageContainer.width(this.bookReaderObject.getPageWidth(this.currentIndex));
    };
    /*
    * eventIndexUpdated()
    *
    * eventIndexUpdated() will update the current index and the DOM. This is where
    * page turning animations can be tied in.
    	*/
    SinglePageViewPlugin.prototype.eventIndexUpdated = function() {
      return this.showCurrentIndex();
    };
    return SinglePageViewPlugin;
  })();
  this.SinglePageViewPlugin = SinglePageViewPlugin;
  if (typeof br !== "undefined" && br !== null) {
    br.registerPluginClass(SinglePageViewPlugin);
  }
}).call(this);
