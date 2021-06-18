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
          "orig_sort": 1,
          "title": "book1/GPORFP.pdf",
          "file_source": "/book1/GPORFP_jp2.zip"
        },
        "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive": {
          "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
          "file_subprefix": "subdir/book2/brewster_kahle_internet_archive",
          "orig_sort": 2,
          "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
          "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip"
        },
        "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
          "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "file_subprefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "orig_sort": 3,
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
    const provider = new volumesProvider(baseHost, brOptions, onSortClick);

    const files = brOptions.options.multipleBooksList?.by_subprefix;
    const volumeCount = Object.keys(files).length;

    expect(provider.optionChange).to.equal(onSortClick);
    expect(provider.id).to.equal('volumes');
    expect(provider.icon).to.exist;

    expect(provider.label).to.equal(`Viewable files (${volumeCount})`);
    expect(provider.viewableFiles).to.exist;
    expect(provider.viewableFiles.length).to.equal(3);

    expect(provider.component.hostUrl).to.exist;
    expect(provider.component.hostUrl).to.equal(baseHost);
    expect(provider.component).to.exist;
  });

  describe('sort volumes in ascending order', async () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(onSortClick, baseHost, brOptions);

    const parsedFiles = brOptions.options.multipleBooksList?.by_subprefix;
    const files = Object.keys(parsedFiles).map(item => parsedFiles[item]);
    const ascendingTitles = files.map(item => item.title);

    await onSortClick();

    const providerFileTitles = provider.viewableFiles.map(item => item.title);

    expect(provider.actionButton).to.exist;
    expect(provider.isSortAscending).to.equals(true);

    // use `.eql` for "lose equality" in order to deeply compare values.
    expect(providerFileTitles).to.eql([...ascendingTitles]);
  });

  describe('sort volumes in descending order', async () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(onSortClick, baseHost, brOptions);

    provider.isSortAscending = false;

    const parsedFiles = brOptions.options.multipleBooksList?.by_subprefix;
    const files = Object.keys(parsedFiles).map(item => parsedFiles[item]);
    const descendingTitles = files.map(item => item.title).sort((a, b) => b.localeCompare(a));

    await onSortClick();

    const providerFileTitles = provider.viewableFiles.map(item => item.title);

    expect(provider.actionButton).to.exist;
    expect(provider.isSortAscending).to.equals(false);

    // use `.eql` for "lose equality" in order to deeply compare values.
    expect(providerFileTitles).to.eql([...descendingTitles]);
  });

});
