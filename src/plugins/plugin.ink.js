// @ts-check
import paper from 'paper/dist/paper-core';
/** @typedef {import('../BookReader/BookModel').PageModel} PageModel */

function makePenTool() {
  const penTool = new paper.Tool();

  /** @type {paper.Path} */
  let path = null;

  /**
     * @param {paper.ToolEvent} event
     */
  penTool.onMouseDown = function (event) {
    // Create a new path and set its stroke color to black:
    path = new paper.Path({
      segments: [event.point],
      strokeColor: 'red',
      strokeWidth: 4,
    });
  }

  /**
     * While the user drags the mouse, points are added to the path
     * at the position of the mouse:
     */
  penTool.onMouseDrag = function (event) {
    // console.log('mousedrag', event);
    path.add(event.point);
  }

  /**
     * @param {paper.ToolEvent} event
     */
  penTool.onMouseUp = function (event) {

  }

  return penTool;
}

/**
 *
 * @param {paper.Project} project
 */
function makeEraserTool(project) {
  const eraserTool = new paper.Tool();

  /** @param {paper.ToolEvent} event */
  eraserTool.onMouseDrag = function(event) {
    const m = project.hitTest(event.point);
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

/**
 * @param {HTMLCanvasElement} canvas
 */
function initCanvas(canvas) {
  paper.setup(canvas);

  const penTool = makePenTool();
  const eraserTool = makeEraserTool(paper.project);
  penTool.activate();

  canvas.addEventListener('pointerdown', ev => {
    if (ev.button == 5) eraserTool.activate();
    else penTool.activate();
  });

  canvas.addEventListener('pointerup', ev => penTool.activate());

  // @ts-ignore
  window.paper = paper;
  return paper.project;
}

class InkPlugin {
  /** @param {import('../BookReader').default} br */
  constructor(br) {
    this.br = br;

    /** @type {{[index: number]: paper.Project}} */
    this.projects = {};
  }

  setup() {

    return this;
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
      .attr('data-page-width', page.width);
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
      const canvas = ev.currentTarget;
      const $canvas = $(canvas);
      const $container = $canvas.parents('.BRpagecontainer');
      const index = $canvas.data('page-index');
      console.log(`Activating project for ${index}`);
      if (!(index in projects)) {
        projects[index] = initCanvas(canvas);
        projects[index].view.scale($container.width() / $canvas.data('page-width'), new paper.Point(0, 0));
      }
      const project = projects[index];
      const { view } = project;

      const curSize = new paper.Size($container.width(), $container.height());
      view.scale(curSize.width / view.viewSize.width, new paper.Point(0, 0));
      view.viewSize = curSize;

      project.activate();
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
    console.log(`Created Page ${index}`);
    const pageContainer = super._createPageContainer(index);
    this._plugins.ink.prependPageCanvas(this._models.book.getPage(index), pageContainer.$container);

    return pageContainer;
  }
}

// @ts-ignore
window.BookReader = BookReaderWithInkPlugin;
