import { css, html, LitElement } from 'lit-element';
import { nothing } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat';

export class Volumes extends LitElement {
  static get properties() {
    return {
      hostUrl: { type: String },
      viewableFiles: { type: Object },
    };
  }

  constructor() {
    super();
    this.viewableFiles = {};
    this.hostUrl = '';
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
    `
  }

  volumeItem(item) {
    return html`
      <li>
        <div class="separator"></div>
        <div class="content active">
          <a href="${this.hostUrl}${item.url_path}">
            <p class="item-title">${item.title}</p>
          </a>
        </div>
      </li>
    `
  }

  get volumesList() {
    const sortedVolumes = Object.keys(this.viewableFiles).map(item => this.viewableFiles[item])
    const volumes = repeat(sortedVolumes, volume => volume?.file_prefix, this.volumeItem.bind(this));
    return html`
      <ul>
        ${volumes}
        <div class="separator"></div> 
      </ul>
    `
  }

  render() {
    return html`
      ${Object.keys(this.viewableFiles).length ? this.volumesList : nothing}
    `
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
    `;
  }
}

customElements.define('viewable-files', Volumes);
