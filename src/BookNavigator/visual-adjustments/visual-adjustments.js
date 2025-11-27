import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { nothing } from "lit";
import "@internetarchive/icon-magnify-minus/icon-magnify-minus.js";
import "@internetarchive/icon-magnify-plus/icon-magnify-plus.js";

const namespacedEvent = (eventName) => `visualAdjustment${eventName}`;

const events = {
  optionChange: namespacedEvent("OptionChanged"),
  zoomIn: namespacedEvent("ZoomIn"),
  zoomOut: namespacedEvent("ZoomOut"),
};

export class IABookVisualAdjustments extends LitElement {
  static get properties() {
    return {
      activeCount: { type: Number },
      options: { type: Array },
      renderHeader: { type: Boolean },
      showZoomControls: { type: Boolean },
    };
  }

  constructor() {
    super();

    this.activeCount = 0;
    this.options = [];
    this.renderHeader = false;
    this.showZoomControls = true;
  }

  firstUpdated() {
    this.activeCount = this.activeOptions.length;
    this.emitOptionChangedEvent();
  }

  /** Gets list of active options
   * @return array
   */
  get activeOptions() {
    return this.options.reduce(
      (results, option) => (option.active ? [...results, option.id] : results),
      [],
    );
  }

  /**
   * Returns blob that will be emitted by event
   */
  prepareEventDetails(changedOptionId = "") {
    return {
      options: this.options,
      activeCount: this.activeCount,
      changedOptionId,
    };
  }

  /**
   * Fires custom event when options change
   * Provides state details: { options, activeCount, changedOptionId }
   *
   * @param { string } changedOptionId
   */
  emitOptionChangedEvent(changedOptionId = "") {
    const detail = this.prepareEventDetails(changedOptionId);
    this.dispatchEvent(
      new CustomEvent(events.optionChange, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }

  emitZoomIn() {
    this.dispatchEvent(new CustomEvent(events.zoomIn));
  }

  emitZoomOut() {
    this.dispatchEvent(new CustomEvent(events.zoomOut));
  }

  /**
   * Updates adjustment & component state
   * updates params of available ajdustment options list
   * updates active adjustment count
   * triggers custom event
   * @param { string } optionName
   */
  changeActiveStateFor(optionName) {
    const updatedOptions = [...this.options];
    const checkedOption = updatedOptions.find(
      (option) => option.id === optionName,
    );
    checkedOption.active = !checkedOption.active;
    this.options = updatedOptions;
    this.activeCount = this.activeOptions.length;
    this.emitOptionChangedEvent(checkedOption.id);
    if (checkedOption.active && checkedOption.value !== undefined) {
      // move focus to the range input
      const rangeInput = this.shadowRoot.querySelector(`input[name="${checkedOption.id}_range"]`);
      requestAnimationFrame(() => {
        rangeInput?.focus();
      });
    }
  }

  setRangeValue(id, value) {
    const updatedOptions = [...this.options];
    updatedOptions.find((o) => o.id === id).value = value;
    this.options = [...updatedOptions];
  }

  /* render */
  rangeSlider(option) {
    return html`
      <label class=${`range${option.active ? " visible" : ""}`}>
        <span class="sr-only">${option.name}</span>
        <input
          type="range"
          name="${option.id}_range"
          min=${option.min || 0}
          max=${option.max || 100}
          step=${option.step || 1}
          .value=${option.value}
          aria-valuetext=${`${option.value}%`}
          @input=${(e) => this.setRangeValue(option.id, e.target.value)}
          @change=${() => this.emitOptionChangedEvent()}
        />
        <span aria-hidden="true">${option.value}%</span>
      </label>
    `;
  }

  adjustmentCheckbox(option) {
    return html`
      <div class="adjustment-option ${option.active ? 'active' : ''} ${option.value !== undefined ? 'has-range' : ''}">
        <label class="checkbox-label">
          ${option.name}
          <input
            type="checkbox"
            @change=${() => this.changeActiveStateFor(option.id)}
            ?checked=${option.active}
          />
        </label>
        ${option.value !== undefined ? this.rangeSlider(option) : nothing}
      </div>
    `;
  }

  get headerSection() {
    const activeAdjustments = this.activeCount
      ? html`<p>(${this.activeCount} active)</p>`
      : nothing;
    const header = html`<header>
      <h3>Visual adjustments</h3>
      ${activeAdjustments}
    </header>`;
    return this.renderHeader ? header : nothing;
  }

  get zoomControls() {
    return html`
      <h4>Adjust zoom</h4>
      <button class="zoom_out" @click=${this.emitZoomOut} title="Zoom out" aria-label="Zoom out">
        <ia-icon-magnify-minus aria-hidden="true" role="presentation"></ia-icon-magnify-minus>
      </button>
      <button class="zoom_in" @click=${this.emitZoomIn} title="Zoom in" aria-label="Zoom in">
        <ia-icon-magnify-plus aria-hidden="true" role="presentation"></ia-icon-magnify-plus>
      </button>
    `;
  }

  /** @inheritdoc */
  render() {
    return html`
      ${this.headerSection}
      ${repeat(this.options, (option) => option.id, this.adjustmentCheckbox.bind(this))}
      ${this.showZoomControls ? this.zoomControls : nothing}
    `;
  }

  static get styles() {
    return css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
      font-size: 1.4rem;
      box-sizing: border-box;
      padding: 10px 10px 0 0;
    }

    header {
      display: flex;
      align-items: baseline;
    }

    h3 {
      padding: 0;
      margin: 0 1rem 0 0;
      font-size: 1.6rem;
    }

    header p {
      padding: 0;
      margin: 0;
      font-size: 1.2rem;
      font-weight: bold;
      font-style: italic;
    }

    .adjustment-option {
      border: 2px solid transparent;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .adjustment-option.has-range.active {
      border: 2px solid rgba(255, 255, 255, 0.2);
    }

    .checkbox-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.4rem;
      font-weight: bold;
      cursor: pointer;
      padding: 6px 8px;
      transition: background-color 0.2s;
      border-radius: inherit;
    }
    .checkbox-label:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    .adjustment-option.has-range.active > .checkbox-label {
      border-radius: 4px 4px 0 0;
    }

    [type="checkbox"] {
      transform: scale(1.5);
    }

    .range {
      display: none;
      padding: 10px;
      align-items: center;
      gap: 10px;
    }
    .range.visible {
      display: flex;
    }
    .range input[type="range"] {
      flex: 1;
    }

    h4 {
      padding: 1rem 0;
      margin: 0;
      font-size: 1.4rem;
    }

    button {
      -webkit-appearance: none;
      appearance: none;
      border: none;
      background: transparent;
      cursor: pointer;
      --iconFillColor: var(--primaryTextColor);
      --iconStrokeColor: var(--primaryTextColor);
      height: 4rem;
      width: 4rem;
      transition: background-color 0.2s;
      border-radius: 4px;
    }

    button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0 0 0 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
`;
  }
}
customElements.define('ia-book-visual-adjustments', IABookVisualAdjustments);
