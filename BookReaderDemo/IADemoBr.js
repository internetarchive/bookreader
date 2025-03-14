/* global BookReader, BookReaderJSIAinit */
import { extraVolOptions, custvolumesManifest } from './ia-multiple-volumes-manifest.js';

/**
 * This is how Internet Archive loads bookreader
 */
const urlParams = new URLSearchParams(window.location.search);
function getFromUrl(name, def) {
  if (urlParams.has(name)) {
    return urlParams.get(name);
  } else {
    return def;
  }
}

const ocaid = urlParams.get('ocaid');
const openFullImmersionTheater = urlParams.get('view') === 'theater';
const ui = urlParams.get('ui');
const searchTerm = urlParams.get('q');

const iaBookReader = document.querySelector('ia-bookreader');

const downloadListWithLCP = [
  [
    "lcpPDF",
    "link to lcp pdf"
  ],
  [
    "lcpEPUB",
    "link to lcp epub"
  ]
];

if (openFullImmersionTheater) {
  $(document.body).addClass('BRfullscreenActive');
  iaBookReader.fullscreen = openFullImmersionTheater;
}

const modal = document.querySelector('modal-manager');
iaBookReader.modal = modal;

// Override options coming from IA
BookReader.optionOverrides.imagesBaseURL = '/BookReader/images/';

const initializeBookReader = (brManifest) => {
  console.log('initializeBookReader', brManifest);

  const {bookPath, subPrefix} = brManifest.data.brOptions;
  let path = bookPath;
  const subPrefixWithSlash = `/${subPrefix}`;
  if (bookPath.length - bookPath.lastIndexOf(subPrefixWithSlash) == subPrefixWithSlash.length) {
    path = bookPath.substr(0, bookPath.length - subPrefixWithSlash.length);
  }

  const searchInsideUrl = '//{{server}}/fulltext/inside.php?' + [
    'item_id={{bookId|urlencode}}',
    'doc={{subPrefix|urlencode}}',
    'q={{query|urlencode}}',
    // This endpoint doesn't expect the path to be url encoded
    `path=${encodeURIComponent(path).replace(/%2F/g, '/')}`,
    'pre_tag={{preTag|urlencode}}',
    'post_tag={{postTag|urlencode}}',
  ].join('&');

  const options = {
    el: '#BookReader',
    /* Url plugin - IA uses History mode for URL */
    // commenting these out as demo uses hash mode
    // keeping them here for reference
    // urlHistoryBasePath: `/details/{$ocaid}/`,
    // resumeCookiePath: `/details/{$ocaid}/`,
    // urlMode: 'history',
    // Only reflect these params onto the URL
    // urlTrackedParams: ['page', 'search', 'mode'],
    /* End url plugin */
    enableBookTitleLink: false,
    bookUrlText: null,
    startFullscreen: openFullImmersionTheater,
    // leaving this option commented out bc we change given user agent on archive.org
    // onePage: { autofit: <?=json_encode($this->ios ? 'width' : 'auto')?> },
    showToolbar: getFromUrl('options.showToolbar', 'false') === 'true',
    /* Multiple volumes */
    // To show multiple volumes:
    enableMultipleBooks: false, // turn this on
    multipleBooksList: [], // populate this  // TODO: get sample blob and tie into demo
    /* End multiple volumes */
    enableBookmarks: true, // turn this on
    enableFSLogoShortcut: true,

    // TMP: To be replaced once BookReaderJSIA is updated to provide
    // these in the right spot.
    plugins: {
      search: {
        enabled: true,
        initialSearchTerm: searchTerm ? searchTerm : '',
        searchInsideUrl,
        preTag: brManifest.data.brOptions.searchInsidePreTag,
        postTag: brManifest.data.brOptions.searchInsidePostTag,
      },
    },
  };

  // we want to show item as embedded when ?ui=embed is in URI
  if (ui === 'embed') {
    options.mode = 1;
    options.ui = 'embed';
  }

  // we expect this at the global level
  BookReaderJSIAinit(brManifest.data, options);

  const isRestricted = brManifest.data.isRestricted;
  window.dispatchEvent(new CustomEvent('contextmenu', { detail: { isRestricted } }));
};

window.initializeBookReader = initializeBookReader;

const showLCP = document.querySelector('#show-lcp');
showLCP.addEventListener('click', async () => {
  const iaBr = document.querySelector('ia-bookreader');
  const bookNav = iaBr.shadowRoot.querySelector('book-navigator');

  bookNav.downloadableTypes = downloadListWithLCP;

  bookNav.updateMenuContents();
  await bookNav.updateComplete;
});

const multiVolume = document.querySelector('#multi-volume');
multiVolume.addEventListener('click', () => {
  // remove everything
  $('#BookReader').empty();
  delete window.br;
  // and re-mount with a new book
  BookReaderJSIAinit(custvolumesManifest, extraVolOptions);
});


const fetchBookManifestAndInitializeBookreader = async (iaMetadata) => {
  document.querySelector('input[name="itemMD"]').checked = true;
  iaBookReader.item = iaMetadata;

  const jsiaParams = {
    format: 'jsonp',
    itemPath: iaMetadata.dir,
    id: iaMetadata.metadata.identifier,
    server: iaMetadata.server,
  };

  const jp2File = iaMetadata.files.find(f => f.name.endsWith('_jp2.zip'))
  if (jp2File) {
    jsiaParams.subPrefix = jp2File.name.replace('_jp2.zip', '');
  }

  const iaManifestUrl = `https://${iaMetadata.server}/BookReader/BookReaderJSIA.php?${
    new URLSearchParams(jsiaParams)
  }`;

  const manifest = await fetch(iaManifestUrl).then(response => response.json());
  document.querySelector('input[name="bookManifest"]').checked = true;

  initializeBookReader(manifest);
};

// Temp; Circumvent bug in BookReaderJSIA code
window.Sentry = null;
window.logError = function(e) {
  console.error(e);
};
fetch(`https://archive.org/metadata/${ocaid}`)
  .then(response => response.json())
  .then(iaMetadata => fetchBookManifestAndInitializeBookreader(iaMetadata));
