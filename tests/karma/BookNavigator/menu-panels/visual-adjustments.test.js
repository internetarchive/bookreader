import {
  html,
  fixture,
  expect,
  oneEvent,
} from '@open-wc/testing';
import sinon from 'sinon';
import { IABookVisualAdjustments } from '../../../src/BookNavigator/menu-panels/visual-adjustments/visual-adjustments.js';

customElements.define('ia-book-visual-adjustments', IABookVisualAdjustments);

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
  name: 'Invert colors',
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

  it('sets default properties', async () => {
    const el = await fixture(container());

    expect(el.options).to.exist;
    expect(el.options.length).to.equal(options.length);
    expect(el.renderHeader).to.exist;
    expect(el.renderHeader).to.be.false;
    expect(el.activeCount).to.exist;
    expect(el.showZoomControls).to.be.true;
  });

  it('renders all properties of a visual adjustment option', async () => {
    const el = await fixture(container());

    await el.updateComplete;

    const label = el.shadowRoot.querySelector('label');
    const name = label.querySelector('.name');
    const checkbox = label.querySelector('input');
    expect(name.innerText).to.equal(options[0].name);
    expect(checkbox.checked).to.equal(true);
  });

  it('can render header with active options count', async () => {
    const renderHeader = true;
    const el = await fixture(container(renderHeader));
    expect(el.shadowRoot.querySelector('header p').innerText).to.include('1');
  });

  it('does not render active options count element when none are selected', async () => {
    const el = await fixture(container());

    el.options = [options[1]];
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('header p')).not.to.exist;
  });

  it('changes option\'s active state when input changed', async () => {
    const el = await fixture(container());

    el.shadowRoot.querySelector('li input').dispatchEvent(new Event('change'));
    await el.updateComplete;

    expect(el.options[0].active).to.equal(false);
  });

  it('renders zoom in and out controls when enabled', async () => {
    const el = await fixture(container());

    expect(el.shadowRoot.querySelector('.zoom_out')).to.exist;
    expect(el.shadowRoot.querySelector('.zoom_in')).to.exist;
  });

  it('does not render zoom controls when disabled', async () => {
    const el = await fixture(container());

    el.showZoomControls = false;
    await el.updateComplete;

    expect(el.shadowRoot.querySelector('.zoom_out')).not.to.exist;
    expect(el.shadowRoot.querySelector('.zoom_in')).not.to.exist;
  });

  describe('Custom events', () => {
    it('prepareEventDetails returns proper params', async () => {
      const el = await fixture(container());
      await el.updateComplete;
      const params = el.prepareEventDetails();

      expect(params.activeCount).to.exist;
      expect(typeof (params.activeCount)).to.be.equal('number');
      expect(params.changedOptionId).to.exist;
      expect(typeof (params.changedOptionId)).to.be.equal('string');
      expect(params.options).to.exist;
      expect(params.options.length).to.exist;
      expect(params.options.length).to.be.greaterThan(0);
    });
    it('emitOptionChangedEvent calls for the params', async () => {
      IABookVisualAdjustments.prototype.prepareEventDetails = sinon.fake();
      const el = await fixture(container());
      await el.updateComplete;

      expect(el.prepareEventDetails.callCount).to.equal(1);
    });
    it('triggers an emitOptionChangedEvent event at firstUpdate', async () => {
      IABookVisualAdjustments.prototype.emitOptionChangedEvent = sinon.fake();
      const el = await fixture(container());

      expect(el.emitOptionChangedEvent.callCount).to.equal(1);
    });

    it('triggers an emitOptionChangedEvent event when a checkbox\'s change event fires', async () => {
      IABookVisualAdjustments.prototype.emitOptionChangedEvent = sinon.fake();
      const el = await fixture(container());

      expect(el.emitOptionChangedEvent.callCount).to.equal(1); // firstUpdate fire

      el.shadowRoot.querySelector('li input').dispatchEvent(new Event('change'));
      expect(el.emitOptionChangedEvent.callCount).to.equal(2);
    });

    it('triggers an emitOptionChangedEvent event when a range\'s change event fires', async () => {
      IABookVisualAdjustments.prototype.emitOptionChangedEvent = sinon.fake();

      const el = await fixture(container());
      expect(el.emitOptionChangedEvent.callCount).to.equal(1); // firstUpdate fire

      el.shadowRoot.querySelector('[name="brightness_range"]').dispatchEvent(new Event('change'));
      expect(el.emitOptionChangedEvent.callCount).to.equal(2);
    });

    it('emits a zoom out event when zoom out button clicked', async () => {
      const el = await fixture(container());

      setTimeout(() => (
        el.shadowRoot.querySelector('.zoom_out').click()
      ));
      const response = await oneEvent(el, 'visualAdjustmentZoomOut');

      expect(response).to.exist;
    });

    it('emits a zoom in event when zoom in button clicked', async () => {
      const el = await fixture(container());

      setTimeout(() => (
        el.shadowRoot.querySelector('.zoom_in').click()
      ));
      const response = await oneEvent(el, 'visualAdjustmentZoomIn');

      expect(response).to.exist;
    });
  });

  it('sets range defaults when none supplied', async () => {
    const el = await fixture(container());
    const brightnessRange = el.shadowRoot.querySelector('[name="brightness_range"]');

    expect(brightnessRange.getAttribute('min')).to.equal('0');
    expect(brightnessRange.getAttribute('max')).to.equal('100');
    expect(brightnessRange.getAttribute('step')).to.equal('1');
  });

  it('sets the updated range value on the options prop', async () => {
    const el = await fixture(container());
    const { id } = options[0];
    const newValue = 120;

    el.setRangeValue(id, newValue);
    await el.updateComplete;

    expect(el.options[0].value).to.equal(newValue);
  });

  it('triggers a setRangeValue event when a range\'s input event fires', async () => {
    IABookVisualAdjustments.prototype.setRangeValue = sinon.fake();

    const el = await fixture(container());

    el.shadowRoot.querySelector('[name="brightness_range"]').dispatchEvent(new Event('input'));
    expect(el.setRangeValue.callCount).to.equal(1);
  });
});
