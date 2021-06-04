import {
  html,
  fixture,
  expect
} from '@open-wc/testing';
import sinon from 'sinon';
// import { Volumes } from '../../../src/BookNavigator/volumes/volumes.js';

console.log("viewable-files-test");

const options = {
  "options": {
    "enableMultipleBooks": true,
    "multipleBooksList": {
      "by_subprefix": {
        "/details/SubBookTest": {
          "url_path": "/details/SubBookTest",
          "file_prefix": "book1/GPORFP",
          "title": "book1/GPORFP.pdf",
          "file_source": "/book1/GPORFP_jp2.zip"
        },
        "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive": {
          "url_path": "/details/SubBookTest/subdir/book2/brewster_kahle_internet_archive",
          "file_prefix": "subdir/book2/brewster_kahle_internet_archive",
          "title": "subdir/book2/brewster_kahle_internet_archive.pdf",
          "file_source": "/subdir/book2/brewster_kahle_internet_archive_jp2.zip"
        },
        "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume": {
          "url_path": "/details/SubBookTest/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "file_prefix": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume",
          "title": "subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume.pdf",
          "file_source": "/subdir/subsubdir/book3/Rfp008011ResponseInternetArchive-without-resume_jp2.zip"
        }
      }
    }
  }
}

const container = () => (
  html`<viewable-files .bookreader=${options}} .baseHost="https://archive.org"></viewable-files>`
);

describe('<viewable-files>', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('sets default properties', async () => {
    const el = await fixture(container());
    el.bookreader = options;

    expect(el.bookreader).to.exist;
    expect(el.bookreader.options.enableMultipleBooks).to.be.true;
    expect(el.bookreader.options.multipleBooksList).to.exist;
  });

  it('render all volume items', async () => {
    const el = await fixture(container());
    el.bookreader = options;

    const files = el.bookreader.options.multipleBooksList.by_subprefix;
    const viewableFiles = Object.keys(files).map(item => files[item]);
    expect(viewableFiles.length).to.equal(3);
  });

});
