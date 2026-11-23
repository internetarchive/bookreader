// @ts-check
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BookReaderPlugin } from '../../BookReaderPlugin.js';
import { promisifyEvent } from '../../BookReader/utils.js';
import { BookReaderTextFragment, renderHighlight } from '../../util/TextSelectionManager.js';
import { HttpDeepReadApi, MockDeepReadApi } from './DeepReadApi.js';
/** @typedef {import('./DeepReadApi.js').DeepReadApi} DeepReadApi */
/** @typedef {import('./DeepReadApi.js').DeepReadEntityRef} DeepReadEntityRef */
/** @typedef {import('./DeepReadApi.js').DeepReadEntityDetails} DeepReadEntityDetails */
/** @typedef {import('../../BookReader/PageContainer.js').PageContainer} PageContainer */

const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

/**
 * Makes named entities (people, places, ...) in the text layer clickable, and
 * shows details about the clicked entity in the side panel.
 * Requires the textSelection plugin.
 */
export class DeepReadPlugin extends BookReaderPlugin {
  options = {
    enabled: true,
    /**
     * @type {import('@/src/util/strings.js').StringWithVars}
     * Url of the entities on a page. Also has {{pageIndex}}. When unset, a
     * mock API is used.
     */
    pageEntitiesUrl: null,
    /**
     * @type {import('@/src/util/strings.js').StringWithVars}
     * Url of an entity's details. Also has {{entityId}}
     */
    entityUrl: null,
  }

  /** @type {DeepReadApi} */
  api;

  /** @type {BrDeepReadPanel} */
  _panel;

  /** @type {string | null} */
  activeEntityId = null;

  /** @override */
  init() {
    if (!this.options.enabled || !this.br.plugins.textSelection?.options.enabled) return;

    this.api = this.options.pageEntitiesUrl
      ? new HttpDeepReadApi({
        pageEntitiesUrl: this.options.pageEntitiesUrl,
        entityUrl: this.options.entityUrl,
        vars: { bookId: this.br.bookId, ...this.br.options.vars },
      })
      : new MockDeepReadApi(this.br);

    this.br.on('textLayerRendered', (_, { pageIndex, pageContainer }) => {
      /** @type {HTMLElement} */
      const textLayer = pageContainer.$container[0].querySelector('.BRtextLayer');
      if (textLayer) this.renderPageEntities(pageIndex, textLayer);
    });

    this._initPanel();
  }

  /**
   * @param {number} pageIndex
   * @param {HTMLElement} textLayer
   */
  async renderPageEntities(pageIndex, textLayer) {
    let resp;
    try {
      resp = await this.api.getPageEntities(pageIndex);
    } catch (e) {
      console.warn('DeepRead: failed to fetch page entities', pageIndex, e);
      return;
    }
    if (!textLayer.isConnected) return;

    for (const mention of resp.mentions) {
      const entity = resp.entities[mention.entityId];
      if (!entity) continue;
      let markEls;
      try {
        const fragment = BookReaderTextFragment.fromString(mention.fragment, this.br.book, pageIndex);
        markEls = renderHighlight(textLayer, fragment, 'BRdeepReadEntity');
      } catch (e) {
        console.warn('DeepRead: could not render mention', mention, e);
      }
      for (const markEl of markEls || []) {
        markEl.classList.add(`BRdeepReadEntity--${entity.type}`);
        markEl.classList.toggle('BRdeepReadEntity--active', entity.id === this.activeEntityId);
        markEl.setAttribute('data-entity-id', entity.id);
        markEl.setAttribute('title', `${entity.label} (${entity.type})`);
      }
    }

    if (!textLayer.dataset.deepReadBound) {
      textLayer.dataset.deepReadBound = 'true';
      textLayer.addEventListener('click', this._onTextLayerClick);
    }
  }

  /** @param {MouseEvent} ev */
  _onTextLayerClick = (ev) => {
    const markEl = /** @type {HTMLElement} */ (ev.target).closest?.('.BRdeepReadEntity');
    // Don't hijack the end of a drag-to-select
    if (!markEl || !window.getSelection()?.isCollapsed) return;
    ev.stopPropagation();
    this.openEntity(markEl.getAttribute('data-entity-id'));
  }

  /** @param {string} entityId */
  async openEntity(entityId) {
    this.activeEntityId = entityId;
    this.br.refs.$br[0].querySelectorAll('.BRdeepReadEntity').forEach(el => {
      el.classList.toggle('BRdeepReadEntity--active', el.getAttribute('data-entity-id') === entityId);
    });

    this.br.shell?.updateSideMenu('deepRead', 'open');
    this._updatePanel({ entity: null, mentions: [], loading: true, error: null });
    try {
      const entity = await this.api.getEntity(entityId);
      // A later click wins
      if (this.activeEntityId !== entityId) return;
      this._updatePanel({ entity, mentions: this._parseMentions(entity.mentions || []), loading: false });
    } catch (e) {
      if (this.activeEntityId !== entityId) return;
      this._updatePanel({ loading: false, error: String(e) });
    }
  }

  /**
   * @param {string[]} fragmentStrs
   * @returns {DeepReadPanelMention[]}
   */
  _parseMentions(fragmentStrs) {
    return fragmentStrs.flatMap(str => {
      try {
        const fragment = BookReaderTextFragment.fromString(str, this.br.book, this.br.currentIndex());
        return [{ fragment, pageLabel: this.br.book.getPageName(fragment.pageIndex) }];
      } catch (e) {
        console.warn('DeepRead: bad mention fragment', str, e);
        return [];
      }
    });
  }

  /** @param {BookReaderTextFragment} fragment */
  jumpToMention(fragment) {
    this.br.jumpToIndex(fragment.pageIndex, { ariaLive: true });
  }

  /** @typedef {Partial<Pick<BrDeepReadPanel, 'entity' | 'mentions' | 'loading' | 'error'>>} DeepReadPanelState */
  /** @type {DeepReadPanelState} */
  _panelState = { entity: null, mentions: [], loading: false, error: null };

  /** @param {DeepReadPanelState} state */
  _updatePanel(state) {
    Object.assign(this._panelState, state);
    if (this._panel) Object.assign(this._panel, this._panelState);
  }

  async _initPanel() {
    if (!this.br.shell) {
      await promisifyEvent(window, 'BookReader:PostInit');
    }
    if (!this.br.shell) return;
    this.br.shell.menuProviders['deepRead'] = {
      id: 'deepRead',
      icon: html`<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" stroke-width="1.6" aria-hidden="true">
        <path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5c-.8 0-1.5.7-1.5 1.5z"/>
        <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z"/>
        <circle cx="17" cy="16" r="3.2" fill="#1e1e1e"/><path d="m19.3 18.3 2.2 2.2"/>
      </svg>`,
      label: 'Deep Read',
      component: html`<br-deep-read-panel
        @connected="${(e) => {
        this._panel = e.target;
        Object.assign(this._panel, this._panelState);
      }}"
        @entityClick="${(e) => this.openEntity(e.detail.entityId)}"
        @mentionClick="${(e) => this.jumpToMention(e.detail.fragment)}"
      ></br-deep-read-panel>`,
    };
    this.br.shell.addMenuShortcut('deepRead');
    this.br.shell.updateMenuContents();
  }
}
BookReader?.registerPlugin('deepRead', DeepReadPlugin);

/** @typedef {{ fragment: BookReaderTextFragment, pageLabel: string }} DeepReadPanelMention */

@customElement('br-deep-read-panel')
export class BrDeepReadPanel extends LitElement {
  /** @type {DeepReadEntityDetails | null} */
  @property({ type: Object }) entity = null;
  /** @type {DeepReadPanelMention[]} */
  @property({ type: Array }) mentions = [];
  @property({ type: Boolean }) loading = false;
  /** @type {string | null} */
  @property({ type: String }) error = null;

  connectedCallback() {
    super.connectedCallback();
    this.dispatchEvent(new CustomEvent('connected'));
  }

  render() {
    if (this.loading) return html`<p class="hint">Loading…</p>`;
    if (this.error) return html`<p class="hint error">${this.error}</p>`;
    if (!this.entity) {
      return html`<p class="hint">Click an underlined name in the text to learn more about it.</p>`;
    }
    const e = this.entity;
    return html`
      <article>
        ${e.image ? html`<img class="image" src="${e.image.url}" alt="${e.image.alt || ''}"/>` : nothing}
        <h3>${e.label}</h3>
        <span class="type type--${e.type}">${e.type}</span>
        ${e.description ? html`<p>${e.description}</p>` : nothing}
        ${e.facts?.length ? html`<dl>${e.facts.map(f => html`<dt>${f.label}</dt><dd>${f.value}</dd>`)}</dl>` : nothing}
        ${e.links?.length ? html`<ul class="links">${e.links.map(l => html`<li><a href="${l.url}" target="_blank" rel="noopener">${l.label}</a></li>`)}</ul>` : nothing}
        ${this.mentions.length ? html`
          <h4>Mentions in this book</h4>
          <ol class="mentions">${this.mentions.map(m => this._renderMention(m))}</ol>
        ` : nothing}
        ${e.related?.length ? html`
          <h4>Related</h4>
          <ul class="related">${e.related.map(r => html`<li><button @click=${() => this._emit('entityClick', { entityId: r.id })}>${r.label}</button></li>`)}</ul>
        ` : nothing}
      </article>
    `;
  }

  /** @param {DeepReadPanelMention} mention */
  _renderMention({ fragment: f, pageLabel }) {
    return html`<li><button @click=${() => this._emit('mentionClick', { fragment: f })}>
      <span class="page">${pageLabel}</span>
      …${f.prefix ?? ""} <b>${f.quote ?? `${f.quoteStart}…${f.quoteEnd}`}</b> ${f.suffix ?? ""}…
    </button></li>`;
  }

  /**
   * @param {string} name
   * @param {object} detail
   */
  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  static styles = css`
    :host { display: block; padding: 10px; color: white; font-size: 14px; }
    .hint { opacity: 0.8; }
    .error { color: #ffb4a8; }
    h3 { margin: 0 0 4px; font-size: 18px; }
    h4 { margin: 16px 0 6px; font-size: 13px; text-transform: uppercase; opacity: 0.7; }
    .image { max-width: 100%; border-radius: 4px; margin-bottom: 8px; }
    .type { display: inline-block; font-size: 11px; padding: 1px 6px; border-radius: 8px; background: rgba(255, 255, 255, 0.15); }
    dl { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; margin: 8px 0; }
    dt { opacity: 0.7; }
    dd { margin: 0; }
    a { color: #8fc1ff; }
    ul, ol { padding: 0; margin: 0; list-style: none; }
    button {
      all: unset; cursor: pointer; display: block; width: 100%; box-sizing: border-box;
      padding: 6px 8px; margin: 2px 0; border-radius: 4px; line-height: 1.35;
    }
    button:hover, button:focus-visible { background: rgba(255, 255, 255, 0.1); }
    .page { display: block; font-size: 11px; opacity: 0.7; }
  `;
}
