
/* global: $ */
/**
 * Plugin for managing menu in full screen
 * Enabling this plug-in removes the "menu tab" triangle
 * and uses center touch/click to show/hide the menu below
 * Behavior is predicated on custom event: `brFullScreenToggled`
 * This is fired when user clicks on the fullscreen button on the menu
 *
 * This uses BookReader native functions and parameters to check its UI state.
 * This includes:
 * - br.refs = (at best) ui references that are present at any given time
 * - br.navigationIsVisible() - checks using refs to confirm the navbar's presence
 *
 */

(function addMenuToggler() {
    jQuery.extend(BookReader.defaultOptions, {
      enableMenuToggle: true
    });

    function hideArrow(br) {
      if (!br.refs || !br.refs.$BRnav) {
        return;
      }
      var $menuTab = br.refs.$BRnav.children('.js-tooltip');
      $menuTab.css('display', 'none');
    }

    function setupNavForToggle(br) {
      hideArrow(br);
      registerEventHandlers(br);
    }

    function alwaysShowNav(br) {
      hideArrow(br);
      removeToggleFromNav(br);
      br.showNavigation();
    }
  
    var removeToggleFromNav = function removeToggleFromNav(br) {
      if (!br.refs || !br.refs.$BRnav) {
        return;
      }
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

    var toggleNav = function toggleNav(br) {
      var menuIsShowing = br.navigationIsVisible();
      if (menuIsShowing) {
        br.hideNavigation();
      } else {
        br.showNavigation();
      }
    }
  
    var toggleMenuIfCenterClick = function toggleMenuIfCenterClick(br, e) {
      var book = e.currentTarget;
      if (!book) {
        return;
      }
      var bookWidth = book.offsetWidth;
      var leftOffset = book.offsetLeft
      var bookEndPageFlipArea = Math.round(bookWidth / 3);
      var leftThreshold = Math.round(bookEndPageFlipArea + leftOffset); // without it, the click area is small
      var rightThreshold = Math.round(bookWidth - bookEndPageFlipArea + leftOffset);
      var isCenterClick = (e.clientX > leftThreshold) && (e.clientX < rightThreshold);
      
      if (isCenterClick) {
        toggleNav(br);
        event.stopPropagation();
      }
    }

    function registerEventHandlers(br) {

      var brContainer = document.querySelector('.BRcontainer') || {};
      var mainBRWrapper = document.querySelector('.BookReader') || {};
      var firstChild = brContainer.firstChild;
  
      if (firstChild) {
        firstChild.addEventListener('click', function(e) {
          toggleMenuIfCenterClick(br, e);
        }, true);
      }

      var toggleAtBackgroundClick = function toggleAtBackgroundClick(e) {
        var isBackground = $(event.target).hasClass('BookReader')
          || $(event.target).hasClass('BRcontainer') /* main black theatre */
          || $(event.target).hasClass('BRemptypage') /* empty page placeholder */
          || $(event.target).hasClass('BRpageview'); /* empty page placeholder */
        if (isBackground) {
          toggleNav(br);
        }
      };
      mainBRWrapper.addEventListener('click', toggleAtBackgroundClick, true);
    }

    BookReader.prototype.initMenuToggle = function brInitMenuToggle(e) {
      var br = this;
      var hasNav = false;

      try {
        hasNav = br.navigationIsVisible();
      } catch(error) {
        hasNav = false;
      }

      if (!hasNav) {
        return;
      }

      var menuToggleEventRegister = function menuToggleEventRegister(e) {
        registerEventHandlers(br);
      };

      var setupDOMandHandlers = function setupDOMandHandlers(e) {
        setupNavForToggle(br);
      };

      var persistNav = function persistNav(e) {
        alwaysShowNav(br);
      };
  
      var whenToToggleNav = [
        'BookReader:2PageViewSelected',
        'BookReader:zoomIn',
        'BookReader:zoomOut',
        'BookReader:resize'
      ];

      var whenTolwaysShowNavWhen = [
        'BookReader:1PageViewSelected',
        'BookReader:3PageViewSelected'
      ];

      $(document).on(whenTolwaysShowNavWhen.join(' '), persistNav);
      $(document).on(whenToToggleNav.join(' '), menuToggleEventRegister);
      $(window).on('orientationchange', menuToggleEventRegister);
      $(document).on('BookReader:fullscreenToggled', setupDOMandHandlers);
      $(window).on('DOMContentLoaded', setupDOMandHandlers);
      setupDOMandHandlers();
    };

    BookReader.prototype.setup = (function(super_) {
      return function(options) {
        super_.call(this, options);
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
  