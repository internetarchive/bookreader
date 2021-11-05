import {
  html,
  elementUpdated,
  fixtureCleanup,
  fixtureSync,
  expect,
} from '@open-wc/testing';
import sinon from 'sinon';

import '../../../src/BookNavigator/BookNavigator.js';
import BRFullscreenMgr from '../../../src/BookNavigator/br-fullscreen-mgr.js';

const container = () => {
  const item = {};
  return html`
    <book-navigator
      .item=${item}
      .baseHost
    >
      <div slot="theater-main">
        <p class="visible-in-reader">now showing</p>
      <\div>
      <p class="bunny">foo</p>
      </
  `;
};

beforeEach(() => {
  const body = document.querySelector('body');
  const brHook = document.createElement('div');
  brHook.setAttribute('id', 'BookReader');
  body.appendChild(brHook);
});

afterEach(() => {
  window.br = null;
  fixtureCleanup();
});


describe('<book-navigator>', () => {
  describe('first update', () => {
    it('binds global event listeners', async () => {
      const el = fixtureSync(container());
      const spy = sinon.spy(el, 'bindEventListeners');
      await elementUpdated(el);
      expect(spy.callCount).to.equal(1);
    });

    it('emits a BrBookNav:PostInit event', async () => {
      let initEventFired = false;
      window.addEventListener('BrBookNav:PostInit', (e) => {
        initEventFired = true;
      });
      const el = fixtureSync(container());
      const spy = sinon.spy(el, 'emitPostInit');
      await elementUpdated(el);

      expect(initEventFired).to.be.true;
      expect(spy.callCount).to.equal(1);
    });
  });

  it('handles global event: BookReader:PostInit', async () => {
    const setTimeoutSpy = sinon.spy(window, 'setTimeout');
    const brStub = {
      resize: sinon.fake(),
      currentIndex: sinon.fake(),
      jumpToIndex: sinon.fake(),
      options: { enableMultipleBooks: false }, // for multipleBooks
      el: '#BookReader'
    };

    const el = fixtureSync(container());
    const initializeBookSubmenus = sinon.spy(el, 'initializeBookSubmenus');

    await elementUpdated(el);
    window.dispatchEvent(new CustomEvent('BookReader:PostInit', {
      detail: { props: brStub }
    }));
    await elementUpdated(el);

    expect(initializeBookSubmenus.callCount).to.equal(1);
    expect(el.bookreader).to.equal(brStub); // sets bookreader
    expect(el.bookReaderLoaded).to.be.true; // notes bookreader is loaded
    expect(el.bookReaderCannotLoad).to.be.false;
    expect(el.fullscreenMgr).to.an.instanceof(BRFullscreenMgr);
    expect(el.brResizeObserver).to.an.instanceof(window.ResizeObserver);
    expect(setTimeoutSpy.callCount).to.equal(1); // resizes at end
  });

  it('resizes bookreader when side menu toggles', async () => {
    const el = fixtureSync(container());
    const brStub = {
      resize: sinon.fake(),
      currentIndex: sinon.fake(),
      jumpToIndex: sinon.fake(),
      options: { enableMultipleBooks: true },
    };

    el.bookreader = brStub;
    await elementUpdated(el);

    el.sideMenuOpen = true;
    await elementUpdated(el);

    expect(el.bookreader.resize.callCount).to.equal(1);

    el.sideMenuOpen = false;
    await elementUpdated(el);

    expect(el.bookreader.resize.callCount).to.equal(2);
  });

  it('does not resize bookreader if animating', async () => {
    const el = fixtureSync(container());
    const brStub = {
      animating: true, // <-- testing for this
      resize: sinon.fake(),
      currentIndex: sinon.fake(),
      jumpToIndex: sinon.fake(),
      options: { enableMultipleBooks: true }
    };

    el.bookreader = brStub;
    await elementUpdated(el);

    el.sideMenuOpen = true;
    await elementUpdated(el);

    expect(el.bookreader.resize.callCount).to.equal(0);
    expect(el.bookreader.currentIndex.callCount).to.equal(0);
    expect(el.bookreader.jumpToIndex.callCount).to.equal(0);
  });

  describe(`this.updateSideMenu`, () => {
    it('emits custom event', async () => {
      const el = fixtureSync(container());
      const brStub = {
        resize: sinon.fake(),
        currentIndex: sinon.fake(),
        jumpToIndex: sinon.fake(),
        options: { enableMultipleBooks: true }
      };
      el.bookreader = brStub;
      await elementUpdated(el);

      let initEventFired = false;
      let eventDetails = {};
      el.addEventListener('updateSideMenu', (e) => {
        eventDetails = e.detail;
        initEventFired = true;
      });

      el.updateSideMenu('foo', 'open');
      expect(initEventFired).to.equal(true);
      expect(eventDetails.menuId).to.equal('foo');
      expect(eventDetails.action).to.equal('open');
    });
    it('does not emit event if missing an arg', async() => {
      const el = fixtureSync(container());
      const brStub = {
        resize: sinon.fake(),
        currentIndex: sinon.fake(),
        jumpToIndex: sinon.fake(),
        options: { enableMultipleBooks: true }
      };
      el.bookreader = brStub;
      await elementUpdated(el);

      let initEventFired = false;
      el.addEventListener('updateSideMenu', (e) => {
        initEventFired = true;
      });

      el.updateSideMenu('', 'open');
      expect(initEventFired).to.equal(false);
    });
  });
});
