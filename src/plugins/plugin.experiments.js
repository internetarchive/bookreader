// @ts-check
import { css, html, LitElement } from 'lit';
import { BookReaderPlugin } from '../BookReaderPlugin.js';
import { customElement, property, state } from 'lit/decorators.js';
import { sleep } from '../BookReader/utils.js';

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

class ExperimentModel {
  /** @type {string} test */
  name;
  /** @type {string} */
  title;
  /** @type {string} */
  description;
  /** @type {string} */
  icon;
  /** @type {boolean} */
  enabled;
  /** @type {string} */
  learnMore;

  enabledLoading = false;

  async enable() { }
  async disable() { }
}

export class ExperimentsPlugin extends BookReaderPlugin {
  options = {
    enabled: true,

    /** Where the state of this plugin is saved in localStorage */
    localStorageKey: 'BrExperiments',
  }

  /** @type {ExperimentModel[]} */
  experiments = [
    new class extends ExperimentModel {
      name = 'hypothesis';
      title = 'Hypothes.is';
      description = 'Create public, collaborative, or fully private annotations on books and the web.';
      learnMore = 'https://web.hypothes.is/about/';
      icon = 'https://web.hypothes.is/favicon.ico';
      enabled = false;

      async enable() {
        return importAsScript('https://hypothes.is/embed.js');
        // For testing
        // return importAsScript('http://localhost:3001/hypothesis');
      }

      async disable() {
        // need to reload to remove the Hypothesis script
        // Sleep so that the event loop can finish processing before the reload
        sleep(0).then(() => {
          window.location.reload();
        });
      }
    }(),
  ]

  /** @type {BrExperimentsPanel} */
  _panel;

  async init() {
    if (!this.options.enabled) {
      return;
    }
    this._loadExperimentStates();
    await Promise.resolve();
    this._render();
  }

  _loadExperimentStates() {
    const savedStates = JSON.parse(localStorage.getItem(this.options.localStorageKey) || '{}');
    this.experiments.forEach(experiment => {
      if (savedStates[experiment.name] !== undefined) {
        experiment.enabled = savedStates[experiment.name];
        if (experiment.enabled) {
          experiment.enable();
        }
      }
    });
  }

  _saveExperimentStates() {
    const states = Object.fromEntries(
      this.experiments.map(experiment => [experiment.name, experiment.enabled]),
    );
    localStorage.setItem(this.options.localStorageKey, JSON.stringify(states));
  }

  /**
   * @param {ExperimentModel} experiment
   * @param {boolean} enabled
   */
  async _toggleExperiment(experiment, enabled) {
    experiment.enabledLoading = true;
    this.br.plugins.archiveAnalytics?.sendEvent(`BRExperiment-${experiment.name}`, enabled ? 'Enable' : 'Disable');
    this._panel.requestUpdate();

    if (enabled) {
      await experiment.enable();
    } else {
      await experiment.disable();
    }
    experiment.enabledLoading = false;
    experiment.enabled = enabled;
    this._panel.requestUpdate();
  }

  _render() {
    this.br.shell.menuProviders['experiments'] = {
      id: 'experiments',
      // https://icon-sets.iconify.design/hugeicons/?icon-filter=eco-lab-02&query=lab
      icon: html`
        <svg xmlns="http://www.w3.org/2000/svg" width="34" viewBox="0 0 24 24"><path fill="currentColor" d="M10 5.75h1.25v2.5H9.5c-.41 0-.75.34-.75.75s.34.75.75.75h.25v1.96A5.72 5.72 0 0 0 6.25 17c0 3.17 2.58 5.75 5.75 5.75s5.75-2.58 5.75-5.75c0-2.33-1.39-4.4-3.5-5.29V9.75h.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75h-1.75v-1.5H14c1.52 0 2.75-1.23 2.75-2.75V3c0-.41-.34-.75-.75-.75h-2c-.579 0-1.115.178-1.558.483A2.75 2.75 0 0 0 10 1.25H8c-.41 0-.75.34-.75.75v1c0 1.52 1.23 2.75 2.75 2.75m2.75-.5V5c0-.69.56-1.25 1.25-1.25h1.25V4c0 .69-.56 1.25-1.25 1.25zm-1.5 6.98V9.75h1.5v2.48c0 .33.22.62.53.72c1.77.56 2.97 2.19 2.97 4.06A4.26 4.26 0 0 1 12 21.26a4.26 4.26 0 0 1-4.25-4.25c0-1.87 1.19-3.5 2.97-4.06c.32-.1.53-.39.53-.72m-2.5-9.48H10c.69 0 1.25.56 1.25 1.25v.25H10c-.69 0-1.25-.56-1.25-1.25z" color="currentColor"/></svg>
      `,
      label: 'Experiments',
      component: html`<br-experiments-panel
        .experiments="${this.experiments}"
        @connected="${e => this._panel = e.target}"
        @toggle="${async e => {
        await this._toggleExperiment(e.detail.experiment, e.detail.enabled);
        this._saveExperimentStates();
      }}"
      />`,
    };
    this.br.shell.updateMenuContents();
  }
}
BookReader?.registerPlugin('experiments', ExperimentsPlugin);

@customElement('br-experiments-panel')
export class BrExperimentsPanel extends LitElement {

  /** @type {ExperimentModel[]} */
  @property({ type: Array }) experiments = [];

  render() {
    return html`
      <div style="padding: 10px">
        ${this.experiments.map(
      experiment => html`
        <br-experiment-toggle
          .icon="${experiment.icon}"
          .title="${experiment.title}"
          .description="${experiment.description}"
          .enabled="${experiment.enabled}"
          .loading="${experiment.enabledLoading}"
          .learnMore="${experiment.learnMore}"
          @toggle="${e => this._dispatchToggle(experiment, e.detail.enabled)}"
        ></br-experiment-toggle>
      `,
    )}
      </div>
    `;
  }

  /**
   * @param {ExperimentModel} experiment
   * @param {boolean} enabled
   */
  async _dispatchToggle(experiment, enabled) {
    this.dispatchEvent(new CustomEvent('toggle', {
      detail: { experiment, enabled },
    }));
  }

  connectedCallback() {
    super.connectedCallback();
    this.dispatchEvent(new CustomEvent('connected'));
  }
}

@customElement('br-experiment-toggle')
export class BrExperimentToggle extends LitElement {
  @property({ type: String }) icon = '';
  @property({ type: String }) title = '';
  @property({ type: String }) description = '';
  @property({ type: Boolean }) enabled = false;
  @property({ type: Boolean }) loading = false;
  @property({ type: String }) learnMore = '';

  /**
   * We want to disable the button immediately if loading, but only display
   * the loading indicator after 200ms.
   */
  @state() _longLoading = false;

  /** @override */
  update(changedProperties) {
    super.update(changedProperties);
    if (changedProperties.has('loading')) {
      if (this.loading) {
        sleep(500).then(() => {
          if (this.loading) {
            this._longLoading = true;
            this.requestUpdate();
          }
        });
      } else {
        this._longLoading = false;
      }
    }
  }

  render() {
    return html`
      <div class="experiment-card">
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${this.icon}" style="width: 20px; height: 20px;" alt="" />
          <div style="flex-grow: 1; font-weight: bold;">${this.title}</div>
        </div>
        <p style="opacity: 0.9">
          ${this.description}
          <a href="${this.learnMore}" target="_blank">Learn more</a>.
        </p>
        <div style="display: flex">
          <div style="flex-grow: 1;"></div>
          <button @click="${this._dispatchToggle}" .disabled="${this.loading}">
            ${this._longLoading ? 'Loading…' : this.enabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .experiment-card {
        border-radius: 8px;
        background-color: #fff2;
        padding: 10px;
        display: flex;
        flex-direction: column;
      }

      .experiment-card p {
        margin: 6px 0;
      }
    `;
  }

  _dispatchToggle() {
    this.dispatchEvent(new CustomEvent('toggle', { detail: { enabled: !this.enabled } }));
  }
}

/**
 * @param {string} url
 */
async function importAsScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}
