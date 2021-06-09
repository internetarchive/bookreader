import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import volumesProvider from '../../../../src/BookNavigator/volumes/volumes-provider';

const brOptions = {
  "options": {
    "enableMultipleBooks": true,
    "multipleBooksList": {
      "by_subprefix": {
        "/details/SubBookTest": {
          "url_path": "/details/SubBookTest",
          "file_subprefix": "book1/GPORFP",
          "title": "book1/GPORFP.pdf",
          "file_source": "/book1/GPORFP_jp2.zip"
        },
        "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive": {
          "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
          "file_subprefix": "subdir/book2/brewster_kahle_internet_archive",
          "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
          "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip"
        },
        "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
          "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "file_subprefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "title": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume.pdf",
          "file_source": "/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume_jp2.zip"
        }
      }
    }
  }
};

afterEach(() => {
  sinon.restore();
});

describe('Volumes Provider', () => {
  describe('constructor', () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(onSortClick, baseHost, brOptions);

    const files = brOptions.options.multipleBooksList?.by_subprefix;
    const volumeCount = Object.keys(files).length;

    expect(provider.optionChange).to.equal(onSortClick);
    expect(provider.id).to.equal('volumes');
    expect(provider.icon).to.exist;

    expect(provider.label).to.equal(`Viewable Files (${volumeCount})`);
    expect(provider.viewableFiles).to.exist;
    expect(provider.viewableFiles.length).to.equal(3);

    expect(provider.component.hostUrl).to.exist;
    expect(provider.component.hostUrl).to.equal(baseHost);
    expect(provider.component).to.exist;
  });
});
