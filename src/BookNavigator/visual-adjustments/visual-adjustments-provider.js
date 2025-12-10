import { html } from 'lit';
import '@internetarchive/icon-visual-adjustment/icon-visual-adjustment.js';
import './visual-adjustments.js';

const visualAdjustmentOptions = [{
  id: 'brightness',
  name: 'Adjust brightness',
  active: false,
  min: 0,
  max: 200,
  step: 1,
  value: 120,
}, {
  id: 'contrast',
  name: 'Adjust contrast',
  active: false,
  min: 0,
  max: 200,
  step: 1,
  value: 120,
}, {
  id: 'invert',
  name: 'Invert colors (dark mode)',
  active: false,
}, {
  id: 'grayscale',
  name: 'Convert to grayscale',
  active: false,
}];

export default class VisualAdjustmentsProvider {
  constructor(options) {
    const { onProviderChange, bookreader } = options;
    this.onProviderChange = onProviderChange;
    this.bookContainer = bookreader.refs.$brContainer;
    this.bookreader = bookreader;

    this.onAdjustmentChange = this.onAdjustmentChange.bind(this);
    this.optionUpdateComplete = this.optionUpdateComplete.bind(this);
    this.updateOptionsCount = this.updateOptionsCount.bind(this);
    this.onZoomIn = this.onZoomIn.bind(this);
    this.onZoomOut = this.onZoomOut.bind(this);

    this.activeCount = 0;
    this.icon = html`<ia-icon-visual-adjustment aria-hidden="true" role="presentation" style="width: var(--iconWidth); height: var(--iconHeight);"></ia-icon-visual-adjustment>`;
    this.label = 'Visual Adjustments';
    this.menuDetails = this.updateOptionsCount();
    this.id = 'visualAdjustments';
    this.component = html`
      <ia-book-visual-adjustments
        .options=${visualAdjustmentOptions}
        @visualAdjustmentOptionChanged=${this.onAdjustmentChange}
        @visualAdjustmentZoomIn=${this.onZoomIn}
        @visualAdjustmentZoomOut=${this.onZoomOut}
      ></ia-book-visual-adjustments>
    `;
  }

  onZoomIn() {
    this.bookreader.zoom(1);
  }

  onZoomOut() {
    this.bookreader.zoom(-1);
  }

  onAdjustmentChange(event) {
    const { detail } = event;
    const adjustments = {
      brightness: (value) => `brightness(${value}%)`,
      contrast: (value) => `contrast(${value}%)`,
      grayscale: () => 'grayscale(100%)',
      invert: () => 'invert(100%)',
    };
    const filters = detail.options.reduce((values, option) => {
      const newValue = `${option.active ? adjustments[option.id](option.value) : ''}`;
      return newValue ? [...values, newValue] : values;
    }, []).join(' ');

    this.bookContainer.css('filter', filters);

    this.optionUpdateComplete(event);
  }

  optionUpdateComplete(event) {
    this.activeCount = event.detail.activeCount;
    this.updateOptionsCount(event);
    this.onProviderChange();
  }

  updateOptionsCount() {
    this.menuDetails = `(${this.activeCount} active)`;
  }
}
