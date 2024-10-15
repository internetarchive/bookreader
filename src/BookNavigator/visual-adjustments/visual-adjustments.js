import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { nothing } from "lit";
import checkmarkIcon from '../assets/icon_checkmark.js';
import "@internetarchive/icon-magnify-minus/icon-magnify-minus";
import "@internetarchive/icon-magnify-plus/icon-magnify-plus";

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
  }

  setRangeValue(id, value) {
    const updatedOptions = [...this.options];
    updatedOptions.find((o) => o.id === id).value = value;
    this.options = [...updatedOptions];
  }

  /* render */
  rangeSlider(option) {
    return html`
      <div class=${`range${option.active ? " visible" : ""}`}>
        <input
          type="range"
          name="${option.id}_range"
          min=${option.min || 0}
          max=${option.max || 100}
          step=${option.step || 1}
          .value=${option.value}
          @input=${(e) => this.setRangeValue(option.id, e.target.value)}
          @change=${() => this.emitOptionChangedEvent()}
        />
        <p>${option.value}%</p>
      </div>
    `;
  }

  adjustmentCheckbox(option) {
    const formID = `adjustment_${option.id}`;
    return html`<li>
      <label for="${formID}">
        <span class="name">${option.name}</span>
        <input
          type="checkbox"
          name="${formID}"
          id="${formID}"
          @change=${() => this.changeActiveStateFor(option.id)}
          ?checked=${option.active}
        />
        <span class="icon"></span>
      </label>
      ${option.value !== undefined ? this.rangeSlider(option) : nothing}
    </li>`;
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
      <button class="zoom_out" @click=${this.emitZoomOut} title="zoom out">
        <ia-icon-magnify-minus></ia-icon-magnify-minus>
      </button>
      <button class="zoom_in" @click=${this.emitZoomIn} title="zoom in">
        <ia-icon-magnify-plus></ia-icon-magnify-plus>
      </button>
    `;
  }

  /** @inheritdoc */
  render() {
    return html`
      ${this.headerSection}
      <ul>
        ${repeat(this.options, (option) => option.id, this.adjustmentCheckbox.bind(this))}
      </ul>
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

    ul {
      padding: 1rem 2rem 0 0;
      list-style: none;
      margin-top: 0;
    }

    [type="checkbox"] {
      display: none;
    }

    label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 1.4rem;
      font-weight: bold;
      line-height: 150%;
      vertical-align: middle;
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
    :checked + .icon {
      background-image: url('${checkmarkIcon}');
    }

    .range {
      display: none;
      padding-top: .5rem;
    }
    .range.visible {
      display: flex;
    }

    .range p {
      margin-left: 1rem;
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
      border-radius: 0;
      background: transparent;
      outline: none;
      cursor: pointer;
      --iconFillColor: var(--primaryTextColor);
      --iconStrokeColor: var(--primaryTextColor);
      height: 4rem;
      width: 4rem;
    }

    button * {
      display: inline-block;
    }`;
  }
}
customElements.define('ia-book-visual-adjustments', IABookVisualAdjustments);
