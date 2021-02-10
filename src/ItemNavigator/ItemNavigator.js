import { html, LitElement } from "lit-element";
import { IAMenuSlider } from "@internetarchive/ia-menu-slider";
import IAIcon from "@internetarchive/ia-icons";
import { ModalConfig } from "@internetarchive/modal-manager";

import ItemNavigatorCSS from "./styles/item-navigator.js";

export default class ItemNavigator extends LitElement {
  static get styles() {
    return ItemNavigatorCSS;
  }

  static get properties() {
    return {
      baseHost: { type: String },
      item: {
        type: Object,
        converter(value) {
          return !value ? {} : JSON.parse(atob(value));
        },
      },
      itemType: { type: String },
      menuShortcuts: {
        type: Array,
        hasChanged(newVal, oldVal) {
          if (newVal !== oldVal) {
            return true;
          }
          return false;
        },
      },
      menuOpened: { type: Boolean },
      menuContents: { type: Array },
      openMenu: { type: String },
      signedIn: { type: Boolean },
      viewportInFullscreen: { type: Boolean },
    };
  }


  constructor() {
    /** TODO: Request BookModel.js
     * Request BookNavigator.js
     * Show loading spinner
     * When JS assets loaded:
     * - render book-navigator component
     */
    super();
    this.baseHost = "archive.org";
    this.item = {};
    this.itemType = "";
    this.menuOpened = false;
    this.menuShortcuts = [];
    this.menuContents = [];
    this.viewportInFullscreen = false;
    this.openMenu = "";
    this.renderModalManager();
  }

  showItemNavigatorModal({ detail }) {
    this.modal.showModal({
      config: this.modalConfig,
      customModalContent: detail.customModalContent,
    });
  }

  closeItemNavigatorModal() {
    this.modal.closeModal();
  }

  /**
   * Event handler - handles viewport slot going into fullscreen
   * @param {Event} e - custom event object
   */
  manageViewportFullscreen({ detail }) {
    const { isFullScreen } = detail;
    this.viewportInFullscreen = isFullScreen;
  }

  /**
   * Event handler - handles viewport slot going into fullscreen
   * @param {Event} e - custom event object
   *   @param {object} event.detail - custom event detail
   *     @param {string} detail.action - open, toggle, close
   *     @param {string} detail.menuId - menu id to be shown
   */
  manageSideMenuEvents({ detail }) {
    const { action = "", menuId = "" } = detail;
    if (menuId) {
      if (action === "open") {
        this.openShortcut(menuId);
      } else if (action === "toggle") {
        this.openMenu = menuId;
        this.toggleMenu();
      }
    }
  }

  toggleMenu() {
    this.menuOpened = !this.menuOpened;
  }

  closeMenu() {
    this.menuOpened = false;
  }

  /**
   * Opens menu to selected menu
   * @param {string} selectedMenuId
   */
  openShortcut(selectedMenuId = "") {
    // open sidemenu to proper tab
    this.openMenu = selectedMenuId;
    this.menuOpened = true;
  }

  setOpenMenu({ detail }) {
    const { id } = detail;
    this.openMenu = id === this.openMenu ? "" : id;
  }

  setMenuContents({ detail }) {
    this.menuContents = [...detail];
  }

  setMenuShortcuts({ detail }) {
    this.menuShortcuts = [...detail];
  }

  /**
   * computes classes for item-navigator <section> node
   */
  get menuClass() {
    const drawerState = this.menuOpened ? "open" : "";
    const fullscreenState = this.viewportInFullscreen ? "fullscreen" : "";
    return `${drawerState} ${fullscreenState}`;
  }

  get menuToggleButton() {
    return html`
      <button class="toggle-menu" @click=${this.toggleMenu.bind(this)}>
        <div>
          <ia-icon
            icon="ellipses"
            style="width: var(--iconWidth); height: var(--iconHeight);"
          ></ia-icon>
        </div>
      </button>
    `;
  }

  get menuSlider() {
    return html`
      <div id="menu">
        <ia-menu-slider
          .menus=${this.menuContents}
          .open=${true}
          .selectedMenu=${this.openMenu}
          @menuTypeSelected=${this.setOpenMenu}
          @menuSliderClosed=${this.closeMenu}
          ?manuallyHandleClose=${true}
          ?animateMenuOpen=${false}
        ></ia-menu-slider>
      </div>
    `;
  }

  /**
   * Returns the shortcut buttons for minimized view
   * @return html
   */
  get shortcuts() {
    // todo: aria tags
    const shortcuts = this.menuShortcuts.map(
      ({ icon, id }) => html`
        <button
          class="shortcut ${id}"
          @click="${(e) => {this.openShortcut(id);}}"
        >
          ${icon}
        </button>
      `
    );

    return html`<div class="shortcuts">${shortcuts}</div>`;
  }

  /**
   * Returns the side menu given it's open/close state
   * @return html
   */
  get renderSideMenu() {
    // todo: aria tags
    return html`
      <nav>
        <div class="minimized">${this.shortcuts} ${this.menuToggleButton}</div>
        ${this.menuSlider}
      </nav>
    `;
  }

  /**
   * Given a itemType, this chooses the proper viewport component
   * @return html
   */
  get renderViewport() {
    if (this.itemType === "bookreader") {
      return html`
        <book-navigator
          .baseHost=${this.baseHost}
          .book=${this.item}
          ?signedIn=${this.signedIn}
          ?sideMenuOpen=${this.menuOpened}
          @ViewportInFullScreen=${this.manageViewportFullscreen}
          @updateSideMenu=${this.manageSideMenuEvents}
          @menuUpdated=${this.setMenuContents}
          @menuShortcutsUpdated=${this.setMenuShortcuts}
          @showItemNavigatorModal=${this.showItemNavigatorModal}
          @closeItemNavigatorModal=${this.closeItemNavigatorModal}
        >
          <div slot="bookreader">
            <slot name="bookreader"></slot>
          </div>
        </book-navigator>
      `;
    }
    return html`<div class="viewport"></div>`;
  }

  renderModalManager() {
    this.modal = document.createElement("modal-manager");
    this.modal.setAttribute("id", "item-navigator-modal");
    this.modalConfig = new ModalConfig();
    this.modalConfig.title = "Delete Bookmark";
    this.modalConfig.headline =
      "This bookmark contains a note. Deleting it will permanently delete the note. Are you sure?";
    this.modalConfig.headerColor = "#194880";
    document.body.appendChild(this.modal);
  }

  render() {
    return html`
      <div id="frame" class=${this.menuClass}>
        ${this.renderSideMenu}
        <div id="reader">${this.renderViewport}</div>
      </div>
    `;
  }
}

customElements.define("ia-icon", IAIcon);
customElements.define("ia-menu-slider", IAMenuSlider);
customElements.define("item-navigator", ItemNavigator);
