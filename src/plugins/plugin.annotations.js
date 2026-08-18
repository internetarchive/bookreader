import { html, LitElement } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { live } from "lit/directives/live.js";
import { BookReaderTextFragment } from "../util/TextSelectionManager.js";
import '@internetarchive/icon-share';
// eslint-disable-next-line no-unused-vars
import { OlPopover } from "../util/OlPopover.js";

const BR_HIGHLIGHTS_LOCAL_STORAGE_KEY = "BRhighlightStorage";

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
        @click=${this.handleDeleteHighlight}
        class="br-annotate-menu__option">Delete
      </button>
      <button
      @click=${this.handleSaveAnnotation}
      class="br-annotate-menu__option save"
      >Save</button>
    </div>
    `;
  }

  renderColorOptions() {
    const colors = {
      '#00ff00': 'green',
      '#ffc0cb': 'pink',
      '#ffff00': 'yellow',
      '#ffa500': 'orange',
    };
    const color = this.getHighlightColor();
    return html`
    <div class="br-annotate-menu__colorOptions">
      <button
        @click=${this.handleColorChange}
        class="br-annotate-menu__color ${colors[color]}"
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
    const colors = {
      'green': this.HIGHLIGHT_GREEN,
      'pink' : this.HIGHLIGHT_PINK,
      'orange' : this.HIGHLIGHT_ORANGE,
      'yellow': this.HIGHLIGHT_YELLOW,
    };
    const currentColor = this.getHighlightColor();
    const allColorOptions = Array.from(Object.keys(colors)).map((color) => {
      if (colors[color] === currentColor) return;
      return html`
      <button
        @click=${this.handleColorChange}
        class="br-annotate-menu__color ${color}"
        value=${colors[color]}>
        </button>`;
    });
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
        ._position=${this.positionObj}
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

  handleDeleteHighlight() {
    if (this.currentAnnotationNodes) {
      const currentUUID = retrieveUUID(this.currentAnnotationNodes[0]);
      this.storageService.delete(currentUUID);
      for (const ele of this.currentAnnotationNodes) {
        const tempText = ele.textContent;
        const parent = ele.parentElement;
        if (parent.classList.contains('BRwordElement') || parent.classList.contains('BRspace')) {
          ele.backgroundColor = 'none';
          ele.remove();
          parent.textContent = tempText;
        }
      }
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

    this.positionObj.top = `${lastNodeBoundary.top + lastNodeBoundary.height + 5}`;
    this.positionObj.left = `${annotationButtonLeft}`;
    this.positionObj.width = `${annotationButtonWidth}`;
    this.positionObj.height = `${Math.max(pageContainerBoundary.height / 7, 80)}`;
    this.anchorEl = anchorEl ?? lastNode.parentElement;
    this.open = true;
    this.requestUpdate();
  }

  hide() {
    this.currentAnnotationNodes = null;
    this.showColorOptions = false;
    this.display = 'none';
    this.open = false;
    this.requestUpdate();
    return;
  }

  updateTextArea(text) {
    const inputEle = document.querySelector("#annotateTextArea");
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
