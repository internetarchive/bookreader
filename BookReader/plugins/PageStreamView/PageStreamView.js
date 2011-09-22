(function() {
  var PageStreamViewPlugin;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  PageStreamViewPlugin = (function() {
    function PageStreamViewPlugin() {
      $.extend(this, {
        reader: null,
        container: null,
        imageElement: null,
        viewContainer: null,
        imageContainer: null,
        currentIndex: null,
        previousIndex: null,
        imageElements: [],
        params: {
          autofit: 'height'
        }
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
    PageStreamViewPlugin.prototype.init = function(bookReaderObject, parentElement) {
      this.reader = bookReaderObject;
      this.container = $(parentElement);
      this.reader.parentElement.bind('br_indexUpdated.PageStreamViewPlugin', __bind(function(data) {
        this.previousIndex = this.currentIndex;
        return this.eventIndexUpdated();
      }, this));
      this.container.bind('br_left.PageStreamViewPlugin', __bind(function() {
        if (this.currentIndex > this.firstDisplayableIndex()) {
          return this.reader.jumpToIndex(this.currentIndex - 1);
        }
      }, this));
      this.container.bind('br_right.PageStreamViewPlugn', __bind(function() {
        if (this.currentIndex < this.lastDisplayableIndex()) {
          return this.reader.jumpToIndex(this.currentIndex + 1);
        }
      }, this));
      this.currentIndex = this.reader.currentIndex() || this.firstDisplayableIndex();
      return this.refresh();
    };
    PageStreamViewPlugin.prototype.buildImage = function(index) {
      var imageContainer, imageElement;
      imageElement = $("<img />");
      imageContainer = $("<div class='image'></div>");
      imageContainer.append(imageElement);
      imageElement.bind('mousedown', __bind(function(e) {
        return false;
      }, this));
      imageElement.attr({
        height: this.reader.getPageHeight(index) / this.pageScale(),
        width: this.reader.getPageWidth(index) / this.pageScale(),
        src: this.reader.getPageURI(index, this.pageScale())
      });
      this.imageElements[index] = imageElement;
      return imageContainer;
    };
    PageStreamViewPlugin.prototype.pageScale = function() {
      if (this.reader.pageScale != null) {
        return this.reader.pageScale;
      }
      return 1;
    };
    PageStreamViewPlugin.prototype.refresh = function() {
      this.hide();
      return this.show();
    };
    /*
    * showCurrentIndex()
    *
    * showCurrentIndex() will update the height, width, and href attributes of the <img/>
    * tag that is displaying the current page
    	*/
    PageStreamViewPlugin.prototype.showCurrentIndex = function() {
      return this.container.animate({
        scrollTop: this.imageElements[this.currentIndex].position().top - this.container.offset().top + this.container.scrollTop()
      });
    };
    /*
    * eventIndexUpdated()
    *
    * eventIndexUpdated() will update the current index and the DOM. This is where
    * page turning animations can be tied in.
    	*/
    PageStreamViewPlugin.prototype.eventIndexUpdated = function() {
      this.currentIndex = this.reader.currentIndex();
      return this.showCurrentIndex();
    };
    PageStreamViewPlugin.prototype.eventResize = function() {
      if (this.reader.autofit) {
        this.reader.resizePageView();
      }
      this.reader.centerPageView();
      this.reader.displayedIndices = [];
      this.reader.updateSearchHilites();
      return this.reader.loadLeafs();
    };
    PageStreamViewPlugin.prototype.firstDisplayableIndex = function() {
      if (this.reader.pageProgression !== 'rl') {
        if (this.reader.getPageSide(0) === 'L') {
          return 1;
        } else {
          return 0;
        }
      } else {
        if (this.reader.getPageSide(0) === 'R') {
          return 1;
        } else {
          return 0;
        }
      }
    };
    PageStreamViewPlugin.prototype.lastDisplayableIndex = function() {
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
    PageStreamViewPlugin.prototype.hide = function() {
      return this.container.empty();
    };
    PageStreamViewPlugin.prototype.show = function() {
      var i, _ref, _ref2;
      this.viewContainer = $("<div class='page-stream-view'></div>");
      for (i = _ref = this.firstDisplayableIndex(), _ref2 = this.lastDisplayableIndex(); _ref <= _ref2 ? i <= _ref2 : i >= _ref2; _ref <= _ref2 ? i++ : i--) {
        this.viewContainer.append(this.buildImage(i));
      }
      this.container.append(this.viewContainer);
      return this.showCurrentIndex();
    };
    PageStreamViewPlugin.prototype.destroy = function() {};
    return PageStreamViewPlugin;
  })();
  this.PageStreamViewPlugin = PageStreamViewPlugin;
  PageStreamViewPlugin.params = {
    type: 'view',
    cssClass: 'page-stream-view'
  };
  BookReader.registerPlugin("page-stream-view", PageStreamViewPlugin);
}).call(this);
