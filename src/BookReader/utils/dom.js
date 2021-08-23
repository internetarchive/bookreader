import { debounce } from '../utils';

/**
 * Computing these things repeatedly is expensive (the browser needs to
 * do a lot of computations/redrawing to make sure these are correct),
 * so we store them here, and only recompute them when necessary:
 * - window resize could have cause the container to change size
 * - zoom could have cause scrollbars to appear/disappear, changing
 *   the client size.
 * @param {typeof LitElement} superClass
 */
export function CachedDimensionsMixin(superClass) {
  return class CachedDimensionsMixin extends superClass {
    containerClientWidth = 100;
    containerClientHeight = 100;

    containerBoundingClient = { top: 0, left: 0 };

    /** @override */
    firstUpdated(changedProps) {
      super.firstUpdated(changedProps);
      this.updateClientSizes();
    }

    updateClientSizes = () => {
      const bc = this.getBoundingClientRect();
      this.containerClientWidth = this.clientWidth;
      this.containerClientHeight = this.clientHeight;
      this.containerBoundingClient.top = bc.top;
      this.containerBoundingClient.left = bc.left;
    }
    debouncedUpdateClientSizes = debounce(this.updateClientSizes, 150, false);

    /** @override */
    connectedCallback() {
      super.connectedCallback();
      window.addEventListener('resize', this.debouncedUpdateClientSizes);
    }

    /** @override */
    disconnectedCallback() {
      window.removeEventListener('resize', this.debouncedUpdateClientSizes);
      super.disconnectedCallback();
    }
  };
}
