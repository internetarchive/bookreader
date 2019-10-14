
/* global: $ */
/**
 * Plugin for managing menu in full screen
 * Enabling this plug-in removes the "menu tab" triangle
 * and uses center touch/click to show/hide the menu below
 * Behavior is predicated on custom event: `brFullScreenToggled`
 * This is fired when user clicks on the fullscreen button on the menu
 */

(function addMenuToggler () {
    jQuery.extend(BookReader.defaultOptions, {
      enableMenuToggle: true
    });
  
    function setupNavForToggle (br) {
      var $menuTab = br.refs.$BRnav.children('.js-tooltip');
      $menuTab.css('display', 'none');
      registerEventHandlers(br);
    }
  
    var removeToggleFromNav = function removeToggleFromNav (br) {
      var $menuTab = br.refs.$BRnav.children('.js-tooltip');
      $menuTab.css('display', 'block');
      removeEventHandlers(br);
    }
  
    var removeEventHandlers = function removeEventHandlers(br) {
      if (br.refs.$brPageViewEl) {
        br.refs.$brPageViewEl[0].removeEventListener('click', toggleMenuIfCenterClick, true);
      }
      if (br.refs.$brTwoPageView) {
        br.refs.$brTwoPageView[0].removeEventListener('click', toggleMenuIfCenterClick, true);
      }
    }
  
    var toggleMenuIfCenterClick = function toggleMenuIfCenterClick(br, e) {
      var menuManager = br.fullscreenMenu;
      var bookWidth = e.currentTarget.offsetWidth;
      var leftOffset = e.currentTarget.offsetLeft
      var bookEndPageFlipArea = Math.round(bookWidth / 3);
      var leftThreshold = Math.round(bookEndPageFlipArea + leftOffset); // without it, the click area is small
      var rightThreshold = Math.round(bookWidth - bookEndPageFlipArea + leftOffset);
      var isCenterClick = (e.clientX > leftThreshold) && (e.clientX < rightThreshold);
      
      if (isCenterClick) {
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
      var brContainer = document.querySelector('.BRcontainer') || {};
      var firstChild = brContainer.firstChild;
  
      if (firstChild) {
        firstChild.addEventListener('click', toggleMenuIfCenterClick.bind(this, br), true);
      }
    }

    BookReader.prototype.initFullScreenToggle = function brInitFullScreenToggle(e) {
      $(document).on('BookReader:fullscreenToggled', function (e) {
        this.menuToggle.setupNavForToggle(this);
      }.bind(this));
  
      var menuToggleEventRegister = function menuToggleEventRegister (e) {
        registerEventHandlers(this);
      }.bind(this);
  
      var eventsToHandle = [
        'BookReader:1PageViewSelected',
        'BookReader:2PageViewSelected',
        'BookReader:zoomIn',
        'BookReader:zoomOut',
        'BookReader:resize'
      ];

      $(document).on(eventsToHandle.join(' '), menuToggleEventRegister);
      $(window).on('orientationchange', menuToggleEventRegister);
      $(window).on('DOMContentLoaded', function setupNavAtFirstDraw(e) {
        setupNavForToggle(this);
      }.bind(this));
    };

    BookReader.prototype.setup = (function(super_) {
      return function(options) {
        super_.call(this, options);
        this.fullscreenMenu = {
          menuIsShowing: true,
          setupNavForToggle: setupNavForToggle,
          removeToggleFromNav: removeToggleFromNav,
        };
      };
    })(BookReader.prototype.setup);

    BookReader.prototype.init = (function(super_) {
      return function() {
        super_.call(this);
        if (this.options.enableMenuToggle) {
          this.initMenuToggle();
        }
      };
    })(BookReader.prototype.init);
  })();
  