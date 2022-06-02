import { css, html, LitElement, nothing } from 'lit';
import buttonStyles from '../assets/button-base.js';
export class IABookDownloads extends LitElement {
  static get properties() {
    return {
      downloads: { type: Array },
      expiration: { type: Number },
      renderHeader: { type: Boolean },
      isBookProtected: { type: Boolean },
    };
  }

  constructor() {
    super();
    this.downloads = [];
    this.expiration = 0;
    this.renderHeader = false;
    this.isBookProtected = false;
  }

  get formatsCount() {
    const count = this.downloads.length;
    return count ? html`<p>${count} format${count > 1 ? 's' : ''}</p>` : html``;
  }

  get loanExpiryMessage() {
    return this.expiration
      ? html`<h2>These files will expire in ${this.expiration} days.</h2>`
      : html``;
  }

  renderDownloadOptions() {
    return this.downloads.map(option => (
      html`
        <li>
          <a class="ia-button link primary" href="${option.url}">Get ${option.type}</a>
          ${option.note ? html`<p>${option.note}</p>` : html``}
        </li>
      `
    ));
  }

  /**
   * checks if downloads list contains an LCP option
   * @return {boolean}
   */
  get hasLCPOption() {
    const regex = /^(LCP)/g;
    const lcpAvailable = this.downloads.some(option => option.type?.match(regex));
    return lcpAvailable;
  }

  get header() {
    if (!this.renderHeader) {
      return nothing;
    }
    return html`
      <header>
        <h3>Downloadable files</h3>
        ${this.formatsCount}
      </header>
    `;
  }

  get accessProtectedBook() {
    return html`
      <p>To access downloaded books, you need Adobe-compliant software on your device. The Internet Archive will administer this loan, but Adobe may also collect some information.</p>
      <a class="ia-button external primary" href="https://www.adobe.com/solutions/ebook/digital-editions/download.html" rel="noopener noreferrer" target="_blank">Install Adobe Digital Editions</a>
    `;
  }

  get installSimplyEAldikoThoriumMsg() {
    return html`
    <p>For LCP downloads, make sure you have SimplyE or Aldiko Next installed on mobile or Thorium on desktop.</p>
    <ul>
      <li><a href="https://librarysimplified.org/simplye/" rel="noopener noreferrer nofollow" target="_blank">Install SimplyE</a></li>
      <li><a href="https://www.demarque.com/en-aldiko" rel="noopener noreferrer nofollow" target="_blank">Install Aldiko</a></li>
      <li><a href="https://www.edrlab.org/software/thorium-reader/" rel="noopener noreferrer nofollow" target="_blank">Install Thorium</a></li>
    </ul>
  `;
  }

  render() {
    return html`
      ${this.header}
      ${this.loanExpiryMessage}
      <ul>${this.renderDownloadOptions()}</ul>
      ${this.hasLCPOption
      ? this.installSimplyEAldikoThoriumMsg
      : (this.isBookProtected ? this.accessProtectedBook : nothing)
      }
    `;
  }

  static get styles() {
    const mainCss = css`
      :host {
        display: block;
        height: 100%;
        padding: 1.5rem 0;
        overflow-y: auto;
        font-size: 1.4rem;
        box-sizing: border-box;
      }

      a.close ia-icon {
        --iconWidth: 18px;
        --iconHeight: 18px;
      }
      a.close {
        justify-self: end;
      }

      header {
        display: flex;
        align-items: center;
        padding: 0 2rem;
      }
      header p {
        padding: 0;
        margin: 0;
        font-size: 1.2rem;
        font-weight: bold;
        font-style: italic;
      }
      header div {
        display: flex;
        align-items: baseline;
      }      

      h2 {
        font-size: 1.6rem;
      }

      h3 {
        padding: 0;
        margin: 0 1rem 0 0;
        font-size: 1.4rem;
      }

      ul {
        padding: 0;
        margin: 0;
        list-style: none;
      }

      p {
        margin: .3rem 0 0 0;
      }

      li,
      ul + p {
        padding-bottom: 1.2rem;
        font-size: 1.2rem;
        line-height: 140%;
      }
    `;

    return [buttonStyles, mainCss];
  }
}
customElements.define('ia-book-downloads', IABookDownloads);
