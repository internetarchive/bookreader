import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import DownloadsProvider from '../../../../src/BookNavigator/downloads/downloads-provider';

const downloadableTypes = [
  ["PDF", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.pdf"],
  ["ePub", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.epub"],
  ["Plain Text", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala_djvu.txt"],
  ["DAISY", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala_daisy.zip"],
  ["Kindle", "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.mobi"]
];

const downloads = [
  {
    type: "PDF",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.pdf",
    note: "PDF files contain high quality images of pages."
  },
  {
    type: "ePub",
    url: "//archive.org/download/theworksofplato01platiala/theworksofplato01platiala.epub",
    note: "ePub files are smaller in size, but may contain errors."
  }
];

afterEach(() => {
  sinon.restore();
});

describe('Downloads Provider', () => {
  it('constructor - initial setup', () => {
    const isBookProtected = false;
    const provider = new DownloadsProvider(isBookProtected);

    expect(provider.id).to.equal('downloads');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Downloadable files');
    expect(provider.menuDetails).to.exist;
    expect(provider.component).to.exist;

    provider.update(downloadableTypes);

    expect(provider.isBookProtected).to.equal(false);

    expect(provider.downloads[0].type).to.equals("PDF");
    expect(provider.downloads[1].type).to.equals("ePub");

    expect(provider.menuDetails).to.equal(`(${downloads.length} formats)`);
  });

  it('render view if book is protected', () => {
    const provider = new DownloadsProvider({
      bookreader: { options: { isProtected: true } }
    });

    expect(provider.isBookProtected).to.equal(true);

    provider.update(downloadableTypes);

    expect(provider.downloads[0].type).to.equals("Encrypted Adobe PDF");
    expect(provider.downloads[1].type).to.equals("Encrypted Adobe ePub");

    expect(provider.downloads.length).to.equals(downloads.length);
  });
});
