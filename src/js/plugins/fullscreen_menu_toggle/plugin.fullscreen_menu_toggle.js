/* global: $ */
/**
 * Plugin for managing menu in full screen
 * Enabling this plug-in removes the "menu tab" triangle
 * and uses center touch/click to show/hide the menu below
 * Behavior is predicated on custom event: `brFullScreenToggled`
 * This is fired when user clicks on the fullscreen button on the menu
 */

(function enableBRFullscreenMenuManager () {
    jQuery.extend(BookReader.defaultOptions, {
      enableFullScreenMenuToggle: true
    });
  
    function onEnterFullscreen (br) {
      var $menuTab = br.refs.$BRnav.children('.js-tooltip');
      $menuTab.css('display', 'none');
  
      var timeoutHandler = function onEnterTimeoutHandler () {
        br.hideNavigation();
        var menuManager = br.menuFullscreenFadeManager;
  
        registerEventHandlers(br);
        menuManager.menuIsShowing = false;
      }
      setTimeout(timeoutHandler, 500);
    }
  
    var onExitFullscreen = function onExitFullscreen (br) {
      var $menuTab = br.refs.$BRnav.children('.js-tooltip');
      $menuTab.css('display', 'block');
      removeEventHandlers(br);
    }
  
    var removeEventHandlers = function removeEventHandlers(br) {
      if (br.refs.$brPageViewEl) {
        br.refs.$brPageViewEl[0].removeEventListener('click', BRMenuClickHandler, true);
      }
      if (br.refs.$brTwoPageView) {
        br.refs.$brTwoPageView[0].removeEventListener('click', BRMenuClickHandler, true);
      }
    }
  
    var BRMenuClickHandler = function BRMenuClickHandler(br, e) {
      var menuManager = br.menuFullscreenFadeManager;
      var bookWidth = e.currentTarget.offsetWidth;
      var leftOffset = e.currentTarget.offsetLeft
      var bookEndPageFlipArea = parseInt(bookWidth / 5);
      var leftThreshold = parseInt(bookEndPageFlipArea + leftOffset); // without it, the click area is small
      var rightThreshold = parseInt(bookWidth - bookEndPageFlipArea + leftOffset);
      var isInRange = (e.clientX > leftThreshold) && (e.clientX < rightThreshold);
      
      if (isInRange) {
        if (menuManager.menuIsShowing) {
          br.hideNavigation();
          menuManager.menuIsShowing = false;
        } else {
          br.showNavigation();
          menuManager.menuIsShowing = true;
        }
        event.stopPropagation();
      }
    }
  
    function registerEventHandlers(br) {
      var brContainer = document.querySelector('.BRcontainer');
      var firstChild = brContainer.firstChild;
  
      if (firstChild) {
        firstChild.addEventListener('click', BRMenuClickHandler.bind(this, br), true);
      }
    }

    BookReader.prototype.manageFullScreenToggle = function brManageFullScreenToggle(e) {
      $(document).on('BookReader:fullscreenToggled', function (e) {
        if (this.isFullscreen()) {
          this.menuFullscreenFadeManager.onEnterFullscreen(this);
        } else {
          this.menuFullscreenFadeManager.onExitFullscreen(this);
        }
      }.bind(this));
  
      var fullscreenEventRegister = function fullscreenEventRegister (e) {
        if (this.isFullscreen()) {
          registerEventHandlers(this);
        }
      }.bind(this);
  
      var eventsToHandle = [
        'BookReader:1PageViewSelected',
        'BookReader:2PageViewSelected',
        'BookReader:zoomIn',
        'BookReader:zoomOut',
        'BookReader:resize'
      ];
  
      $(window).on('orientationchange', fullscreenEventRegister);
      eventsToHandle.forEach(function bindEventHandlers(eventName) {
        $(document).on(eventName, fullscreenEventRegister);
      })
    };

    BookReader.prototype.setup = (function(super_) {
      return function(options) {
        super_.call(this, options);
        this.menuFullscreenFadeManager = {
          menuIsShowing: true,
          onEnterFullscreen: onEnterFullscreen,
          onExitFullscreen: onExitFullscreen,
        };
      };
    })(BookReader.prototype.setup);

    BookReader.prototype.init = (function(super_) {
      return function() {
        super_.call(this);
        if (this.options.enableFullScreenMenuToggle) {
          this.manageFullScreenToggle();
        }
      };
    })(BookReader.prototype.init);
  })();
  