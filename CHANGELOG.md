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
