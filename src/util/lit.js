import { css } from 'lit';

/**
 * Convert an SVG string to a data URL usable in CSS
 * @param {import('lit').TemplateResult} svgTemplate - The SVG template to convert
 * @returns {import('lit').CSSResult}
 */
export function svgToDataUrl(svgTemplate) {
  const svgString = (
    // No clue why, on prod the template from the close icon comes in as a class instead of a TemplateResult.
    // Might be a discrepancy with lit versions.
    svgTemplate.prototype?.render() ||
    // Otherwise it's a normal TemplateResult.
    svgTemplate.strings[0]
  );
  return css([`data:image/svg+xml;base64,${btoa(svgString.replace(/\n/g, ' '))}`]);
}
