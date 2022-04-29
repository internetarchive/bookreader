import {
  html,
  fixture,
  fixtureCleanup,
} from '@open-wc/testing-helpers';
import sinon from 'sinon';
import '@/src/BookNavigator/volumes/volumes.js';


const brOptions = {
  "options": {
    "enableMultipleBooks": true,
    "multipleBooksList": {
      "by_subprefix": {
        "/details/SubBookTest": {
          "url_path": "/details/SubBookTest",
          "file_subprefix": "book1/GPORFP",
          "orig_sort": 0,
          "title": "book1/GPORFP.pdf",
          "file_source": "/book1/GPORFP_jp2.zip"
        },
        "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive": {
          "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
          "file_subprefix": "subdir/book2/brewster_kahle_internet_archive",
          "orig_sort": 1,
          "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
          "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip"
        },
        "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
          "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "file_subprefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "orig_sort": 2,
          "title": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume.pdf",
          "file_source": "/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume_jp2.zip"
        }
      }
    }
  }
};

const container = (brOptions, prefix) => (
  html`
    <viewable-files .viewableFiles=${brOptions} .hostUrl="https://archive.org" .subPrefix=${prefix}></viewable-files>
  `
);

beforeEach(() => {
  const body = document.querySelector('body');
  const brHook = document.createElement('div');
  brHook.setAttribute('id', 'BookReader');
  body.appendChild(brHook);
});

afterEach(() => {
  sinon.restore();
  fixtureCleanup();
});

describe('<viewable-files>', () => {
  test('sets default properties', async () => {
    const files = brOptions.options.multipleBooksList?.by_subprefix;
    const viewableFiles = Object.keys(files).map(item => files[item]);
    const el = await fixture(container(viewableFiles));
    await el.updateComplete;

    expect(el.viewableFiles).toEqual(viewableFiles);
    expect(el.viewableFiles.length).toEqual(3);
    expect(el.shadowRoot.querySelectorAll("ul li").length).toEqual(3);

    expect(el.shadowRoot.querySelector(".item-title").textContent).toInclude(`${viewableFiles[0].title}`);
  });

  test('render empty volumes', async () => {
    const viewableFiles = [];
    const el = await fixture(container(viewableFiles));
    await el.updateComplete;

    expect(el.viewableFiles).toEqual(viewableFiles);
    expect(el.viewableFiles.length).toEqual(0);
    expect(el.shadowRoot.childElementCount).toEqual(0);
  });

  test('render active volume item set as first viewable item ', async () => {
    const files = brOptions.options.multipleBooksList?.by_subprefix;
    const viewableFiles = Object.keys(files).map(item => files[item]);
    const prefix = viewableFiles[0].file_subprefix;

    const el = await fixture(container(viewableFiles, prefix));
    await el.updateComplete;

    expect(el.viewableFiles).toEqual(viewableFiles);
    expect(el.viewableFiles.length).toEqual(3);

    expect(el.shadowRoot.querySelectorAll("ul li div")[1].className).toEqual("content active");
  });

});
