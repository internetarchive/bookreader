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

  render() {
    return html`
      ${this.header}
      ${this.loanExpiryMessage}
      ${this.renderDownloadOptions()}
    `;
  }

  get header() {
    if (!this.renderHeader) {
      return nothing;
    }
    return html`
      <header>
        <h3>Read offline</h3>
        ${this.formatsCount}
      </header>
    `;
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
    const downloadOptions = [];
    ['pdf', 'epub', 'lcppdf', 'lcpepub', 'adobepdf', 'adobeepub'].forEach(format => {
      if (this.downloads[format]) {
        downloadOptions.push(this.downloadOption(format, this.downloads[format]));
      }
    });
    return html`
      <ul>
        ${downloadOptions}
      </ul>
    `;
  }

  downloadOption(format, link) {
    if (/^adobe/.test(format)) {
      return html`
        <li>
          <a
            href="${link}"
            data-event-click-tracking="BookReader|Download-${format}"
          >${this.menuText[format].linkText}</a>
          ${this.menuText[format].message ?? nothing}
        </li>
      `;
    }
    return html`
      <li>
        <a class="ia-button link primary"
          href="${link}"
          data-event-click-tracking="BookReader|Download-${format}"
        >${this.menuText[format].linkText}</a>
        ${this.menuText[format].message ? html`<p>${this.menuText[format].message}</p>` : nothing}
      </li>
    `;
  }

  get menuText() {
    return {
      pdf: {
        linkText: 'Get high-resolution PDF',
        message: html``,
      },
      epub: {
        linkText: 'Get text-based ebook',
        message: html`Smaller size. May contain some errors.`,
      },
      lcppdf: {
        linkText: 'Get high-resolution PDF',
        message: this.lcpNote,
      },
      lcpepub: {
        linkText: 'Get text-based ebook',
        message: html`Smaller size. May contain some errors. ${this.lcpNote}`,
      },
      adobepdf: {
        linkText:'Get legacy Adobe DRM PDF version here.',
        message: this.adobeNote,
      },
      adobeepub: {
        linkText: 'Get legacy Adobe DRM EPUB version here.',
        message: this.adobeNote,
      },
    };
  };
  
  get lcpNote() {
    return html`
      Requires having an LCP-compatible e-reader installed like Aldiko Next (<a href="https://apps.apple.com/us/app/aldiko-next/id1476410111">iOS</a>, <a href="https://play.google.com/store/apps/details?id=com.aldiko.android">Android</a>) or <a href="https://www.edrlab.org/software/thorium-reader/">Thorium</a>.
    `;
  }

  get adobeNote() {
    return html`
      Requires a compatible e-reader like <a hef="https://www.adobe.com/solutions/ebook/digital-editions.html">Adobe Digital Editions</a>.
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
