import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import downloadsProvider from '../../../../src/BookNavigator/downloads/downloads-provider';

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
  describe('constructor', () => {
    const isBookProtected = false;
    const provider = new downloadsProvider(isBookProtected);

    expect(provider.id).to.equal('downloads');
    expect(provider.icon).to.exist;
    expect(provider.label).to.equal('Downloadable files');
    expect(provider.menuDetails).to.exist;
    expect(provider.component).to.exist;

    provider.update(downloadableTypes);

    expect(provider.menuDetails).to.equal(`(${downloads.length} formats)`);
  });

});
