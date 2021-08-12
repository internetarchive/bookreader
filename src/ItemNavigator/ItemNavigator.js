import '@internetarchive/ia-item-navigator';

// import { css, html, LitElement } from "lit-element";
// import { nothing } from "lit-html";
// import { IAMenuSlider } from "@internetarchive/ia-menu-slider";
// import IAIcon from "@internetarchive/ia-icons";
// import { ModalConfig } from "@internetarchive/modal-manager";

// export default class ItemNavigator extends LitElement {
//   static get properties() {
//     return {
//       baseHost: { type: String },
//       item: {
//         type: Object,
//         converter(value) {
//           return !value ? {} : JSON.parse(atob(value));
//         },
//       },
//       itemType: { type: String },
//       menuShortcuts: {
//         type: Array,
//         hasChanged(newVal, oldVal) {
//           if (newVal !== oldVal) {
//             return true;
//           }
//           return false;
//         },
//       },
//       menuOpened: { type: Boolean },
//       menuContents: { type: Array },
//       openMenu: { type: String },
//       signedIn: {
//         type: Boolean,
//         converter: (arg) => {
//           if (typeof (arg) === 'boolean') {
//             return arg;
//           }
//           return arg === 'true';
//         },
//       },
//       viewportInFullscreen: { type: Boolean },
//     };
//   }

//   constructor() {
//     /** TODO: Request BookModel.js
//     * Request BookNavigator.js
//     * Show loading spinner
//     * When JS assets loaded:
//     * - render book-navigator component
//     */
//     super();
//     this.baseHost = 'archive.org';
//     this.item = {};
//     this.itemType = '';
//     this.menuOpened = false;
//     this.signedIn = false;
//     this.menuShortcuts = [];
//     this.menuContents = [];
//     this.viewportInFullscreen = false;
//     this.openMenu = '';
//     this.renderModalManager();
//   }

//   showItemNavigatorModal({ detail }) {
//     this.modal.showModal({
//       config: this.modalConfig,
//       customModalContent: detail.customModalContent,
//     });
//   }

//   closeItemNavigatorModal() {
//     this.modal.closeModal();
//   }

//   /**
//    * Event handler - handles viewport slot going into fullscreen
//    * @param {Event} e - custom event object
//    */
//   manageViewportFullscreen({ detail }) {
//     const { isFullScreen } = detail;
//     this.viewportInFullscreen = isFullScreen;
//   }

//   /**
//    * Event handler - handles viewport slot going into fullscreen
//    * @param {Event} e - custom event object
//    *   @param {object} event.detail - custom event detail
//    *     @param {(open, toggle, close)} detail.action
//    *     @param {string} detail.menuId - menu id to be shown
//    */
//   manageSideMenuEvents({ detail }) {
//     const { action = '', menuId = '' } = detail;
//     if (!menuId) { return; }
//     switch (action) {
//     case 'open':
//       this.openShortcut(menuId);
//       break;
//     case 'toggle':
//       this.openMenu = menuId;
//       this.toggleMenu();
//       break;
//     default:
//       this.closeMenu();
//     }
//   }

//   toggleMenu() {
//     this.menuOpened = !this.menuOpened;
//   }

//   closeMenu() {
//     this.menuOpened = false;
//   }

//   /**
//    * Opens menu to selected menu
//    * @param {string} selectedMenuId
//    */
//   openShortcut(selectedMenuId = '') {
//     // open sidemenu to proper tab
//     this.openMenu = selectedMenuId;
//     this.menuOpened = true;
//   }

//   setOpenMenu({ detail }) {
//     const { id } = detail;
//     this.openMenu = id === this.openMenu ? '' : id;
//   }

//   setMenuContents({ detail }) {
//     this.menuContents = [...detail];
//   }

//   setMenuShortcuts({ detail }) {
//     this.menuShortcuts = [...detail];
//   }

//   /**
//    * computes classes for item-navigator <section> node
//    */
//   get menuClass() {
//     const drawerState = this.menuOpened ? 'open' : '';
//     const fullscreenState = this.viewportInFullscreen ? 'fullscreen' : '';
//     return `${drawerState} ${fullscreenState}`;
//   }

//   get menuToggleButton() {
//     return html`
//       <button class="toggle-menu" @click=${this.toggleMenu.bind(this)}>
//         <div>
//           <ia-icon icon="ellipses" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon>
//         </div>
//       </button>
//     `;
//   }

//   get menuSlider() {
//     return html`
//       <div id="menu">
//         <ia-menu-slider
//           .menus=${this.menuContents}
//           .open=${true}
//           .selectedMenu=${this.openMenu}
//           @menuTypeSelected=${this.setOpenMenu}
//           @menuSliderClosed=${this.closeMenu}
//           ?manuallyHandleClose=${true}
//           ?animateMenuOpen=${false}
//         ></ia-menu-slider>
//       </div>
//     `;
//   }

//   /**
//    * Returns the shortcut buttons for minimized view
//    * @return html
//    */
//   get shortcuts() {
//     // todo: aria tags
//     const shortcuts = this.menuShortcuts.map(({
//       icon,
//       id,
//     }) => html`
//         <button class="shortcut ${id}" @click="${(e) => { this.openShortcut(id); }}">
//           ${icon}
//         </button>
//       `);

//     return html`<div class="shortcuts">${shortcuts}</div>`;
//   }

//   /**
//    * Returns the side menu given it's open/close state
//    * @return html
//    */
//   get renderSideMenu() {
//     // todo: aria tags
//     return html`
//       <nav>
//         <div class="minimized">
//           ${this.shortcuts}
//           ${this.menuToggleButton}
//         </div>
//         ${this.menuSlider}
//       </nav>
//     `;
//   }

//   /**
//    * Given a itemType, this chooses the proper viewport component
//    * @return html
//    */
//   get renderViewport() {
//     if (this.itemType === 'bookreader') {
//       return html`
//         <book-navigator
//           .baseHost=${this.baseHost}
//           .book=${this.item}
//           ?signedIn=${this.signedIn}
//           ?sideMenuOpen=${this.menuOpened}
//           @ViewportInFullScreen=${this.manageViewportFullscreen}
//           @updateSideMenu=${this.manageSideMenuEvents}
//           @menuUpdated=${this.setMenuContents}
//           @menuShortcutsUpdated=${this.setMenuShortcuts}
//           @showItemNavigatorModal=${this.showItemNavigatorModal}
//           @closeItemNavigatorModal=${this.closeItemNavigatorModal}
//         >
//           <div slot="bookreader">
//             <slot name="bookreader"></slot>
//           </div>
//         </book-navigator>
//       `;
//     }
//     return html`<div class="viewport"></div>`;
//   }

//   renderModalManager() {
//     this.modal = document.createElement('modal-manager');
//     this.modal.setAttribute('id', 'item-navigator-modal');
//     this.modalConfig = new ModalConfig();
//     this.modalConfig.title = 'Delete Bookmark';
//     this.modalConfig.headline = 'This bookmark contains a note. Deleting it will permanently delete the note. Are you sure?';
//     this.modalConfig.headerColor = '#194880';
//     document.body.appendChild(this.modal);
//   }

//   render() {
//     const renderMenu = this.menuContents.length || this.menuShortcuts.length;
//     return html`
//       <div id="frame" class=${this.menuClass}>
//         <slot name="item-nav-header"></slot>
//         <div class="menu-and-reader">
//           ${renderMenu ? this.renderSideMenu : nothing}
//           <div id="reader">
//             ${this.renderViewport}
//           </div>
//         </div>
//       </div>
//     `;
//   }

//   static get styles() {
//     const subnavWidth = css`var(--menuWidth, 320px)`;
//     const tabletPlusQuery = css`@media (min-width: 640px)`;
//     const transitionTiming = css`var(--animationTiming, 200ms)`;
//     const transitionEffect = css`transform ${transitionTiming} ease-out`;

//     return css`
//       #frame {
//         position: relative;
//         overflow: hidden;
//       }

//       #frame.fullscreen,
//       #frame.fullscreen #reader {
//         height: 100vh;
//       }

//       button {
//         cursor: pointer;
//         padding: 0;
//         border: 0;
//       }

//       button:focus,
//       button:active {
//         outline: none;
//       }

//       .menu-and-reader {
//         position: relative;
//       }

//       nav button {
//         background: none;
//       }

//       nav .minimized {
//         background: rgba(0, 0, 0, .7);
//         border-bottom-right-radius: 5%;
//         position: absolute;
//         padding-top: .6rem;
//         left: 0;
//         width: 4rem;
//         z-index: 2;
//       }

//       nav .minimized button {
//         width: var(--iconWidth);
//         height: var(--iconHeight);
//         margin: auto;
//         display: inline-flex;
//         vertical-align: middle;
//         -webkit-box-align: center;
//         align-items: center;
//         -webkit-box-pack: center;
//         justify-content: center;
//         width: 4rem;
//         height: 4rem;
//       }

//       nav .minimized button.toggle-menu > * {
//         border: 2px solid var(--iconStrokeColor);
//         border-radius: var(--iconWidth);
//         width: var(--iconWidth);
//         height: var(--iconHeight);
//         margin: auto;
//       }

//       #menu {
//         position: absolute;
//         top: 0;
//         bottom: 0;
//         left: 0;
//         z-index: 3;
//         overflow: hidden;
//         transform: translateX(-${subnavWidth});
//         width: ${subnavWidth};
//         transform: translateX(calc(${subnavWidth} * -1));
//         transition: ${transitionEffect};
//       }

//       #reader {
//         position: relative;
//         z-index: 1;
//         transition: ${transitionEffect};
//         transform: translateX(0);
//         width: 100%;
//       }

//       .open #menu {
//         width: ${subnavWidth};
//         transform: translateX(0);
//         transition: ${transitionEffect};
//       }

//       ${tabletPlusQuery} {
//         .open #reader {
//           transition: ${transitionEffect};
//           transform: translateX(${subnavWidth});
//           width: calc(100% - ${subnavWidth});
//         }
//       }

//       #loading-indicator {
//         display: none;
//       }

//       #loading-indicator.visible {
//         display: block;
//       }
//     `;
//   }
// }

// customElements.define('ia-icon', IAIcon);
// customElements.define('ia-menu-slider', IAMenuSlider);
// customElements.define('item-navigator', ItemNavigator);
