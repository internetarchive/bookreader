import { css } from 'lit';

/**
 * Convert an SVG string to a data URL usable in CSS
 * @param {string} svgString
 * @returns {import('lit').CSSResult}
 */
export function svgToDataUrl(svgString) {
  return css([`data:image/svg+xml;base64,${btoa(svgString.replace(/\n/g, ' '))}`]);
}
