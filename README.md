# Internet Archive BookReader

![](./screenshot.png)

The Internet Archive BookReader is used to view books from the Internet Archive online and can also be used to view other books.

See live examples:
- On details page: https://archive.org/details/birdbookillustra00reedrich
- Full Screen: https://archive.org/stream/birdbookillustra00reedrich (mobile-friendly)


## Demos

See `BookReaderDemo` directory. These can be tested by starting a simple web server in the root directory. For example:

```
python -m SimpleHTTPServer
```

And then open `http://localhost:8000/BookReaderDemo/demo-simple.html`.

## Usage

The best way to learn how to use BookReader is to view the source of the demos. The general idea is to instantiate a BookReader instance, and override some property and methods. Here is a short example:

```
var br = new BookReader();
br.numLeafs = 15;
br.bookTitle= 'Internet Archive BookReader Example';

br.getPageURI = function(index, reduce, rotate) {
  var leafStr = '000';
  var imgStr = (index+1).toString();
  var re = new RegExp("0{"+imgStr.length+"}$");
  var url = 'http://example.com/image_'+leafStr.replace(re, imgStr) + '.jpg';
  return url;
}

// ... some code omitted

br.init();
```

See `BookReaderDemo/demo-simple.html` and `BookReaderDemo/BookReaderJSSimple.js` for a full example.

### Properties

- TODO (for now see BookReader.js and BookReader function at approx. line 37)


## Notes about version 2

Some of the new features in version 2:
- Updated look for desktop
- Improved mobile support
- Fix issues with Text to Speech in browsers that don't support Flash
- Remove PHP backend code from this repository and only include frontend code


## More info

Developer documentation:
https://openlibrary.org/dev/docs/bookreader

Hosted source code:
https://github.com/internetarchive/bookreader

IIIF (http://iiif.io)
See `BookReaderDemo/demo-iiif.html` to see an example of how to load a IIIF manifest in BookReader.


## Areas for improvement
- Change libraries to be NPM dependencies rather than included in the source code


## Contributing

Some notes for contributing:
- Please try to follow the code style within the file (spacing/comments/etc).
- Please only submit merge requests for features that would be useful for the general use
- Please try to avoid adding new libraries
- If the PR is a bug fix, include a link to a jsbin/codepen if possible
- Please test the changes in desktop, mobile, and embed modes, and also on many different devices/browsers.


## License

The source code license is AGPL v3, as described in the LICENSE file.

The mobile menu is built with [mmenu](http://mmenu.frebsite.nl/download.html), which is free for personal and non-profit use. However, for commmercial use, a license must be purchased.

Alternatively, the mobile mmenu can be disabled with `br.enableMobileNav = false;`.


## Other credits

The ability to test on multiple devices is provided courtesy of [Browser Stack](https://www.browserstack.com).
