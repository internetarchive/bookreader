# 5.0.0-53
- Dev: update icons & lit versions to help a.o build @iisa

# 5.0.0-52
# 5.0.0-51
- Fix: Bookmark with subfiles was broken @nsharma123
- Feature: Default 1up mode and options.defaults mode override exiting mode @nsharma123

# 5.0.0-50
Fix: Search results display @latonv

# 5.0.0-49
- Dev: remove class shims, v5 deprecations @cdrini
- Dev: update dependency (@open-wc/testing-helpers) @renovate
- Dev: e2e - remove ia test + export DesktopNav for external usage @iisa

# 5.0.0-48
- Fix: move analytics to sample bucket @iisa
- Dev: update dependencies (concurrently, jest) @renovate

# 5.0.0-47
- Fix: XSS vulnerability in search results @latonv
- Dev: Update jQuery to v3 **BREAKING** @cdrini
    - If you were importing `BookReader/jquery-1.10.1.js` you will need to change it to `BookReader/jquery-3.js`
    - Also ensure if other code was using this jquery that it works with jQuery 3!
- Dev: Update testing dependencies (jest, testcafe) @renovate

# 5.0.0-46
Fix: Leaf positioning during RTL fliip animation @latonv
Dev: dependency updates @renovate
Fix: Disable contextmenu for restricted books @iisa

# 5.0.0-45
# 5.0.0-44
Fix: dynamic `q=<term>` url parameter @iisa
Dev: dependency updates @renovate

# 5.0.0-43
Fix: search results panel display asserted page numbers @cdrini
Dev: dependency updates @renovate
Dev: node-fetch update @cdrini

# 5.0.0-42
Dev: update testing dependencies @renovate
Dev: update `<ia-item-navigator>` @iisa

# 5.0.0-40
Fix: Better search highlights @cdrini
Dev: update lit 2 components @iisa
Dev: update lit @renovate

# 5.0.0-39
Fix: Performance improvements to scroll/zooming when text layer is larger @cdrini
Fix: Update zoom in/out icons to match iconochive glyphs @pezvi
Dev: update dependencies @renovate

# 5.0.0-38
Dev: Add Renovate Bot @cdrini
Dev: Update node-fetch @cdrini
Fix: Search request promise err & fix tests @cdrini
Dev: Split node workflow into different jobs @cdrini
Dev: Give cache steps better names in GHA @cdrini
Dev: Update concurrently + Small speedup to build & test @cdrini
Dev: Renovate - Auto-update dev dependencies for minor/patch @cdrini
Fix: Better MS Edge voice selection @cdrini
Dev: Allow small drops in codecov coverage (< 0.5%) @cdrini
Dev: Renovate - add `^@internetarchive/icon-` @cdrini

# 5.0.0-37
Fix: Update all `.then()` to async/await @sancodes
Fix: Upgrade to Lit 2 @Aadilhassan
Dev: Update to Node v16.x @duggiefresh
Dev: Remove unused demo bundle @cdrini
Dev: Fix README broken link for plugin directory @duggiefresh
Dev: Update sharing options menu to lit2 @iisa
Dev: Remove package publishing from GHA @cdrini

# 5.0.0-36
Fix: Readaloud scrolls along with dext @cdrini
Dev: ES6 var to let/const updates @sancodes
Dev: ES6 async/await updates @sancodes
Dev: Re-enable testcafe tests in GH action @iisa
Fix: Search results bar clears and closes properly @iisa

# 5.0.0-35
Fix: global style leak specify colorbox styles @iisa
Fix: br menu reinits with shared ro load @iisa
Fix: url plugin does not rewrite with multiple slashes @iisa

# 5.0.0-34
Dev: update test dependencies @cdrini
Fix: Update hyphen stitching regex to include dangling "¬" @cdrini
Fix: pop open multiple files menu at proper width @iisa

# 5.0.0-33
Fix: restricted books get cover image @iisa

# 5.0.0-32
Fix: fetch bookmarks from service when logged in @iisa
Fix: adjust css to help shadydom render properly @iisa
# 5.0.0-31
Fix: modal loads into dom from `<ia-bookreader>` @iisa

# 5.0.0-30
- `<ia-bookreader>` is top-most web component @iisa

# 5.0.0-29
- import ia-item-navigator for menu management @iisa
- url plugin: suppress default state on load @dualcnhq

# 5.0.0-28
Dev: Refactor URLPlugin + sync volumes sorting state to URL @dualcnhq @cdrini

# 5.0.0-27
Dev: eslint fix for $.browser @homewardgamer
Fix: cache search inside requests @iisa
# 5.0.0-26
Fix: read aloud play/pause button @nsharma123
Dev: strict keyboard shortcuts @mc2
Dev: update IA demo page @iisa

# 5.0.0-24
Fix: book-nav side panel zoom out @mc2
Dev: refactor zoom code @mc2

# 5.0.0-23
Fix: Darken scrollbars in Safari @pezvi
Fix: Bookmarks service calls when reader is logged in @mc2
Dev: Move jest tests into separate directory @cdrini

# 5.0.0-22
- Dev: remove deprecated embed nav view, use standard default @iisa

# 5.0.0-21
- Dev: Toggle view=theater in fullscreen @mc2

# 5.0.0-20
- Feature: Add voice selection dropdown to ReadAloud! @mekarpeles
- Dev: Make jest support root-level imports with "@" @cdrini
- Dev: Make it easy to run e2e tests on archive.org/browserstack @cdrini

# 5.0.0-19
- Dev: Refactor dragscrollable from a jquery plugin to a JS class @cdrini
- Dev: Fix jquery eslint errors @cdrini
- Dev: Replace deprecated babel-eslint with successor @cdrini
- Fix: BR not working on iOS 9 / iOS 10! @cdrini, @iisa
    - Added webcomponents, ResizeObserver polyfill
    - ES5-ify lit node_modules

# 5.0.0-18
- Dev: Update a number of dependencies @cdrini
- Dev: Added eslint-plugin-no-jquery @soham4abc
- Feature: Add continuous pinch zooming for touch screens and trackpads! @cdrini
    - This is a _big_ change to the codebase. It involved rewriting 1 up mode in LitElement. This means that BookReader now need webcomponents to function.
    - Breaking changes (unlikely to be used by anyone):
        - Most Mode1Up Bookreader global functions removed (unlikely to be used): `drawLeafsOnePage`, `onePageGetAutofitWidth`, `onePageGetAutofitHeight`, `onePageGetPageTop`, `onePageCalculateReductionFactors`, `centerX1up`, `centerY1up`
        - Some Mode2Up cleanups: Removed `setClickHandler2UP`, `setMouseHandlers2UP`
        - [Web components](https://caniuse.com/custom-elementsv1) now must be supported
        - Reduction factors options no longer applies to 1up

# 5.0.0-17
- Fix: focus in a textarea disables keyboard shortcuts @cdrini

# 5.0.0-16
- Dev: remove unused menu toggle plugin @iisa
- Fix: Book nav loader safari update @iisa

# 5.0.0-15
- Fix: Typing -/+ in search box no longer zooms @cdrini
- Dev: Add script for updating dev deps @cdrini
- Refactor/Fix: Convert search/TTS highlights to use SVG layer @cdrini
    - Fix TTS highlights not positioned correctly in Mode1Up
- Breaking changes (unlikely these are used by anyone):
    - Remove public method `BookReader.prototype.keyboardNavigationIsDisabled`
    - Remove public method `BookReader.util.sleep`
    - Remove public method `BookReader.prototype.updateSearchHilites1UP`
    - Remove public method `BookReader.prototype.updateSearchHilites2UP`
    - Remove public attribute `BookReader.prototype.ttsHilites`

# 5.0.0-14
- Fix: Url search param `q=` updates dynamically @nsharma123
- Fix: Downloads menu text updates @dualcnhq
- Fix: Volumes updates - icons, labelling, open menu onload @iisa

# 5.0.0-13
- Enhancement: Add neutral state for sorting volumes @dualcnhq
- Enhancement: Update subfiles/volumes title sorting logic by filename -> title_asc -> title_desc order then back to filename @dualcnhq
- Fix: Volume item index count display @dualcnhq


# 5.0.0-12
- Fix: new side panel: sortable multiple volumes @dualcnhq @iisa
- Fix: sharing side panel can share subfile/volume @iisa

# 5.0.0-11
- Fix: standardize button style for download panel @nsharma123
# 5.0.0-10
- Fix: Make 1up default to full width (up to real world size) @cdrini
- Fix: Remove "page" from toolbar @cdrini
- Dev: Update menu slider @iisa
- Dev: Add semi-colons eslint rule @iisa

# 5.0.0-9
- Fix: search-inside results check for page's index via `leafNum` @nsharma123
# 5.0.0-8
- Fix: cancel search fix naming var @iisa

# 5.0.0-7
- Fix: cancel search @iisa
- Dev: remove dead css @cdrini
- Dev: GHA node_modules caching @cdrini
# 5.0.0-6
- Fix: Fullscreen toggle sets/unsets animating flag @iisa
# 5.0.0-5
- Fix: Book Nav: resize only when bookreader is not animating @iisa
- Fix: Web components register themselves at EOF @iisa
- Dev: update dependencies with dependabot @drini
# 5.0.0-4
- Dev: update bookmarks login archive_analytics @iisa @dualcnhq

# 5.0.0-3
- Fix: bookmarks panel has login CTA @dualcnhq @iisa

# 5.0.0-2
- Dev: update testing dependencies @cdrini
- Dev: update dev-flow dependencies @cdrini
- Dev: reorganize core BR files @cdrini
- Dev: update build files @cdrini
- Fix: update needed imports for older iOS versions @cdrini
- Fix: `<ia-bookreader>` does not use full browser width to fit into container @iisa
- Fix: updates to `<book-navigator>` to upgrade archive.org's liner notes display to v5 @iisa

# 5.0.0-1
- Actually delete the files mentioned in previous release @cdrini
- Dev: Organize BookNavigator files @iisa
- Fix: Search results not in correct place in Mode1Up @cdrini

# 5.0.0-0
First beta release of v5! Lots of breaking changes:
- Files deleted from `BookReader/` . These are all no longer needed, or bundled in other BookReader JS files
    - jquery.bt.min.js
    - plugin.theme.js - including methods:
        - BookReader.prototype.themes
        - BookReader.prototype.updateTheme
        - BookReader.prototype.default_theme
        - BookReader.prototype.theme
        - option enableThemesPlugin
    - excanvas.compiled.js
    - plugin.print.js - including methods:
        - BookReader.prototype.printPage 
        - BookReader.prototype.getPrintURI 
        - BookReader.prototype.getPageFile
    - jquery.browser.min.js
    - soundmanager/*
    - jquery.ui.touch-punch.min.js
    - mmenu/*
    - jquery-ui-1.12.0.min.js
- BookReader now also requires web components; more documentation on how to use will be coming in the next beta versions.
- BookNavigator is a web component wrapper around core BookReader
- Add Karma for testing web components
- Switch to npm module type to allow importing of web components
- Use submenu web components for search, book info, and other
- New Bookmark managing submenu
- Bug fixes
- BookReader/ build files directory is now completely disposable

# 4.40.2
-Fix: page container has `data-side` attr @iisa

# 4.40.1
- Fix: Support /search/TERM in url @nsharma123
- Dev: Fix reference to deprecated pruneUnused @cdrini

# 4.40.0
- Dev: Separate ModeThumb into separate file @cdrini
- Feature: Progressive loading of higher resolution images @cdrini
    - Potentially breaking change: `data-(side|leaf|reduce|row)` no longer set
    - Potentially breaking change: mode class no longer set on page container
    - A number of deprecated methods converted to no-ops with `console.warn`
- Feature: pow2 reduce by default @cdrini
    - New option: `reduceSet: 'pow2' | 'integer' = 'pow2'` limits reduce variables sent to getURI to be powers of 2
- Dev: Add esbuild to `npm run serve-dev` @iisa
- Fix: BookNavigator loaded after JSIAInit @cdrini

# 4.39.3
- Hotfix: Fix iOS 8 erroring since 4.39.0 @cdrini

# 4.39.2
- Dev: update Readme @Himanshunitrr
- Dev: in-file typo fixes @cclauss
- Fix: v5 booknav refresh @iisa @dualcnhq
# 4.39.1
- Dev: update Readme @Himanshunitrr
- Fix: v5 bookmarks menu update @iisa @dualcnhq
# 4.39.0
- Feature: Mode1Up DPI awareness @cdrini
    - Introduces two new optional options: `ppi` and `PageData.ppi`
    - Potentially breaking change: zooming in Mode1Up will now zoom at different intervals

# 4.38.0
Dev: update dependencies @cdrini
Dev: replace travis badge with GHA badge @cdrini
Feature: Thumbnail/Gallery view reusing best scaled images @iisa
Fix: simplify ImageCache dictionary @iisa

# 4.37.0
Fix: new ImageCache that keeps track of requested images & their scale factor @iisa
Fix: 2up mode's use of ImageCache @iisa
# 4.36.0
Fix: More image caching - 2up, some sharing with thumbnail draw @iisa

# 4.35.1
Fix: 2up, `baseLeafCss` - use function to find "top" value @iisa
# 4.35.0
Fix: show text selection layer if word count is less than 2,500 @cdrini
Fix: 2up, only resize spread if current image is better than next size @iisa
# 4.34.0
Fix: exist fullscreen will change to 2up if 2up is available @iisa
# 4.33.0
Fix: use optional `srcSet` in 1up mode @iisa
# 4.32.0
Fix: slim down prefetch group @iisa
Fix: TTS caches xml @cdrini 
# 4.31.0
Dev: demo cleanup with @cdrini
Fix: 2up - pass reduction factors when creating image urls @iisa
# 4.30.0
Fix: all view modes on desktop & view mode toggl on mobile are now default. @nsharma123

# 4.28.0
Fix: adding alt tags to images @nsharma123
# 4.27.0
Fix: update init function to use new flag `autoResize` @iisa
Fix: images - `useSrcSet` flag to determine when we fill `srcSet` attribute @iisa
# 4.26.1
Patch: Text selection layer does not get made in thumbnail view @dualcnhq
# 4.26.0
Dev: move to Github actions @cdrini
Dev: version bumps @dependabot
Fix: Text selection layer gets created for first page, does not get created for last page @dualcnhq

# 4.25.0
Fix: Helper changes for stream redirection to read hash fragment params from URL @nsharma123

# 4.24.0
Fix: Bookreader layout when initialized in "ReadAloud" mode @nsharma123

# 4.23.0
Fix: first search result click now updates url @nsharma123

# 4.22.0
Fix: update non-asserted page labelling next to nav scrubber @iisa

# 4.21.0
- Fix: Search Plugin Updates (#556) @iisa
  - always display search results markers
  - update search results nav tap targets & style
  - Search Results Nav - extend click events
    - add new click event to help toggle side menu
    - add new test file for Search view
- Dev: move search plugin test files to their own directory (#556) @iisa

# 4.20.1
- Fix: Handle empty dejavu.xml files in text selection plugin @iisa

# 4.20.0
- Dev: Update 9 dependencies (including webpack, sass, @babel/*) @dependabot-preview + @cdrini
- Dev: Move dragscroll code into src @cdrini
- Dev: Make webpack treat jquery as an external dependency @cdrini
- Fix: Samsung Internet not loading BR on IA @cdrini

# 4.19.0
- Fix: `<br>` rendered in search panel @ArunTeltia
- Fix: TTS speed dropdown has white text on white in Chrome @participator
- Dev: Replace dependency copies with npm packages (jquery, jquery-ui, mmenu, colorbox, touch-punch, jquery.browser) @cdrini
- Fix: Use serif font for advance/review icons @Eilima
- Fix: Table of contents has black text on black background @xhalin01
- Dev: Delete empty files (BookReaderEmbed.css, mmenu/demo.css) @cdrini
- Dev: Move images into src directory and compress SVG files @cdrini
- Fix: TTS toolbar should not be in tab order when invisible @shaneriley @cdrini
- Fix: Text selection not working in demos @cdrini
- Fix: Text selection throwing error on page with index=-1 @cdrini

# 4.18.7
Fix: update fullscreen toggle methods to fire behaviors in an expected way @iisa

# 4.18.6
- Fix: use fullscreen toggle flow when starting fullscreen (#499) @iisa

# 4.18.5
- Fix: Waits to resize until first result flipped to (#498) @shaneriley

# 4.18.4
- Fix: Adds data attribute to 2up page containers for side designation @shaneriley
- Fix: Apdate interstitial modal to fixed with & clean up messaging @iisa

# 4.18.3
- Fix: Enrich context to search emitted events @iisa
- Fix: Hides directional buttons and shows viewmode buttons on mobile viewports @shaneriley

# 4.18.2
- Fix: Search plugin fixes (#491) @shaneriley

# 4.18.1
- Fix: Skips subsequent creation of search views when setup called 1+n times @shaneriley

# 4.18.0
- Dev: Add eslint for `space-after-keywords`, `space-before-blocks`, `only-multiline` @Yashs911
- Dev: Update eslint, sinon, @types/jest, testcafe, sass, webpack @dependabot-preview + @cdrini
- Dev: Add 3 more files to eslint @Yashs911
- Feature: New options for text selection plugin: single page DJVU XML url @cdrini

# 4.17.0
- Fix: text selection on Safari @cdrini
- Feature: Search results navigation bar @shaneriley

# 4.16.0
- Dev: Emit custom event to trigger @iisa
- Feature: Text selection plugin @Pyrojet99
- Fix: Wrong openlibrary URL @cdrini
- Dev: update sinon, jest, concurrently, testcafe, eslint, @types/jest, webpack-cli, @babel/core, @babel/preset-env, node-fetch @dependabot-preview + @cdrini
- Fix: Flaky TestCafe tests (#436) @cdrini
- Fix: Search plugin fixes (#443) @shaneriley
- Dev: Upgrade to Webpack 5 @cdrini
- Fix: Polyfill CustomEvent constructor @cdrini
- Fix: HTML escaping to prevent XSS (#434) @nsharma123

# 4.15.0
- Dev: update lodash dependency @dependabot-preview + @cdrini
- Dev: Moves /BookReaderDemo/index.html to /index.html (#394) @anirbansaha782
- Fix: Prevents page flipping to last page if navigating to previous page from a book's cover (#419) @iisa
- Feature: Splits search plugin controller and view, updates mobile menu styles (#420) @shaneriley
- Dev: Updates to e2e testing navigation model & base tests (#421) @iisa

# 4.14.3
- Fix: Zoom buttons missing on mobile + other chrome fixes (#416) @shaneriley

# 4.14.2
- Dev: Make npm package public (#414) @cdrini

# 4.14.1
- Dev: Automate npm publishing on github release (#409, #412) @cdrini

# 4.14.0
- Dev: Simplify webpack file (#373) @cdrini
- Feature: One page/Two page/Thumbnail view now one button toggler (#375) @shaneriley
- Fix: Advanced page demo broken (#383) @Pyrojet99
- Fix: Pages randomly flipping on /stream endpoint (#386) @Pyrojet99
- Feature: Display high quality images on high resolution displays (#378) @Pyrojet99
- Dev: Add eslint for newline at end of file (#396) @JanviMahajan14
- Dev: update a bunch of dependencies @dependabot-preview + @cdrini
- Dev: Speed up Travis (a bit) by making it run testcafe concurrently (#407) @cdrini
- Feature: New chrome for BookReader! (#381) @shaneriley

# 4.13.1
- Fix: Toc entries not showing page number on desktop (#369) @cdrini

# 4.13.0
- Fix: BookReader.unbind not actually unbinding (#360) @shaneriley
- Dev: New demo with configurable IA id: `demo-internetarchive.html?ocaid=foo` (#356) @Pyrojet99
- Dev: Add E2E tests for right-to-left books (#350) @Pyrojet99
- Dev: Update core-js, webpack, \@types/jest, regenerator-runtime @dependabot-preview + @cdrini
- Fix: Remembers page for multi-book items on IA (#359) @mc2
- Feature: Table of contents panel in mobile view (#351) @Pyrojet99

# 4.12.0
- Fix: Test command for Windows users @cdrini
- Dev: Autoplay e2e test @pyrojet99
- Dev: Enable eslint for tests @Kartik1397
- Dev: Mobile search e2e test @pyrojet99
- Fix: Extra querystring after hash @kristopolous
- Dev: Update websocket-extensions, sinon, testcafe @cdrini
- Feature: Visual adjustments checkboxes on mobile @pyrojet99

# 4.11.1
- Fix: search urls now redirect to query parameter `q=foo` @mc2

# 4.11.0
- Dev: Add E2E tests for searching on desktop @Pyrojet99
- Fix: Search result not highlighted when landing on page with matches @iisa
- Dev: Remove console logs from jest tests @NayamAmarshe
- Dev: Add eslint for space-infix-ops @JanviMahajan14
- Fix: Bugs in search results in preview books @iisa
- Fix: `startFullscreen` option only working for mode2up @shaneriley
- Fix: Prefetch viewable pages in preview books for smoother flipping @cdrini
- Dev: Add dependabot for JS dependencies @cdrini
- Dev: Update codecov, iso-language-codes @dependabot-preview + @cdrini

# 4.10.0
- Fix: BR shouldn't change URL until the user interacts with the page @mc2
- Feature: Add `startFullscreen` option to launch in fullscreen @shaneriley
- Feature (beta): Preview pages can be swapped out with search pin clicking @cdrini

# 4.9.0
- Fix: -/+ buttons not zooming in Chrome @ishank-dev
- Add chapters demo to e2e tests @ishank-dev
- Make Travis testcafe runs less flaky @shaneriley
- Pin npm version dependencies for consistent builds @cdrini
- Standardize HTML structure for pages across view modes @shaneriley
    - WARNING: Some of the html elements/classes have changed. Potentially breaking change.
- Feature (beta): Preview pages. Specifying `viewable: false` on pages causes them to render a preview image placeholder. @cdrini
- Remove deprecated QUnit tests @Pyrojet99
- Remove console.logs in test output @NayamAmarshe

# 4.8.0
- Adds customizable layout controls @shaneriley

# 4.7.1
- Add new parameters to analytics @bfalling

# 4.7.0
Big change: All of BookReader core is now compiled to es5, and a large number of
chunks have been re-written in es6. Care has been taken to ensure no public APIs
have changed, but note this was a big change.

- Extract large chunks of BookReader.js into separate files, into es6; @cdrini
- Increase jest coverage 47% → 58%; @cdrini
- Increase testcafe coverage; @iisa @shaneriley

# 4.6.0
Big change: all the plugins are now written in es6, and compiled to es5. There should
be no observable changes, but note this was a big change.

- Fix: UI on archive.org not consistent with demos due to CSS conflicts; @rchrd2
- Convert all plugins to es6 + webpack; @cdrini @iisa @nsharma123
- Increase jest coverage 39% → 47%; @cdrini @iisa @nsharma123
- Increase testcafe coverage; @iisa
- Add testcafe to travis; @cdrini
- Add more/enforce more lint rules; @cdrini
- Make demo pages more in sync with Internet Archive pages; @mc2
- Add `npm run serve-dev` for auto-watching + auto-refreshing dev server; @cdrini

# 4.5.1
- Fix: Click-to-flip now works in 2up mode zoomed in
- Fix: Image panning sometimes not working
- Fix #144: Hamburger icon only clickable on lines
- Add TestCafe support

# 4.5.0
- ReadAloud now supports jumping backwards
- Pressing -/= (or -/+ on numpad) zooms out/in
- FIX #179: ReadAloud now ignores hyphens between lines

# 4.4.2
- more robust menu toggle plugin, working well with zoom & panning around in zoom
- more tests

# 4.4.1
- Remove accidental es6 syntax in BookReader.js (breaking IE11)

# 4.4.0
- New ReadAloud controls + engine. Uses browser's SpeechSynthesis API instead of server-side test-to-speech

# 4.3.2
- menu toggle plugin, now applies to in-page & fullscreen views + early escapes when navbar isn't present

# 4.3.0
- New plugin, `fullscreen_menu_toggle`, allowing center-tap to hide UI
- TTS Plugin logs analytics events (if enabled)
- ES6 compilation step no longer performed on client; build files are included in repo so clients have no build step

# 4.2.5
- Large refactor of plugin.tts.js
- ES6 compliation step
- Known bug: Clicking on page while TTS is playing won't stop the playback

# 4.2.4
- Skips initialization of vendor fullscreen plugin when on a mobile device

# 4.2.3
- Creates vendor native fullscreen plugin and example use page

# 4.2.2
- Adds options for flipSpeed and flipDelay, the latter used for autoplay

# 4.2.1
- Fix rapid reload bug from thumbnail view

# 4.2.0
- Add eslint
- Fix issue analytics plugin
- Make the page display more extendable by splitting it into two functions

# 4.1.0
- Change BookReader.js function comments to JSDoc
- Move autoplay feature into an optional plugin
- Change the format of the current page string in the navbar. eg "1 / 100 (Cover)"
- Add BookReader.prototype.updateFirstIndex and use instead of setting this.firstIndex directly
- Simplify BookReader.prototype.init

# 4.0.1
- Add options.navBarTitle, which gets shown to the left of the scrubber.
- Fix issue where there was a 1px border on cover leafEdge

# 4.0.0
V4 was driven by updating BookReader to work inline on the archive.org details page. This required code refactoring (eg: changing ids to classes), and also updating the design so it integrates well within the details page theatre section.

- BookReader selectors made relative to BookReader. This means it shouldn't interfere with parent page, and also more than one BookReader instance can be on the page.
- CSS converted to SASS and refactored.
- New design with full-screen support.
- URL plugin is extended to support replaceState, and also configure which params are reflected into the URL fragment.
- In transition: JavaScript code is formatted with 2 spaces instead of 4

# 3.2.1
- Fix so initParams normalizes params.page to params.index, to prevent complexity of priority of page versus index.

# 3.2.0
On Archive.org, we needed a way to pass in a default start page for books. These changes make that easier.

- Update the way bookreader inits from various params contexts
- Add `defaults` to the init options
- Update so that mode is only reflected on URL if user has made a change.
- Update to handle both params.index and params.page when provided in defaults. Separate page parsing into separate method.

# 3.1.0
- Add new IFrame plugin to enable two-way communication between a BookReader inside an `<iframe>` and its parent window.
- Move the `paramsFromCurrent`, `paramsFromFragment`, and `fragmentFromParams` methods back into BookReader core and out of the URL Plugin. This change should be backwards-compatible with previous versions.
- Fire a new event, `fragmentChange`, on BookReader when the reader’s state changes.

# 3.0.8
- Add additional tracking event when view changes

# 3.0.7
- Fix: Assign options.titleLeaf to this.titleLeaf

# 3.0.6
- Another fix for plugin.search.js. The path GET param should not have a trailing slash.

# 3.0.5
- Hotfix for plugin.search.js. Fixes issue where search results were not rendered on page flip.

# 3.0.4
- Hotfix for plugin.search.js. Fixes fulltext search for some books on Archive.org

# 3.0.3
- Add more options: showToolbar, showLogo
- Add this.options field, which stores the options last used in setup call
- Improve `_getDataFlattened` to have simple cache breaker
- Fix: don't show search UI if this.enableSearch is false
- Fix: add missing 'defaults' option to search plugin
- Move constants out of instance, and into class (eg BookReader.constMode1up)

# 3.0.2
In the process of upgrading IA, to use the new BookReader API, more changes/fixes were made.

- Separate default options into BookReader.defaultOptions. This allows clients which use Internet Archive's JSIA endpoint (see demo-ia-plato.html) to have a hook into changing options. Also update plugins, to extend defaultOptions instead of modifying options in setup functions.
- Add BookReader.version, which helps IA support older versions in the JSIA endpoint (eg https://archive.org/bookreader/BookReaderJSLocate.php?id=theworksofplato01platiala&subPrefix=theworksofplato01platiala).
- Bring some IA-specific code into plugin.chapters.js
- Add more options that were previously missed (protected, olHost, subPrefix, bookPath, zip, imageFormat, bookId). These are mostly for plugins. If you intend on using any of the plugins, you can see the full config options there.

# 3.0.1
- Fix issue setting info and share dialogs

# 3.0.0 Major Release

Version 3.0.0 is an effort to make BookReader more modular, extensible, and easier to use.

Changes include:

- Make BookReader easier to use, by adding `options` to the constructor, and adding new `options.data` option. The old way of overriding properties should still work, but it is deprecated. With `options.data`, all BookReader needs is the image URLs and dimensions. To have dynamic image URLs (eg for scaling), omit the URL from `options.data`, and include `options.getPageURI`.
- Factor out extra features into plugins. See `plugins` directory. Example plugins include:
    - plugins.chapters.js - render chapter markers
    - plugins.search.js - add search ui, and callbacks
    - plugins.tts.js - add tts (read aloud) ui, sound library, and callbacks
    - plugins.url.js - automatically updates the browser url
    - plugins.resume.js - uses cookies to remember the current page
    - plugins.mobile_nav.js - adds responsive mobile nav to BookReader
Note that there is minor overhead added when loading multiple script tags. If this is a concern, a build step, can be used to concatenate the files into a single JS file.
- Clean up code: Remove a lot of commented-out code. Remove some unused methods.
- Change some, but not all, CSS ids to classes.
- DEPRECATED: Use options to configure BookReader. It is now deprecated to change properties directly.
- DEPRECATED: CSS ids are being removed, (eg #BookReader is now .BookReader), with the goal to entirely use classes instead. This is in progress, but it is considered deprecated to use the ids directly. We would like to remove all ids for the next major release.
- BREAKING: If features that are now in plugins were used, the plugin's JS file will need to be included as well. Note, we would also like to separate the CSS into a separate file for the next major release.

# 2.1.0
- Add auto mode to 1up autosize (in addition to height and width)
- Remove the old responsiveAutofit (which is not needed anymore)

# 2.0.2
- Fix regex issue when searching
- Make the search api endpoint configurable

# 2.0.1
- Add package.json and CHANGELOG
- Remove more IA-specific code

# 2.0.0
- Major release
- Many changes from updated Archive.org bookreader brought back to this open source project.
