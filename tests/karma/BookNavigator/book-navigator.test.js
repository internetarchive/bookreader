import {
  html,
  elementUpdated,
  fixtureCleanup,
  fixtureSync,
  expect,
} from '@open-wc/testing';
import sinon from 'sinon';
import DownloadsProvider from '../../../src/BookNavigator/downloads/downloads-provider.js';
import SearchProvider from '../../../src/BookNavigator/search/search-provider.js';
import SharingProvider from '../../../src/BookNavigator/sharing.js';
import VisualAdjustmentsProvider from '../../../src/BookNavigator/visual-adjustments/visual-adjustments-provider.js';
import VolumesProvider from '../../../src/BookNavigator/volumes/volumes-provider.js';
import { ModalManager } from '@internetarchive/modal-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import '../../../src/BookNavigator/book-navigator.js';

const promise0 = () => new Promise(res => setTimeout(res, 0));

const container = (sharedObserver = null) => {
  const itemStub = {
    metadata: {
      identifier: 'foo',
      creator: 'bar',
      title: 'baz',
    }
  };
  const modalMgr = new ModalManager();
  return html`
    <book-navigator
      .itemMD=${itemStub}
      .baseHost=${`https://foo.archive.org`}
      .sharedObserver=${sharedObserver || new SharedResizeObserver()}
      .modal=${modalMgr}
    >
      <div slot="main">
        <div id="BookReader"></div>
        <p class="visible-in-reader">now showing</p>
      <\div>
    </book-navigator>
  `;
};

afterEach(() => {
  window.br = null;
  fixtureCleanup();
  const body = document.querySelector('body');
  body.innerHTML = '';
  sinon.restore();
});


describe('<book-navigator>', () => {
  describe("How it loads", () => {
    describe('Attaches BookReader listeners before `br.init` is called', () => {
      it('binds global event listeners', async () => {
        const el = fixtureSync(container());
        const spy = sinon.spy(el, 'bindEventListeners');
        await elementUpdated(el);
        expect(spy.callCount).to.equal(1);
      });
      it('Listens for Global Event @BookReader:PostInit', async () => {
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
        el.handleResize = sinon.fake();
        await elementUpdated(el);

        expect(brStub.resize.callCount).to.equal(0);

        window.dispatchEvent(new CustomEvent('BookReader:PostInit', {
          detail: { props: brStub }
        }));
        await elementUpdated(el);

        expect(el.emitLoadingStatusUpdate.callCount).to.equal(1);
        expect(el.bookreader).to.equal(brStub); // sets bookreader
        expect(el.bookReaderLoaded).to.be.true; // notes bookreader is loaded
        expect(el.bookReaderCannotLoad).to.be.false;
        expect(sharedObserver.addObserver.callCount).to.equal(1);

        await promise0();

        expect(brStub.resize.callCount > 0).to.be.true;
      });
    });
    it('Emits a BrBookNav:PostInit event at completion', async () => {
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

    it('creates an item image from metadata', async () => {
      const el = fixtureSync(container());
      el.item = {
        metadata: { identifier: 'foo' },
      };
      await elementUpdated(el);

      const itemImage = fixtureSync(el.itemImage);
      expect(itemImage).to.be.instanceOf(HTMLImageElement);
      expect(itemImage.getAttribute('class')).to.equal('cover-img');
      expect(itemImage.getAttribute('src')).to.equal('https://https://foo.archive.org/services/img/foo');
    });
  });
  describe('Menu/Layer Provider', () => {
    describe('Connecting with a provider:', () => {
      // loads Providers with base shared resources
      it('We load 3 Sub Menus by default', async() => {
        const el = fixtureSync(container());
        const $brContainer = document.createElement('div');
        const brStub = {
          resize: sinon.fake(),
          currentIndex: sinon.fake(),
          jumpToIndex: sinon.fake(),
          options: {},
          refs: {
            $brContainer
          }
        };
        el.bookreader = brStub;
        await el.elementUpdated;

        el.initializeBookSubmenus();
        await el.elementUpdated;
        const defaultMenus = Object.keys(el.menuProviders);
        expect(defaultMenus).to.contain('downloads');
        expect(el.menuProviders.downloads).to.be.instanceOf(DownloadsProvider);

        expect(defaultMenus).to.contain('share');
        expect(el.menuProviders.share).to.be.instanceOf(SharingProvider);

        expect(defaultMenus).to.contain('visualAdjustments');
        expect(el.menuProviders.visualAdjustments).to.be.instanceOf(VisualAdjustmentsProvider);
      });
      describe('Loading Sub Menus By Plugin Flags', async() => {
        it('Search: uses `enableSearch` flag', async() => {
          const el = fixtureSync(container());
          const $brContainer = document.createElement('div');
          const brStub = {
            resize: sinon.fake(),
            currentIndex: sinon.fake(),
            jumpToIndex: sinon.fake(),
            options: { enableSearch: true },
            refs: {
              $brContainer
            }
          };
          el.bookreader = brStub;
          await el.elementUpdated;

          el.initializeBookSubmenus();
          await el.elementUpdated;

          expect(el.menuProviders.search).to.exist;
          expect(el.menuProviders.search).to.be.instanceOf(SearchProvider);

          // also adds a menu shortcut
          expect(el.menuShortcuts.find(m => m.id === 'search')).to.exist;
        });
        it('Volumes/Multiple Books: uses `enableMultipleBooks` flag', async() => {
          const el = fixtureSync(container());
          const $brContainer = document.createElement('div');
          const brStub = {
            resize: sinon.fake(),
            currentIndex: sinon.fake(),
            jumpToIndex: sinon.fake(),
            options: {
              enableMultipleBooks: true,
              multipleBooksList: {
                by_subprefix: {
                  fooSubprefix: 'beep'
                }
              }
            },
            refs: {
              $brContainer
            }
          };
          el.bookreader = brStub;
          await el.elementUpdated;

          el.initializeBookSubmenus();
          await el.elementUpdated;

          expect(el.menuProviders.volumes).to.exist;
          expect(el.menuProviders.volumes).to.be.instanceOf(VolumesProvider);

          // also adds a menu shortcut
          expect(el.menuShortcuts.find(m => m.id === 'volumes')).to.be.exist;
        });
      });
      it('keeps track of base shared resources for providers in: `baseProviderConfig`', () => {
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

    describe('Controlling Menu Side Panel & Shortcuts', () => {
      describe('Side Menu Panels', () => {
        describe('Control which side menu to toggle open by using: `this.updateSideMenu`', () => {
          it('Emits `@updateSideMenu` to signal which menu gets the update', async () => {
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
          it('Will Not Emit `@updateSideMenu` if menu ID is missing', async() => {
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

      describe('Shortcuts', () => {
        it('has specific order of menu shortcuts to show', () => {
          const el = fixtureSync(container());
          expect(el.shortcutOrder[0]).to.equal('fullscreen');
          expect(el.shortcutOrder[1]).to.equal('volumes');
          expect(el.shortcutOrder[2]).to.equal('search');
          expect(el.shortcutOrder[3]).to.equal('bookmarks');
        });
      });

      describe('Behaviors for specific menus', () => {
        describe('Search menu - ref: plugin.search.js', () => {
          it('Event: listens for `BookReader:ToggleSearchMenu to open search side panel', async () => {
            const el = fixtureSync(container());
            const brStub = {
              resize: sinon.fake(),
              currentIndex: sinon.fake(),
              jumpToIndex: sinon.fake(),
              options: { enableMultipleBooks: true }
            };
            el.bookreader = brStub;
            await elementUpdated(el);

            let sidePanelConfig = {};
            el.addEventListener('updateSideMenu', (e) => {
              console.log();
              sidePanelConfig = e.detail;
            });
            const toggleSearchMenuEvent = new Event('BookReader:ToggleSearchMenu');
            window.dispatchEvent(toggleSearchMenuEvent);

            await elementUpdated(el);
            expect(sidePanelConfig.menuId).to.equal('search');
            expect(sidePanelConfig.action).to.equal('toggle');
          });
        });
      });
    });
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
      await promise0();

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
      await promise0();

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
    it('needs option: `enableFSLogoShortcut` to use FS logo', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        options: {
          enableFSLogoShortcut: false,
        }
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);
      expect(el.menuShortcuts.length).to.equal(0);
    });
    it('sets fullscreen shortcut when entering Fullscreen', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        options: {
          enableFSLogoShortcut: true,
        }
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
        options: {
          enableFSLogoShortcut: true,
        }
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
        options: {
          enableFSLogoShortcut: true,
        }
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
        options: {
          enableFSLogoShortcut: true,
        }
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
});
