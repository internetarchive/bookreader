// @ts-check
import { css, html, LitElement } from 'lit';
import { BookReaderPlugin } from '../BookReaderPlugin.js';
import { customElement, property, state } from 'lit/decorators.js';
import { sleep } from '../BookReader/utils.js';

// @ts-ignore
const BookReader = /** @type {typeof import('@/src/BookReader.js').default} */(window.BookReader);

/** @typedef {'copyLinkToHighlight' | 'annotateHighlight' | 'translate' | 'hypothesis'} ExperimentName */

class ExperimentModel {
  /** @type {ExperimentName} */
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

  /** @type {import("@/src/BookReader.js").default} */
  br;

  assetRoot = '/BookReader/';

  enabledLoading = false;

  /**
   * @param {string} path
   */
  buildAssetPath(path) {
    return `${this.assetRoot}${path}`;
  }

  /**
   * @param {object} param0
   * @param {boolean} param0.manual Whether the experiment was enabled manually
   */
  async enable({ manual }) { }
  async disable() { }
}

export class ExperimentsPlugin extends BookReaderPlugin {
  options = {
    enabled: true,

    /** Where the state of this plugin is saved in localStorage */
    localStorageKey: 'BrExperiments',

    /** @type {ExperimentName[]} Experiments shown in the experiments panel */
    availableExperiments: ['translate', 'copyLinkToHighlight'],

    /** @type {ExperimentName[]} Experiments enabled by default */
    autoEnabledExperiments: [],
  }

  /** @type {ExperimentModel[]} */
  allExperiments = [
    new class extends ExperimentModel {
      name = 'copyLinkToHighlight';
      title = 'Copy Link to Highlight';
      description = 'Shareable link to a text selection';
      icon = null;
      enabled = false;
      async enable ({ manual = false }) {
        if (manual) {
          this.br.plugins.textSelection.textSelectionManager.selectMenu.copyLinkToHighlightEnabled = true;
        }
      }
      async disable() {
        this.br.plugins.textSelection.textSelectionManager.selectMenu.copyLinkToHighlightEnabled = false;
      }
    }(),
    new class extends ExperimentModel {
      name = 'annotateHighlight';
      title = 'Highlight and annotate';
      description = 'Create private highlights and annotations for this book';
      icon = null;
      enabled = false;
      async enable ({ manual = false }) {
        if (manual) {
          this.br.plugins.textSelection.textSelectionManager.selectMenu.highlightAnnotationEnabled = true;
        }
      }
      async disable() {
        sleep(0).then(() => {
          window.location.reload();
        });
      }
    }(),
    new class extends ExperimentModel {
      name = 'translate';
      title = 'Translate Plugin';
      description = "Translate books directly in your browser.";
      learnMore = 'https://mozilla.github.io/translations/';
      icon = 'images/translate.svg';
      enabled = false;
      async enable({ manual = false}) {
        if (BookReader.PLUGINS.translate) return;

        await importAsScript(this.buildAssetPath('plugins/plugin.translate.js'));
        this.br.initializePlugin('translate');
      }
      async disable() {
        // need to reload to remove translate plugin script
        // Sleep so that the event loop can finish processing before the reload
        sleep(0).then(() => {
          window.location.reload();
        });
      }
    }(),
    new class extends ExperimentModel {
      name = 'hypothesis';
      title = 'Hypothes.is';
      description = 'Create public, collaborative, or fully private annotations on books and the web.';
      learnMore = 'https://web.hypothes.is/about/';
      icon = 'images/hypothesis.ico';
      enabled = false;

      async enable({ manual = false }) {
        // Hypothesis configs ; see https://h.readthedocs.io/projects/client/en/latest/publishers/config.html
        const configScript = document.createElement('script');
        configScript.type = 'application/json';
        configScript.className = 'js-hypothesis-config';
        configScript.textContent = JSON.stringify({
          // Open the sidebar if this is the first time enabling
          openSidebar: manual,
          assetRoot: this.buildAssetPath('hypothesis/'),
        });

        document.head.appendChild(configScript);
        return importAsScript(this.buildAssetPath('hypothesis/build/boot.js'));
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

    for (const experiment of this.allExperiments) {
      // TODO: imagesBaseURL should be replaced with assetRoot everywhere
      experiment.assetRoot = this.br.options.imagesBaseURL.replace(/images\/$/, '');
      if (experiment.icon) {
        experiment.icon = experiment.buildAssetPath(experiment.icon);
      }

      experiment.br = this.br;

      // Enable any experiments that should be automatically enabled
      if (!experiment.enabled && this.options.autoEnabledExperiments.includes(experiment.name)) {
        experiment.enabled = true;
        await experiment.enable({ manual: false });
      }
    }

    this._loadExperimentStates();
    await Promise.resolve();
    this._render();
  }

  /**
   * @param {ExperimentName} experimentName
   */
  isEnabled(experimentName) {
    const experiment = this.allExperiments.find(exp => exp.name === experimentName);
    return experiment?.enabled;
  }

  _loadExperimentStates() {
    const savedStates = JSON.parse(localStorage.getItem(this.options.localStorageKey) || '{}');
    this.allExperiments.forEach(experiment => {
      if (savedStates[experiment.name] !== undefined) {
        experiment.enabled = savedStates[experiment.name];
        if (experiment.enabled) {
          experiment.enable({ manual: false });
        }
      }
    });
  }

  _saveExperimentStates() {
    const states = Object.fromEntries(
      this.allExperiments.map(experiment => [experiment.name, experiment.enabled]),
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
      await experiment.enable({ manual: true });
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
      icon: html`
        <img src="${this.br.options.imagesBaseURL}/icon_experiment.svg" alt="" width="26"/>
      `,
      label: 'Experiments',
      component: html`<br-experiments-panel
        .experiments="${this.allExperiments.filter(experiment => this.options.availableExperiments.includes(experiment.name))}"
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
      <div class="experiment-card" style="margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          ${this.icon ? html`<img src="${this.icon}" style="width: 20px; height: 20px;" alt="" />` : ''}
          <div style="flex-grow: 1; font-weight: bold;">${this.title}</div>
        </div>
        <p style="opacity: 0.9">
          ${this.description}
          ${this.learnMore ? html`<a href="${this.learnMore}" target="_blank">Learn more</a>.` : ''}
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
