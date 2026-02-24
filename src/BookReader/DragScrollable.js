// @ts-check
/*
 * jQuery dragscrollable Plugin
 * Based off version: 1.0 (25-Jun-2009)
 * Copyright (c) 2009 Miquel Herrera
 *
 * Portions Copyright (c) 2010 Reg Braithwaite
 *          Copyright (c) 2010 Internet Archive / Michael Ang
 *          Copyright (c) 2016 Internet Archive / Richard Caceres
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

/**
 * @param {string} string_of_events
 * @param {string} ns
 * @returns
 */
function append_namespace(string_of_events, ns) {
  return string_of_events
    .split(' ')
    .map(event_name => event_name + ns)
    .join(' ');
}

function left_top(event) {
  /** @type {number} */
  let x;
  /** @type {number} */
  let y;
  if (typeof(event.clientX) != 'undefined') {
    x = event.clientX;
    y = event.clientY;
  }
  else if (typeof(event.screenX) != 'undefined') {
    x = event.screenX;
    y = event.screenY;
  }
  else if (typeof(event.targetTouches) != 'undefined') {
    x = event.targetTouches[0].pageX;
    y = event.targetTouches[0].pageY;
  }
  else if (typeof(event.originalEvent) == 'undefined') {
    console.error("don't understand x and y for " + event.type, event);
  }
  else if (typeof(event.originalEvent.clientX) != 'undefined') {
    x = event.originalEvent.clientX;
    y = event.originalEvent.clientY;
  }
  else if (typeof(event.originalEvent.screenX) != 'undefined') {
    x = event.originalEvent.screenX;
    y = event.originalEvent.screenY;
  }
  else if (typeof(event.originalEvent.targetTouches) != 'undefined') {
    x = event.originalEvent.targetTouches[0].pageX;
    y = event.originalEvent.targetTouches[0].pageY;
  }

  return { left: x, top: y };
}

const DEFAULT_OPTIONS = {
  /**
   * @type {String|HTMLElement} jQuery selector to apply to each wrapped element to
   * find which will be the dragging elements. Defaults to the first child of scrollable
   * element
   */
  dragSelector: '>:first',

  /** Will the dragging element accept propagated events? default is yes, a propagated
   * mouse event on a inner element will be accepted and processed. If set to false,
   * only events originated on the draggable elements will be processed. */
  acceptPropagatedEvent: true,

  /**
   * Prevents the event to propagate further effectively disabling other default actions
   */
  preventDefault: true,

  dragstart: 'mousedown touchstart',
  dragcontinue: 'mousemove touchmove',
  dragend: 'mouseup touchend', // mouseleave
  dragMinDistance: 5,
  namespace: '.ds',

  /** Scroll the window rather than the element */
  scrollWindow: false,
};

/**
 * Adds the ability to manage elements scroll by dragging
 * one or more of its descendant elements. Options parameter
 * allow to specifically select which inner elements will
 * respond to the drag events.
 *  usage examples:
 *
 *  To add the scroll by drag to the element id=viewport when dragging its
 *  first child accepting any propagated events
 *	`new DragScrollable($('#viewport')[0]);`
 *
 *  To add the scroll by drag ability to any element div of class viewport
 *  when dragging its first descendant of class dragMe responding only to
 *  evcents originated on the '.dragMe' elements.
 *	```js
 *  new DragScrollable($('div.viewport')[0], {
 *      dragSelector: '.dragMe:first',
 *	    acceptPropagatedEvent: false
 *  });
 * ```
 *
 *  Notice that some 'viewports' could be nested within others but events
 *  would not interfere as acceptPropagatedEvent is set to false.
 */
export class DragScrollable {
  /**
   * @param {HTMLElement} element
   * @param {Partial<DEFAULT_OPTIONS>} options
   */
  constructor(element, options = {}) {
    this.handling_element = $(element);
    /** @type {typeof DEFAULT_OPTIONS} */
    this.settings = $.extend({}, DEFAULT_OPTIONS, options || {});
    this.firstCoord = { left: 0, top: 0 };
    this.lastCoord = { left: 0, top: 0 };

    this.settings.dragstart = append_namespace(this.settings.dragstart, this.settings.namespace);
    this.settings.dragcontinue = append_namespace(this.settings.dragcontinue, this.settings.namespace);
    //settings.dragend = append_namespace(settings.dragend, settings.namespace);

    // Set mouse initiating event on the desired descendant
    this.handling_element.find(this.settings.dragSelector)
      .on(this.settings.dragstart, this._dragStartHandler);
  }

  _shouldAbort() {
    const isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
    return isTouchDevice;
  }

  /** @param {MouseEvent} event */
  _dragStartHandler = (event) => {
    if (this._shouldAbort()) { return true; }

    // mousedown, left click, check propagation
    if (event.which > 1 ||
    (!this.settings.acceptPropagatedEvent && event.target != this.handling_element[0])) {
      return false;
    }

    // Initial coordinates will be the last when dragging
    this.lastCoord = this.firstCoord = left_top(event);

    this.handling_element
      .on(this.settings.dragcontinue, this._dragContinueHandler)
    //.on(this.settings.dragend, this._dragEndHandler)
    ;

    // Note, we bind using addEventListener so we can use "capture" binding
    // instead of "bubble" binding
    this.settings.dragend.split(' ').forEach(event_name => {
      this.handling_element[0].addEventListener(event_name, this._dragEndHandler, true);
    });

    if (this.settings.preventDefault) {
      event.preventDefault();
      return false;
    }
  }

  /** @param {MouseEvent} event */
  _dragContinueHandler = (event) => { // User is dragging
    // console.log('drag continue');
    if (this._shouldAbort()) { return true; }

    const lt = left_top(event);

    // How much did the mouse move?
    const delta = {
      left: (lt.left - this.lastCoord.left),
      top: (lt.top - this.lastCoord.top),
    };

    const scrollTarget = this.settings.scrollWindow ? $(window) : this.handling_element;

    // Set the scroll position relative to what ever the scroll is now
    scrollTarget.scrollLeft( scrollTarget.scrollLeft() - delta.left );
    scrollTarget.scrollTop(	scrollTarget.scrollTop() - delta.top );

    // Save where the cursor is
    this.lastCoord = lt;

    if (this.settings.preventDefault) {
      event.preventDefault();
      return false;
    }
  }

  /** @param {MouseEvent} event */
  _dragEndHandler = (event) => { // Stop scrolling
    //console.log('dragEndHandler');

    if (this._shouldAbort()) { return true; }

    this.handling_element
      .off(this.settings.dragcontinue)
      // Note, for some reason, even though I removeEventListener below,
      // this call to unbind is still necessary. I don't know why.
      .off(this.settings.dragend);

    // Note, we bind using addEventListener so we can use "capture" binding
    // instead of "bubble" binding
    this.settings.dragend.split(' ').forEach(event_name => {
      this.handling_element[0].removeEventListener(event_name, this._dragEndHandler, true);
    });

    // How much did the mouse move total?
    const delta = {
      left: Math.abs(this.lastCoord.left - this.firstCoord.left),
      top: Math.abs(this.lastCoord.top - this.firstCoord.top),
    };
    const distance = Math.max(delta.left, delta.top);

    // Allow event to propagate if min distance was not achieved
    if (this.settings.preventDefault && distance > this.settings.dragMinDistance) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      return false;
    }
  }
}
