/*
 * jQuery dragscrollable Plugin
 * version: 1.0 (25-Jun-2009)
 * Copyright (c) 2009 Miquel Herrera
 *
 * Portions Copyright (c) 2010 Reg Braithwaite
 *          Copyright (c) 2010 Internet Archive / Michael Ang
 *          Copyright (c) 2016 Internet Archive / Richard Caceres
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Modified by richard@archive.org 2016
 * - Added check to disable on touch enabled devices
 * - Change dragend handler to bind using event "capturing" instead of "bubbling"
 */
(function($) { // secure $ jQuery alias

  /**
 * Adds the ability to manage elements scroll by dragging
 * one or more of its descendant elements. Options parameter
 * allow to specifically select which inner elements will
 * respond to the drag events.
 *
 * options properties:
 * ------------------------------------------------------------------------
 *  dragSelector         | jquery selector to apply to each wrapped element
 *                       | to find which will be the dragging elements.
 *                       | Defaults to '>:first' which is the first child of
 *                       | scrollable element
 * ------------------------------------------------------------------------
 *  acceptPropagatedEvent| Will the dragging element accept propagated
 *	                     | events? default is yes, a propagated mouse event
 *	                     | on a inner element will be accepted and processed.
 *	                     | If set to false, only events originated on the
 *	                     | draggable elements will be processed.
 * ------------------------------------------------------------------------
 *  preventDefault       | Prevents the event to propagate further effectivey
 *                       | disabling other default actions. Defaults to true
 * ------------------------------------------------------------------------
 *  scrollWindow         | Scroll the window rather than the element
 *                       | Defaults to false
 * ------------------------------------------------------------------------
 *
 *  usage examples:
 *
 *  To add the scroll by drag to the element id=viewport when dragging its
 *  first child accepting any propagated events
 *	$('#viewport').dragscrollable();
 *
 *  To add the scroll by drag ability to any element div of class viewport
 *  when dragging its first descendant of class dragMe responding only to
 *  evcents originated on the '.dragMe' elements.
 *	$('div.viewport').dragscrollable({dragSelector:'.dragMe:first',
 *									  acceptPropagatedEvent: false});
 *
 *  Notice that some 'viewports' could be nested within others but events
 *  would not interfere as acceptPropagatedEvent is set to false.
 *
 */

  var append_namespace = function (string_of_events, ns) {

    /* IE doesn't have map
	return string_of_events
		.split(' ')
			.map(function (name) { return name + ns; })
				.join(' ');
    */
    var pieces = string_of_events.split(' ');
    var ret = new Array();
    for (var i = 0; i < pieces.length; i++) {
      ret.push(pieces[i] + ns);
    }
    return ret.join(' ');
  };

  var left_top = function(event) {

    var x;
    var y;
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
      var str = '';
      for (const i in event) {
        str += ', ' + i + ': ' + event[i];
      }
      console.error("don't understand x and y for " + event.type + ' event: ' + str);
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

    return {left: x, top:y};
  };

  $.fn.dragscrollable = function( options ) {

    var handling_element = $(this);

    var settings = $.extend(
      {
        dragSelector:'>:first',
        acceptPropagatedEvent: true,
        preventDefault: true,
        dragstart: 'mousedown touchstart',
        dragcontinue: 'mousemove touchmove',
        dragend: 'mouseup touchend', // mouseleave
        dragMinDistance: 5,
        namespace: '.ds',
        scrollWindow: false,
      },options || {});

    settings.dragstart = append_namespace(settings.dragstart, settings.namespace);
    settings.dragcontinue = append_namespace(settings.dragcontinue, settings.namespace);
    //settings.dragend = append_namespace(settings.dragend, settings.namespace);

    var shouldAbort = function() {
      var isTouchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);
      return isTouchDevice;
    };

    var dragContinueHandlerProxy;

    var dragscroll = {
      dragStartHandler : function(event) {
        if (shouldAbort()) { return true; }

        // mousedown, left click, check propagation
        if (event.which > 1 ||
				(!event.data.acceptPropagatedEvent && event.target != this)) {
          return false;
        }

        event.data.firstCoord = left_top(event);
        // Initial coordinates will be the last when dragging
        event.data.lastCoord = event.data.firstCoord;

        handling_element
          .bind(settings.dragcontinue, event.data, dragscroll.dragContinueHandler)
        //.bind(settings.dragend, event.data, dragscroll.dragEndHandler)
        ;

        // Note, we bind using addEventListener so we can use "capture" binding
        // instead of "bubble" binding
        dragContinueHandlerProxy = function(e) {
          e.data = event.data;
          dragscroll.dragEndHandler(e);
        };
        $.each(settings.dragend.split(' '), function(idx, val) {
          handling_element.get(0).addEventListener(val, dragContinueHandlerProxy, true);
        });

        if (event.data.preventDefault) {
          event.preventDefault();
          return false;
        }
      },
      dragContinueHandler : function(event) { // User is dragging
        // console.log('drag continue');
        if (shouldAbort()) { return true; }

        var lt = left_top(event);

        // How much did the mouse move?
        var delta = {left: (lt.left - event.data.lastCoord.left),
          top: (lt.top - event.data.lastCoord.top)};

        var scrollTarget = event.data.scrollable;
        if (event.data.scrollWindow) {
          scrollTarget = $(window);
        }
        // Set the scroll position relative to what ever the scroll is now
        scrollTarget.scrollLeft( scrollTarget.scrollLeft() - delta.left );
        scrollTarget.scrollTop(	scrollTarget.scrollTop() - delta.top );

        // Save where the cursor is
        event.data.lastCoord = lt;

        if (event.data.preventDefault) {
          event.preventDefault();
          return false;
        }
      },
      dragEndHandler : function(event) { // Stop scrolling
        //console.log('dragEndHandler');

        if (shouldAbort()) { return true; }

        handling_element
          .unbind(settings.dragcontinue)
        // Note, for some reason, even though I removeEventListener below,
        // this call to unbind is still necessary. I don't know why.
          .unbind(settings.dragend)
        ;

        // Note, we bind using addEventListener so we can use "capture" binding
        // instead of "bubble" binding
        $.each(settings.dragend.split(' '), function(idx, val) {
          handling_element.get(0).removeEventListener(val, dragContinueHandlerProxy, true);
        });

        // How much did the mouse move total?
        var delta = {left: Math.abs(event.data.lastCoord.left - event.data.firstCoord.left),
          top: Math.abs(event.data.lastCoord.top - event.data.firstCoord.top)};
        var distance = Math.max(delta.left, delta.top);

        // Allow event to propagate if min distance was not achieved
        if (event.data.preventDefault && distance > settings.dragMinDistance) {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
          return false;
        }
      }
    };

    // set up the initial events
    return this.each(function() {
      // closure object data for each scrollable element
      var data = {scrollable : $(this),
        acceptPropagatedEvent : settings.acceptPropagatedEvent,
        preventDefault : settings.preventDefault,
        scrollWindow : settings.scrollWindow };
      // Set mouse initiating event on the desired descendant
      $(this).find(settings.dragSelector).
        bind(settings.dragstart, data, dragscroll.dragStartHandler);
    });
  }; //end plugin dragscrollable

  // Note, this probably doesn't work anymore with our modifications - Nov/8/2016
  $.fn.removedragscrollable = function (namespace) {
    if (typeof(namespace) == 'undefined')
      namespace = '.ds';
    return this.each(function() {
      $(document).find('*').andSelf().unbind(namespace);
    });
  };

})( jQuery ); // confine scope
