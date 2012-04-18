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
      this.imageElement.bind('mousedown', __bind(function(e) {
        return false;
      }, this));
      this.showCurrentIndex();
      ({
        pageScale: function() {
          if (this.reader.pageScale != null) {
            return this.reader.pageScale;
          }
          return 1;
        }
        /*
        * We may need to bind to events that handle advancing and retreating pages
        * since the presentation/view plugin knows how many pages are being shown
        		*/
      });
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
        height: this.reader.getPageHeight(this.currentIndex) / this.pageScale(),
        width: this.reader.getPageWidth(this.currentIndex) / this.pageScale(),
        src: this.reader.getPageURI(this.currentIndex, this.pageScale())
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
    SinglePageViewPlugin.prototype.eventResize = function() {
      if (this.reader.autofit) {
        this.reader.resizePageView();
      }
      this.reader.centerPageView();
      return this.reader.loadLeafs();
    };
    SinglePageViewPlugin.prototype.firstDisplayableIndex = function() {
      if (this.reader.pageProgression !== 'rl') {
        if (this.reader.getPageSide(0) === 'L') {
          return 0;
        } else {
          return -1;
        }
      } else {
        if (this.reader.getPageSide(0) === 'R') {
          return 0;
        } else {
          return -1;
        }
      }
    };
    SinglePageViewPlugin.prototype.lastDisplayableIndex = function() {
      var lastIndex;
      lastIndex = this.reader.getNumPages() - 1;
      if (this.reader.pageProgression !== 'rl') {
        if (this.reader.getPageSide(lastIndex) === 'R') {
          return lastIndex;
        } else {
          return lastIndex + 1;
        }
      } else {
        if (this.reader.getPageSide(lastIndex) === 'L') {
          return lastIndex;
        } else {
          return lastIndex + 1;
        }
      }
    };
    return SinglePageViewPlugin;
  })();
  this.SinglePageViewPlugin = SinglePageViewPlugin;
  SinglePageViewPlugin.params = {
    autofit: 'height'
  };
  BookReader.registerPlugin(SinglePageViewPlugin);
}).call(this);
