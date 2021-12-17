import {
  html,
  elementUpdated,
  fixtureCleanup,
  fixtureSync,
  expect,
} from '@open-wc/testing';
import sinon from 'sinon';

import '../../../src/BookNavigator/BookNavigator.js';

const container = (sharedObserver = null) => {
  const item = {};
  return html`
    <book-navigator
      .item=${item}
      .baseHost=${`https://foo.archive.org`}
      .sharedObserver=${sharedObserver || new SharedResizeObserver()}
      .modal=${new ModalManager()}
    >
      <div slot="theater-main">
        <p class="visible-in-reader">now showing</p>
      <\div>
    </book-navigator>
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
  const body = document.querySelector('body');
  body.innerHTML = '';
  fixtureCleanup();
  sinon.restore();
});


describe('<book-navigator>', () => {
  describe('defaults', () => {
    it('has `baseProviderConfig`', () => {
      const el = fixtureSync(container());
      const baseConfigKeys = Object.keys(el.baseProviderConfig);
      expect(baseConfigKeys).to.contain('baseHost');
      expect(baseConfigKeys).to.contain('modal');
      expect(baseConfigKeys).to.contain('sharedObserver');
      expect(baseConfigKeys).to.contain('bookreader');
      expect(baseConfigKeys).to.contain('item');
      expect(baseConfigKeys).to.contain('signedIn');
      expect(baseConfigKeys).to.contain('isAdmin');
      expect(baseConfigKeys).to.contain('onProviderChange');
    });
  });

  describe('first update', () => {
    it('binds global event listeners', async () => {
      const el = fixtureSync(container());
      const spy = sinon.spy(el, 'bindEventListeners');
      await elementUpdated(el);
      expect(spy.callCount).to.equal(1);
    });

    it('Event: emits a BrBookNav:PostInit event', async () => {
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

  it('Event: handles global event: BookReader:PostInit', async () => {
    const setTimeoutSpy = sinon.spy(window, 'setTimeout');
    const brStub = {
      resize: sinon.fake(),
      currentIndex: sinon.fake(),
      jumpToIndex: sinon.fake(),
      options: { enableMultipleBooks: false }, // for multipleBooks
      el: '#BookReader'
    };

    const sharedObserver = new SharedResizeObserver();
    sinon.spy(sharedObserver, 'addObserver');
    const el = fixtureSync(container(sharedObserver));

    el.initializeBookSubmenus = sinon.fake();
    el.emitLoadingStatusUpdate = sinon.fake();
    await elementUpdated(el);

    window.dispatchEvent(new CustomEvent('BookReader:PostInit', {
      detail: { props: brStub }
    }));
    await elementUpdated(el);

    expect(el.emitLoadingStatusUpdate.callCount).to.equal(1);
    expect(el.bookreader).to.equal(brStub); // sets bookreader
    expect(el.bookReaderLoaded).to.be.true; // notes bookreader is loaded
    expect(el.bookReaderCannotLoad).to.be.false;
    expect(sharedObserver.addObserver.callCount).to.equal(1);
    expect(setTimeoutSpy.callCount).to.equal(1); // resizes at end
  });
  describe('Resizing',() => {
    it('keeps track of `brWidth` and `brHeight`', async () => {
      const el = fixtureSync(container());
      const brStub = {
        resize: sinon.fake(),
      };
      el.bookreader = brStub;
      await elementUpdated(el);
      expect(el.brWidth).to.equal(0);
      expect(el.brHeight).to.equal(0);

      const mockResizeEvent = {
        contentRect: {
          height: 500,
          width: 900
        },
        target: el.mainBRContainer
      };
      el.handleResize(mockResizeEvent);

      await elementUpdated(el);
      await new Promise(res => setTimeout(res, 0));

      expect(el.brHeight).to.equal(500);
      expect(el.brWidth).to.equal(900);
    });
    it('resizes if height/width changes && is not animating', async () => {
      const el = fixtureSync(container());
      const brStub = {
        animating: false,
        resize: sinon.fake(),
      };
      el.bookreader = brStub;
      await elementUpdated(el);
      expect(el.brWidth).to.equal(0);
      expect(el.brHeight).to.equal(0);

      const mockResizeEvent = {
        contentRect: {
          height: 500,
          width: 900
        },
        target: el.mainBRContainer
      };
      el.handleResize(mockResizeEvent);

      await elementUpdated(el);
      await new Promise(res => setTimeout(res, 0));

      expect(brStub.resize.callCount).to.equal(1);
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

      expect(el.bookreader.resize.callCount).to.equal(0);
      expect(el.bookreader.currentIndex.callCount).to.equal(0);
      expect(el.bookreader.jumpToIndex.callCount).to.equal(0);
    });
  });

  describe('Fullscreen Management', () => {
    it('sets fullscreen shortcut when entering Fullscreen', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);
      expect(el.menuShortcuts.length).to.equal(1);
      expect(el.menuShortcuts[0].id).to.equal('fullscreen');
      expect(el.menuShortcuts[0].icon).to.exist;
      expect(el.emitMenuShortcutsUpdated.callCount).to.equal(1);
    });
    it('clicking Fullscreen shortcut closes fullscreen', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      el.closeFullscreen = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);

      fixtureSync(el.menuShortcuts[0].icon).click();
      await elementUpdated(el);

      expect(el.closeFullscreen.callCount).to.equal(1);
    });
    it('removes Fullscreen shortcut when leaving fullscreen', async() => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => false,
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);
      expect(el.menuShortcuts.length).to.equal(0);
      expect(el.emitMenuShortcutsUpdated.callCount).to.equal(1);
    });
    it('Event: Listens for `BookReader:FullscreenToggled', async() => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        resize: sinon.fake(),
        currentIndex: sinon.fake(),
        jumpToIndex: sinon.fake(),
      };
      el.bookreader = brStub;
      el.manageFullScreenBehavior = sinon.fake();
      await elementUpdated(el);

      window.dispatchEvent(new CustomEvent('BookReader:fullscreenToggled', {
        detail: { props: brStub }
      }));
      await elementUpdated(el);

      expect(el.manageFullScreenBehavior.callCount).to.equal(1);
    });
  });

  describe('Side Panel Navigation', () => {
    describe('Shortcuts', () => {
      it('has specific order of menu shortcuts to show', () => {
        const el = fixtureSync(container());
        expect(el.shortcutOrder[0]).to.equal('fullscreen');
        expect(el.shortcutOrder[1]).to.equal('volumes');
        expect(el.shortcutOrder[2]).to.equal('search');
        expect(el.shortcutOrder[3]).to.equal('bookmarks');
      });
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
      it('Event: will not emit event if menu ID is missing', async() => {
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

});
