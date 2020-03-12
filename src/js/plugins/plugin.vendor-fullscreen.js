/* global BookReader */

/**
 * Toggles browser's native fullscreen mode if available
 */

const EVENT_NAMESPACE = '.bookreader_vendor-fullscreen';
// function isMobile() {
//   return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
// };

// if (this.isMobile()) { return; }

jQuery.extend(BookReader.defaultOptions, {
  /** @type {true} */
  enableVendorFullscreenPlugin: true
});

/** @override */
BookReader.prototype.setup = (function(super_) {
  return function(options) {
    super_.call(this, options);

    this.isVendorFullscreenActive = false;
  };
})(BookReader.prototype.setup);

/** @override */
BookReader.prototype.getInitialMode = (function(super_) {
  return function(params) {
    let nextMode = super_.call(this, params);
    if (this.isVendorFullscreenActive) {
      nextMode = this.constMode1up;
    }
    return nextMode;
  };
})(BookReader.prototype.getInitialMode);

/** @override */
BookReader.prototype.init = (function(super_) {
  return function() {
    super_.call(this);

    if (!BookReader.util.fullscreenAllowed()) {
      return;
    }
    // In fullscreen mode the colorbox and overlay need to be inside the fullscreen element to display properly.
    BookReader.util.bindFullscreenChangeListener(this, (e) => {
      e.data.resize();
      e.data.updateBrClasses();
      const cboxOverlay = $('#cboxOverlay');
      const cbox = $('#colorbox');
      if (BookReader.util.isFullscreenActive()) {
        // In full screen mode, the colorbox and overlay need
        // to be children of the fullscreen element to display properly.
        let $fullscreen = $(BookReader.util.getFullscreenElement());
        $fullscreen.append(cboxOverlay).append(cbox);
      } else {
        // In non-fullscreen mode, the colorbox and overlay need
        // to be children of the main document body.
        $(document.body).append(cboxOverlay).append(cbox);
      }
    });
  }
})(BookReader.prototype.init);

/** 
 * Start fullscreen mode
 */
BookReader.prototype.enterFullWindow = function() {
  this.refs.$brContainer.css('opacity', 0);

  const windowWidth = $(window).width();
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
  };
  $(document).on('keyup.' + EVENT_NAMESPACE, this._fullWindowExitHandler);
};

/** 
 * Exit from fullscreen mode
 */
BookReader.prototype.exitFullWindow = function() {
  this.refs.$brContainer.css('opacity', 0);

  $(document).off('keyup' + EVENT_NAMESPACE);

  this.isFullscreenActive = false;
  this.updateBrClasses()

  this.resize();
  this.refs.$brContainer.animate({ opacity: 1 }, 400, 'linear');
};

/** 
 * Returns true if fullscreen mode is enabled
 *
 * @returns {boolean}
 */
BookReader.prototype.isFullscreen = function() {
  return BookReader.util.isFullscreenActive() || this.isVendorFullscreenActive;
};

/** 
 * Toggle screen
 */
BookReader.prototype.toggleFullscreen = function() {
  if (this.isFullscreen()) {
    if (BookReader.util.fullscreenAllowed()) {
      BookReader.util.exitFullscreen();
    } else {
      this.exitFullWindow();
    }
  } else {
    if (BookReader.util.fullscreenAllowed()) {
      BookReader.util.requestFullscreen(this.refs.$br[0]);
    } else {
      this.enterFullWindow();
    }
  }
};


/**
 * Returns the DOM element being used for fullscreen.
 *
 * @returns {boolean}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/fullscreenElement
 */
BookReader.util.getFullscreenElement = function() {
  return document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;
};

/**
 * Returns true if the document is in fullscreen mode.
 *
 * @returns {boolean}
 */
BookReader.util.isFullscreenActive = function() {
  const fullscreenElement = this.getFullscreenElement();
  return fullscreenElement !== null && fullscreenElement !== undefined;
};

/**
 * Exits fullscreen mode.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/exitFullscreen
 */
BookReader.util.exitFullscreen = function() {
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
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
 */
BookReader.util.requestFullscreen = function(element) {
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
 * 
 * @returns {boolean}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenEnabled
 */
BookReader.util.fullscreenAllowed = function() {
  return (document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullScreenEnabled);
};

/**
 * jQuery-style binding to a fullscreenchange event.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenchange_event
 */
BookReader.util.bindFullscreenChangeListener = function(
  data, fullscreenchangeListener
) {
  const event = 'fullscreenchange ';
  const vendor_prefixes = [
    'webkit',
    'moz',
    'ms'
  ];
  const all_events = $.trim(event + vendor_prefixes.join(event) + event);
  $(document).bind(all_events, data, fullscreenchangeListener);
};
