import { html, LitElement } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { live } from "lit/directives/live.js";
import { BookReaderTextFragment, getNodeTextLayer, renderHighlight } from "../util/TextSelectionManager.js";
import '@internetarchive/icon-share';
// eslint-disable-next-line no-unused-vars
import { OlPopover } from "../util/OlPopover.js";
import { BookReaderPlugin } from "../BookReaderPlugin.js";

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

const BR_HIGHLIGHTS_LOCAL_STORAGE_KEY = "BRhighlightStorage";

export class AnnotationsPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
  }

  /** @type {AnnotationStorageService} */
  storageService;

  /** @type {BRSelectMenu} */
  selectMenu;

  /** @type {BRAnnotationModal} */
  annotationModal;

  /**
   * Nodes corresponding to the current text selection
   *  @type {HTMLElement[]} */
  activeHighlightNodes;

  constructor(br) {
    super(br);
    this.annotationModal = new BRAnnotationModal(br);
    this.annotationModal.className = "br-annotate-menu__root";
  }

  /** @override */
  init() {
    if (!this.options.enabled) return;
    this.storageService = new AnnotationStorageService({storageMethod : window.localStorage});
    this.selectMenu = this.br.plugins?.textSelection?.textSelectionManager?.selectMenu;

    this.selectMenu.annotationOptions.push(
      {clickFunction: this.handleHighlightSave.bind(this), iconName: "edit-pencil", labelName: "Highlight"},
      {clickFunction: this.handleAddAnnotation.bind(this), iconName: "edit-pencil", labelName: "Annotate"},
    );
    this.selectMenu.extendedOptions.push(
      {clickFunction: this.renderSavedHighlights.bind(this), iconName: "share", labelName: "Load Highlights"},
      {clickFunction: this.handleHighlightDelete.bind(this), iconName: "share", labelName: "Delete Current Highlight / Annotation"},
      {clickFunction: ()=> {window.localStorage.removeItem(BR_HIGHLIGHTS_LOCAL_STORAGE_KEY);}, iconName: "share", labelName: "Clear All Highlights and Annotations"},
    );

    if (!this.annotationModal.isConnected) {
      document.body.append(this.annotationModal);
    }
  }

  /**
   * @param {MouseEvent} e
   */
  handleAddAnnotation (e) {
    const anchorEl = /** @type {HTMLElement} */ (e.currentTarget);
    if (!this.activeHighlightNodes) { // highlight selection if not already done
      this.handleHighlightSave();
    }
    this.annotationModal.show(this.activeHighlightNodes, anchorEl);
    window.getSelection()?.empty();
    this.activeHighlightNodes = null;
  }

  /**
   * Retrieves the current selected text on the page and serializes the quote contents + context
   * The selection is also changed in the DOM to highlight the words
   */
  handleHighlightSave() {
    const currentSelection = window.getSelection();
    const start = currentSelection.direction === 'backward' ? currentSelection.focusNode.parentElement : currentSelection.anchorNode.parentElement;
    const textLayer = getNodeTextLayer(start);
    const highlight = BookReaderTextFragment.fromSelection(currentSelection, [textLayer.parentElement]);
    highlight.highlightColor = this.annotationModal.lastHighlightColorUsed;
    highlight.uuid = `id-${crypto.randomUUID().split("-")[4]}`;
    const highlights = this.storageService.load();
    highlights.push(highlight);
    this.storageService.save(highlights);
    this.renderSavedHighlights();
    this.activeHighlightNodes = document.querySelectorAll(`.${highlight.uuid}`);
    this.selectMenu.requestUpdate();
  }

  /**
   * Removes the highlighted DOM nodes and deletes the associated storage record.
   * @param {HTMLElement[]} [nodes] defaults to the plugin's currently active highlight nodes
   */
  handleHighlightDelete() {
    if (!this.activeHighlightNodes.length) return;
    const uuid = retrieveUUID(this.activeHighlightNodes[0]);
    for (const ele of this.activeHighlightNodes) {
      const tempText = ele.textContent;
      const parent = ele.parentElement;
      if (parent.classList.contains('BRwordElement') || parent.classList.contains('BRspace')) {
        ele.remove();
        parent.textContent = tempText;
      } else {
        console.log("This element did not match removal criteria:", parent, ele);
      }
    }
    this.storageService.delete(uuid);
    this.activeHighlightNodes = null;
  }

  /**
   * @param {HTMLElement} target
   */
  handleHighlightClick(target) {
    const textLayer = getNodeTextLayer(target);
    const identifier = retrieveUUID(target);
    const selectedQuoteNodes = textLayer.querySelectorAll(`.${identifier}`);
    this.activeHighlightNodes = selectedQuoteNodes;

    const firstNode = selectedQuoteNodes[0];
    const lastNode = selectedQuoteNodes[selectedQuoteNodes.length - 1];

    const highlightRange = document.createRange();
    highlightRange.setStart(firstNode, 0);
    highlightRange.setEnd(lastNode, 1);

    const currentSelection = window.getSelection();
    currentSelection.removeAllRanges();
    currentSelection.addRange(highlightRange);
    this.selectMenu.show();
  }


  renderSavedHighlights() {
    for (const hl of this.storageService.load()) {
      const textLayer = /** @type {HTMLElement} */ (this.br.$(`.pagediv${hl.pageIndex} .BRtextLayer`)[0]);
      if (!textLayer) continue;
      const highlightedRange = renderHighlight(textLayer, hl);
      const hasExistingAnnotation = document.querySelector(`.icon-${hl.uuid}`) ? true : false;
      // Attach click behaviour here? Only need one handler per text layer
      if (hl.annotation && !hasExistingAnnotation) {
        const iconLocation = findTopRightMostNode(highlightedRange);
        const hlParagraph = highlightedRange[0].closest(".BRparagraphElement");
        const annotationIconEle = document.createElement('ia-icon-edit-pencil');
        annotationIconEle.classList.add('annotationIndicator', `icon-${hl.uuid}`);
        annotationIconEle.style.top = `${iconLocation.offsetTop - 30}px`;
        annotationIconEle.style.left = `${iconLocation.offsetLeft + iconLocation.offsetWidth}px`;
        hlParagraph?.append(annotationIconEle);
      }

      $(textLayer)
        .off('mouseup.BRHighlightClick')
        .on('mouseup.BRHighlightClick', (e) => {
          if (!e.target.classList.contains("BRhighlight")) return;
          e.stopPropagation();
          this.handleHighlightClick(e.target);
        });
    }
  }

}
BookReader?.registerPlugin('annotate', AnnotationsPlugin);

@customElement('br-annotation-modal')

export class BRAnnotationModal extends LitElement {
  /** @type {import('../BookReader.js').default} */
  br;

  HIGHLIGHT_YELLOW = "#ffff00";
  HIGHLIGHT_PINK = "#ffc0cb";
  HIGHLIGHT_ORANGE = "#ffa500";
  HIGHLIGHT_GREEN = "#00ff00"

  @property({type: String})
  lastHighlightColorUsed = this.HIGHLIGHT_YELLOW;

  /** @type {HTMLElement[]} */
  currentAnnotationNodes;

  /** @type {HTMLElement | null} Element the popover anchors to; the br-menu-option that was clicked */
  @property({attribute: false})
  anchorEl = null;

  @property({type: Boolean})
  open = false;

  positionObj = {};

  storageService = new AnnotationStorageService({storageMethod: window.localStorage});

  @property({type: Boolean})
  showColorOptions = false;


  /**
   *
   * @param {import('../BookReader.js').default} br
   */
  constructor(br) {
    super();
    this.br = br;
  }

  /** @override */
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('ol-popover-open', this.focusTextArea);
  }

  /** @override */
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('ol-popover-open', this.focusTextArea);
  }

  focusTextArea() {
    const textArea = document.querySelector('#annotateTextArea');
    textArea?.focus();
  }

  /** @override */
  createRenderRoot() {
    return this;
  }

  showTextEditArea() {
    return html`
    <div class="br-annotate-menu__body"> 
      <div class="br-annotate-menu__text">
        <textarea 
          class="br-annotate-menu__textArea" 
          id="annotateTextArea" 
          placeholder="Add note..."
          >${this.getAnnotationText()}</textarea>
      </div>
      <div class="br-annotate-menu__footer">
          ${this.renderColorOptions()}
          <div class="br-annotate-menu__editOptions">
        <button 
          @click=${this.handleHighlightDelete}
          class="br-annotate-menu__option">Delete
        </button>
        <button
        @click=${this.handleSaveAnnotation}
        class="br-annotate-menu__option save"
        >Save</button>
      </div>
    </div>
    `;
  }

  /**
   * Selectable highlight colors
   * @returns {{name: string, hex: string}[]}
   */
  get highlightColorOptions() {
    return [
      {name: 'green', hex: this.HIGHLIGHT_GREEN},
      {name: 'pink', hex: this.HIGHLIGHT_PINK},
      {name: 'yellow', hex: this.HIGHLIGHT_YELLOW},
      {name: 'orange', hex: this.HIGHLIGHT_ORANGE},
    ];
  }

  renderColorOptions() {
    const color = this.getHighlightColor();
    const colorName = this.highlightColorOptions.find((option) => option.hex === color)?.name;
    return html`
    <div class="br-annotate-menu__colorOptions">
      <button
        @click=${this.handleColorChange}
        class="br-annotate-menu__color ${colorName}"
        value=${color}
      >
      </button>
      ${this.showColorOptions ? this.renderColorDropdown() : ""}
      <button class="br-annotate-menu__carot"
      @click=${this.handleShowColor}>${this.showColorOptions ? '<' : '>'}</button>
    </div>
    `;
  }

  handleShowColor() {
    this.showColorOptions = !this.showColorOptions;
  }

  renderColorDropdown() {
    const currentColor = this.getHighlightColor();
    const allColorOptions = this.highlightColorOptions
      .filter((option) => option.hex !== currentColor)
      .map((option) => html`
      <button
        @click=${this.handleColorChange}
        class="br-annotate-menu__color ${option.name}"
        value=${option.hex}>
        </button>`);
    return html`
      <div class="br-annotate-menu__pipe">|</div>
      <div class="br-annotate-menu__colorDropdown">
        ${allColorOptions}
      </div>
    `;
  }

  render() {
    return html`
      <ol-popover
        aria-label="Annotation actions"
        placement="bottom-start"
        .anchor=${this.anchorEl}
        .open=${live(this.open)}
        .position=${this.positionObj}
        @ol-popover-close=${this.handleSaveAnnotation}
      >
        ${this.showTextEditArea()}
      </ol-popover>
    `;
  }

  handleColorChange(e) {
    const currentUUID = retrieveUUID(this.currentAnnotationNodes[0]);
    $(`.${currentUUID}`).css("background-color", `${e.target.value}`);
    this.lastHighlightColorUsed = e.target.value;
    const annotationObject = this.storageService.findRecordByUUID(currentUUID);
    if (annotationObject) {
      this.storageService.edit(currentUUID, 'highlightColor', e.target.value);
    }
    this.handleShowColor();
  }

  // Pass in AnnotationPlugin during construction
  handleHighlightDelete() {
    if (this.currentAnnotationNodes) {
      this.br.plugins?.annotations?.handleHighlightDelete(this.currentAnnotationNodes);
      this.hide();
    }
  }

  /**
   *
   * @param {HTMLElement[]} nodes
   * @param {HTMLElement} [anchorEl] Element to anchor the popover to, e.g. the
   *  br-menu-option button that was clicked to open the modal
   * @returns
   */
  show(nodes, anchorEl) {
    if (!nodes.length) return;
    this.currentAnnotationNodes = nodes;
    const identifier = retrieveUUID(nodes[0]);
    const selectedQuoteNodes = document.querySelectorAll(`.${identifier}`);

    const firstNode = selectedQuoteNodes[0];
    const lastNode = selectedQuoteNodes[selectedQuoteNodes.length - 1];

    const highlightRange = document.createRange();
    highlightRange.setStart(firstNode, 0);
    highlightRange.setEnd(lastNode, 1);

    const currentSelection = window.getSelection();
    currentSelection?.removeAllRanges();
    currentSelection?.addRange(highlightRange);

    this.updateTextArea(this.getAnnotationText());
    const lastNodeBoundary = lastNode.getBoundingClientRect();
    const pageContainerBoundary = lastNode.closest(".BRpagecontainer")?.getBoundingClientRect();
    const annotationButtonWidth = pageContainerBoundary.width * 0.93;
    const annotationButtonLeft = pageContainerBoundary.left + 5;

    this.positionObj.top = lastNodeBoundary.top + lastNodeBoundary.height + 5;
    this.positionObj.left = annotationButtonLeft;
    this.positionObj.width = annotationButtonWidth;
    this.positionObj.height = Math.max(pageContainerBoundary.height / 7, 80);
    this.anchorEl = anchorEl ?? lastNode.parentElement;
    this.open = true;
    this.requestUpdate();
    window.addEventListener('ol-popover-close', this.onPopoverClose, { capture: true, passive: true });
  }

  hide() {
    this.currentAnnotationNodes = null;
    this.showColorOptions = false;
    this.display = 'none';
    this.open = false;
    this.requestUpdate();
    window.removeEventListener('ol-popover-close', this.onPopoverClose, { capture: true });
    return;
  }

  onPopoverClose = () => {
    this.handleSaveAnnotation();
  }

  updateTextArea(text) {
    const inputEle = this.querySelector("#annotateTextArea");
    if (!inputEle) return;
    inputEle.value = text;
  }

  handleSaveAnnotation() {
    const inputEle = document.querySelector("#annotateTextArea");
    if (!inputEle || !this.currentAnnotationNodes) return;
    if (inputEle.value) {
      const currentUUID = retrieveUUID(this.currentAnnotationNodes[0]);
      this.storageService.edit(currentUUID, 'annotation', inputEle.value);
      inputEle.value = "";
    }
    this.hide();
  }

  getAnnotationText() {
    if (!this.currentAnnotationNodes) return null;
    const nodesUUID = retrieveUUID(this.currentAnnotationNodes[0]);
    return this.storageService.findRecordByUUID(nodesUUID)?.annotation || "";
  }

  /**
   * Checks if the currently selected annotation has a previously stored highlight for styling. Will use the default HIGHLIGHT_YELLOW if not found
   * @returns {string}
   */
  getHighlightColor() {
    if (!this.currentAnnotationNodes) return this.HIGHLIGHT_YELLOW;
    const nodesUUID = retrieveUUID(this.currentAnnotationNodes[0]);

    const storageObject = this.storageService.findRecordByUUID(nodesUUID);
    return storageObject?.highlightColor || this.HIGHLIGHT_YELLOW;
  }
}

/**
 * Get UUID assigned to the highlight element from class list
 * @param {HTMLElement} ele
 * @returns
 */
function retrieveUUID(ele) {
  if (!ele) return null;
  const findUUID = Array.from(ele?.classList).filter((name) => {
    if (name.slice(0, 2).includes('id')) {
      return name;
    }
  });
  if (findUUID.length) {
    return findUUID[0];
  }
  return null;
}

/**
 * @typedef {BookReaderTextFragment & { uuid: string }} BookReaderSavedHighlight
 */

export class AnnotationStorageService {
  /**
   * @param {object} params
   * @param {Storage | null} params.storageMethod
   */

  constructor({storageMethod}) {
    /**@type {Storage | null} */
    this.storageMethod = storageMethod;
  }
  /**
 * Retrieve bookreader saved highlights as a list of BookReaderTextFragment
 * @returns {BookReaderSavedHighlight[]}
 */
  load () {
    return JSON.parse(this.storageMethod.getItem(BR_HIGHLIGHTS_LOCAL_STORAGE_KEY) || "[]")
      .map(item => BookReaderTextFragment.fromJSON(item));
  }

  save (highlights) {
    this.storageMethod.setItem(BR_HIGHLIGHTS_LOCAL_STORAGE_KEY, JSON.stringify(highlights.map(hl => hl.toJSON()),
    ));
  }

  /**
   * Returns an entry by UUID if found or null
   * @param {string} targetUUID
   * @returns {string | null}
   */
  findRecordByUUID (targetUUID) {
    const storage = this.load();
    for (const idx in storage) {
      if (storage[idx].uuid === targetUUID) {
        return storage[idx];
      }
    }
    return null;
  }
  /**
   * Changes an entry's key:pair value by UUID, throws an Error if the UUID cannot be found from storage.
   * @param {string} targetUUID
   * @param {string} key
   * @param {string} value
   * @returns
   */
  edit (targetUUID, key, value) {
    const storage = this.load();
    for (const idx in storage) {
      if (storage[idx].uuid === targetUUID) {
        storage[idx][key] = value;
        this.save(storage);
        return;
      }
    }
    throw new Error (`Could not find and edit storage object from target id`);
  }

  /**
   * Deletes an entry by UUID, throws an Error if the UUID cannot be found from storage
   * @param {string} targetUUID
   * @returns
   */
  delete(targetUUID) {
    const storage = this.load();
    for (const idx in storage) {
      if (storage[idx].uuid === targetUUID) {
        storage.splice(idx, 1);
        this.save(storage);
        return;
      }
    }
    throw new Error (`Could not find and remove storage object from target id`);
  }
}

/**
 * Find the node that has the top right most position
 * @param {Element[]} nodes
 */
export function findTopRightMostNode(nodes) {
  let top = Infinity;
  let right = -Infinity;
  let bestPositionNode;
  for (const node of nodes) {
    const nodePosition = node.getBoundingClientRect();
    if (nodePosition.top <= top && nodePosition.right > right) {
      bestPositionNode = node;
      top = nodePosition.top;
      right = nodePosition.right;
    }
  }
  return bestPositionNode;
}

// Might make more sense within SelectMenuOption in TextSelectionManager
/**
 * @typedef {Object} BookReaderTextSelectionMenuOptions
 * @property {function} clickFunction
 * @property {string} labelName
 * @property {string} iconName
 */
