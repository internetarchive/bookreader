import { fixtureCleanup, fixtureSync } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import volumesProvider from '@/src/BookNavigator/volumes/volumes-provider';

const brOptions = {
  "options": {
    "subPrefix": 'special-subprefix',
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
  fixtureCleanup();
});

describe('Volumes Provider', () => {
  test('initiating & sorting', () => {
    const onProviderChange = sinon.fake();

    const baseHost = "https://archive.org";
    const provider = new volumesProvider({
      baseHost,
      bookreader: brOptions,
      onProviderChange
    });

    const files = brOptions.options.multipleBooksList.by_subprefix;
    const volumeCount = Object.keys(files).length;

    expect(provider.onProviderChange).toEqual(onProviderChange);
    expect(provider.id).toEqual('volumes');
    expect(provider.icon).toBeDefined();
    expect(fixtureSync(provider.icon).tagName).toEqual('svg');
    expect(provider.sortOrderBy).toEqual('default');

    expect(provider.label).toEqual(`Viewable files (${volumeCount})`);
    expect(provider.viewableFiles).toBeDefined();
    expect(provider.viewableFiles.length).toEqual(3);
    expect(provider.volumeCount).toEqual(3);

    expect(provider.component.baseHost).toEqual(baseHost);
    expect(provider.component.fileList).toEqual(provider.viewableFiles);
    expect(provider.component.subPrefix).toEqual(brOptions.options.subPrefix);

    expect(provider.actionButton).toBeDefined();
    expect(provider.actionButton).toEqual(provider.sortFilesComponent);
    expect(provider.actionButton.fileListRaw).toEqual(provider.viewableFiles);

    const callbackSpy = sinon.spy(provider, 'handleFileListSorted');
    provider.actionButton.sortVolumes('title_asc');

    expect(callbackSpy.callCount).toEqual(1);
  });
});
