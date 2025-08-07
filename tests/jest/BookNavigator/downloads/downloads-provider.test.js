import { fixtureCleanup, fixtureSync } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import DownloadsProvider from '@/src/BookNavigator/downloads/downloads-provider.js';

const downloadableTypes = [
  ["PDF", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.pdf"],
  ["ePub", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.epub"],
  ["Plain Text", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala_djvu.txt"],
  ["DAISY", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala_daisy.zip"],
  ["Kindle", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.mobi"],
];

const downloads = [
  {
    type: "PDF",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.pdf",
    note: "PDF files contain high quality images of pages.",
  },
  {
    type: "ePub",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.epub",
    note: "ePub files are smaller in size, but may contain errors.",
  },
];

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('Downloads Provider', () => {
  test('constructor - initial setup', () => {
    const isBookProtected = false;
    const provider = new DownloadsProvider(isBookProtected);

    expect(provider.id).toEqual('downloads');
    expect(provider.icon).toBeDefined();
    expect(fixtureSync(provider.icon).tagName).toEqual('IA-ICON-DL');
    expect(provider.label).toEqual('Downloadable files');
    expect(provider.menuDetails).toBeDefined();
    expect(provider.component).toBeDefined();

    provider.update(downloadableTypes);

    expect(provider.isBookProtected).toEqual(false);

    expect(provider.downloads[0].type).toEqual("PDF");
    expect(provider.downloads[1].type).toEqual("ePub");

    expect(provider.menuDetails).toEqual(`(${downloads.length} formats)`);
  });

  test('render view if book is protected', () => {
    const provider = new DownloadsProvider({
      bookreader: { options: { isProtected: true } },
    });

    expect(provider.isBookProtected).toEqual(true);

    provider.update(downloadableTypes);

    expect(provider.downloads[0].type).toEqual("Encrypted Adobe PDF");
    expect(provider.downloads[1].type).toEqual("Encrypted Adobe ePub");

    expect(provider.downloads.length).toEqual(downloads.length);
  });
});
