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
- Update to handle both params.index and params.page when provided in defaults. Seperate page parsing into separate method.

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
