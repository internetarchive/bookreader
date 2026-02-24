/** Adds a class while the given element is experiencing scrolling */
export class ScrollClassAdder {
  /**
   * @param {HTMLElement} element
   * @param {string} className
   */
  constructor(element, className) {
    /** @type {HTMLElement} */
    this.element = element;
    /** @type {string} */
    this.className = className;
    this.timeout = null;
  }

  attach() {
    this.element.addEventListener('scroll', this.onScroll);
  }

  detach() {
    this.element.removeEventListener('scroll', this.onScroll);
  }

  onScroll = () => {
    this.element.classList.add(this.className);
    clearTimeout(this.timeout);
    // TODO: Also remove class on mousemove, touch, click, etc.
    this.timeout = setTimeout(() => {
      this.element.classList.remove(this.className);
    }, 600);
  }
}
