/**
 * @param {Node} node
 * @returns {Element}
 */
export function closestElement(node) {
  if (node instanceof Element) return node;
  if (node.parentElement) return node.parentElement;
  throw new Error('Node is detached from the document and has no parent element');
}
