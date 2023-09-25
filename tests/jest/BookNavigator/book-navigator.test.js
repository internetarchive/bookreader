import {
  html,
  elementUpdated,
  fixtureCleanup,
  fixtureSync,
} from '@open-wc/testing-helpers';
import sinon from 'sinon';
import DownloadsProvider from '@/src/BookNavigator/downloads/downloads-provider.js';
import SearchProvider from '@/src/BookNavigator/search/search-provider.js';
import SharingProvider from '@/src/BookNavigator/sharing.js';
import VisualAdjustmentsProvider from '@/src/BookNavigator/visual-adjustments/visual-adjustments-provider.js';
import ViewableFilesProvider from '@/src/BookNavigator/viewable-files.js';
import { ModalManager } from '@internetarchive/modal-manager';
import { SharedResizeObserver } from '@internetarchive/shared-resize-observer';
import '@/src/BookNavigator/book-navigator.js';

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

window.ResizeObserver = class ResizeObserver {
  observe = sinon.fake()
  unobserve = sinon.fake()
  disconnect = sinon.fake()
};

beforeEach(() => {
  window.archive_analytics = {
    send_event_no_sampling: sinon.fake(),
    send_event: sinon.fake()
  };
});

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
      test('binds global event listeners', async () => {
        const el = fixtureSync(container());
        const spy = sinon.spy(el, 'bindEventListeners');
        await elementUpdated(el);
        expect(spy.callCount).toEqual(1);
      });
      test('Listens for Global Event @BookReader:PostInit', async () => {
        const brStub = {
          resize: sinon.fake(),
          currentIndex: sinon.fake(),
          jumpToIndex: sinon.fake(),
          options: { enableMultipleBooks: false }, // for multipleBooks
          el: '#BookReader',
          refs: {}
        };

        const sharedObserver = new SharedResizeObserver();
        sinon.spy(sharedObserver, 'addObserver');
        const el = fixtureSync(container(sharedObserver));

        el.initializeBookSubmenus = sinon.fake();
        el.emitLoadingStatusUpdate = sinon.fake();
        el.handleResize = sinon.fake();
        await elementUpdated(el);

        expect(brStub.resize.callCount).toEqual(0);

        window.dispatchEvent(new CustomEvent('BookReader:PostInit', {
          detail: { props: brStub }
        }));
        await elementUpdated(el);

        expect(el.emitLoadingStatusUpdate.callCount).toEqual(1);
        expect(el.bookreader).toEqual(brStub); // sets bookreader
        expect(el.bookReaderLoaded).toBeTruthy(); // notes bookreader is loaded
        expect(el.bookReaderCannotLoad).toBeFalsy();
        expect(sharedObserver.addObserver.callCount).toEqual(1);

        await promise0();

        expect(brStub.resize.callCount > 0).toBeTruthy();
      });
    });
    test('Emits a BrBookNav:PostInit event at completion', async () => {
      let initEventFired = false;
      window.addEventListener('BrBookNav:PostInit', (e) => {
        initEventFired = true;
      });
      const el = fixtureSync(container());
      const spy = sinon.spy(el, 'emitPostInit');

      await elementUpdated(el);

      expect(initEventFired).toBeTruthy();
      expect(spy.callCount).toEqual(1);
    });

    test('creates an item image from metadata', async () => {
      const el = fixtureSync(container());
      const itemImage = fixtureSync(el.itemImage);
      expect(itemImage).toBeInstanceOf(HTMLImageElement);
      expect(itemImage.getAttribute('class')).toEqual('cover-img');
      expect(itemImage.getAttribute('src')).toEqual('https://https://foo.archive.org/services/img/foo');
    });
  });
  describe('Menu/Layer Provider', () => {
    describe('Connecting with a provider:', () => {
      // loads Providers with base shared resources
      test('We load 3 Sub Menus by default', async() => {
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

        el.downloadableTypes = ['foo/bar'];
        await el.elementUpdated;

        el.initializeBookSubmenus();
        await el.elementUpdated;
        const defaultMenus = Object.keys(el.menuProviders);
        expect(defaultMenus).toContain('downloads');
        expect(el.menuProviders.downloads).toBeInstanceOf(DownloadsProvider);

        expect(defaultMenus).toContain('share');
        expect(el.menuProviders.share).toBeInstanceOf(SharingProvider);

        expect(defaultMenus).toContain('visualAdjustments');
        expect(el.menuProviders.visualAdjustments).toBeInstanceOf(VisualAdjustmentsProvider);
      });
      describe('Loading Sub Menus By Plugin Flags', () => {
        test('Search: uses `enableSearch` flag', async() => {
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

          expect(el.menuProviders.search).toBeDefined();
          expect(el.menuProviders.search).toBeInstanceOf(SearchProvider);

          // also adds a menu shortcut
          expect(el.menuShortcuts.find(m => m.id === 'search')).toBeDefined();
        });
        test('Volumes/Multiple Books: uses `enableMultipleBooks` flag', async() => {
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

          expect(el.menuProviders.volumes).toBeDefined();
          expect(el.menuProviders.volumes).toBeInstanceOf(ViewableFilesProvider);

          // also adds a menu shortcut
          expect(el.menuShortcuts.find(m => m.id === 'volumes')).toBeDefined();
        });
      });
      test('keeps track of base shared resources for providers in: `baseProviderConfig`', () => {
        const el = fixtureSync(container());
        const baseConfigKeys = Object.keys(el.baseProviderConfig);
        expect(baseConfigKeys).toContain('baseHost');
        expect(baseConfigKeys).toContain('modal');
        expect(baseConfigKeys).toContain('sharedObserver');
        expect(baseConfigKeys).toContain('bookreader');
        expect(baseConfigKeys).toContain('item');
        expect(baseConfigKeys).toContain('signedIn');
        expect(baseConfigKeys).toContain('isAdmin');
        expect(baseConfigKeys).toContain('onProviderChange');
      });

      test('Downloads panel - does not show if no available `downloadableTypes`', async () => {
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
        expect(defaultMenus.find(menu => menu === 'downloads')).toBeUndefined;
      });
    });

    describe('Controlling Menu Side Panel & Shortcuts', () => {
      describe('Side Menu Panels', () => {
        test('`isWideEnoughToOpenMenu` checks if menu should be open', async () => {
          const el = fixtureSync(container());
          el.brWidth = 300;
          await el.elementUpdated;

          expect(el.isWideEnoughToOpenMenu).toEqual(false);

          el.brWidth = 641;
          await el.elementUpdated;

          expect(el.isWideEnoughToOpenMenu).toEqual(true);
        });
        describe('Control which side menu to toggle open by using: `this.updateSideMenu`', () => {
          test('Emits `@updateSideMenu` to signal which menu gets the update', async () => {
            const el = fixtureSync(container());
            const brStub = {
              resize: sinon.fake(),
              currentIndex: sinon.fake(),
              jumpToIndex: sinon.fake(),
              options: { enableMultipleBooks: true },
              refs: {},
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
            expect(initEventFired).toEqual(true);
            expect(eventDetails.menuId).toEqual('foo');
            expect(eventDetails.action).toEqual('open');
          });
          test('Will Not Emit `@updateSideMenu` if menu ID is missing', async() => {
            const el = fixtureSync(container());
            const brStub = {
              resize: sinon.fake(),
              currentIndex: sinon.fake(),
              jumpToIndex: sinon.fake(),
              options: { enableMultipleBooks: true },
              refs: {},
            };
            el.bookreader = brStub;
            await elementUpdated(el);

            let initEventFired = false;
            el.addEventListener('updateSideMenu', (e) => {
              initEventFired = true;
            });

            el.updateSideMenu('', 'open');
            expect(initEventFired).toEqual(false);
          });
        });
      });

      describe('Shortcuts', () => {
        test('has specific order of menu shortcuts to show', () => {
          const el = fixtureSync(container());
          expect(el.shortcutOrder[0]).toEqual('fullscreen');
          expect(el.shortcutOrder[1]).toEqual('volumes');
          expect(el.shortcutOrder[2]).toEqual('search');
          expect(el.shortcutOrder[3]).toEqual('bookmarks');
        });
      });

      describe('Behaviors for specific menus', () => {
        describe('Search menu - ref: plugin.search.js', () => {
          test('Event: listens for `BookReader:ToggleSearchMenu to open search side panel', async () => {
            const el = fixtureSync(container());
            const brStub = {
              resize: sinon.fake(),
              currentIndex: sinon.fake(),
              jumpToIndex: sinon.fake(),
              options: { enableMultipleBooks: true },
              refs: {},
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
            expect(sidePanelConfig.menuId).toEqual('search');
            expect(sidePanelConfig.action).toEqual('toggle');
          });
        });
      });
    });
  });

  describe('Resizing',() => {
    test('keeps track of `brWidth` and `brHeight`', async () => {
      const el = fixtureSync(container());
      const brStub = {
        resize: sinon.fake(),
        options: {},
        refs: {
          $brContainer: document.createElement('div')
        }
      };
      el.bookreader = brStub;
      await elementUpdated(el);
      expect(el.brWidth).toEqual(0);
      expect(el.brHeight).toEqual(0);

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

      expect(el.brHeight).toEqual(500);
      expect(el.brWidth).toEqual(900);
    });
    test('resizes if height/width changes && is not animating', async () => {
      const el = fixtureSync(container());
      const brStub = {
        animating: false,
        resize: sinon.fake(),
        options: {},
        refs: {
          $brContainer: document.createElement('div')
        }
      };

      el.bookreader = brStub;
      await elementUpdated(el);
      expect(el.brWidth).toEqual(0);
      expect(el.brHeight).toEqual(0);

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

      expect(brStub.resize.callCount).toEqual(1);
    });
    test('does not resize bookreader if animating', async () => {
      const el = fixtureSync(container());
      const brStub = {
        animating: true, // <-- testing for this
        resize: sinon.fake(),
        currentIndex: sinon.fake(),
        jumpToIndex: sinon.fake(),
        options: { enableMultipleBooks: true },
        refs: {},
      };

      el.bookreader = brStub;
      await elementUpdated(el);

      expect(el.bookreader.resize.callCount).toEqual(0);
      expect(el.bookreader.currentIndex.callCount).toEqual(0);
      expect(el.bookreader.jumpToIndex.callCount).toEqual(0);
    });
  });

  describe('Fullscreen Management', () => {
    test('needs option: `enableFSLogoShortcut` to use FS logo', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        options: {
          enableFSLogoShortcut: false,
        },
        refs: {},
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);
      expect(el.menuShortcuts.length).toEqual(0);
    });
    test('sets fullscreen shortcut when entering Fullscreen', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        options: {
          enableFSLogoShortcut: true,
        },
        refs: {},
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);
      expect(el.menuShortcuts.length).toEqual(1);
      expect(el.menuShortcuts[0].id).toEqual('fullscreen');
      expect(el.menuShortcuts[0].icon).toBeDefined();
      expect(el.emitMenuShortcutsUpdated.callCount).toEqual(1);
    });
    test('clicking Fullscreen shortcut closes fullscreen', async () => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        options: {
          enableFSLogoShortcut: true,
        },
        refs: {},
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      el.closeFullscreen = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);

      fixtureSync(el.menuShortcuts[0].icon).click();
      await elementUpdated(el);

      expect(el.closeFullscreen.callCount).toEqual(1);
    });
    test('removes Fullscreen shortcut when leaving fullscreen', async() => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => false,
        options: {
          enableFSLogoShortcut: true,
        },
        refs: {},
      };

      el.bookreader = brStub;
      el.emitMenuShortcutsUpdated = sinon.fake();
      await elementUpdated(el);

      el.manageFullScreenBehavior();
      await elementUpdated(el);
      expect(el.menuShortcuts.length).toEqual(0);
      expect(el.emitMenuShortcutsUpdated.callCount).toEqual(1);
    });
    test('Event: Listens for `BookReader:FullscreenToggled', async() => {
      const el = fixtureSync(container());
      const brStub = {
        isFullscreen: () => true,
        resize: sinon.fake(),
        currentIndex: sinon.fake(),
        jumpToIndex: sinon.fake(),
        options: {
          enableFSLogoShortcut: true,
        },
        refs: {},
      };
      el.bookreader = brStub;
      el.manageFullScreenBehavior = sinon.fake();
      await elementUpdated(el);

      window.dispatchEvent(new CustomEvent('BookReader:fullscreenToggled', {
        detail: { props: brStub }
      }));
      await elementUpdated(el);

      expect(el.manageFullScreenBehavior.callCount).toEqual(1);
    });
  });
  describe('Handles Restricted Books', () => {
    describe('contextMenu is prevented when book is restricted', () => {
      it('watches on `div.BRscreen`', async () => {
        const el = fixtureSync(container());
        const brStub = {
          options: { restricted: true },
        };

        el.bookreader = brStub;
        el.bookIsRestricted = true;

        const elSpy = sinon.spy(el.manageContextMenuVisibility);
        await el.elementUpdated;

        expect(window.archive_analytics.send_event_no_sampling.called).toEqual(false);
        expect(window.archive_analytics.send_event.called).toEqual(false);
        expect(elSpy.called).toEqual(false);

        const body = document.querySelector('body');

        const divBRscreen = document.createElement('div');
        divBRscreen.classList.add('BRscreen');
        body.appendChild(divBRscreen);

        const contextMenuEvent = new Event('contextmenu', { bubbles: true });

        // Set spy on contextMenuEvent to check if `preventDefault` is called
        const preventDefaultSpy = sinon.spy(contextMenuEvent, 'preventDefault');
        expect(preventDefaultSpy.called).toEqual(false);

        divBRscreen.dispatchEvent(contextMenuEvent);

        // analytics fires
        expect(window.archive_analytics.send_event_no_sampling.called).toEqual(
          false
        );
        expect(window.archive_analytics.send_event.called).toEqual(true);
        // we prevent default
        expect(preventDefaultSpy.called).toEqual(true);
      });
      it('watches on `img.BRpageimage`', async () => {
        const el = fixtureSync(container());
        const brStub = {
          options: { restricted: true },
        };

        el.bookreader = brStub;
        el.bookIsRestricted = true;

        await el.elementUpdated;

        expect(window.archive_analytics.send_event_no_sampling.called).toEqual(false);
        expect(window.archive_analytics.send_event.called).toEqual(false);

        const body = document.querySelector('body');
        // const element stub for img.BRpageimage
        const imgBRpageimage = document.createElement('img');
        imgBRpageimage.classList.add('BRpageimage');
        body.appendChild(imgBRpageimage);
        const contextMenuEvent = new Event('contextmenu', { bubbles: true });

        // Set spy on contextMenuEvent to check if `preventDefault` is called
        const preventDefaultSpy = sinon.spy(contextMenuEvent, 'preventDefault');
        expect(preventDefaultSpy.called).toEqual(false);

        imgBRpageimage.dispatchEvent(contextMenuEvent);

        // analytics fires
        expect(window.archive_analytics.send_event_no_sampling.called).toEqual(false);
        expect(window.archive_analytics.send_event.called).toEqual(true);
        // we prevent default
        expect(preventDefaultSpy.called).toEqual(true);
      });
    });
    it('Allows unrestricted books access to context menu', async () => {
      const el = fixtureSync(container());
      const brStub = {
        options: { restricted: false },
      };

      el.bookreader = brStub;
      el.bookIsRestricted = false;

      await el.elementUpdated;

      expect(window.archive_analytics.send_event_no_sampling.called).toEqual(
        false
      );
      expect(window.archive_analytics.send_event.called).toEqual(false);


      const body = document.querySelector('body');
      // const element stub for img.BRpageimage
      const imgBRpageimage = document.createElement('img');
      imgBRpageimage.classList.add('not-targeted-element');
      body.appendChild(imgBRpageimage);
      const contextMenuEvent = new Event('contextmenu', { bubbles: true });

      // Set spy on contextMenuEvent to check if `preventDefault` is called
      const preventDefaultSpy = sinon.spy(contextMenuEvent, 'preventDefault');
      expect(preventDefaultSpy.called).toEqual(false);

      imgBRpageimage.dispatchEvent(contextMenuEvent);

      // analytics fires
      expect(window.archive_analytics.send_event_no_sampling.called).toEqual(false);
      expect(window.archive_analytics.send_event.called).toEqual(true);
      // we do not prevent default
      expect(preventDefaultSpy.called).toEqual(false);
    });
  });
});
