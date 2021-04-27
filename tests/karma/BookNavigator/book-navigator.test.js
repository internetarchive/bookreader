import {
  html,
  elementUpdated,
  fixtureCleanup,
  fixtureSync,
  expect,
} from '@open-wc/testing';
import sinon from 'sinon';

import '../../../src/BookNavigator/BookNavigator.js';

const container = () => {
  const item = {};
  return html`
    <book-navigator
      .item=${item}
      .baseHost
    >
      <div slot="bookreader">
        <p class="visible-in-reader">now showing</p>
      <div>
      <p class="bunny">foo</p>
      </
  `;
}

afterEach(() => {
  window.br = null;
  fixtureCleanup();
});


describe('<book-navigator>', () => {
  it('emits a PostInit event on on first update', async () => {
    let initEventFired = false;
    window.addEventListener('BrBookNav:PostInit', (e) => {
      initEventFired = true;
    });
    const el = fixtureSync(container());
    await elementUpdated(el);

    expect(initEventFired).to.be.true;
  });

  it('resizes bookreader to ', async () => {
    const el = fixtureSync(container());
    const brStub = {
      resize: sinon.fake(),
      currentIndex: sinon.fake(),
      jumpToIndex: sinon.fake()
    }
    el.bookreader = brStub;
    await elementUpdated(el);

    expect(el.bookreader).to.equal(brStub);

    el.sideMenuOpen = true;
    await elementUpdated(el);
    expect(el.sideMenuOpen).to.equal(123);

    expect(el.bookreader.callCount).to.equal(1232);
  });
});
