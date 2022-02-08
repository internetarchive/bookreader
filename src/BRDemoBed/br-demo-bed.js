// @ts-check
/* global BookReaderJSIAinit */
import { customElement, LitElement, html, property, css } from 'lit-element';
import {extraVolOptions, custvolumesManifest} from './ia-multiple-volumes-manifest.json';

/**
 * This element contains controls for placing the BR demo into specific states.
 * This is probably not going to be stuff down-stream client will use, but is
 * mostly going to be used by folks testing bookreader.
 *
 * Anything that would be useful for a downstream client to use should be
 * placed directly in the demo file so as to be more easily accessible.
 */
@customElement('br-demo-bed')
export class BRDemoBed extends LitElement {
  /** Selector to find a specific <ia-bookreader/> instance */
  @property() brSelector = 'ia-bookreader';

  /** @type {import('../ia-bookreader/ia-bookreader.js').IaBookReader} */
  iaBookReader = document.querySelector(this.brSelector);

  @property({type: Boolean, attribute: false}) metadataLoaded = false;
  @property({type: Boolean, attribute: false}) manifestLoaded = false;

  /** @override */
  render() {
    return html`
      <section class="demos">
        <div class="demo">
          <button @click="${this.toggleSignedIn}">
            Toggle Logged in view
          </button>
          <p>Features behind signed in gate: Bookmarks</p>
          <p>Logged In Status: ${this.iaBookReader.signedIn ? 'Logged In' : 'Logged Out'}</p>
        </div>
        <div class="demo">
          <button @click="${this.loadMultipleBooksDemo}">Multiple books</button>
        </div>
        <div class="demo" @click="${this.reloadFullscreen}">
          <button>Start at Fullscreen</button>
        </div>
        <div class="demo">
          <h3 id="placeholder">${
            this.postInitFired ?
              'Dependencies are complete, bookreader has loaded' :
              'Please wait as we are fetching the following:'
            }</h3>
          <input type='checkbox' ?checked=${this.metadataLoaded} disabled>Item metadata<br>
          <input type='checkbox' ?checked=${this.manifestLoaded} disabled>Book manifest<br>
        </div>
        <div class="demo">
          <h3>Placeholder div to allow scrolling</h3>
        </div>
      </section>
    `;
  }

  firstUpdated() {
    window.addEventListener('BookReader:PostInit', () => {
      this.postInitFired = true;
    });
  }

  /** @override */
  updated(changedProperties) {
    if (changedProperties.has('brSelector')) {
      this.iaBookReader = document.querySelector(this.brSelector);
    }
  }

  static get styles() {
    return css`
      .demos {
        height: 800px;
        width: inherit;
        padding: 10px;
      }
      .demo {
        border: 1px solid white;
        padding: 10px;
      }`;
  }

  reloadFullscreen() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('view')) {
      const url = new URL(window.location.toString());
      url.searchParams.delete('view');
      window.history.pushState({}, '', url);
    }
    urlParams.set('view', 'theater');
    window.location.search = urlParams.toString();
  }

  async toggleSignedIn() {
    this.iaBookReader.signedIn = !this.iaBookReader.signedIn;
    await this.iaBookReader.updateComplete;
    this.requestUpdate();
  }

  async loadMultipleBooksDemo() {
    // remove everything
    $('#BookReader').empty();
    delete window.br;
    // and re-mount with a new bookreader
    BookReaderJSIAinit(custvolumesManifest, extraVolOptions);
  }
}
