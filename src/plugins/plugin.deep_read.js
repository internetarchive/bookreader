// @ts-check
import { EVENTS } from '../BookReader/events.js';
import { BookReaderPlugin } from '../BookReaderPlugin.js';

/* global BookReader */

/**
 * Deep Read — "[Deep] Research Mode" plugin.
 *
 * Augments a window of pages (the current spread ± `windowRadius`) by
 * identifying the semantic entities on those pages (people, places, things).
 * Selecting an entity performs a research step that surfaces relevant,
 * accessible resources on archive.org, rendered in a right-hand sidebar.
 *
 * The entity-identification and research work is done by the Deep Read backend
 * micro-services (separate repo: internetarchivecanada/deep-read). This plugin
 * is the BookReader-side integration + UI only; point `apiBase` at that backend.
 *
 *   API contract:
 *     POST {apiBase}/api/identify  { text }    -> { entities: [{name,type,excerpt}] }
 *     POST {apiBase}/api/research  { entity }   -> { summary, links: [...] }
 *
 * TODO(ui): rebuild the sidebar on the Internet Archive Design System (iaux) —
 * it's a plain custom element here so the plugin stays single-file and buildless.
 */
export class DeepReadPlugin extends BookReaderPlugin {
  options = {
    enabled: false,
    /** @type {string} Base URL of the Deep Read backend, e.g. 'http://localhost:8010'. */
    apiBase: '',
    /** Pages before/after the current spread to include in the window. */
    windowRadius: 1,
    /** Re-identify entities when the page changes. */
    autoIdentifyOnFlip: true,
    /**
     * Optional override to extract the window text for a given BookReader.
     * @type {null | ((br: BookReader, radius: number) => Promise<string>)}
     */
    getWindowText: null,
  };

  /** @override */
  init() {
    if (!this.options.enabled) return;
    this._lastKey = null;
    this._mount();
    if (this.options.autoIdentifyOnFlip) {
      this.br.bind(EVENTS.fragmentChange, () => this.identify());
    }
    // First pass once the book is ready.
    this.br.bind(EVENTS.PostInit, () => this.identify());
  }

  _mount() {
    const panel = document.createElement('div');
    panel.className = 'BRdeepRead';
    Object.assign(panel.style, {
      width: '360px', flex: '0 0 360px', height: '100%', overflow: 'hidden',
    });
    this.sidebar = /** @type {any} */ (document.createElement('deep-read-sidebar'));
    panel.appendChild(this.sidebar);

    // Insert to the right of the reader container.
    const brEl = this.br.refs?.$br?.[0] ?? this.br.refs?.$brContainer?.[0];
    const host = brEl?.parentElement ?? document.body;
    host.appendChild(panel);
    this._panel = panel;

    this.sidebar.addEventListener('entity-select', (/** @type {any} */ e) =>
      this.selectEntity(e.detail.entity));
    this.sidebar.addEventListener('close', () => { panel.style.display = 'none'; });
  }

  /** Pull the window text and request entities. */
  async identify() {
    const text = await this._windowText();
    const key = (text || '').slice(0, 64);
    if (!text || key === this._lastKey) return;
    this._lastKey = key;
    const { entities } = await this._post('/api/identify', { text });
    if (this.sidebar) {
      this.sidebar.entities = entities || [];
      this.sidebar.selected = null;
      this.sidebar.result = null;
    }
    return entities;
  }

  /** Research a selected entity and render it. */
  async selectEntity(entity) {
    if (!this.sidebar) return;
    this.sidebar.selected = entity;
    this.sidebar.result = null;
    this.sidebar.loading = true;
    try {
      const context = entity.excerpt || '';
      this.sidebar.result = await this._post('/api/research', { entity: { ...entity, context } });
    } finally {
      this.sidebar.loading = false;
    }
    return this.sidebar.result;
  }

  async _post(path, body) {
    const res = await fetch(`${this.options.apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
    return res.json();
  }

  /**
   * Collect the text of the current page window. Override via
   * options.getWindowText for your deployment; otherwise best-effort via the
   * BookReader book model (not all builds expose page text).
   */
  async _windowText() {
    if (typeof this.options.getWindowText === 'function') {
      return (await this.options.getWindowText(this.br, this.options.windowRadius)) || '';
    }
    const current = this.br.currentIndex?.() ?? 0;
    const r = this.options.windowRadius;
    const parts = [];
    for (let i = current - r; i <= current + r + 1; i++) {
      if (i < 0) continue;
      try {
        const t = await this.br.book?.getPage?.(i)?.getPageText?.();
        if (t) parts.push(typeof t === 'string' ? t : String(t));
      } catch { /* page text unavailable for this build */ }
    }
    return parts.join('\n\n').trim();
  }
}

BookReader?.registerPlugin('deepRead', DeepReadPlugin);

// --- Sidebar UI -----------------------------------------------------------
// Plain custom element so the plugin is single-file and needs no build step.
// Replace with iaux (`<ia-*>`) components + IA design tokens for production.
const TYPE_LABEL = { person: 'Person', place: 'Place', thing: 'Thing' };

if (typeof customElements !== 'undefined' && !customElements.get('deep-read-sidebar')) {
  class DeepReadSidebar extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); this._e = []; this._sel = null; this._res = null; this._loading = false; }
    connectedCallback() { this._render(); }
    set entities(v) { this._e = v || []; this._render(); }
    get entities() { return this._e; }
    set selected(v) { this._sel = v || null; this._render(); }
    get selected() { return this._sel; }
    set result(v) { this._res = v || null; this._render(); }
    get result() { return this._res; }
    set loading(v) { this._loading = !!v; this._render(); }
    get loading() { return this._loading; }
    _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true })); }
    _render() {
      const sel = this._sel;
      this.shadowRoot.innerHTML = `
        <style>
          :host { --dr-fg:#2c2c2c; --dr-muted:#767676; --dr-accent:#c5523f; --dr-border:#e0e0e0; --dr-chip:#f5f5f7;
            display:block; height:100%; font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
            color:var(--dr-fg); background:#fff; border-left:1px solid var(--dr-border); box-sizing:border-box; }
          .wrap{display:flex;flex-direction:column;height:100%}
          header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--dr-border)}
          header h2{font-size:14px;letter-spacing:.04em;text-transform:uppercase;margin:0;color:var(--dr-muted)}
          .close{border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:var(--dr-muted)}
          .body{padding:16px;overflow-y:auto;flex:1}
          .chips{display:flex;flex-wrap:wrap;gap:8px}
          .chip{border:1px solid var(--dr-border);background:var(--dr-chip);border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer}
          .chip[aria-pressed="true"]{border-color:var(--dr-accent);color:var(--dr-accent);background:#fdf2f0}
          .chip .t{color:var(--dr-muted);font-size:11px;margin-left:6px}
          .summary{margin:16px 0;line-height:1.5}.summary h3{margin:0 0 4px;font-size:18px}
          ul.links{list-style:none;margin:0;padding:0}ul.links li{padding:12px 0;border-top:1px solid var(--dr-border)}
          ul.links a{color:var(--dr-accent);text-decoration:none;font-weight:600}ul.links a:hover{text-decoration:underline}
          .excerpt{color:var(--dr-muted);font-size:13px;line-height:1.4;margin-top:4px}
          .empty,.loading{color:var(--dr-muted);font-size:14px;padding:8px 0}
          .mediatype{font-size:11px;color:var(--dr-muted);text-transform:uppercase;letter-spacing:.04em}
        </style>
        <div class="wrap">
          <header><h2>Deep Read</h2><button class="close" aria-label="Close">×</button></header>
          <div class="body">
            ${this._e.length ? `<div class="chips">${this._e.map((e, i) => this._chip(e, i)).join('')}</div>`
              : `<p class="empty">No entities identified for this view yet.</p>`}
            ${this._detail(sel)}
          </div>
        </div>`;
      this.shadowRoot.querySelector('.close').addEventListener('click', () => this._emit('close'));
      this.shadowRoot.querySelectorAll('.chip').forEach((el) =>
        el.addEventListener('click', () => this._emit('entity-select', { entity: this._e[Number(el.dataset.i)] })));
    }
    _chip(e, i) {
      const pressed = this._sel && this._sel.name === e.name;
      return `<button class="chip" data-i="${i}" aria-pressed="${pressed ? 'true' : 'false'}">${esc(e.name)}<span class="t">${TYPE_LABEL[e.type] || ''}</span></button>`;
    }
    _detail(sel) {
      if (!sel) return '';
      if (this._loading) return `<p class="loading">Researching ${esc(sel.name)}…</p>`;
      const r = this._res; if (!r) return '';
      const links = (r.links || []).map((l) => `
        <li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>
        ${l.mediatype ? `<div class="mediatype">${esc(l.mediatype)}</div>` : ''}
        ${l.excerpt ? `<div class="excerpt">${esc(l.excerpt)}</div>` : ''}</li>`).join('');
      return `<div class="summary"><h3>${esc(sel.name)}</h3><div>${esc(r.summary || '')}</div></div>
        ${links ? `<ul class="links">${links}</ul>` : `<p class="empty">No references found.</p>`}`;
    }
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  customElements.define('deep-read-sidebar', DeepReadSidebar);
}
