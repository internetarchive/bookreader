
/* global: $, BookReader */
/**
 * Plugin for managing menu visibility
 * Enabling this plug-in:
 * + removes the "menu tab" triangle
 * + toggles nav at: book center tap/click
 * + toggles nav at: black background tap/click
 *
 * This uses core BookReader functions and parameters to check its UI state:
 * - br.refs = (at best) ui references that are present at any given time
 * - br.navigationIsVisible() - checks using refs to confirm the navbar's presence
 * - br.showNavigation() & br.hideNavigation()
 *
 * The list of BookReader custom events this plugin taps into are mainly
 * listed in the `.init` function
 */

(function addMenuToggler() {
    jQuery.extend(BookReader.defaultOptions, {
      enableMenuToggle: true
    });

    /**
     * Hides Nav arrow tab
     *
     * @param { object } br - BookReader instance
     */
    function hideArrow(br) {
      if (!br.refs || !br.refs.$BRnav) {
        return;
      }
      var $menuTab = br.refs.$BRnav.children('.BRnavCntl');
      $menuTab.css('display', 'none');
    }

    /**
     * Sets up nav - hides arrow tab & adds click events
     *
     * @param { object } br - BookReader instance
     */
    function setupNavForToggle(br) {
      hideArrow(br);
      registerClickHandlers(br);
    }

    /**
     * Resets nav to always show
     * hides arrow tab, removes click events, shows nav chrome
     *
     * @param { object } br - BookReader instance
     */
    function alwaysShowNav(br) {
      hideArrow(br);
      removeClickHandlers(br);
      br.showNavigation();
    }
  
    /**
     * Removes click handlers on elements that house the book pages
     *
     * @param { object } br - BookReader instance
     */
    var removeClickHandlers = function removeClickHandlers(br) {
      if (br.refs.$brPageViewEl) {
        br.refs.$brPageViewEl[0].removeEventListener('click', onBookClick, true);
      }
      if (br.refs.$brTwoPageView) {
        br.refs.$brTwoPageView[0].removeEventListener('click', onBookClick, true);
      }
    }

    /**
     * Toggle functionality
     * Responsible for calling native functions `hideNavigation` & `showNavigation`
     * Makes sure only 1 toggle action is taken at a time using `togglingNav` switch.
     *
     * @params { object } br - bookreader instance
     */
    var togglingNav = false; /* flag to make sure animations only fire once */
    var toggleNav = function toggleNav(br) {
      if (togglingNav) {
        return;
      }

      togglingNav = true;
      const navToggled = function navToggled() {
        togglingNav = false;
        window.removeEventListener('BookReader:navToggled', navToggled);
      };
      $(document).on('BookReader:navToggled', navToggled);

      var menuIsShowing = br.navigationIsVisible();
      if (menuIsShowing) {
        br.hideNavigation();
      } else {
        br.showNavigation();
      }
    }

    /**
     * Confirms whether or not the click happened in the nav toggle zone
     *
     * @param { object } event - JS event object
     */
    var isCenterClick = function isCenterClick(event) {
      var book = event.currentTarget;
      var bookWidth = book.offsetWidth;
      var leftOffset = book.offsetLeft
      var bookEndPageFlipArea = Math.round(bookWidth / 3);
      var leftThreshold = Math.round(bookEndPageFlipArea + leftOffset); // without it, the click area is small
      var rightThreshold = Math.round(bookWidth - bookEndPageFlipArea + leftOffset);
      var isCenterClick = (event.clientX > leftThreshold) && (event.clientX < rightThreshold);

      return isCenterClick;
    }

    /**
     * Confirms whether or not the click happened in the background
     *
     * @param { DOM } element
     */
    var isBackground = function isBackground(element) {
      return $(element).hasClass('BookReader')
        || $(element).hasClass('BRcontainer') /* main black theatre */
        || $(element).hasClass('BRemptypage') /* empty page placeholder */
        || $(element).hasClass('BRpageview'); /* empty page placeholder */
    };

    /**
     * Main hook into toggle functionality
     * This is the only function that should be called by the event handlers
     *
     * @param { object } br - BookReader instance
     * @param { object } e - JS event object
     * @param { boolean } atBookCenter - optional
     */
    var toggleRouter = function toggleRouter (br, e, atBookCenter) {
      var isValidClickArea = atBookCenter ? isCenterClick(e) : isBackground(e.target);

      if (isValidClickArea) {
        toggleNav(br, atBookCenter);

        if (atBookCenter) {
          e.stopPropagation(); // don't turn the page. this takes prescendence
        }
      }
    }

    /**
     * background click event handler
     * @param { object } br - BookReader instance
     * @param { object } e - JS event object
     */
    function onBackgroundClick(br, e) {
      toggleRouter(br, e);
    }

    /**
     * actual book container click event handler
     *
     * @param { object } br - BookReader instance
     * @param { object } e - JS event object
     */
    function onBookClick(br, e) {

      var atBookCenter = true;
      toggleRouter(br, e, atBookCenter);
    }

    /**
     * attaches click handlers to background & book
     * @param { object } br - BookReader instance
     */
    function registerClickHandlers(br) {
      var background = document.querySelector('.BookReader') || {};
      background.addEventListener('click', onBackgroundClick.bind(null, br), { capture: true, passive: true });

      var desk = document.querySelector('.BRcontainer') || {};
      var book = desk.firstChild;

      if (book) {
        book.addEventListener('click', onBookClick.bind(null, br), true);
      }
    }

    /**
     * Install menu toggle
     * attaches event handlers, sets up DOM on load
     */
    BookReader.prototype.installMenuToggle = function installMenuToggle(e) {
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
        registerClickHandlers(br);
      };

      var setupDOMandHandlers = function setupDOMandHandlers(e) {
        setupNavForToggle(br);
      };

      var persistNav = function persistNav(e) {
        alwaysShowNav(br);
      };
  
      var whenToToggleNav = [
        'BookReader:1PageViewSelected',
        'BookReader:2PageViewSelected',
        'BookReader:zoomIn',
        'BookReader:zoomOut',
        'BookReader:resize'
      ];

      var whenTolwaysShowNavWhen = [
        'BookReader:3PageViewSelected'
      ];

      $(document).on(whenTolwaysShowNavWhen.join(' '), persistNav);
      $(document).on(whenToToggleNav.join(' '), menuToggleEventRegister);
      $(window).on('orientationchange', menuToggleEventRegister);
      $(document).on('BookReader:fullscreenToggled', setupDOMandHandlers);
      $(window).on('DOMContentLoaded', setupDOMandHandlers);
      setupDOMandHandlers();
    };

    /**
     * Add to BookReader
     */
    BookReader.prototype.setup = (function(super_) {
      return function(options) {
        super_.call(this, options);
      };
    })(BookReader.prototype.setup);

    /**
     * Initialize plugin
     */
    BookReader.prototype.init = (function(super_) {
      return function() {
        super_.call(this);
        if (this.options.enableMenuToggle) {
          this.installMenuToggle();
        }
      };
    })(BookReader.prototype.init);
  })();
  