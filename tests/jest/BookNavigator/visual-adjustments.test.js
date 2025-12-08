import {
  html,
  fixture,
  oneEvent,
} from '@open-wc/testing-helpers';
import sinon from 'sinon';
import { IABookVisualAdjustments } from '@/src/BookNavigator/visual-adjustments/visual-adjustments.js';

const options = [{
  id: 'contrast',
  name: 'Adjust contrast',
  active: true,
  min: 0,
  max: 150,
  step: 1,
  value: 100,
}, {
  id: 'invert',
  name: 'Invert colors (dark mode)',
  active: false,
}, {
  id: 'brightness',
  name: 'Adjust brightness',
  active: false,
  value: 100,
}];

const container = (renderHeader = false) => (
  html`<ia-book-visual-adjustments .options=${options} ?renderHeader=${renderHeader}></ia-book-visual-adjustments>`
);

describe('<ia-book-visual-adjustments>', () => {
  afterEach(() => {
    sinon.restore();
  });

  test('sets default properties', async () => {
    const el = await fixture(container());

    expect(el.options).toBeDefined();
    expect(el.options.length).toEqual(options.length);
    expect(el.renderHeader).toBeDefined();
    expect(el.renderHeader).toBeFalsy();
    expect(el.activeCount).toBeDefined();
    expect(el.showZoomControls).toBeTruthy();
  });

  test('renders all properties of a visual adjustment option', async () => {
    const el = await fixture(container());

    await el.updateComplete;

    const label = el.shadowRoot.querySelector('label');
    const checkbox = label.querySelector('input');
    expect(label.textContent.trim()).toEqual(options[0].name);
    expect(checkbox.checked).toEqual(true);
  });

  test('can render header with active options count', async () => {
    const renderHeader = true;
    const el = await fixture(container(renderHeader));
    expect(el.shadowRoot.querySelector('header p').textContent).toContain('1');
  });

  test('does not render active options count element when none are selected', async () => {
    const el = await fixture(container());

    el.options = [options[1]];
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header p')).toBe(null);
  });

  test('changes option\'s active state when input changed', async () => {
    const el = await fixture(container());

    el.shadowRoot.querySelector('.checkbox-label input').dispatchEvent(new Event('change'));
    await el.updateComplete;

    expect(el.options[0].active).toEqual(false);
  });

  test('renders zoom in and out controls when enabled', async () => {
    const el = await fixture(container());

    expect(el.shadowRoot.querySelector('.zoom_out')).toBeDefined();
    expect(el.shadowRoot.querySelector('.zoom_in')).toBeDefined();
  });

  test('does not render zoom controls when disabled', async () => {
    const el = await fixture(container());

    el.showZoomControls = false;
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('.zoom_out')).toBe(null);
    expect(el.shadowRoot.querySelector('.zoom_in')).toBe(null);
  });

  describe('Custom events', () => {
    test('prepareEventDetails returns proper params', async () => {
      const el = await fixture(container());
      await el.updateComplete;
      const params = el.prepareEventDetails();

      expect(params.activeCount).toBeDefined();
      expect(typeof (params.activeCount)).toEqual('number');
      expect(params.changedOptionId).toBeDefined();
      expect(typeof (params.changedOptionId)).toEqual('string');
      expect(params.options).toBeDefined();
      expect(params.options.length).toBeDefined();
      expect(params.options.length).toBeGreaterThan(0);
    });
    test('emitOptionChangedEvent calls for the params', async () => {
      IABookVisualAdjustments.prototype.prepareEventDetails = sinon.fake();
      const el = await fixture(container());
      await el.updateComplete;

      expect(el.prepareEventDetails.callCount).toEqual(1);
    });
    test('triggers an emitOptionChangedEvent event at firstUpdate', async () => {
      IABookVisualAdjustments.prototype.emitOptionChangedEvent = sinon.fake();
      const el = await fixture(container());

      expect(el.emitOptionChangedEvent.callCount).toEqual(1);
    });

    test('triggers an emitOptionChangedEvent event when a checkbox\'s change event fires', async () => {
      IABookVisualAdjustments.prototype.emitOptionChangedEvent = sinon.fake();
      const el = await fixture(container());

      expect(el.emitOptionChangedEvent.callCount).toEqual(1); // firstUpdate fire

      el.shadowRoot.querySelector('.checkbox-label input').dispatchEvent(new Event('change'));
      expect(el.emitOptionChangedEvent.callCount).toEqual(2);
    });

    test('triggers an emitOptionChangedEvent event when a range\'s change event fires', async () => {
      IABookVisualAdjustments.prototype.emitOptionChangedEvent = sinon.fake();

      const el = await fixture(container());
      expect(el.emitOptionChangedEvent.callCount).toEqual(1); // firstUpdate fire

      el.shadowRoot.querySelector('[name="brightness_range"]').dispatchEvent(new Event('change'));
      expect(el.emitOptionChangedEvent.callCount).toEqual(2);
    });

    test('emits a zoom out event when zoom out button clicked', async () => {
      const el = await fixture(container());

      setTimeout(() => (
        el.shadowRoot.querySelector('.zoom_out').click()
      ));
      const response = await oneEvent(el, 'visualAdjustmentZoomOut');

      expect(response).toBeDefined();
    });

    test('emits a zoom in event when zoom in button clicked', async () => {
      const el = await fixture(container());

      setTimeout(() => (
        el.shadowRoot.querySelector('.zoom_in').click()
      ));
      const response = await oneEvent(el, 'visualAdjustmentZoomIn');

      expect(response).toBeDefined();
    });
  });

  test('sets range defaults when none supplied', async () => {
    const el = await fixture(container());
    const brightnessRange = el.shadowRoot.querySelector('[name="brightness_range"]');

    expect(brightnessRange.getAttribute('min')).toEqual('0');
    expect(brightnessRange.getAttribute('max')).toEqual('100');
    expect(brightnessRange.getAttribute('step')).toEqual('1');
  });

  test('sets the updated range value on the options prop', async () => {
    const el = await fixture(container());
    const { id } = options[0];
    const newValue = 120;

    el.setRangeValue(id, newValue);
    await el.updateComplete;

    expect(el.options[0].value).toEqual(newValue);
  });

  test('triggers a setRangeValue event when a range\'s input event fires', async () => {
    IABookVisualAdjustments.prototype.setRangeValue = sinon.fake();

    const el = await fixture(container());

    el.shadowRoot.querySelector('[name="brightness_range"]').dispatchEvent(new Event('input'));
    expect(el.setRangeValue.callCount).toEqual(1);
  });
});
