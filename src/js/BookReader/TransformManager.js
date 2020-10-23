// @ts-check
export class TransformManager {
  /**
   * @param {object} param0
   * @param {HTMLElement} param0.transformingEl The element we will be transforming
   * @param {HTMLElement} param0.containingEl The container element
   */
  constructor({ transformingEl, containingEl }) {
    this.transformingEl = transformingEl;
    this.containingEl = containingEl;
    this.transformingEl.style.transformOrigin = '0 0';

    this.transformInProgress = false;

    this.scale = {
      finalized: 1,
      tentative: 1,
      startCenter: {
        x: 50,
        y: 50,
      }
    };
  }

  _calculateContainerCenter() {
    const c = this.containingEl;
    return {
      x: (c.scrollLeft + c.clientWidth / 2) / c.scrollWidth,
      y: (c.scrollTop + c.clientHeight / 2) / c.scrollHeight,
    };
  }

  beginTransform() {
    this.transformInProgress = true;
    this.scale.tentative = this.scale.finalized;
    this.scale.startCenter = this._calculateContainerCenter();
    this.transformingEl.style.transformOrigin = '0 0';
  }

  /**
   * @param {object} param0
   * @param {number} param0.scale
   */
  applyTentativeTransform({ scale }) {
    this.scale.tentative *= scale;
    this.transformingEl.style.transform = `scale(${this.scale.tentative})`;

    const c = this.containingEl;
    c.scrollLeft = this.scale.startCenter.x * c.scrollWidth - c.clientWidth / 2;
    c.scrollTop = this.scale.startCenter.y * c.scrollHeight - c.clientHeight / 2;
  }

  cancelTransform() {
    this.transformInProgress = false;
    this.transformingEl.style.transform = `scale(${this.scale.finalized})`;
  }

  finalizeTransform() {
    // Don't allow zooming out more than 1; this doesn't work because we can't
    // set scrollLeft/scrollTop to finalize the zoom in a centered position
    this.scale.finalized = Math.max(1, this.scale.tentative);
    this.transformInProgress = false;
  }
}
