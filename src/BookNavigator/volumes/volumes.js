import { css, html, LitElement } from 'lit-element';
import { nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';

export class Volumes extends LitElement {
  static get properties() {
    return {
      subPrefix: { type: String },
      hostUrl: { type: String },
      viewableFiles: { type: Array },
    };
  }

  constructor() {
    super();
    this.subPrefix = '';
    this.hostUrl = '';
    this.viewableFiles = [];
  }

  firstUpdated() {
    const activeFile = this.shadowRoot.querySelector('.content.active');
    // allow for css animations to run before scrolling to active file
    setTimeout(() => {
      // scroll active file into view if needed
      // note: `scrollIntoViewIfNeeded` handles auto-scroll gracefully for Chrome, Safari
      // Firefox does not have this capability yet as it does not support `scrollIntoViewIfNeeded`
      if (activeFile?.scrollIntoViewIfNeeded) {
        activeFile?.scrollIntoViewIfNeeded(true);
        return;
      }

      // Todo: support `scrollIntoView` or `parentContainer.crollTop = x` for FF & "IE 11"
      // currently, the hard `position: absolutes` misaligns subpanel when `scrollIntoView` is applied :(
    }, 350);
  }

  volumeItemWithImageTitle(item) {
    return html`
      <li class="content active">
        <div class="separator"></div>
        <a class="container" href="${this.hostUrl}${item.url_path}">
          <div class="image">
            <img src="${item.image}">
          </div>
          <div class="text">
            <p class="item-title">${item.title}</p>
            <small>by: ${item.author}</small>
          </div>
        </a>
      </li>
    `;
  }

  volumeItem(item) {
    const activeClass = this.subPrefix === item.file_subprefix ? ' active' : '';
    return html`
      <li>
        <div class="separator"></div>
        <div class="content${activeClass}">
          <a href="https://${this.hostUrl}${item.url_path}">
            <p class="item-title">${item.title}</p>
          </a>
        </div>
      </li>
    `;
  }

  get volumesList() {
    const volumes = repeat(this.viewableFiles, volume => volume?.file_prefix, this.volumeItem.bind(this));
    return html`
      <ul>
        ${volumes}
        <div class="separator"></div> 
      </ul>
    `;
  }

  render() {
    return html`
      ${this.viewableFiles.length ? this.volumesList : nothing}
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        overflow-y: auto;
        box-sizing: border-box;
        color: var(--primaryTextColor);
        margin-top: 14px;
        margin-bottom: 2rem;
        --activeBorderWidth: 2px;
      }

      a {
        color: #ffffff;
        text-decoration: none
      }

      img {
        width: 35px;
        height: 45px;
      }

      ul {
        padding: 0;
        list-style: none;
        margin: var(--activeBorderWidth) 0.5rem 1rem 0;
      }

      ul > li:first-child .separator {
        display: none;
      }

      li {
        cursor: pointer;
        outline: none;
        position: relative;
      }

      li .content {
        padding: 2px 0 4px 2px;
        border: var(--activeBorderWidth) solid transparent;
        padding: .2rem 0 .4rem .2rem;
      }
      
      li .content.active {
        border: var(--activeBorderWidth) solid #538bc5;
      }

      small {
        font-style: italic;
        white-space: initial;
      }

      .container {
        display: flex;
        align-items: center;
        justify-content: center
      }

      .item-title {
        margin-block-start: 0em;
        margin-block-end: 0em;
        font-size: 14px;
        font-weight: bold;
        word-wrap: break-word;
        padding-left: 5px;
      }

      .separator {
        background-color: var(--secondaryBGColor);
        width: 98%;
        margin: 1px auto;
        height: 1px;
      }

      .text {
        padding-left: 10px;
      }

      .icon {
        display: inline-block;
        width: 14px;
        height: 14px;
        margin-left: .7rem;
        border: 1px solid var(--primaryTextColor);
        border-radius: 2px;
        background: var(--activeButtonBg) 50% 50% no-repeat;
      }

    `;
  }
}

customElements.define('viewable-files', Volumes);
