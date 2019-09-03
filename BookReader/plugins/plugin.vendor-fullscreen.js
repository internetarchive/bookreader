/**
 * Toggles browser's native fullscreen mode if available
 */

(function(BR) {
  var event_namespace = '.bookreader_vendor-fullscreen';
  function isMobile() {
    return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
  };

  if (isMobile()) { return; }

  jQuery.extend(BR.defaultOptions, {
    enableVendorFullscreenPlugin: true
  });

  BR.prototype.setup = (function(super_) {
    return function(options) {
      super_.call(this, options);

      this.isVendorFullscreenActive = false;
    };
  })(BR.prototype.setup);

  BR.prototype.getInitialMode = (function(super_) {
    return function(params) {
      var nextMode = super_.call(this, params);
      if (this.isVendorFullscreenActive) {
        nextMode = this.constMode1up;
      }
      return nextMode;
    };
  })(BR.prototype.getInitialMode);

  BR.prototype.init = (function(super_) {
    return function() {
      super_.call(this);

      if (!BR.util.fullscreenAllowed()) {
        return;
      }
      // In fullscreen mode, the colorbox and overlay need to be inside the
      // fullscreen element to display properly.
      BR.util.bindFullscreenChangeListener(this, function(e) {
        e.data.resize();
        e.data.updateBrClasses();
        var cboxOverlay = $("#cboxOverlay");
        var cbox = $("#colorbox");
        if (BR.util.isFullscreenActive()) {
          // In full screen mode, the colorbox and overlay need
          // to be children of the fullscreen element to display properly.
          var $fullscreen = $(BR.util.getFullscreenElement());
          $fullscreen.append(cboxOverlay).append(cbox);
        } else {
          // In non-fullscreen mode, the colorbox and overlay need
          // to be children of the main document body.
          $(document.body).append(cboxOverlay).append(cbox);
        }
      });
    }
  })(BR.prototype.init);

  BR.prototype.enterFullWindow = function() {
    this.refs.$brContainer.css('opacity', 0);

    var windowWidth = $(window).width();
    if (windowWidth <= this.onePageMinBreakpoint) {
      this.switchMode(this.constMode1up);
    }

    this.isVendorFullscreenActive = true;
    this.updateBrClasses();

    this.resize();
    this.jumpToIndex(this.currentIndex());

    this.refs.$brContainer.animate({ opacity: 1 }, 400, 'linear');

    this._fullWindowExitHandler = function (e) {
      if (e.keyCode === 27) this.exitFullScreen();
    }.bind(this);
    $(document).on('keyup.' + event_namespace, this._fullWindowExitHandler);
  };

  BR.prototype.exitFullWindow = function() {
    this.refs.$brContainer.css('opacity', 0);

    $(document).off('keyup' + event_namespace);

    this.isFullscreenActive = false;
    this.updateBrClasses()

    this.resize();
    this.refs.$brContainer.animate({ opacity: 1 }, 400, 'linear');
  };

  BR.prototype.isFullscreen = function() {
    return BR.util.isFullscreenActive() || this.isVendorFullscreenActive;
  };

  BR.prototype.toggleFullscreen = function() {
    if (this.isFullscreen()) {
      if (BR.util.fullscreenAllowed()) {
        BR.util.exitFullscreen();
      } else {
        this.exitFullWindow();
      }
    } else {
      if (BR.util.fullscreenAllowed()) {
        BR.util.requestFullscreen(this.refs.$br[0]);
      } else {
        this.enterFullWindow();
      }
    }
  };

  /**
   * Returns the DOM element being used for fullscreen.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/fullscreenElement
   */
  BR.util.getFullscreenElement = function() {
    return document.fullscreenElement ||
           document.webkitFullscreenElement ||
           document.mozFullScreenElement ||
           document.msFullscreenElement;
  };

  /**
   * Returns true if the document is in fullscreen mode.
   */
  BR.util.isFullscreenActive = function() {
    var fullscreenElement = this.getFullscreenElement();
    return fullscreenElement !== null && fullscreenElement !== undefined;
  };

  /**
   * Exits fullscreen mode.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen
   */
  BR.util.exitFullscreen = function() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  };

  /**
   * Requests fullscreen mode for the given element
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
   */
  BR.util.requestFullscreen = function(element) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  /**
   * Returns true if fullscreen mode is allowed on this device and document.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenEnabled
   */
  BR.util.fullscreenAllowed = function() {
    return (document.fullscreenEnabled ||
           document.webkitFullscreenEnabled ||
           document.mozFullScreenEnabled ||
           document.msFullScreenEnabled);
  };

  /**
   * jQuery-style binding to a fullscreenchange event.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event
   */
  BR.util.bindFullscreenChangeListener = function(data, fullscreenchangeListener) {
    var event = 'fullscreenchange ';
    var vendor_prefixes = [
      'webkit',
      'moz',
      'ms'
    ];
    var all_events = $.trim(event + vendor_prefixes.join(event) + event);

    $(document).bind(all_events, data, fullscreenchangeListener);
  };
})(BookReader);
