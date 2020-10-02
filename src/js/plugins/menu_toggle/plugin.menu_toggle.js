
/* global BookReader */
/**
 * Plugin for managing menu visibility
 * Enabling this plug-in:
 * + removes the "menu tab" triangle
 * + toggles nav at: book center tap/click
 * + toggles nav at: black background tap/click
 *
 * Handles to events at CAPTURE phase
 *
 * This uses core BookReader functions and parameters to check its UI state:
 * - br.refs = (at best) ui references that are present at any given time
 * - br.navigationIsVisible() - checks using refs to confirm the navbar's presence
 * - br.showNavigation() & br.hideNavigation()
 * - br.constMode1up checks against br.mode;
 *
 * The list of BookReader custom events this plugin taps into are mainly
 * listed in the `.init` function
 */

(function addMenuToggler() {
  jQuery.extend(BookReader.defaultOptions, {
    enableMenuToggle: true
  });

  /**
     * `holdOffOnToggle` is used in fn `toggleRouter`
     * to determine if menu toggle should happen
     * set by `registerDragHandlers`
     */
  let holdOffOnToggle = false;

  /**
     * Hides Nav arrow tab
     *
     * @param { object } br - BookReader instance
     */
  function hideArrow(br) {
    if (!br.refs || !br.refs.$BRnav) {
      return;
    }
    const $menuTab = br.refs.$BRnav.children('.BRnavCntl');
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
  const removeClickHandlers = function removeClickHandlers(br) {
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
  let togglingNav = false; /* flag to make sure animations only fire once */
  const toggleNav = function toggleNav(br) {
    if (togglingNav) {
      return;
    }

    togglingNav = true;
    const navToggled = function navToggled() {
      togglingNav = false;
      window.removeEventListener('BookReader:navToggled', navToggled);
    };
    $(document).on('BookReader:navToggled', navToggled);

    const menuIsShowing = br.navigationIsVisible();
    if (menuIsShowing) {
      br.hideNavigation();
    } else {
      br.showNavigation();
    }
  }

  /**
     * Check if div `BRcontainer` is scrollable.
     * This normally happens when bookreader is zoomed in.
     * not using br.refs, because `scrollWidth` & `offsetWidth` is not easily accessible.
     */
  const isBRcontainerScrollable = function isBRcontainerScrollable() {
    const brContainer = document.querySelector('.BRcontainer');
    const scrollWidth = brContainer.scrollWidth;
    const offsetWidth = brContainer.offsetWidth;

    return scrollWidth > offsetWidth;
  }

  /**
     * Confirms whether or not the click happened in the nav toggle zone
     *
     * @param { MouseEvent } event - JS click event object
     * @param { DOM } book - DOM element that represents book
     */
  const isCenterClick = function isCenterClick(event, book) {
    const clickPosition = event.clientX;
    const bookWidth = book.offsetWidth;
    const leftOffset = book.offsetLeft
    const bookEndPageFlipArea = Math.round(bookWidth / 3);
    const leftThreshold = Math.round(bookEndPageFlipArea + leftOffset); // without it, the click area is small
    const rightThreshold = Math.round(bookWidth - bookEndPageFlipArea + leftOffset);
    const isOkOnRight = clickPosition > leftThreshold;
    const isOkOnLeft = clickPosition < rightThreshold;
    const isCenterClick = isOkOnRight && isOkOnLeft;

    return isCenterClick;
  }

  /**
     * Confirms whether or not the click happened in the background
     *
     * @param { DOM } element
     */
  const isBackground = function isBackground(element) {
    const isBackgroundClick = $(element).hasClass('BookReader')
        || $(element).hasClass('BRcontainer') /* main black theatre */
        || $(element).hasClass('BRemptypage') /* empty page placeholder */
        || $(element).hasClass('BRpageview') /* empty page placeholder, 1up */
        || $(element).hasClass('BRtwopageview'); /* empty page placeholder, 2up */
    return isBackgroundClick;
  };

  /**
     * Main hook into toggle functionality
     * This is the only function that should be called by the event handlers
     *
     * @param { object } br - BookReader instance
     * @param { MouseEvent } e - JS event object
     * @param { boolean } atBookCenter - optional
     */
  const toggleRouter = function toggleRouter (br, e, atBookCenter) {
    if (holdOffOnToggle) {
      return;
    }

    const book = isBRcontainerScrollable() ? br.refs.$brContainer[0] : e.currentTarget;
    const is1UpMode = br.constMode1up === br.mode;
    const validBookClick = is1UpMode || isCenterClick(e, book);
    const isValidClickArea = atBookCenter ? validBookClick : isBackground(e.target);
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
     * @param { MouseEvent } e - JS event object
     */
  function onBackgroundClick(br, e) {
    toggleRouter(br, e);
  }

  /**
     * actual book container click event handler
     *
     * @param { object } br - BookReader instance
     * @param { MouseEvent } e - JS event object
     */
  function onBookClick(br, e) {

    const atBookCenter = true;
    toggleRouter(br, e, atBookCenter);
  }

  let initialX;
  let initialY;
  /**
     * attaches mouseup & mousedown event handlers to assess if user is dragging
     * sets `initialX`, `initialY`, and `holdOffOnToggle`
     */
  function registerDragHandlers() {
    const background = document.querySelector('.BookReader');
    if (!background) {
      return;
    }

    background.addEventListener('mousedown', function (e) {
      initialX = e.screenX;
      initialY = e.screenY;

      holdOffOnToggle = true;
    }, true);
    background.addEventListener('mouseup', function (e) {
      const isDrag = (Math.abs(initialX - e.screenX) > 5 || Math.abs(initialY - e.screenY) > 5);

      if (!isDrag) {
        holdOffOnToggle = false;
        initialX = 0;
        initialY = 0;
      }
    }, true);
  }

  /**
     * attaches click handlers to background & book
     * @param { object } br - BookReader instance
     */
  function registerClickHandlers(br) {
    const background = document.querySelector('.BookReader');
    if (!background) {
      return;
    }

    background.addEventListener('click', onBackgroundClick.bind(null, br), { capture: true, passive: true });

    const desk = document.querySelector('.BRcontainer') || {};
    const book = desk.firstChild;

    if (book) {
      book.addEventListener('click', onBookClick.bind(null, br), true);
      registerDragHandlers();
    }
  }

  /**
     * Install menu toggle
     * attaches event handlers, sets up DOM on load
     */
  const installMenuToggle = function installMenuToggle(br) {
    let hasNav = false;

    try {
      hasNav = br.navigationIsVisible();
    } catch (error) {
      hasNav = false;
    }

    if (!hasNav) {
      return;
    }

    const menuToggleEventRegister = function menuToggleEventRegister(e) {
      registerClickHandlers(br);
    };

    const setupDOMandHandlers = function setupDOMandHandlers(e) {
      setupNavForToggle(br);
    };

    const persistNav = function persistNav(e) {
      alwaysShowNav(br);
    };

    const whenToToggleNav = [
      'BookReader:1PageViewSelected',
      'BookReader:2PageViewSelected',
      'BookReader:zoomIn',
      'BookReader:zoomOut',
      'BookReader:resize'
    ];

    const whenTolwaysShowNavWhen = [
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
        installMenuToggle(this);
      }
    };
  })(BookReader.prototype.init);
})();
