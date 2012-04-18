(function() {
  var PageStreamViewPlugin;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  PageStreamViewPlugin = (function() {
    function PageStreamViewPlugin() {
      $.extend(this, {
        reader: null,
        container: null,
        viewContainer: null,
        imageContainer: null,
        currentIndex: 0,
        previousIndex: null,
        imageElements: [],
        reductionFactors: [],
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
      this.prepareView();
      this.reader.parentElement.bind('br_indexUpdated.PageStreamViewPlugin', __bind(function(e, data) {
        return this.eventIndexUpdated(data);
      }, this));
      this.container.bind('br_left.PageStreamViewPlugin', __bind(function() {
        console.log("br_left");
        if (this.currentIndex > this.firstDisplayableIndex()) {
          return this.reader.jumpToIndex(this.currentIndex - 1);
        }
      }, this));
      this.container.bind('br_right.PageStreamViewPlugin', __bind(function() {
        console.log("br_right");
        if (this.currentIndex < this.lastDisplayableIndex()) {
          return this.reader.jumpToIndex(this.currentIndex + 1);
        }
      }, this));
      this.currentIndex = this.firstDisplayableIndex();
      if (this.currentIndex < 0) {
        this.currentIndex = 0;
      }
      return this.refresh();
    };
    PageStreamViewPlugin.prototype.buildImage = function(index) {
      var imageContainer, imageElement;
      if (index < 0 || index === NaN) {
        return $("<div class='empty-page'></div>");
      }
      console.log(index);
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
    PageStreamViewPlugin.prototype.showCurrentIndex = function(options) {
      var newScrollPosition, oldScrollPosition, _ref;
            if ((_ref = this.previousIndex) != null) {
        _ref;
      } else {
        this.previousIndex = 0;
      };
      newScrollPosition = this.imageElements[this.currentIndex].offset().top;
      oldScrollPosition = this.imageElements[this.previousIndex].offset().top;
      if ((options != null) && options.animate === false) {
        return this.container.animate({
          scrollTop: newScrollPosition
        }, 'fast');
      } else {
        return this.container.animate({
          scrollTop: newScrollPosition
        }, 'slow');
      }
    };
    PageStreamViewPlugin.prototype.drawLeafs = function() {
      return this.show();
    };
    PageStreamViewPlugin.prototype.zoom = function(direction) {};
    PageStreamViewPlugin.prototype.prepareView = function() {
      var startLeaf;
      startLeaf = this.reader.currentIndex();
      this.container.empty();
      this.container.css({
        overflowY: 'scroll',
        overflowX: 'auto'
      });
      this.container.dragscrollable();
      this.reader.bindGestures(this.container);
      this.reader.resizePageView();
      this.reader.jumpToIndex(startLeaf);
      return this.reader.displayedIndices = [];
    };
    PageStreamViewPlugin.prototype.calculateReductionFactors = function() {
      this.reductionFactors = this.reductionFactors.concat([
        {
          reduce: this.getAutofitWidth(),
          autofit: 'width'
        }, {
          reduce: this.getAutofitHeight(),
          autofit: 'height'
        }
      ]);
      return this.reductionFactors.sort(function(a, b) {
        return a.reduce - b.reduce;
      });
    };
    PageStreamViewPlugin.prototype.getAutofitWidth = function() {
      var widthPadding;
      widthPadding = 20;
      return (this.reader.getMedianPageSize().width + 0.0) / (this.container.attr('clientWidth') - widthPadding * 2);
    };
    PageStreamViewPlugin.prototype.getAutofitHeight = function() {
      return (this.reader.getMedianPageSize().height + 0.0) / (this.container.attr('clientHeight') - this.reader.padding * 2);
    };
    /*
    	* eventIndexUpdated()
    	*
    	* eventIndexUpdated() will update the current index and the DOM. This is where
    	* page turning animations can be tied in.
    	*/
    PageStreamViewPlugin.prototype.eventIndexUpdated = function(data) {
      if (this.previousIndex !== data.newIndex && (this.imageElements[data.newIndex] != null)) {
        this.previousIndex = this.currentIndex;
        this.currentIndex = data.newIndex;
        return this.showCurrentIndex();
      }
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
      if (this.viewContainer != null) {
        this.viewContainer.empty();
      }
      return this.imageElements = [];
    };
    PageStreamViewPlugin.prototype.show = function() {
      var i, _ref, _ref2, _ref3;
            if ((_ref = this.viewContainer) != null) {
        _ref;
      } else {
        this.viewContainer = $("<div class='page-stream-view'></div>");
      };
      for (i = _ref2 = this.firstDisplayableIndex(), _ref3 = this.lastDisplayableIndex(); _ref2 <= _ref3 ? i <= _ref3 : i >= _ref3; _ref2 <= _ref3 ? i++ : i--) {
        if (this.imageElements[i] == null) {
          this.viewContainer.append(this.buildImage(i));
        }
      }
      this.container.append(this.viewContainer);
      return this.showCurrentIndex({
        animate: false
      });
    };
    PageStreamViewPlugin.prototype.destroy = function() {};
    return PageStreamViewPlugin;
  })();
  this.PageStreamViewPlugin = PageStreamViewPlugin;
  PageStreamViewPlugin.manifest = {
    type: 'view',
    cssClass: 'page-stream-view'
  };
  BookReader.registerPlugin("page-stream-view", PageStreamViewPlugin);
}).call(this);
