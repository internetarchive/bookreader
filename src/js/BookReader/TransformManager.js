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
        x: 0.5,
        y: 0.5,
      }
    };

    this.animationFrameRequest = 0;
  }

  _calculateContainerCenter(c = this.containingEl) {
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
    this.animationFrameRequest = window.requestAnimationFrame(this.step.bind(this));
    this.containingEl.classList.add('BRTransformManager');
  }

  /**
   * @param {object} param0
   * @param {number} param0.scale
   */
  applyTentativeTransform({ scale }) {
    this.scale.tentative *= scale;
  }

  step() {
    this.transformingEl.style.transform = `scale(${this.scale.tentative}) translate3d(0px, 0px, 0px)`;

    const c = this.containingEl;
    const desiredScrollLeft = this.scale.startCenter.x * c.scrollWidth - c.clientWidth / 2;
    const desiredScrollTop = this.scale.startCenter.y * c.scrollHeight - c.clientHeight / 2;
    c.scrollLeft = desiredScrollLeft;
    c.scrollTop = desiredScrollTop;
    this.animationFrameRequest = window.requestAnimationFrame(this.step.bind(this));
  }

  cancelTransform() {
    this.transformInProgress = false;
    this.transformingEl.style.transform = `scale(${this.scale.finalized}) translate3d(0px, 0px, 0px)`;
    window.cancelAnimationFrame(this.animationFrameRequest);
    this.containingEl.classList.remove('BRTransformManager');
  }

  finalizeTransform() {
    // TODO: Zooming out more than 1 results in things being uncentered
    this.scale.finalized = this.scale.tentative;
    this.transformInProgress = false;
    window.cancelAnimationFrame(this.animationFrameRequest);
    this.containingEl.classList.remove('BRTransformManager');
  }
}
