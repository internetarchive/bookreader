// @ts-check
import 'pepjs';
import paper from 'paper/dist/paper-core';
import { Mode1Up } from '../BookReader/Mode1Up';
import { Mode2Up } from '../BookReader/Mode2Up';
/** @typedef {import('../BookReader/BookModel').PageModel} PageModel */

class PenTool extends paper.Tool {
  /** @type {paper.Path} */
  path = null;

  constructor() {
    super();

    /**
     * @param {paper.ToolEvent} event
     */
    this.onMouseDown = (event) => {
      if (event.event.pointerType != 'pen') return;
      const scale = window.br.activeMode instanceof Mode1Up ? window.br.activeMode.mode1UpLit.scale :
        window.br.activeMode instanceof Mode2Up ? window.br.activeMode.scale :
          1;
      // Create a new path and set its stroke color to black:
      this.path = new paper.Path({
        segments: [event.point.divide(scale)],
        strokeColor: 'red',
        strokeWidth: 2,
      });
    };

    this.onMouseDrag =  (event) => {
      if (event.event.pointerType != 'pen') return;
      const scale = window.br.activeMode instanceof Mode1Up ? window.br.activeMode.mode1UpLit.scale :
        window.br.activeMode instanceof Mode2Up ? window.br.activeMode.scale :
          1;
      this.path.add(event.point.divide(scale));
    };

    this.onMouseUp = (event) => {
      if (event.event.pointerType != 'pen') return;
      this.path = null;
    };
  }
}

function makeEraserTool() {
  const eraserTool = new paper.Tool();

  /** @param {paper.ToolEvent} event */
  eraserTool.onMouseDrag = function(event) {
    const scale = window.br.activeMode instanceof Mode1Up ? window.br.activeMode.mode1UpLit.scale :
      window.br.activeMode instanceof Mode2Up ? window.br.activeMode.scale :
        1;
    const m = paper.project.hitTest(event.point.divide(scale));
    if (m) m.item.remove();
  };

  return eraserTool;
}

// class InkAnnotationLayer {
//     afterPageFetch(page) {

//     }

//     afterPageRendered(page, $pageContainer) {

//     }

//     afterPageDestroyed(page) {

//     }
// }

class InkPlugin {
  /** @type {{[index: number]: paper.Project}} */
  projects = {};

  // Tools
  penTool = new PenTool();
  eraserTool = makeEraserTool();

  /** @param {import('../BookReader').default} br */
  constructor(br) {
    this.br = br;
  }

  setup() {
    return this;
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  initProject(canvas) {
    paper.setup(canvas);
    this.penTool.activate();

    canvas.addEventListener('pointerdown', ev => {
      if (ev.button == 5) this.eraserTool.activate();
      else this.penTool.activate();
    });

    canvas.addEventListener('pointerup', ev => this.penTool.activate());

    // @ts-ignore
    window.paper = paper;
    return paper.project;
  }

  /**
     * Construct or re-use the canvas, and add it to the given page container
     * @param {PageModel} page
     * @param {JQuery<HTMLElement>} $pageContainer
     */
  prependPageCanvas(page, $pageContainer) {
    let $canvas = $pageContainer.find('canvas');
    if (!$canvas.length) {
      $canvas = page.index in this.projects ?
        $(this.projects[page.index].view.element) :
        $(`<canvas class="BR-ink-canvas" />`);
      $pageContainer.prepend($canvas);
    }

    return $canvas
      .attr('data-page-index', page.index)
      .attr('data-page-width', page.width)
      .attr('data-page-height', page.height);
  }
}

const BookReader = /** @type {typeof import('../BookReader').default} */(window.BookReader);

class BookReaderWithInkPlugin extends BookReader {
  /**
     * @param {BookReaderOptions} options
     */
  setup(options) {
    super.setup(options);
    this._plugins = {
      ink: new InkPlugin(this).setup()
    };
  }

  init() {
    super.init();
    const { projects } = this._plugins.ink;
    this.$('.BRcontainer').on('pointerover pointerdown', '.BR-ink-canvas', ev => {
      if (ev.originalEvent.pointerType != 'pen') return;

      const canvas = ev.currentTarget;
      const $canvas = $(canvas);
      // this.$('.BRcontainer').addClass('pen-hover');
      // $(document).one('pointerleave', ev => this.$('.BRcontainer').removeClass('pen-hover'))
      const index = $canvas.data('page-index');
      if (!(index in projects)) {
        projects[index] = this._plugins.ink.initProject(canvas);
        projects[index].view.setViewSize(new paper.Size($canvas.data('page-width'), $canvas.data('page-height')));

      }
      projects[index].activate();
    });


    // Prevent scrolling document with pen
    let isPen = false;

    // Copypasta from https://stackoverflow.com/a/49375331/2317712
    // to prevent pen scrolling
    const $brContainer = this.$('.BRcontainer');
    $brContainer[0].addEventListener("pointerdown", e => {
      isPen = e.pointerType == "pen";
      e.preventDefault();
    }, { capture: true });

    $brContainer[0].addEventListener("touchstart", e => isPen && e.preventDefault(), {
      passive: false,
      capture: false
    });
  }

  /**
     * @param {import('../BookReader/BookModel').PageIndex} index
     */
  _createPageContainer(index) {
    const pageContainer = super._createPageContainer(index);
    this._plugins.ink.prependPageCanvas(this._models.book.getPage(index), pageContainer.$container);

    return pageContainer;
  }
}

// @ts-ignore
window.BookReader = BookReaderWithInkPlugin;
