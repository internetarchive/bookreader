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
  it('constructor', () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(baseHost, brOptions, onSortClick);

    const files = brOptions.options.multipleBooksList.by_subprefix;
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

  it('sorting cycles - render sort actionButton', async () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(baseHost, brOptions, onSortClick);

    expect(provider.sortOrderBy).to.equal("orig_sort");

    provider.sortVolumes("title_asc");
    expect(provider.sortOrderBy).to.equal("title_asc");
    expect(provider.sortButton.getHTML()).includes("sort-by asc-icon");

    provider.sortVolumes("title_desc");
    expect(provider.sortOrderBy).to.equal("title_desc");
    expect(provider.sortButton.getHTML()).includes("sort-by desc-icon");

    provider.sortVolumes("orig_sort");
    expect(provider.sortOrderBy).to.equal("orig_sort");
    expect(provider.sortButton.getHTML()).includes("sort-by neutral-icon");
  });

  it('sort volumes in initial order', async () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(baseHost, brOptions, onSortClick);

    const parsedFiles = brOptions.options.multipleBooksList.by_subprefix;
    const files = Object.keys(parsedFiles).map(item => parsedFiles[item]).sort((a, b) => a.orig_sort - b.orig_sort);
    const origSortTitles = files.map(item => item.title);

    provider.sortVolumes("orig_sort");

    expect(provider.sortOrderBy).to.equal("orig_sort");
    expect(provider.actionButton).to.exist;

    const providerFileTitles = provider.viewableFiles.map(item => item.title);
    // use `.eql` for "lose equality" in order to deeply compare values.
    expect(providerFileTitles).to.eql([...origSortTitles]);
  });

  it('sort volumes in ascending title order', async () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(baseHost, brOptions, onSortClick);

    const parsedFiles = brOptions.options.multipleBooksList.by_subprefix;
    const files = Object.keys(parsedFiles).map(item => parsedFiles[item]);
    const ascendingTitles = files.map(item => item.title).sort((a, b) => a.localeCompare(b));

    provider.sortVolumes("title_asc");

    expect(provider.sortOrderBy).to.equal("title_asc");
    expect(provider.actionButton).to.exist;

    const providerFileTitles = provider.viewableFiles.map(item => item.title);
    // use `.eql` for "lose equality" in order to deeply compare values.
    expect(providerFileTitles).to.eql([...ascendingTitles]);
  });

  it('sort volumes in descending title order', async () => {
    const onSortClick = sinon.fake();
    const baseHost = "https://archive.org";
    const provider = new volumesProvider(baseHost, brOptions, onSortClick);

    provider.isSortAscending = false;

    const parsedFiles = brOptions.options.multipleBooksList.by_subprefix;
    const files = Object.keys(parsedFiles).map(item => parsedFiles[item]);
    const descendingTitles = files.map(item => item.title).sort((a, b) => b.localeCompare(a));

    provider.sortVolumes("title_desc");

    expect(provider.sortOrderBy).to.equals("title_desc");
    expect(provider.actionButton).to.exist;

    const providerFileTitles = provider.viewableFiles.map(item => item.title);
    // use `.eql` for "lose equality" in order to deeply compare values.
    expect(providerFileTitles).to.eql([...descendingTitles]);
  });

});
