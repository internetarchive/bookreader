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
  /** @type {{[index: number]: object}} */
  projectsFile = {};
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

  export() {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(this.projects)
          .filter(([index, project]) => !project.isEmpty())
          .map(([index, project]) => [index, project.exportJSON({ asString: false })]),
      )
    );
  }

  /** @param {string} exportJsonStr */
  import(exportJsonStr) {
    this.projectsFile = JSON.parse(exportJsonStr);
    for (const indexStr in this.projectsFile) {
      const index = parseFloat(indexStr);
      const page = this.br._models.book.getPage(index);
      const activePageContainerEls = this.br.getActivePageContainerElementsForIndex(index);
      for (const el of activePageContainerEls) {
        const canvas = /** @type {HTMLCanvasElement} */($(el).find('.BR-ink-canvas')[0]);
        if (!canvas) continue;
        if (!(index in this.projects)) {
          this.projects[indexStr] = this.createProject(page, canvas);
        }
        this.projects[indexStr].importJSON(this.projectsFile[indexStr]);
      }
    }
  }

  /**
   * Construct or re-use the canvas, and add it to the given page container
   * @param {PageModel} page
   */
  createCanvas(page) {
    /** @type {JQuery<HTMLCanvasElement>} */
    const $canvas = page.index in this.projects ?
      $(this.projects[page.index].view.element) :
      $(`<canvas class="BR-ink-canvas" />`);

    if (page.index in this.projectsFile) {
      if (!(page.index in this.projects)) {
        this.projects[page.index] = this.createProject(page, $canvas[0]);
      }
      this.projects[page.index].importJSON(this.projectsFile[page.index]);
    }

    return $canvas;
  }

  /**
   * @param {PageModel} page
   * @param {HTMLCanvasElement} canvas
   */
  createProject(page, canvas) {
    paper.setup(canvas);
    this.penTool.activate();
    paper.project.view.setViewSize(new paper.Size(page.width, page.height));

    canvas.addEventListener('pointerdown', ev => {
      if (ev.button == 5) this.eraserTool.activate();
      else this.penTool.activate();
    });

    canvas.addEventListener('pointerup', ev => this.penTool.activate());

    // @ts-ignore
    window.paper = paper;
    return paper.project;
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
      const pageIndex = parseFloat(
        $canvas.closest('.BRpagecontainer')
          .attr('class')
          .match(/pagediv\d+/)[0]
          .slice('pagediv'.length)
      );
      if (!(pageIndex in projects)) {
        const page = this._models.book.getPage(pageIndex);
        projects[pageIndex] = this._plugins.ink.createProject(page, canvas);
      }
      projects[pageIndex].activate();
    });


    const $brContainer = this.$('.BRcontainer');
    $brContainer[0].addEventListener("pointerover", e => {
      if (e.pointerType == 'pen') {
        $brContainer.addClass('pen-hover');
      }
    }, { passive: true, capture: true });

    $brContainer[0].addEventListener("pointerleave", e => {
      if (e.pointerType == 'pen') {
        $brContainer.removeClass('pen-hover');
      }
    }, { passive: true, capture: true });

    // Prevent scrolling document with pen
    let isPen = false;

    // Copypasta from https://stackoverflow.com/a/49375331/2317712
    // to prevent pen scrolling
    $brContainer[0].addEventListener("pointerdown", e => {
      isPen = e.pointerType == "pen";
      if (isPen) e.preventDefault();
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
    if (!pageContainer.$container.find('.BR-ink-canvas').length) {
      pageContainer.$container
        .append(this._plugins.ink.createCanvas(this._models.book.getPage(index)));
    }

    return pageContainer;
  }
}

// @ts-ignore
window.BookReader = BookReaderWithInkPlugin;
