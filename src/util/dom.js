// @ts-check
import { clamp } from '../BookReader/utils.js';

/**
 * Walks up the DOM tree starting at (but not including) the given element,
 * returning the nearest ancestor that can actually scroll its overflow.
 * @param {Element} el
 * @return {Element | null}
 */
export function findScrollableAncestor(el) {
  let current = el.parentElement;
  while (current) {
    const style = getComputedStyle(current);
    const canScrollY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
    const canScrollX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && current.scrollWidth > current.clientWidth;
    if (canScrollY || canScrollX) return current;
    current = current.parentElement;
  }
  return null;
}

/**
 * Computes the scroll offset for a single axis needed to align an element
 * within a container, per the same semantics as scrollIntoView's block/inline.
 * @param {number} elStart
 * @param {number} elEnd
 * @param {number} containerStart
 * @param {number} containerEnd
 * @param {number} currentScroll
 * @param {'start' | 'center' | 'end' | 'nearest'} align
 * @return {number}
 */
function computeAxisScroll(elStart, elEnd, containerStart, containerEnd, currentScroll, align) {
  let delta = 0;
  switch (align) {
  case 'start':
    delta = elStart - containerStart;
    break;
  case 'end':
    delta = elEnd - containerEnd;
    break;
  case 'center':
    delta = (elStart + elEnd) / 2 - (containerStart + containerEnd) / 2;
    break;
  case 'nearest':
  default:
    if (elStart < containerStart) delta = elStart - containerStart;
    else if (elEnd > containerEnd) delta = elEnd - containerEnd;
    break;
  }
  return currentScroll + delta;
}

/**
 * Scrolls the given element into view within a single scroll container.
 *
 * Unlike the native `Element.scrollIntoView`, this never walks up and scrolls
 * every scrollable ancestor in turn (which can otherwise unexpectedly move
 * the whole page) — it only ever adjusts the scroll position of one
 * container: either the one explicitly passed in, or the nearest scrollable
 * ancestor found via {@link findScrollableAncestor}.
 * @param {Element} el
 * @param {object} [options]
 * @param {'auto' | 'smooth'} [options.behavior]
 * @param {'start' | 'center' | 'end' | 'nearest'} [options.block]
 * @param {'start' | 'center' | 'end' | 'nearest'} [options.inline]
 * @param {Element} [options.scrollContainer] The scrollable element whose
 *   scroll position should be adjusted. Defaults to `findScrollableAncestor(el)`.
 */
export function singleScrollIntoView(el, options) {
  const { block = 'start', inline = 'nearest', behavior = 'auto', scrollContainer = findScrollableAncestor(el) } = options || {};
  if (!scrollContainer) {
    el.scrollIntoView({ block, inline, behavior });
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  const top = computeAxisScroll(elRect.top, elRect.bottom, containerRect.top, containerRect.bottom, scrollContainer.scrollTop, block);
  const left = computeAxisScroll(elRect.left, elRect.right, containerRect.left, containerRect.right, scrollContainer.scrollLeft, inline);

  scrollContainer.scrollTo({
    top: clamp(top, 0, scrollContainer.scrollHeight - scrollContainer.clientHeight),
    left: clamp(left, 0, scrollContainer.scrollWidth - scrollContainer.clientWidth),
    behavior,
  });
}
